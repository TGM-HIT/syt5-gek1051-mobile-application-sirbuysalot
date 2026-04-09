package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.model.Tag;
import at.tgm.sirbuysalot.repository.ShoppingListRepository;
import at.tgm.sirbuysalot.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class TagService {

    private final TagRepository tagRepository;
    private final ShoppingListRepository listRepository;

    public List<Tag> findByListId(UUID listId) {
        return tagRepository.findByShoppingListId(listId);
    }

    public Tag create(UUID listId, String name) {
        ShoppingList list = listRepository.findById(listId)
                .orElseThrow(() -> new RuntimeException("Liste nicht gefunden"));

        Tag tag = Tag.builder()
                .name(name)
                .shoppingList(list)
                .build();

        return tagRepository.save(tag);
    }

    public Tag update(UUID id, String name) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag nicht gefunden"));
        tag.setName(name);
        return tagRepository.save(tag);
    }

    @Transactional
    public void delete(UUID id) {
        tagRepository.removeTagFromAllProducts(id);
        tagRepository.deleteById(id);
    }
}
