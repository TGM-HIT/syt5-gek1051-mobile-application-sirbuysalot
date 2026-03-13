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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ShoppingListControllerTest {

    @Mock
    private ShoppingListService service;

    @InjectMocks
    private ShoppingListController controller;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
        objectMapper = new ObjectMapper();
    }

    @Test
    void create_gibtErstellteListeZurueck() throws Exception {
        ShoppingList created = ShoppingList.builder()
                .id(UUID.randomUUID())
                .name("Wocheneinkauf")
                .accessCode("ab12cd34")
                .version(1)
                .build();
        when(service.create(any(ShoppingList.class))).thenReturn(created);

        String body = objectMapper.writeValueAsString(
                ShoppingList.builder().name("Wocheneinkauf").build()
        );

        mockMvc.perform(post("/api/lists")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Wocheneinkauf"))
                .andExpect(jsonPath("$.accessCode").value("ab12cd34"));
    }

    @Test
    void getAll_gibtAlleListenZurueck() throws Exception {
        ShoppingList list = ShoppingList.builder()
                .id(UUID.randomUUID())
                .name("Einkaufsliste")
                .version(1)
                .build();
        when(service.findAll()).thenReturn(List.of(list));

        mockMvc.perform(get("/api/lists"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Einkaufsliste"));
    }

    @Test
    void getById_gibtListeZurueck() throws Exception {
        UUID id = UUID.randomUUID();
        ShoppingList list = ShoppingList.builder()
                .id(id)
                .name("Meine Liste")
                .version(1)
                .build();
        when(service.findById(id)).thenReturn(Optional.of(list));

        mockMvc.perform(get("/api/lists/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Meine Liste"));
    }

    @Test
    void getById_gibt404WennNichtGefunden() throws Exception {
        UUID id = UUID.randomUUID();
        when(service.findById(id)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/lists/" + id))
                .andExpect(status().isNotFound());
    }
}
