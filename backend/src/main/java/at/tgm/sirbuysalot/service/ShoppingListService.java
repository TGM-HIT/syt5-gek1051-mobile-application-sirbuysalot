package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.repository.ShoppingListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ShoppingListService {

    private final ShoppingListRepository repository;

    public List<ShoppingList> findAll() {
        return repository.findByDeletedAtIsNull();
    }

    public Optional<ShoppingList> findById(UUID id) {
        return repository.findById(id)
                .filter(list -> list.getDeletedAt() == null);
    }

    public ShoppingList create(ShoppingList list) {
        list.setAccessCode(UUID.randomUUID().toString().substring(0, 8));
        return repository.save(list);
    }

    public ShoppingList update(UUID id, ShoppingList updated) {
        ShoppingList list = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("List not found"));
        list.setName(updated.getName());
        list.setVersion(list.getVersion() + 1);
        return repository.save(list);
    }

    public void softDelete(UUID id) {
        ShoppingList list = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("List not found"));
        list.setDeletedAt(LocalDateTime.now());
        repository.save(list);
    }
}
