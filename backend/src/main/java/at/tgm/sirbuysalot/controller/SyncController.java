package at.tgm.sirbuysalot.controller;

import at.tgm.sirbuysalot.service.SyncService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists/{listId}/sync")
@RequiredArgsConstructor
public class SyncController {

    private final SyncService syncService;

    @PostMapping
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
