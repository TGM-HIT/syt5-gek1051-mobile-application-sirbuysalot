package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.model.AppUser;
import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.repository.AppUserRepository;
import at.tgm.sirbuysalot.repository.ShoppingListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AppUserService {

    private final AppUserRepository userRepository;
    private final ShoppingListRepository listRepository;

    public List<AppUser> findByListId(UUID listId) {
        return userRepository.findByShoppingListId(listId);
    }

    public AppUser joinList(UUID listId, String displayName) {
        ShoppingList list = listRepository.findById(listId)
                .orElseThrow(() -> new RuntimeException("Liste nicht gefunden"));

        AppUser user = AppUser.builder()
                .displayName(displayName)
                .shoppingList(list)
                .build();

        return userRepository.save(user);
    }
}
