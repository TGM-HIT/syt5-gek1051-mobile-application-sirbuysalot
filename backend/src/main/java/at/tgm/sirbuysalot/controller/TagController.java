package at.tgm.sirbuysalot.controller;

import at.tgm.sirbuysalot.model.Tag;
import at.tgm.sirbuysalot.model.TagDTO;
import at.tgm.sirbuysalot.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/lists/{listId}/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService service;

    @GetMapping
    public ResponseEntity<List<TagDTO>> getAll(@PathVariable UUID listId) {
        List<TagDTO> tags = service.findByListId(listId).stream()
                .map(TagDTO::fromEntity)
                .collect(Collectors.toList());
        return ResponseEntity.ok(tags);
    }

    @PostMapping
    public ResponseEntity<TagDTO> create(@PathVariable UUID listId, @RequestBody Tag tag) {
        Tag created = service.create(listId, tag);
        return ResponseEntity.ok(TagDTO.fromEntity(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TagDTO> update(@PathVariable UUID id, @RequestBody Tag tag) {
        Tag updated = service.update(id, tag);
        return ResponseEntity.ok(TagDTO.fromEntity(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
