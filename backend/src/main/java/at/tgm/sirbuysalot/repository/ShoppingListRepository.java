package at.tgm.sirbuysalot.repository;

import at.tgm.sirbuysalot.model.ShoppingList;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ShoppingListRepository extends JpaRepository<ShoppingList, UUID> {

    List<ShoppingList> findByDeletedAtIsNull();

    List<ShoppingList> findByDeletedAtIsNotNull();

    Optional<ShoppingList> findByAccessCode(String accessCode);
}
