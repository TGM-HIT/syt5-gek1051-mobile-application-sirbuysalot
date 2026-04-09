package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.model.Tag;
import at.tgm.sirbuysalot.repository.ShoppingListRepository;
import at.tgm.sirbuysalot.repository.TagRepository;
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
class TagServiceTest {

    @Mock
    private TagRepository tagRepository;

    @Mock
    private ShoppingListRepository listRepository;

    @InjectMocks
    private TagService service;

    @Test
    void findByListId_returnsTags() {
        UUID listId = UUID.randomUUID();
        Tag tag = Tag.builder().name("Fruit").build();
        when(tagRepository.findByShoppingListId(listId)).thenReturn(List.of(tag));

        List<Tag> result = service.findByListId(listId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Fruit");
    }

    @Test
    void create_associatesWithListAndSaves() {
        UUID listId = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder().id(listId).name("Groceries").build();
        when(listRepository.findById(listId)).thenReturn(Optional.of(list));
        when(tagRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Tag result = service.create(listId, "Fruit");

        assertThat(result.getName()).isEqualTo("Fruit");
        assertThat(result.getShoppingList()).isEqualTo(list);
        verify(tagRepository).save(any(Tag.class));
    }

    @Test
    void create_throwsWhenListNotFound() {
        UUID listId = UUID.randomUUID();
        when(listRepository.findById(listId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.create(listId, "Fruit"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Liste nicht gefunden");
    }

    @Test
    void update_updatesNameAndSaves() {
        UUID tagId = UUID.randomUUID();
        Tag tag = Tag.builder().id(tagId).name("Fruit").build();
        when(tagRepository.findById(tagId)).thenReturn(Optional.of(tag));
        when(tagRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Tag result = service.update(tagId, "Vegetables");

        assertThat(result.getName()).isEqualTo("Vegetables");
        verify(tagRepository).save(tag);
    }

    @Test
    void update_throwsWhenNotFound() {
        UUID tagId = UUID.randomUUID();
        when(tagRepository.findById(tagId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(tagId, "Vegetables"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Tag nicht gefunden");
    }

    @Test
    void delete_deletesById() {
        UUID tagId = UUID.randomUUID();

        service.delete(tagId);

        verify(tagRepository).deleteById(tagId);
    }
}
