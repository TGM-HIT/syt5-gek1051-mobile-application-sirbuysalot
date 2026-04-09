package at.tgm.sirbuysalot.controller;

import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.service.ShoppingListService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists")
@RequiredArgsConstructor
@Tag(name = "Einkaufslisten", description = "CRUD-Operationen für Einkaufslisten")
public class ShoppingListController {

    private final ShoppingListService service;

    @GetMapping
    @Operation(summary = "Alle Listen abrufen", description = "Gibt alle aktiven (nicht gelöschten) Einkaufslisten zurück")
    public ResponseEntity<List<ShoppingList>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Liste per ID abrufen")
    @ApiResponse(responseCode = "200", description = "Liste gefunden")
    @ApiResponse(responseCode = "404", description = "Liste nicht gefunden")
    public ResponseEntity<ShoppingList> getById(@PathVariable UUID id) {
        return service.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @Operation(summary = "Neue Liste erstellen", description = "Erstellt eine neue Einkaufsliste mit generiertem Zugangscode")
    public ResponseEntity<ShoppingList> create(@Valid @RequestBody ShoppingList list) {
        return ResponseEntity.ok(service.create(list));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ShoppingList> update(@PathVariable UUID id, @Valid @RequestBody ShoppingList list) {
        return ResponseEntity.ok(service.update(id, list));
    }

    @GetMapping("/join/{accessCode}")
    @Operation(summary = "Per Zugangscode beitreten", description = "Sucht eine Liste anhand ihres 8-stelligen Zugangscodes")
    @ApiResponse(responseCode = "404", description = "Ungültiger Zugangscode")
    public ResponseEntity<ShoppingList> joinByCode(@PathVariable String accessCode) {
        return service.findByAccessCode(accessCode)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/deleted")
    @Operation(summary = "Gelöschte Listen abrufen")
    public ResponseEntity<List<ShoppingList>> getDeleted() {
        return ResponseEntity.ok(service.findDeleted());
    }

    @PatchMapping("/{id}/restore")
    @Operation(summary = "Gelöschte Liste wiederherstellen")
    public ResponseEntity<ShoppingList> restore(@PathVariable UUID id) {
        return ResponseEntity.ok(service.restore(id));
    }

    @PostMapping("/{id}/duplicate")
    @Operation(summary = "Liste duplizieren", description = "Erstellt eine Kopie der Liste inkl. aller Produkte")
    public ResponseEntity<ShoppingList> duplicate(@PathVariable UUID id) {
        return ResponseEntity.ok(service.duplicate(id));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Liste löschen (Soft Delete)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.softDelete(id);
        return ResponseEntity.noContent().build();
    }
}
