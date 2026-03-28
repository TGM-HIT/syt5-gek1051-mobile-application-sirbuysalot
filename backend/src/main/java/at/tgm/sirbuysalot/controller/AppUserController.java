package at.tgm.sirbuysalot.controller;

import at.tgm.sirbuysalot.model.AppUser;
import at.tgm.sirbuysalot.service.AppUserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/lists/{listId}/users")
@RequiredArgsConstructor
@Tag(name = "Benutzer", description = "Benutzer-Verwaltung pro Einkaufsliste")
public class AppUserController {

    private final AppUserService service;

    @GetMapping
    public ResponseEntity<List<AppUser>> getUsers(@PathVariable UUID listId) {
        return ResponseEntity.ok(service.findByListId(listId));
    }

    @PostMapping
    public ResponseEntity<AppUser> joinList(@PathVariable UUID listId, @RequestBody Map<String, String> body) {
        String displayName = body.get("displayName");
        if (displayName == null || displayName.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(service.joinList(listId, displayName));
    }
}
