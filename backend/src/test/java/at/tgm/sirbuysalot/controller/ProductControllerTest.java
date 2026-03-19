package at.tgm.sirbuysalot.controller;

import at.tgm.sirbuysalot.model.Product;
import at.tgm.sirbuysalot.service.ProductService;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class ProductControllerTest {

    @Mock
    private ProductService service;

    @InjectMocks
    private ProductController controller;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final UUID listId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    }

    @Test
    void getAll_returnsProducts() throws Exception {
        Product product = Product.builder()
                .id(UUID.randomUUID()).name("Milk").build();
        when(service.findByListId(listId)).thenReturn(List.of(product));

        mockMvc.perform(get("/api/lists/{listId}/products", listId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Milk"));
    }

    @Test
    void create_returnsProduct() throws Exception {
        Product product = Product.builder()
                .id(UUID.randomUUID()).name("Milk").price(BigDecimal.valueOf(1.50)).build();
        when(service.create(eq(listId), any())).thenReturn(product);

        mockMvc.perform(post("/api/lists/{listId}/products", listId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Milk\",\"price\":1.50}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Milk"))
                .andExpect(jsonPath("$.price").value(1.50));
    }

    @Test
    void update_returnsProduct() throws Exception {
        UUID productId = UUID.randomUUID();
        Product product = Product.builder()
                .id(productId).name("Oat Milk").version(2).build();
        when(service.update(eq(productId), any())).thenReturn(product);

        mockMvc.perform(put("/api/lists/{listId}/products/{id}", listId, productId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"Oat Milk\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Oat Milk"))
                .andExpect(jsonPath("$.version").value(2));
    }

    @Test
    void togglePurchase_returnsProduct() throws Exception {
        UUID productId = UUID.randomUUID();
        Product product = Product.builder()
                .id(productId).name("Milk").purchased(true).purchasedBy("Alice").build();
        when(service.markPurchased(eq(productId), eq(listId), eq("Alice"))).thenReturn(product);

        mockMvc.perform(patch("/api/lists/{listId}/products/{id}/purchase", listId, productId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"purchasedBy\":\"Alice\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.purchased").value(true))
                .andExpect(jsonPath("$.purchasedBy").value("Alice"));
    }

    @Test
    void delete_returns204() throws Exception {
        UUID productId = UUID.randomUUID();
        doNothing().when(service).softDelete(productId);

        mockMvc.perform(delete("/api/lists/{listId}/products/{id}", listId, productId))
                .andExpect(status().isNoContent());

        verify(service).softDelete(productId);
    }
}
