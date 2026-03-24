import { ref } from 'vue'

export type MessageHandler = (message: any) => void

const WS_BASE = import.meta.env.VITE_WS_URL || 'ws://localhost:8080/ws'
const RECONNECT_DELAY = 3000
const MAX_RECONNECT_ATTEMPTS = 10

class WebSocketService {
  private socket: WebSocket | null = null
  private subscriptions = new Map<string, Set<MessageHandler>>()
  private reconnectAttempts = 0
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private currentListId: string | null = null

  readonly connected = ref(false)
  readonly connecting = ref(false)

  connect(listId: string): void {
    if (this.socket?.readyState === WebSocket.OPEN && this.currentListId === listId) {
      return
    }

    this.disconnect()
    this.currentListId = listId
    this.connecting.value = true

    try {
      this.socket = new WebSocket(`${WS_BASE}?listId=${listId}`)

      this.socket.onopen = () => {
        this.connected.value = true
        this.connecting.value = false
        this.reconnectAttempts = 0

        // Send subscription message
        this.send({ type: 'subscribe', listId })
      }

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          this.handleMessage(message)
        } catch {
          // Ignore malformed messages
        }
      }

      this.socket.onclose = () => {
        this.connected.value = false
        this.connecting.value = false
        this.attemptReconnect()
      }

      this.socket.onerror = () => {
        this.connected.value = false
        this.connecting.value = false
      }
    } catch {
      this.connecting.value = false
    }
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.socket) {
      this.socket.onclose = null
      this.socket.close()
      this.socket = null
    }

    this.connected.value = false
    this.connecting.value = false
    this.currentListId = null
    this.reconnectAttempts = 0
  }

  subscribe(topic: string, handler: MessageHandler): () => void {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set())
    }
    this.subscriptions.get(topic)!.add(handler)

    return () => {
      const handlers = this.subscriptions.get(topic)
      if (handlers) {
        handlers.delete(handler)
        if (handlers.size === 0) this.subscriptions.delete(topic)
      }
    }
  }

  private handleMessage(message: any): void {
    const topic = message.type || 'default'

    // Notify topic-specific subscribers
    const handlers = this.subscriptions.get(topic)
    if (handlers) {
      handlers.forEach((handler) => handler(message))
    }

    // Notify wildcard subscribers
    const wildcardHandlers = this.subscriptions.get('*')
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler(message))
    }
  }

  private send(data: any): void {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(data))
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS || !this.currentListId) {
      return
    }

    this.reconnectAttempts++
    const delay = RECONNECT_DELAY * Math.min(this.reconnectAttempts, 5)

    this.reconnectTimer = setTimeout(() => {
      if (this.currentListId) {
        this.connect(this.currentListId)
      }
    }, delay)
  }
}

export const websocketService = new WebSocketService()
