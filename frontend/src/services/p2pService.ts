import Peer, { DataConnection } from 'peerjs'
import { ref } from 'vue'

export type P2PMessageHandler = (data: any, peerId: string) => void

const PREFIX = 'sirbuysalot-'

class P2PService {
  private peer: Peer | null = null
  private connections = new Map<string, DataConnection>()
  private handlers = new Set<P2PMessageHandler>()

  readonly peerId = ref<string | null>(null)
  readonly connected = ref(false)
  readonly peerCount = ref(0)

  init(listId: string): void {
    if (this.peer) return

    const id = PREFIX + listId + '-' + Math.random().toString(36).substring(2, 8)

    this.peer = new Peer(id, {
      debug: 0,
    })

    this.peer.on('open', (openedId) => {
      this.peerId.value = openedId
      this.connected.value = true
    })

    this.peer.on('connection', (conn) => {
      this.setupConnection(conn)
    })

    this.peer.on('error', () => {
      this.connected.value = false
    })

    this.peer.on('disconnected', () => {
      this.connected.value = false
      // Try to reconnect
      this.peer?.reconnect()
    })
  }

  connectToPeer(remotePeerId: string): void {
    if (!this.peer || this.connections.has(remotePeerId)) return

    const conn = this.peer.connect(remotePeerId, {
      reliable: true,
    })

    this.setupConnection(conn)
  }

  private setupConnection(conn: DataConnection): void {
    conn.on('open', () => {
      this.connections.set(conn.peer, conn)
      this.peerCount.value = this.connections.size
    })

    conn.on('data', (data) => {
      this.handlers.forEach((handler) => handler(data, conn.peer))
    })

    conn.on('close', () => {
      this.connections.delete(conn.peer)
      this.peerCount.value = this.connections.size
    })

    conn.on('error', () => {
      this.connections.delete(conn.peer)
      this.peerCount.value = this.connections.size
    })
  }

  send(data: any): void {
    const message = JSON.stringify(data)
    this.connections.forEach((conn) => {
      if (conn.open) {
        conn.send(message)
      }
    })
  }

  onMessage(handler: P2PMessageHandler): () => void {
    this.handlers.add(handler)
    return () => this.handlers.delete(handler)
  }

  getPeerId(): string | null {
    return this.peerId.value
  }

  getConnectedPeers(): string[] {
    return Array.from(this.connections.keys())
  }

  destroy(): void {
    this.connections.forEach((conn) => conn.close())
    this.connections.clear()
    this.peer?.destroy()
    this.peer = null
    this.peerId.value = null
    this.connected.value = false
    this.peerCount.value = 0
    this.handlers.clear()
  }
}

export const p2pService = new P2PService()
