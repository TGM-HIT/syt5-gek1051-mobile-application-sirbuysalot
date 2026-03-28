package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.model.AppUser;
import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.repository.AppUserRepository;
import at.tgm.sirbuysalot.repository.ShoppingListRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AppUserServiceTest {

    @Mock
    private AppUserRepository userRepository;

    @Mock
    private ShoppingListRepository listRepository;

    @InjectMocks
    private AppUserService service;

    @Test
    void findByListId_returnsUsers() {
        UUID listId = UUID.randomUUID();
        AppUser user = AppUser.builder().displayName("Alice").build();
        when(userRepository.findByShoppingListId(listId)).thenReturn(List.of(user));

        List<AppUser> result = service.findByListId(listId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getDisplayName()).isEqualTo("Alice");
    }

    @Test
    void joinList_associatesWithListAndSaves() {
        UUID listId = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(listId).name("Groceries").build();
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AppUser result = service.joinList(listId, "Alice");

        assertThat(result.getDisplayName()).isEqualTo("Alice");
        assertThat(result.getShoppingList()).isEqualTo(list);
        verify(userRepository).save(any(AppUser.class));
    }

    @Test
    void joinList_throwsWhenListNotFound() {
        UUID listId = UUID.randomUUID();
        when(listRepository.findById(listId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.joinList(listId, "Alice"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Liste nicht gefunden");
    }

    @Test
    void findByListId_returnsEmptyWhenNoUsers() {
        UUID listId = UUID.randomUUID();
        when(userRepository.findByShoppingListId(listId)).thenReturn(List.of());

        List<AppUser> result = service.findByListId(listId);

        assertThat(result).isEmpty();
    }
}
