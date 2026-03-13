package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.repository.ShoppingListRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShoppingListServiceTest {

    @Mock
    private ShoppingListRepository repository;

    @InjectMocks
    private ShoppingListService service;

    private ShoppingList testList;

    @BeforeEach
    void setUp() {
        testList = ShoppingList.builder()
                .id(UUID.randomUUID())
                .name("Testkaufsliste")
                .version(1)
                .build();
    }

    @Test
    void create_setzAccessCodeUndSpeichert() {
        when(repository.save(any(ShoppingList.class))).thenReturn(testList);
        ShoppingList input = ShoppingList.builder().name("Neue Liste").build();

        service.create(input);

        assertThat(input.getAccessCode()).isNotNull();
        assertThat(input.getAccessCode()).hasSize(8);
        verify(repository).save(input);
    }

    @Test
    void findAll_gibtNurNichtGeloeschteListen() {
        when(repository.findByDeletedAtIsNull()).thenReturn(List.of(testList));

        List<ShoppingList> result = service.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Testkaufsliste");
        verify(repository).findByDeletedAtIsNull();
    }

    @Test
    void findById_gibtListeWennNichtGeloescht() {
        when(repository.findById(testList.getId())).thenReturn(Optional.of(testList));

        Optional<ShoppingList> result = service.findById(testList.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getName()).isEqualTo("Testkaufsliste");
    }

    @Test
    void findById_gibtLeerWennGeloescht() {
        ShoppingList deleted = ShoppingList.builder()
                .id(UUID.randomUUID())
                .name("Gelöscht")
                .deletedAt(java.time.LocalDateTime.now())
                .version(1)
                .build();
        when(repository.findById(deleted.getId())).thenReturn(Optional.of(deleted));

        Optional<ShoppingList> result = service.findById(deleted.getId());

        assertThat(result).isEmpty();
    }

    @Test
    void update_aendertNameUndErhoehVersion() {
        when(repository.findById(testList.getId())).thenReturn(Optional.of(testList));
        when(repository.save(any(ShoppingList.class))).thenAnswer(inv -> inv.getArgument(0));

        ShoppingList updated = ShoppingList.builder().name("Neuer Name").build();
        ShoppingList result = service.update(testList.getId(), updated);

        assertThat(result.getName()).isEqualTo("Neuer Name");
        assertThat(result.getVersion()).isEqualTo(2);
    }
}
