package at.tgm.sirbuysalot.repository;

import at.tgm.sirbuysalot.model.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface TagRepository extends JpaRepository<Tag, UUID> {

    List<Tag> findByShoppingListId(UUID shoppingListId);

    @Modifying
    @Query(value = "DELETE FROM product_tags WHERE tag_id = :tagId", nativeQuery = true)
    void removeTagFromAllProducts(@Param("tagId") UUID tagId);
}
