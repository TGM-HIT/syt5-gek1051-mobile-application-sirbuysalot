package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.model.Tag;
import at.tgm.sirbuysalot.repository.ShoppingListRepository;
import at.tgm.sirbuysalot.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

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

    public Tag create(UUID listId, Tag tag) {
        ShoppingList list = listRepository.findById(listId)
                .orElseThrow(() -> new RuntimeException("List not found"));
        tag.setShoppingList(list);
        return tagRepository.save(tag);
    }

    public Tag update(UUID id, Tag updated) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tag not found"));
        tag.setName(updated.getName());
        return tagRepository.save(tag);
    }

    public void delete(UUID id) {
        tagRepository.deleteById(id);
    }
}
