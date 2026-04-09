package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.model.Product;
import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.repository.ProductRepository;
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
    private final ProductRepository productRepository;

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

    public Optional<ShoppingList> findByAccessCode(String accessCode) {
        return repository.findByAccessCode(accessCode)
                .filter(list -> list.getDeletedAt() == null);
    }

    public void softDelete(UUID id) {
        ShoppingList list = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("List not found"));
        list.setDeletedAt(LocalDateTime.now());
        repository.save(list);
    }

    public List<ShoppingList> findDeleted() {
        return repository.findByDeletedAtIsNotNull();
    }

    public ShoppingList restore(UUID id) {
        ShoppingList list = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("List not found"));
        list.setDeletedAt(null);
        list.setVersion(list.getVersion() + 1);
        return repository.save(list);
    }

    public ShoppingList duplicate(UUID id) {
        ShoppingList original = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("List not found"));

        ShoppingList copy = new ShoppingList();
        copy.setName(original.getName() + " (Kopie)");
        copy.setAccessCode(UUID.randomUUID().toString().substring(0, 8));
        ShoppingList saved = repository.save(copy);

        List<Product> originalProducts = productRepository
                .findByShoppingListIdAndDeletedAtIsNull(id);

        for (Product p : originalProducts) {
            Product newProduct = new Product();
            newProduct.setName(p.getName());
            newProduct.setPrice(p.getPrice());
            newProduct.setPosition(p.getPosition());
            newProduct.setShoppingList(saved);
            productRepository.save(newProduct);
        }

        return saved;
    }
}
