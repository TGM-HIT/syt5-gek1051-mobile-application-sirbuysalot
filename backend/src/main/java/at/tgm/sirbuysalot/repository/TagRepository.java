package at.tgm.sirbuysalot.repository;

import at.tgm.sirbuysalot.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface TagRepository extends JpaRepository<Tag, UUID> {

    List<Tag> findByShoppingListId(UUID shoppingListId);
}
