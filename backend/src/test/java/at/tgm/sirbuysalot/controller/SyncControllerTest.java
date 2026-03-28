package at.tgm.sirbuysalot.controller;

import at.tgm.sirbuysalot.service.SyncService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.*;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class SyncControllerTest {

    @Mock
    private SyncService syncService;

    @InjectMocks
    private SyncController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UUID listId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void syncBatch_withChanges_returnsResults() throws Exception {
        Map<String, Object> serviceResult = new HashMap<>();
        serviceResult.put("results", List.of(Map.of("id", "c1", "status", "synced")));
        serviceResult.put("synced", 1);
        serviceResult.put("failed", 0);
        when(syncService.processBatch(eq(listId), any())).thenReturn(serviceResult);

        String body = objectMapper.writeValueAsString(Map.of(
                "changes", List.of(Map.of(
                        "id", "c1", "type", "create", "entity", "product",
                        "payload", Map.of("name", "Milk")
                ))
        ));

        mockMvc.perform(post("/api/lists/{listId}/sync", listId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.synced").value(1))
                .andExpect(jsonPath("$.failed").value(0));
    }

    @Test
    void syncBatch_emptyChanges_returnsZeroCounts() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("changes", List.of()));

        mockMvc.perform(post("/api/lists/{listId}/sync", listId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.synced").value(0))
                .andExpect(jsonPath("$.failed").value(0));

        verify(syncService, never()).processBatch(any(), any());
    }

    @Test
    void syncBatch_nullChanges_returnsZeroCounts() throws Exception {
        String body = "{}";

        mockMvc.perform(post("/api/lists/{listId}/sync", listId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.synced").value(0))
                .andExpect(jsonPath("$.failed").value(0));
    }

    @Test
    void syncBatch_multipleChanges_delegatesToService() throws Exception {
        Map<String, Object> serviceResult = new HashMap<>();
        serviceResult.put("results", List.of(
                Map.of("id", "c1", "status", "synced"),
                Map.of("id", "c2", "status", "synced")
        ));
        serviceResult.put("synced", 2);
        serviceResult.put("failed", 0);
        when(syncService.processBatch(eq(listId), any())).thenReturn(serviceResult);

        String body = objectMapper.writeValueAsString(Map.of(
                "changes", List.of(
                        Map.of("id", "c1", "type", "create", "entity", "product", "payload", Map.of("name", "Milk")),
                        Map.of("id", "c2", "type", "create", "entity", "product", "payload", Map.of("name", "Bread"))
                )
        ));

        mockMvc.perform(post("/api/lists/{listId}/sync", listId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.synced").value(2));

        verify(syncService).processBatch(eq(listId), any());
    }

    @Test
    void syncBatch_mixedResults_returnsCorrectCounts() throws Exception {
        Map<String, Object> serviceResult = new HashMap<>();
        serviceResult.put("results", List.of(
                Map.of("id", "c1", "status", "synced"),
                Map.of("id", "c2", "status", "failed", "error", "Not found")
        ));
        serviceResult.put("synced", 1);
        serviceResult.put("failed", 1);
        when(syncService.processBatch(eq(listId), any())).thenReturn(serviceResult);

        String body = objectMapper.writeValueAsString(Map.of(
                "changes", List.of(
                        Map.of("id", "c1", "type", "create", "entity", "product", "payload", Map.of("name", "Milk")),
                        Map.of("id", "c2", "type", "update", "entity", "product", "entityId", UUID.randomUUID().toString(), "payload", Map.of("name", "Ghost"))
                )
        ));

        mockMvc.perform(post("/api/lists/{listId}/sync", listId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.synced").value(1))
                .andExpect(jsonPath("$.failed").value(1));
    }
}
