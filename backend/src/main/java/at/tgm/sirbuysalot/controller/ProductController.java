package at.tgm.sirbuysalot.controller;

import at.tgm.sirbuysalot.model.Product;
import at.tgm.sirbuysalot.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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
    public ResponseEntity<Product> create(@PathVariable UUID listId, @Valid @RequestBody Product product) {
        return ResponseEntity.ok(service.create(listId, product));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Product> update(@PathVariable UUID id, @RequestBody Product product) {
        return ResponseEntity.ok(service.update(id, product));
    }

    @PatchMapping("/{id}/purchase")
    public ResponseEntity<Product> togglePurchase(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(service.markPurchased(id, body.get("purchasedBy")));
    }

    @GetMapping("/deleted")
    public ResponseEntity<List<Product>> getDeleted(@PathVariable UUID listId) {
        return ResponseEntity.ok(service.findDeletedByListId(listId));
    }

    @PatchMapping("/{id}/restore")
    public ResponseEntity<Product> restore(@PathVariable UUID id) {
        return ResponseEntity.ok(service.restore(id));
    }

    @PatchMapping("/{id}/tags")
    public ResponseEntity<Product> setTags(@PathVariable UUID id, @RequestBody Map<String, List<String>> body) {
        List<String> tagIds = body.get("tagIds");
        Set<UUID> uuids = tagIds.stream().map(UUID::fromString).collect(Collectors.toSet());
        return ResponseEntity.ok(service.setTags(id, uuids));
    }

    @PatchMapping("/reorder")
    public ResponseEntity<Void> reorder(@PathVariable UUID listId, @RequestBody List<Map<String, Object>> order) {
        service.reorder(listId, order);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
