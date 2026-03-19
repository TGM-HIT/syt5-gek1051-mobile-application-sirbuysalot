package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.model.Product;
import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.repository.ProductRepository;
import at.tgm.sirbuysalot.repository.ShoppingListRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ShoppingListRepository listRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ProductService productService;

    private UUID productId;
    private UUID listId;
    private Product product;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        listId = UUID.randomUUID();
        product = Product.builder()
                .id(productId)
                .name("Milch")
                .purchased(false)
                .version(1)
                .build();
    }

    @Test
    void findByListId_returnsNonDeletedProducts() {
        when(productRepository.findByShoppingListIdAndDeletedAtIsNull(listId))
                .thenReturn(List.of(product));

        List<Product> result = productService.findByListId(listId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Milch");
    }

    @Test
    void create_associatesWithListAndSaves() {
        ShoppingList list = ShoppingList.builder().id(listId).name("Groceries").build();
        Product newProduct = Product.builder().name("Milk").build();
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = productService.create(listId, newProduct);

        assertThat(result.getShoppingList()).isEqualTo(list);
        verify(productRepository).save(newProduct);
    }

    @Test
    void create_throwsWhenListNotFound() {
        when(listRepository.findById(listId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.create(listId, new Product()))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("List not found");
    }

    @Test
    void update_updatesFieldsAndIncrementsVersion() {
        Product existing = Product.builder()
                .id(productId).name("Milk").price(BigDecimal.valueOf(1.50)).version(1).build();
        Product updated = Product.builder()
                .name("Oat Milk").price(BigDecimal.valueOf(2.99)).build();
        when(productRepository.findById(productId)).thenReturn(Optional.of(existing));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = productService.update(productId, updated);

        assertThat(result.getName()).isEqualTo("Oat Milk");
        assertThat(result.getPrice()).isEqualByComparingTo(BigDecimal.valueOf(2.99));
        assertThat(result.getVersion()).isEqualTo(2);
    }

    @Test
    void update_throwsWhenNotFound() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.update(productId, new Product()))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Product not found");
    }

    @Test
    void markPurchased_setsProductAsPurchased() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = productService.markPurchased(productId, listId, "Julian");

        assertThat(result.getPurchased()).isTrue();
        assertThat(result.getPurchasedBy()).isEqualTo("Julian");
        assertThat(result.getPurchasedAt()).isNotNull();
    }

    @Test
    void markPurchased_togglesBackToNotPurchased() {
        product.setPurchased(true);
        product.setPurchasedBy("Julian");
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = productService.markPurchased(productId, listId, "Julian");

        assertThat(result.getPurchased()).isFalse();
        assertThat(result.getPurchasedBy()).isNull();
        assertThat(result.getPurchasedAt()).isNull();
    }

    @Test
    void markPurchased_incrementsVersion() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Product result = productService.markPurchased(productId, listId, "Julian");

        assertThat(result.getVersion()).isEqualTo(2);
    }

    @Test
    void markPurchased_broadcastsViaWebSocket() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        productService.markPurchased(productId, listId, "Julian");

        verify(messagingTemplate).convertAndSend(
                eq("/topic/lists/" + listId + "/products"),
                any(Product.class)
        );
    }

    @Test
    void markPurchased_broadcastsCorrectProduct() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        ArgumentCaptor<Product> captor = ArgumentCaptor.forClass(Product.class);

        productService.markPurchased(productId, listId, "Julian");

        verify(messagingTemplate).convertAndSend(
                eq("/topic/lists/" + listId + "/products"),
                captor.capture()
        );
        assertThat(captor.getValue().getPurchased()).isTrue();
        assertThat(captor.getValue().getPurchasedBy()).isEqualTo("Julian");
    }

    @Test
    void markPurchased_throwsWhenNotFound() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.markPurchased(productId, listId, "Alice"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Product not found");
    }

    @Test
    void softDelete_setsDeletedAt() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        productService.softDelete(productId);

        assertThat(product.getDeletedAt()).isNotNull();
        verify(productRepository).save(product);
    }

    @Test
    void softDelete_throwsWhenNotFound() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> productService.softDelete(productId))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Product not found");
    }
}
