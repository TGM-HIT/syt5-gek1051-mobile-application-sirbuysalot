# Prompt: WebSocket Real-time Updates

## When
During implementation of US-07/US-08 (purchase marking and user attribution)

## Context
We needed real-time sync between clients. When User A marks a product as purchased, User B should see it immediately without refreshing. WebSockets with STOMP seemed like the right fit.

## Prompt (paraphrased)
"Our shopping list app needs real-time updates. When someone marks a product as purchased, all other users on the same list should see it instantly. We're using Vue 3 frontend and Spring Boot backend. How do we implement WebSocket communication between them?"

## Result
- Spring Boot with `@EnableWebSocketMessageBroker`
- STOMP over WebSocket for pub/sub pattern
- `/topic/lists/{listId}` for broadcasting changes
- `/app/purchase` for receiving purchase events
- Vue composable `useWebSocket.ts` to subscribe to list topics

## What We Learned
STOMP is overkill for simple apps but provides routing which helps organize messages. The alternative (raw WebSocket) would work too but STOMP makes it easier to send messages to specific channels.

## Key Takeaways
- WebSocket connection URL: `ws://localhost:8080/ws`
- STOMP subscribes to `/topic/lists/{listId}`
- Messages are JSON with type, payload, and timestamp
- `SimpMessagingTemplate.convertAndSend()` for server-to-client
