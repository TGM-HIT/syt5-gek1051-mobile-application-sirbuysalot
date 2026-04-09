package at.tgm.sirbuysalot.controller;

import at.tgm.sirbuysalot.model.ShoppingList;
import at.tgm.sirbuysalot.service.ShoppingListService;
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

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ShoppingListControllerTest {

    @Mock
    private ShoppingListService service;

    @InjectMocks
    private ShoppingListController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getAll_returnsLists() throws Exception {
        ShoppingList list = ShoppingList.builder()
                .id(UUID.randomUUID()).name("Groceries").build();
        when(service.findAll()).thenReturn(List.of(list));

        mockMvc.perform(get("/api/lists"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Groceries"));
    }

    @Test
    void getById_returnsList() throws Exception {
        UUID id = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder()
                .id(id).name("Groceries").build();
        when(service.findById(id)).thenReturn(Optional.of(list));

        mockMvc.perform(get("/api/lists/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Groceries"));
    }

    @Test
    void getById_returns404WhenNotFound() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.findById(id)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/lists/{id}", id))
                .andExpect(status().isNotFound());
    }

    @Test
    void create_returnsList() throws Exception {
        ShoppingList list = ShoppingList.builder()
                .id(UUID.randomUUID()).name("Groceries").accessCode("abc12345").build();
        when(service.create(any())).thenReturn(list);

        mockMvc.perform(post("/api/lists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Groceries\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Groceries"))
                .andExpect(jsonPath("$.accessCode").value("abc12345"));
    }

    @Test
    void update_returnsList() throws Exception {
        UUID id = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder()
                .id(id).name("Updated").version(2).build();
        when(service.update(eq(id), any())).thenReturn(list);

        mockMvc.perform(put("/api/lists/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Updated\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"))
                .andExpect(jsonPath("$.version").value(2));
    }

    @Test
    void delete_returns204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(service).softDelete(id);

        mockMvc.perform(delete("/api/lists/{id}", id))
                .andExpect(status().isNoContent());

        verify(service).softDelete(id);
    }

    // --- Additional tests ---

    @Test
    void joinByCode_returnsList() throws Exception {
        ShoppingList list = ShoppingList.builder()
                .id(UUID.randomUUID()).name("Groceries").accessCode("abc12345").build();
        when(service.findByAccessCode("abc12345")).thenReturn(Optional.of(list));

        mockMvc.perform(get("/api/lists/join/{accessCode}", "abc12345"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Groceries"))
                .andExpect(jsonPath("$.accessCode").value("abc12345"));
    }

    @Test
    void joinByCode_returns404WhenNotFound() throws Exception {
        when(service.findByAccessCode("nonexist")).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/lists/join/{accessCode}", "nonexist"))
                .andExpect(status().isNotFound());
    }

    @Test
    void getDeleted_returnsDeletedLists() throws Exception {
        ShoppingList deleted = ShoppingList.builder()
                .id(UUID.randomUUID()).name("Old List").build();
        when(service.findDeleted()).thenReturn(List.of(deleted));

        mockMvc.perform(get("/api/lists/deleted"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Old List"));
    }

    @Test
    void restore_returnsList() throws Exception {
        UUID id = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder()
                .id(id).name("Restored List").version(2).build();
        when(service.restore(id)).thenReturn(list);

        mockMvc.perform(patch("/api/lists/{id}/restore", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Restored List"))
                .andExpect(jsonPath("$.version").value(2));
    }

    @Test
    void duplicate_returnsDuplicatedList() throws Exception {
        UUID id = UUID.randomUUID();
        ShoppingList copy = ShoppingList.builder()
                .id(UUID.randomUUID()).name("Groceries (Kopie)").accessCode("new12345").build();
        when(service.duplicate(id)).thenReturn(copy);

        mockMvc.perform(post("/api/lists/{id}/duplicate", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Groceries (Kopie)"))
                .andExpect(jsonPath("$.accessCode").value("new12345"));
    }

    @Test
    void create_blankName_returns400() throws Exception {
        mockMvc.perform(post("/api/lists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest());

        verify(service, never()).create(any());
    }

    @Test
    void create_whitespaceName_returns400() throws Exception {
        mockMvc.perform(post("/api/lists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"   \"}"))
                .andExpect(status().isBadRequest());

        verify(service, never()).create(any());
    }

    @Test
    void getDeleted_returnsEmptyWhenNoneDeleted() throws Exception {
        when(service.findDeleted()).thenReturn(List.of());

        mockMvc.perform(get("/api/lists/deleted"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }
}
