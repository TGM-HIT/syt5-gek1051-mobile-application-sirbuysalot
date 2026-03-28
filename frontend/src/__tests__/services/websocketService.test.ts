import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Store the original WebSocket so we can restore it
const OriginalWebSocket = globalThis.WebSocket

// We need to re-import the module fresh for each test to reset internal state
let websocketService: any

function createMockWebSocket() {
  const ws: any = {
    readyState: 0, // CONNECTING
    close: vi.fn(),
    send: vi.fn(),
    onopen: null as any,
    onclose: null as any,
    onmessage: null as any,
    onerror: null as any,
  }
  return ws
}

let mockWs: ReturnType<typeof createMockWebSocket>

describe('websocketService', () => {
  beforeEach(async () => {
    vi.useFakeTimers()
    mockWs = createMockWebSocket()

    // Mock WebSocket constructor
    globalThis.WebSocket = vi.fn(() => mockWs) as any
    ;(globalThis.WebSocket as any).OPEN = 1
    ;(globalThis.WebSocket as any).CLOSED = 3

    // Reset module to get a fresh WebSocketService instance
    vi.resetModules()
    const mod = await import('@/services/websocketService')
    websocketService = mod.websocketService
  })

  afterEach(() => {
    vi.useRealTimers()
    globalThis.WebSocket = OriginalWebSocket
  })

  it('connect creates a WebSocket with the correct URL', () => {
    websocketService.connect('list-1')

    expect(globalThis.WebSocket).toHaveBeenCalledWith(
      expect.stringContaining('listId=list-1'),
    )
  })

  it('connect sets connected to true on open', () => {
    websocketService.connect('list-1')

    expect(websocketService.connected.value).toBe(false)

    // Simulate open
    mockWs.readyState = 1
    mockWs.onopen()

    expect(websocketService.connected.value).toBe(true)
  })

  it('disconnect closes socket and resets state', () => {
    websocketService.connect('list-1')
    mockWs.readyState = 1
    mockWs.onopen()

    websocketService.disconnect()

    expect(mockWs.close).toHaveBeenCalled()
    expect(websocketService.connected.value).toBe(false)
  })

  it('subscribe returns an unsubscribe function', () => {
    const handler = vi.fn()
    const unsub = websocketService.subscribe('product-added', handler)

    expect(typeof unsub).toBe('function')

    // After unsubscribe, handler should not be called
    unsub()

    // Simulate a message to verify handler is removed
    websocketService.connect('list-1')
    mockWs.readyState = 1
    mockWs.onopen()
    mockWs.onmessage({ data: JSON.stringify({ type: 'product-added', name: 'Milk' }) })

    expect(handler).not.toHaveBeenCalled()
  })

  it('dispatches messages to topic-specific handlers', () => {
    const handler = vi.fn()
    websocketService.subscribe('product-added', handler)

    websocketService.connect('list-1')
    mockWs.readyState = 1
    mockWs.onopen()

    const message = { type: 'product-added', name: 'Milk' }
    mockWs.onmessage({ data: JSON.stringify(message) })

    expect(handler).toHaveBeenCalledWith(message)
  })

  it('wildcard subscriber receives all messages', () => {
    const wildcardHandler = vi.fn()
    const topicHandler = vi.fn()
    websocketService.subscribe('*', wildcardHandler)
    websocketService.subscribe('product-added', topicHandler)

    websocketService.connect('list-1')
    mockWs.readyState = 1
    mockWs.onopen()

    const message = { type: 'product-added', name: 'Milk' }
    mockWs.onmessage({ data: JSON.stringify(message) })

    expect(wildcardHandler).toHaveBeenCalledWith(message)
    expect(topicHandler).toHaveBeenCalledWith(message)
  })

  it('attempts reconnect on close', () => {
    // Track all created WebSocket instances
    const instances: any[] = []
    globalThis.WebSocket = vi.fn(() => {
      const ws = createMockWebSocket()
      instances.push(ws)
      return ws
    }) as any
    ;(globalThis.WebSocket as any).OPEN = 1
    ;(globalThis.WebSocket as any).CLOSED = 3

    websocketService.connect('list-1')
    const firstWs = instances[0]
    firstWs.readyState = 1
    firstWs.onopen()

    // Simulate close — readyState must reflect closed state
    firstWs.readyState = 3
    firstWs.onclose()

    // Advance timer past reconnect delay
    vi.advanceTimersByTime(5000)

    // WebSocket constructor should have been called again for reconnect
    expect(globalThis.WebSocket).toHaveBeenCalledTimes(2)
  })

  it('ignores malformed messages without crashing', () => {
    const handler = vi.fn()
    websocketService.subscribe('test', handler)

    websocketService.connect('list-1')
    mockWs.readyState = 1
    mockWs.onopen()

    // Send malformed (non-JSON) data
    mockWs.onmessage({ data: 'not-json{{{' })

    // Handler should not be called, and no error thrown
    expect(handler).not.toHaveBeenCalled()
  })
})
