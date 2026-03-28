package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.model.Product;
import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.repository.ProductRepository;
import at.tgm.sirbuysalot.repository.ShoppingListRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SyncServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ShoppingListRepository listRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private SyncService service;

    private final UUID listId = UUID.randomUUID();

    @Test
    void processBatch_emptyChanges_returnsZeroCounts() {
        Map<String, Object> result = service.processBatch(listId, List.of());

        assertThat(result.get("synced")).isEqualTo(0);
        assertThat(result.get("failed")).isEqualTo(0);
        assertThat((List<?>) result.get("results")).isEmpty();
    }

    @Test
    void processBatch_createProduct_savesProduct() {
        ShoppingList list = ShoppingList.builder().id(listId).name("Groceries").build();
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> change = new HashMap<>();
        change.put("id", "change-1");
        change.put("type", "create");
        change.put("entity", "product");
        change.put("payload", Map.of("name", "Milk", "price", 1.50));

        Map<String, Object> result = service.processBatch(listId, List.of(change));

        assertThat(result.get("synced")).isEqualTo(1);
        assertThat(result.get("failed")).isEqualTo(0);
        verify(productRepository).save(any(Product.class));
    }

    @Test
    void processBatch_updateProduct_updatesFieldsAndVersion() {
        UUID productId = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(listId).name("Test").build();
        Product product = Product.builder()
                .id(productId).name("Milk").version(1).shoppingList(list).build();
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> change = new HashMap<>();
        change.put("id", "change-2");
        change.put("type", "update");
        change.put("entity", "product");
        change.put("entityId", productId.toString());
        change.put("payload", Map.of("name", "Oat Milk"));

        Map<String, Object> result = service.processBatch(listId, List.of(change));

        assertThat(result.get("synced")).isEqualTo(1);
        assertThat(product.getName()).isEqualTo("Oat Milk");
        assertThat(product.getVersion()).isEqualTo(2);
    }

    @Test
    void processBatch_toggleProduct_togglesPurchased() {
        UUID productId = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(listId).name("Test").build();
        Product product = Product.builder()
                .id(productId).name("Milk").purchased(false).version(1).shoppingList(list).build();
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> change = new HashMap<>();
        change.put("id", "change-3");
        change.put("type", "toggle");
        change.put("entity", "product");
        change.put("entityId", productId.toString());
        change.put("payload", Map.of("purchasedBy", "Alice"));

        service.processBatch(listId, List.of(change));

        assertThat(product.getPurchased()).isTrue();
        assertThat(product.getPurchasedBy()).isEqualTo("Alice");
        assertThat(product.getVersion()).isEqualTo(2);
    }

    @Test
    void processBatch_deleteProduct_setsDeletedAt() {
        UUID productId = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(listId).name("Test").build();
        Product product = Product.builder()
                .id(productId).name("Milk").shoppingList(list).build();
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> change = new HashMap<>();
        change.put("id", "change-4");
        change.put("type", "delete");
        change.put("entity", "product");
        change.put("entityId", productId.toString());
        change.put("payload", Map.of());

        service.processBatch(listId, List.of(change));

        assertThat(product.getDeletedAt()).isNotNull();
    }

    @Test
    void processBatch_updateList_updatesNameAndVersion() {
        ShoppingList list = ShoppingList.builder()
                .id(listId).name("Old Name").version(1).build();
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(listRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> change = new HashMap<>();
        change.put("id", "change-5");
        change.put("type", "update");
        change.put("entity", "list");
        change.put("payload", Map.of("name", "New Name"));

        service.processBatch(listId, List.of(change));

        assertThat(list.getName()).isEqualTo("New Name");
        assertThat(list.getVersion()).isEqualTo(2);
    }

    @Test
    void processBatch_deleteList_setsDeletedAt() {
        ShoppingList list = ShoppingList.builder()
                .id(listId).name("Groceries").build();
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(listRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> change = new HashMap<>();
        change.put("id", "change-6");
        change.put("type", "delete");
        change.put("entity", "list");
        change.put("payload", Map.of());

        service.processBatch(listId, List.of(change));

        assertThat(list.getDeletedAt()).isNotNull();
    }

    @Test
    void processBatch_failedChange_incrementsFailedCount() {
        when(listRepository.findById(listId)).thenReturn(Optional.empty());

        Map<String, Object> change = new HashMap<>();
        change.put("id", "change-7");
        change.put("type", "create");
        change.put("entity", "product");
        change.put("payload", Map.of("name", "Milk"));

        Map<String, Object> result = service.processBatch(listId, List.of(change));

        assertThat(result.get("synced")).isEqualTo(0);
        assertThat(result.get("failed")).isEqualTo(1);
        List<Map<String, Object>> results = (List<Map<String, Object>>) result.get("results");
        assertThat(results.get(0).get("status")).isEqualTo("failed");
    }

    @Test
    void processBatch_mixedResults_countsSyncedAndFailed() {
        ShoppingList list = ShoppingList.builder().id(listId).name("Groceries").build();
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(productRepository.findById(any())).thenReturn(Optional.empty());

        Map<String, Object> createChange = new HashMap<>();
        createChange.put("id", "change-ok");
        createChange.put("type", "create");
        createChange.put("entity", "product");
        createChange.put("payload", Map.of("name", "Milk"));

        Map<String, Object> updateChange = new HashMap<>();
        updateChange.put("id", "change-fail");
        updateChange.put("type", "update");
        updateChange.put("entity", "product");
        updateChange.put("entityId", UUID.randomUUID().toString());
        updateChange.put("payload", Map.of("name", "Ghost"));

        Map<String, Object> result = service.processBatch(listId, List.of(createChange, updateChange));

        assertThat(result.get("synced")).isEqualTo(1);
        assertThat(result.get("failed")).isEqualTo(1);
    }

    @Test
    void processBatch_broadcastsWebSocketMessage() {
        Map<String, Object> result = service.processBatch(listId, List.of());

        verify(messagingTemplate).convertAndSend(eq("/topic/lists/" + listId), any(Map.class));
    }

    @Test
    void broadcastChange_sendsToCorrectTopic() {
        service.broadcastChange(listId, "test_event", Map.of("key", "value"));

        verify(messagingTemplate).convertAndSend(eq("/topic/lists/" + listId), any(Map.class));
    }
}
