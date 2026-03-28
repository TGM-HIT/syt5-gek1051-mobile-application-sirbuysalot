package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.exception.ConflictException;
import at.tgm.sirbuysalot.model.Product;
import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.model.Tag;
import at.tgm.sirbuysalot.repository.ProductRepository;
import at.tgm.sirbuysalot.repository.ShoppingListRepository;
import at.tgm.sirbuysalot.repository.TagRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ShoppingListRepository listRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ProductService service;

    @Test
    void findByListId_returnsNonDeletedProducts() {
        UUID listId = UUID.randomUUID();
        Product product = Product.builder().name("Milk").build();
        when(productRepository.findByShoppingListIdAndDeletedAtIsNull(listId))
                .thenReturn(List.of(product));

        List<Product> result = service.findByListId(listId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Milk");
    }

    @Test
    void create_associatesWithListAndSaves() {
        UUID listId = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(listId).name("Groceries").build();
        Product product = Product.builder().name("Milk").build();
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = service.create(listId, product);

        assertThat(result.getShoppingList()).isEqualTo(list);
        verify(productRepository).save(product);
    }

    @Test
    void create_throwsWhenListNotFound() {
        UUID listId = UUID.randomUUID();
        when(listRepository.findById(listId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(listId, new Product()))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("List not found");
    }

    @Test
    void update_updatesFieldsAndIncrementsVersion() {
        UUID id = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(UUID.randomUUID()).name("Test").build();
        Product existing = Product.builder()
                .id(id).name("Milk").price(BigDecimal.valueOf(1.50)).version(1).shoppingList(list).build();
        Product updated = Product.builder()
                .name("Oat Milk").price(BigDecimal.valueOf(2.99)).build();
        when(productRepository.findById(id)).thenReturn(Optional.of(existing));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = service.update(id, updated);

        assertThat(result.getName()).isEqualTo("Oat Milk");
        assertThat(result.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(2.99));
        assertThat(result.getVersion()).isEqualTo(2);
    }

    @Test
    void update_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(productRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(id, new Product()))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Product not found");
    }

    @Test
    void markPurchased_togglesFromUnpurchasedToPurchased() {
        UUID id = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(UUID.randomUUID()).name("Test").build();
        Product product = Product.builder()
                .id(id).name("Milk").purchased(false).version(1).shoppingList(list).build();
        when(productRepository.findById(id)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = service.markPurchased(id, "Alice");

        assertThat(result.getPurchased()).isTrue();
        assertThat(result.getPurchasedBy()).isEqualTo("Alice");
        assertThat(result.getPurchasedAt()).isNotNull();
        assertThat(result.getVersion()).isEqualTo(2);
    }

    @Test
    void markPurchased_togglesFromPurchasedToUnpurchased() {
        UUID id = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(UUID.randomUUID()).name("Test").build();
        Product product = Product.builder()
                .id(id).name("Milk").purchased(true).purchasedBy("Alice").version(1).shoppingList(list).build();
        when(productRepository.findById(id)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = service.markPurchased(id, "Bob");

        assertThat(result.getPurchased()).isFalse();
        assertThat(result.getPurchasedBy()).isNull();
        assertThat(result.getPurchasedAt()).isNull();
        assertThat(result.getVersion()).isEqualTo(2);
    }

    @Test
    void markPurchased_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(productRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.markPurchased(id, "Alice"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Product not found");
    }

    @Test
    void softDelete_setsDeletedAt() {
        UUID id = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(UUID.randomUUID()).name("Test").build();
        Product product = Product.builder().id(id).name("Milk").shoppingList(list).build();
        when(productRepository.findById(id)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.softDelete(id);

        assertThat(product.getDeletedAt()).isNotNull();
        verify(productRepository).save(product);
    }

    @Test
    void softDelete_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(productRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.softDelete(id))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Product not found");
    }

    // --- Additional tests ---

    @Test
    void findDeletedByListId_returnsOnlyDeletedProducts() {
        UUID listId = UUID.randomUUID();
        Product deleted = Product.builder()
                .name("Old Milk").deletedAt(LocalDateTime.now()).build();
        when(productRepository.findByShoppingListIdAndDeletedAtIsNotNull(listId))
                .thenReturn(List.of(deleted));

        List<Product> result = service.findDeletedByListId(listId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDeletedAt()).isNotNull();
        verify(productRepository).findByShoppingListIdAndDeletedAtIsNotNull(listId);
    }

    @Test
    void restore_setsDeletedAtNullAndIncrementsVersion() {
        UUID id = UUID.randomUUID();
        Product product = Product.builder()
                .id(id).name("Milk").version(1).deletedAt(LocalDateTime.now()).build();
        when(productRepository.findById(id)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = service.restore(id);

        assertThat(result.getDeletedAt()).isNull();
        assertThat(result.getVersion()).isEqualTo(2);
        verify(productRepository).save(product);
    }

    @Test
    void restore_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(productRepository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.restore(id))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Product not found");
    }

    @Test
    void setTags_assignsTagsAndIncrementsVersion() {
        UUID productId = UUID.randomUUID();
        UUID tagId1 = UUID.randomUUID();
        UUID tagId2 = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(UUID.randomUUID()).name("Test").build();
        Product product = Product.builder()
                .id(productId).name("Milk").version(1).shoppingList(list).build();
        Tag tag1 = Tag.builder().id(tagId1).name("Fruit").build();
        Tag tag2 = Tag.builder().id(tagId2).name("Dairy").build();
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(tagRepository.findAllById(Set.of(tagId1, tagId2))).thenReturn(List.of(tag1, tag2));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = service.setTags(productId, Set.of(tagId1, tagId2));

        assertThat(result.getTags()).hasSize(2);
        assertThat(result.getVersion()).isEqualTo(2);
    }

    @Test
    void setTags_throwsWhenProductNotFound() {
        UUID productId = UUID.randomUUID();
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.setTags(productId, Set.of(UUID.randomUUID())))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Product not found");
    }

    @Test
    void reorder_updatesPositions() {
        UUID id1 = UUID.randomUUID();
        UUID id2 = UUID.randomUUID();
        UUID listId = UUID.randomUUID();
        Product p1 = Product.builder().id(id1).name("Milk").position(0).build();
        Product p2 = Product.builder().id(id2).name("Bread").position(1).build();
        when(productRepository.findById(id1)).thenReturn(Optional.of(p1));
        when(productRepository.findById(id2)).thenReturn(Optional.of(p2));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        List<Map<String, Object>> order = List.of(
                Map.of("id", id1.toString(), "position", 1),
                Map.of("id", id2.toString(), "position", 0)
        );

        service.reorder(listId, order);

        assertThat(p1.getPosition()).isEqualTo(1);
        assertThat(p2.getPosition()).isEqualTo(0);
        verify(productRepository, times(2)).save(any(Product.class));
    }

    @Test
    void update_withVersionConflict_throwsConflictException() {
        UUID id = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(UUID.randomUUID()).name("Test").build();
        Product existing = Product.builder()
                .id(id).name("Milk").version(5).shoppingList(list).build();
        Product updated = Product.builder()
                .name("Oat Milk").version(3).build();
        when(productRepository.findById(id)).thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.update(id, updated))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void findByListId_returnsEmptyWhenNoProducts() {
        UUID listId = UUID.randomUUID();
        when(productRepository.findByShoppingListIdAndDeletedAtIsNull(listId))
                .thenReturn(List.of());

        List<Product> result = service.findByListId(listId);

        assertThat(result).isEmpty();
    }

    @Test
    void create_setsShoppingListOnProduct() {
        UUID listId = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(listId).name("Groceries").build();
        Product product = Product.builder().name("Milk").price(BigDecimal.ZERO).build();
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = service.create(listId, product);

        assertThat(result.getShoppingList()).isEqualTo(list);
        assertThat(result.getShoppingList().getId()).isEqualTo(listId);
    }

    @Test
    void update_withZeroVersion_skipsConflictCheck() {
        UUID id = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(UUID.randomUUID()).name("Test").build();
        Product existing = Product.builder()
                .id(id).name("Milk").version(5).shoppingList(list).build();
        Product updated = Product.builder()
                .name("Oat Milk").price(BigDecimal.valueOf(2.99)).version(0).build();
        when(productRepository.findById(id)).thenReturn(Optional.of(existing));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = service.update(id, updated);

        assertThat(result.getName()).isEqualTo("Oat Milk");
        assertThat(result.getVersion()).isEqualTo(6);
    }

    @Test
    void create_withNullPrice_savesSuccessfully() {
        UUID listId = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(listId).name("Groceries").build();
        Product product = Product.builder().name("Milk").price(null).build();
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = service.create(listId, product);

        assertThat(result.getPrice()).isNull();
        verify(productRepository).save(product);
    }

    @Test
    void findDeletedByListId_returnsEmptyWhenNoneDeleted() {
        UUID listId = UUID.randomUUID();
        when(productRepository.findByShoppingListIdAndDeletedAtIsNotNull(listId))
                .thenReturn(List.of());

        List<Product> result = service.findDeletedByListId(listId);

        assertThat(result).isEmpty();
    }
}
