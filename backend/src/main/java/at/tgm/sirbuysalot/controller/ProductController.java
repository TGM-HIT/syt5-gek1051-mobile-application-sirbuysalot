package at.tgm.sirbuysalot.controller;

import at.tgm.sirbuysalot.model.Product;
import at.tgm.sirbuysalot.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists/{listId}/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService service;

    @GetMapping
    public ResponseEntity<List<Product>> getAll(@PathVariable UUID listId) {
        return ResponseEntity.ok(service.findByListId(listId));
    }

    @PostMapping
    public ResponseEntity<Product> create(@PathVariable UUID listId, @RequestBody Product product) {
        return ResponseEntity.ok(service.create(listId, product));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable UUID id, @RequestBody Product product) {
        return ResponseEntity.ok(service.update(id, product));
    }

    @PatchMapping("/{id}/purchase")
    public ResponseEntity<Product> togglePurchase(
            @PathVariable UUID listId,
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.markPurchased(id, listId, body.get("purchasedBy")));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
