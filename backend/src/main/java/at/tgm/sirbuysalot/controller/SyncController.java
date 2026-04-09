package at.tgm.sirbuysalot.controller;

import at.tgm.sirbuysalot.service.SyncService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists/{listId}/sync")
@RequiredArgsConstructor
@Tag(name = "Synchronisation", description = "Offline-Batch-Synchronisation")
public class SyncController {

    private final SyncService syncService;

    @PostMapping
    @Operation(summary = "Offline-Änderungen synchronisieren", description = "Verarbeitet eine Liste von offline gesammelten Änderungen als Batch")
    public ResponseEntity<Map<String, Object>> syncBatch(
            @PathVariable UUID listId,
            @RequestBody Map<String, List<Map<String, Object>>> body) {
        List<Map<String, Object>> changes = body.get("changes");
        if (changes == null || changes.isEmpty()) {
            return ResponseEntity.ok(Map.of("results", List.of(), "synced", 0, "failed", 0));
        }
        return ResponseEntity.ok(syncService.processBatch(listId, changes));
    }
}
