package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.model.Product;
import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.repository.ProductRepository;
import at.tgm.sirbuysalot.repository.ShoppingListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ShoppingListRepository listRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public List<Product> findByListId(UUID listId) {
        return productRepository.findByShoppingListIdAndDeletedAtIsNull(listId);
    }

    public Product create(UUID listId, Product product) {
        ShoppingList list = listRepository.findById(listId)
                .orElseThrow(() -> new RuntimeException("List not found"));
        product.setShoppingList(list);
        return productRepository.save(product);
    }

    public Product update(UUID id, Product updated) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setName(updated.getName());
        product.setPrice(updated.getPrice());
        product.setVersion(product.getVersion() + 1);
        return productRepository.save(product);
    }

    public Product markPurchased(UUID id, UUID listId, String purchasedBy) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setPurchased(!product.getPurchased());
        product.setPurchasedBy(product.getPurchased() ? purchasedBy : null);
        product.setPurchasedAt(product.getPurchased() ? LocalDateTime.now() : null);
        product.setVersion(product.getVersion() + 1);
        Product saved = productRepository.save(product);
        messagingTemplate.convertAndSend("/topic/lists/" + listId + "/products", saved);
        return saved;
    }

    public void softDelete(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Product not found"));
        product.setDeletedAt(LocalDateTime.now());
        productRepository.save(product);
    }
}
