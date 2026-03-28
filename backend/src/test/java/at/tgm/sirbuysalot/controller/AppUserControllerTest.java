package at.tgm.sirbuysalot.controller;

import at.tgm.sirbuysalot.model.AppUser;
import at.tgm.sirbuysalot.service.AppUserService;
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
class AppUserControllerTest {

    @Mock
    private AppUserService service;

    @InjectMocks
    private AppUserController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UUID listId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getUsers_returnsUsers() throws Exception {
        AppUser user = AppUser.builder().id(UUID.randomUUID()).displayName("Alice").build();
        when(service.findByListId(listId)).thenReturn(List.of(user));

        mockMvc.perform(get("/api/lists/{listId}/users", listId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].displayName").value("Alice"));
    }

    @Test
    void getUsers_returnsEmptyList() throws Exception {
        when(service.findByListId(listId)).thenReturn(List.of());

        mockMvc.perform(get("/api/lists/{listId}/users", listId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void joinList_returnsUser() throws Exception {
        AppUser user = AppUser.builder().id(UUID.randomUUID()).displayName("Bob").build();
        when(service.joinList(eq(listId), eq("Bob"))).thenReturn(user);

        mockMvc.perform(post("/api/lists/{listId}/users", listId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"displayName\":\"Bob\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Bob"));
    }

    @Test
    void joinList_blankName_returns400() throws Exception {
        mockMvc.perform(post("/api/lists/{listId}/users", listId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"displayName\":\"\"}"))
                .andExpect(status().isBadRequest());

        verify(service, never()).joinList(any(), any());
    }

    @Test
    void joinList_nullName_returns400() throws Exception {
        mockMvc.perform(post("/api/lists/{listId}/users", listId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        verify(service, never()).joinList(any(), any());
    }
}
