package at.tgm.sirbuysalot.service;

import at.tgm.sirbuysalot.model.Product;
import at.tgm.sirbuysalot.repository.ProductRepository;
import at.tgm.sirbuysalot.repository.ShoppingListRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ProductServiceTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ShoppingListRepository listRepository;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private ProductService productService;

    private UUID productId;
    private UUID listId;
    private Product product;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        listId = UUID.randomUUID();
        product = Product.builder()
                .id(productId)
                .name("Milch")
                .purchased(false)
                .version(1)
                .build();
        when(productRepository.findById(productId)).thenReturn(Optional.of(product));
        when(productRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void markPurchased_setsProductAsPurchased() {
        Product result = productService.markPurchased(productId, listId, "Julian");

        assertThat(result.getPurchased()).isTrue();
        assertThat(result.getPurchasedBy()).isEqualTo("Julian");
        assertThat(result.getPurchasedAt()).isNotNull();
    }

    @Test
    void markPurchased_togglesBackToNotPurchased() {
        product.setPurchased(true);
        product.setPurchasedBy("Julian");

        Product result = productService.markPurchased(productId, listId, "Julian");

        assertThat(result.getPurchased()).isFalse();
        assertThat(result.getPurchasedBy()).isNull();
        assertThat(result.getPurchasedAt()).isNull();
    }

    @Test
    void markPurchased_incrementsVersion() {
        Product result = productService.markPurchased(productId, listId, "Julian");

        assertThat(result.getVersion()).isEqualTo(2);
    }

    @Test
    void markPurchased_broadcastsViaWebSocket() {
        productService.markPurchased(productId, listId, "Julian");

        verify(messagingTemplate).convertAndSend(
                eq("/topic/lists/" + listId + "/products"),
                any(Product.class)
        );
    }

    @Test
    void markPurchased_broadcastsCorrectProduct() {
        ArgumentCaptor<Product> captor = ArgumentCaptor.forClass(Product.class);

        productService.markPurchased(productId, listId, "Julian");

        verify(messagingTemplate).convertAndSend(
                eq("/topic/lists/" + listId + "/products"),
                captor.capture()
        );
        assertThat(captor.getValue().getPurchased()).isTrue();
        assertThat(captor.getValue().getPurchasedBy()).isEqualTo("Julian");
    }
}
