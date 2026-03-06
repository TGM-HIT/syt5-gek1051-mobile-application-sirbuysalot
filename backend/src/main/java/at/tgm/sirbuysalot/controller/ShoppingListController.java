package at.tgm.sirbuysalot.controller;

import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.service.ShoppingListService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
public class ShoppingListController {

    private final ShoppingListService service;

    @GetMapping
    public ResponseEntity<List<ShoppingList>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ShoppingList> getById(@PathVariable UUID id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<ShoppingList> create(@RequestBody ShoppingList list) {
        return ResponseEntity.ok(service.create(list));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShoppingList> update(@PathVariable UUID id, @RequestBody ShoppingList list) {
        return ResponseEntity.ok(service.update(id, list));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
