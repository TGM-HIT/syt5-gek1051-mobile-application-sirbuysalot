package at.tgm.sirbuysalot.repository;

import at.tgm.sirbuysalot.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ProductRepository extends JpaRepository<Product, UUID> {

    List<Product> findByShoppingListIdAndDeletedAtIsNull(UUID shoppingListId);

    List<Product> findByShoppingListIdAndDeletedAtIsNotNull(UUID shoppingListId);
}
