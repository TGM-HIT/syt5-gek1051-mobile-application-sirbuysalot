package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.model.Product;
import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.repository.ProductRepository;
import at.tgm.sirbuysalot.repository.ShoppingListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class SyncService {

    private final ProductRepository productRepository;
    private final ShoppingListRepository listRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public Map<String, Object> processBatch(UUID listId, List<Map<String, Object>> changes) {
        List<Map<String, Object>> results = new ArrayList<>();
        int synced = 0;
        int failed = 0;

        for (Map<String, Object> change : changes) {
            try {
                String type = (String) change.get("type");
                String entity = (String) change.get("entity");
                Map<String, Object> payload = (Map<String, Object>) change.get("payload");

                if ("product".equals(entity)) {
                    processProductChange(listId, type, change, payload);
                } else if ("list".equals(entity)) {
                    processListChange(listId, type, change, payload);
                }

                Map<String, Object> result = new HashMap<>();
                result.put("id", change.get("id"));
                result.put("status", "synced");
                results.add(result);
                synced++;
            } catch (Exception e) {
                Map<String, Object> result = new HashMap<>();
                result.put("id", change.get("id"));
                result.put("status", "failed");
                result.put("error", e.getMessage());
                results.add(result);
                failed++;
            }
        }

        // Broadcast update to connected clients
        messagingTemplate.convertAndSend("/topic/lists/" + listId, Map.of(
                "type", "sync",
                "timestamp", LocalDateTime.now().toString()
        ));

        Map<String, Object> response = new HashMap<>();
        response.put("results", results);
        response.put("synced", synced);
        response.put("failed", failed);
        return response;
    }

    private void processProductChange(UUID listId, String type, Map<String, Object> change, Map<String, Object> payload) {
        switch (type) {
            case "create" -> {
                ShoppingList list = listRepository.findById(listId)
                        .orElseThrow(() -> new RuntimeException("List not found"));
                Product product = new Product();
                product.setName((String) payload.get("name"));
                if (payload.get("price") != null) {
                    product.setPrice(((Number) payload.get("price")).doubleValue());
                }
                product.setShoppingList(list);
                productRepository.save(product);
            }
            case "update" -> {
                String entityId = (String) change.get("entityId");
                Product product = productRepository.findById(UUID.fromString(entityId))
                        .orElseThrow(() -> new RuntimeException("Product not found"));
                if (payload.containsKey("name")) product.setName((String) payload.get("name"));
                if (payload.containsKey("price") && payload.get("price") != null) {
                    product.setPrice(((Number) payload.get("price")).doubleValue());
                }
                product.setVersion(product.getVersion() + 1);
                productRepository.save(product);
            }
            case "toggle" -> {
                String entityId = (String) change.get("entityId");
                Product product = productRepository.findById(UUID.fromString(entityId))
                        .orElseThrow(() -> new RuntimeException("Product not found"));
                product.setPurchased(!product.getPurchased());
                product.setPurchasedBy(product.getPurchased() ? (String) payload.get("purchasedBy") : null);
                product.setPurchasedAt(product.getPurchased() ? LocalDateTime.now() : null);
                product.setVersion(product.getVersion() + 1);
                productRepository.save(product);
            }
            case "delete" -> {
                String entityId = (String) change.get("entityId");
                Product product = productRepository.findById(UUID.fromString(entityId))
                        .orElseThrow(() -> new RuntimeException("Product not found"));
                product.setDeletedAt(LocalDateTime.now());
                productRepository.save(product);
            }
        }
    }

    private void processListChange(UUID listId, String type, Map<String, Object> change, Map<String, Object> payload) {
        switch (type) {
            case "update" -> {
                ShoppingList list = listRepository.findById(listId)
                        .orElseThrow(() -> new RuntimeException("List not found"));
                if (payload.containsKey("name")) list.setName((String) payload.get("name"));
                list.setVersion(list.getVersion() + 1);
                listRepository.save(list);
            }
            case "delete" -> {
                ShoppingList list = listRepository.findById(listId)
                        .orElseThrow(() -> new RuntimeException("List not found"));
                list.setDeletedAt(LocalDateTime.now());
                listRepository.save(list);
            }
        }
    }

    public void broadcastChange(UUID listId, String changeType, Object data) {
        messagingTemplate.convertAndSend("/topic/lists/" + listId, Map.of(
                "type", changeType,
                "data", data,
                "timestamp", LocalDateTime.now().toString()
        ));
    }
}
