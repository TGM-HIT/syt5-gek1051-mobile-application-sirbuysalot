package at.tgm.sirbuysalot.controller;

import at.tgm.sirbuysalot.model.Tag;
import at.tgm.sirbuysalot.service.TagService;
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
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class TagControllerTest {

    @Mock
    private TagService service;

    @InjectMocks
    private TagController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UUID listId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getAll_returnsTags() throws Exception {
        Tag tag = Tag.builder().id(UUID.randomUUID()).name("Fruit").build();
        when(service.findByListId(listId)).thenReturn(List.of(tag));

        mockMvc.perform(get("/api/lists/{listId}/tags", listId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Fruit"));
    }

    @Test
    void getAll_returnsEmptyList() throws Exception {
        when(service.findByListId(listId)).thenReturn(List.of());

        mockMvc.perform(get("/api/lists/{listId}/tags", listId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void create_returnsTag() throws Exception {
        Tag tag = Tag.builder().id(UUID.randomUUID()).name("Fruit").build();
        when(service.create(eq(listId), eq("Fruit"))).thenReturn(tag);

        mockMvc.perform(post("/api/lists/{listId}/tags", listId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Fruit\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Fruit"));
    }

    @Test
    void create_blankName_returns400() throws Exception {
        mockMvc.perform(post("/api/lists/{listId}/tags", listId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest());

        verify(service, never()).create(any(), any());
    }

    @Test
    void create_nullName_returns400() throws Exception {
        mockMvc.perform(post("/api/lists/{listId}/tags", listId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        verify(service, never()).create(any(), any());
    }

    @Test
    void create_whitespaceName_returns400() throws Exception {
        mockMvc.perform(post("/api/lists/{listId}/tags", listId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"   \"}"))
                .andExpect(status().isBadRequest());

        verify(service, never()).create(any(), any());
    }

    @Test
    void update_returnsTag() throws Exception {
        UUID tagId = UUID.randomUUID();
        Tag tag = Tag.builder().id(tagId).name("Vegetables").build();
        when(service.update(eq(tagId), eq("Vegetables"))).thenReturn(tag);

        mockMvc.perform(put("/api/lists/{listId}/tags/{id}", listId, tagId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Vegetables\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Vegetables"));
    }

    @Test
    void delete_returns204() throws Exception {
        UUID tagId = UUID.randomUUID();
        doNothing().when(service).delete(tagId);

        mockMvc.perform(delete("/api/lists/{listId}/tags/{id}", listId, tagId))
                .andExpect(status().isNoContent());

        verify(service).delete(tagId);
    }
}
