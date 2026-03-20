package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.exception.ConflictException;
import at.tgm.sirbuysalot.model.Product;
import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.model.Tag;
import at.tgm.sirbuysalot.repository.ProductRepository;
import at.tgm.sirbuysalot.repository.ShoppingListRepository;
import at.tgm.sirbuysalot.repository.TagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ShoppingListRepository listRepository;
    private final TagRepository tagRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<Product> findByListId(UUID listId) {
        return productRepository.findByShoppingListIdAndDeletedAtIsNull(listId);
    }

    public Product create(UUID listId, Product product) {
        ShoppingList list = listRepository.findById(listId)
                .orElseThrow(() -> new RuntimeException("List not found"));
        product.setShoppingList(list);
        Product saved = productRepository.save(product);
        broadcastChange(listId, "product_created", saved);
        return saved;
    }

    public Product update(UUID id, Product updated) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));

        // Version conflict check: client must send the version it based changes on
        if (updated.getVersion() > 0 && updated.getVersion() < product.getVersion()) {
            throw new ConflictException("Produkt", product.getVersion(), updated.getVersion());
        }

        product.setName(updated.getName());
        product.setPrice(updated.getPrice());
        product.setVersion(product.getVersion() + 1);
        Product saved = productRepository.save(product);
        broadcastChange(product.getShoppingList().getId(), "product_updated", saved);
        return saved;
    }

    public Product markPurchased(UUID id, String purchasedBy) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setPurchased(!product.getPurchased());
        product.setPurchasedBy(product.getPurchased() ? purchasedBy : null);
        product.setPurchasedAt(product.getPurchased() ? LocalDateTime.now() : null);
        product.setVersion(product.getVersion() + 1);
        Product saved = productRepository.save(product);
        broadcastChange(product.getShoppingList().getId(), "product_toggled", saved);
        return saved;
    }

    public void softDelete(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setDeletedAt(LocalDateTime.now());
        productRepository.save(product);
        broadcastChange(product.getShoppingList().getId(), "product_deleted", Map.of("id", id));
    }

    public List<Product> findDeletedByListId(UUID listId) {
        return productRepository.findByShoppingListIdAndDeletedAtIsNotNull(listId);
    }

    public Product restore(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setDeletedAt(null);
        product.setVersion(product.getVersion() + 1);
        return productRepository.save(product);
    }

    public Product setTags(UUID productId, Set<UUID> tagIds) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        Set<Tag> tags = new HashSet<>(tagRepository.findAllById(tagIds));
        product.setTags(tags);
        product.setVersion(product.getVersion() + 1);
        Product saved = productRepository.save(product);
        broadcastChange(product.getShoppingList().getId(), "product_updated", saved);
        return saved;
    }

    private void broadcastChange(UUID listId, String changeType, Object data) {
        messagingTemplate.convertAndSend("/topic/lists/" + listId, Map.of(
                "type", changeType,
                "data", data,
                "timestamp", LocalDateTime.now().toString()
        ));
    }
}
