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

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ShoppingListRepository listRepository;

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
        Product existing = Product.builder()
                .id(id).name("Milk").price(BigDecimal.valueOf(1.50)).version(1).build();
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
        Product product = Product.builder()
                .id(id).name("Milk").purchased(false).version(1).build();
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
        Product product = Product.builder()
                .id(id).name("Milk").purchased(true).purchasedBy("Alice").version(1).build();
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
        Product product = Product.builder().id(id).name("Milk").build();
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
}
