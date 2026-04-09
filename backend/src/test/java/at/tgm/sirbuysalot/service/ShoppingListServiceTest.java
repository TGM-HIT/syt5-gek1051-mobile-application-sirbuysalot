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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShoppingListServiceTest {

    @Mock
    private ShoppingListRepository repository;

    @Mock
    private ProductRepository productRepository;

    @InjectMocks
    private ShoppingListService service;

    @Test
    void findAll_returnsNonDeletedLists() {
        ShoppingList list = ShoppingList.builder().name("Groceries").build();
        when(repository.findByDeletedAtIsNull()).thenReturn(List.of(list));

        List<ShoppingList> result = service.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Groceries");
        verify(repository).findByDeletedAtIsNull();
    }

    @Test
    void findById_returnsListWhenFoundAndNotDeleted() {
        UUID id = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(id).name("Groceries").build();
        when(repository.findById(id)).thenReturn(Optional.of(list));

        Optional<ShoppingList> result = service.findById(id);

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Groceries");
    }

    @Test
    void findById_returnsEmptyWhenDeleted() {
        UUID id = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder()
                .id(id).name("Groceries")
                .deletedAt(LocalDateTime.now())
                .build();
        when(repository.findById(id)).thenReturn(Optional.of(list));

        Optional<ShoppingList> result = service.findById(id);

        assertThat(result).isEmpty();
    }

    @Test
    void findById_returnsEmptyWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        Optional<ShoppingList> result = service.findById(id);

        assertThat(result).isEmpty();
    }

    @Test
    void create_setsAccessCodeAndSaves() {
        ShoppingList list = ShoppingList.builder().name("Groceries").build();
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ShoppingList result = service.create(list);

        assertThat(result.getAccessCode()).isNotNull();
        assertThat(result.getAccessCode()).hasSize(8);
        verify(repository).save(list);
    }

    @Test
    void update_updatesNameAndIncrementsVersion() {
        UUID id = UUID.randomUUID();
        ShoppingList existing = ShoppingList.builder()
                .id(id).name("Old").version(1).build();
        ShoppingList updated = ShoppingList.builder().name("New").build();
        when(repository.findById(id)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ShoppingList result = service.update(id, updated);

        assertThat(result.getName()).isEqualTo("New");
        assertThat(result.getVersion()).isEqualTo(2);
    }

    @Test
    void update_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(id, new ShoppingList()))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("List not found");
    }

    @Test
    void softDelete_setsDeletedAt() {
        UUID id = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(id).name("Groceries").build();
        when(repository.findById(id)).thenReturn(Optional.of(list));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        service.softDelete(id);

        assertThat(list.getDeletedAt()).isNotNull();
        verify(repository).save(list);
    }

    @Test
    void softDelete_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.softDelete(id))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("List not found");
    }

    // --- Additional tests ---

    @Test
    void findByAccessCode_returnsListWhenFoundAndNotDeleted() {
        String code = "abc12345";
        ShoppingList list = ShoppingList.builder().name("Groceries").accessCode(code).build();
        when(repository.findByAccessCode(code)).thenReturn(Optional.of(list));

        Optional<ShoppingList> result = service.findByAccessCode(code);

        assertThat(result).isPresent();
        assertThat(result.get().getAccessCode()).isEqualTo(code);
    }

    @Test
    void findByAccessCode_returnsEmptyWhenNotFound() {
        when(repository.findByAccessCode("nonexist")).thenReturn(Optional.empty());

        Optional<ShoppingList> result = service.findByAccessCode("nonexist");

        assertThat(result).isEmpty();
    }

    @Test
    void findByAccessCode_returnsEmptyWhenDeleted() {
        String code = "abc12345";
        ShoppingList list = ShoppingList.builder()
                .name("Groceries").accessCode(code).deletedAt(LocalDateTime.now()).build();
        when(repository.findByAccessCode(code)).thenReturn(Optional.of(list));

        Optional<ShoppingList> result = service.findByAccessCode(code);

        assertThat(result).isEmpty();
    }

    @Test
    void findDeleted_returnsOnlyDeletedLists() {
        ShoppingList deleted = ShoppingList.builder()
                .name("Old List").deletedAt(LocalDateTime.now()).build();
        when(repository.findByDeletedAtIsNotNull()).thenReturn(List.of(deleted));

        List<ShoppingList> result = service.findDeleted();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDeletedAt()).isNotNull();
        verify(repository).findByDeletedAtIsNotNull();
    }

    @Test
    void restore_setsDeletedAtNullAndIncrementsVersion() {
        UUID id = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder()
                .id(id).name("Groceries").version(1).deletedAt(LocalDateTime.now()).build();
        when(repository.findById(id)).thenReturn(Optional.of(list));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        ShoppingList result = service.restore(id);

        assertThat(result.getDeletedAt()).isNull();
        assertThat(result.getVersion()).isEqualTo(2);
        verify(repository).save(list);
    }

    @Test
    void restore_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.restore(id))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("List not found");
    }

    @Test
    void duplicate_createsCopyWithKopieNameAndNewAccessCode() {
        UUID originalId = UUID.randomUUID();
        ShoppingList original = ShoppingList.builder()
                .id(originalId).name("Groceries").accessCode("orig1234").build();
        when(repository.findById(originalId)).thenReturn(Optional.of(original));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(productRepository.findByShoppingListIdAndDeletedAtIsNull(originalId))
                .thenReturn(List.of());

        ShoppingList result = service.duplicate(originalId);

        assertThat(result.getName()).isEqualTo("Groceries (Kopie)");
        assertThat(result.getAccessCode()).isNotNull();
        assertThat(result.getAccessCode()).hasSize(8);
        assertThat(result.getAccessCode()).isNotEqualTo("orig1234");
    }

    @Test
    void duplicate_copiesProducts() {
        UUID originalId = UUID.randomUUID();
        ShoppingList original = ShoppingList.builder()
                .id(originalId).name("Groceries").accessCode("orig1234").build();
        Product p1 = Product.builder().name("Milk").price(BigDecimal.valueOf(1.50)).position(0).build();
        Product p2 = Product.builder().name("Bread").price(BigDecimal.valueOf(2.00)).position(1).build();
        when(repository.findById(originalId)).thenReturn(Optional.of(original));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(productRepository.findByShoppingListIdAndDeletedAtIsNull(originalId))
                .thenReturn(List.of(p1, p2));
        when(productRepository.save(any(Product.class))).thenAnswer(inv -> inv.getArgument(0));

        service.duplicate(originalId);

        verify(productRepository, times(2)).save(any(Product.class));
    }

    @Test
    void duplicate_throwsWhenNotFound() {
        UUID id = UUID.randomUUID();
        when(repository.findById(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.duplicate(id))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("List not found");
    }

    @Test
    void findAll_returnsEmptyWhenNoLists() {
        when(repository.findByDeletedAtIsNull()).thenReturn(List.of());

        List<ShoppingList> result = service.findAll();

        assertThat(result).isEmpty();
    }
}
