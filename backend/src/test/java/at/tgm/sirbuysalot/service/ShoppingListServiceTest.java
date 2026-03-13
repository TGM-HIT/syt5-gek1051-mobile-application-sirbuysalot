package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.repository.ShoppingListRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
}
