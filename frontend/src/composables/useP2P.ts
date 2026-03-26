import { onMounted, onUnmounted } from 'vue'
import { p2pService } from '@/services/p2pService'

export function useP2P(listId: string, onRemoteChange?: (data: any) => void) {
  let unsubscribe: (() => void) | null = null

  onMounted(() => {
    p2pService.init(listId)

    if (onRemoteChange) {
      unsubscribe = p2pService.onMessage((rawData) => {
        try {
          const data = typeof rawData === 'string' ? JSON.parse(rawData) : rawData
          onRemoteChange(data)
        } catch {
          // Ignore malformed messages
        }
      })
    }
  })

  onUnmounted(() => {
    unsubscribe?.()
    p2pService.destroy()
  })

  function broadcast(type: string, payload: any) {
    p2pService.send({ type, payload, timestamp: Date.now() })
  }

  function connectToPeer(peerId: string) {
    p2pService.connectToPeer(peerId)
  }

  return {
    peerId: p2pService.peerId,
    connected: p2pService.connected,
    peerCount: p2pService.peerCount,
    broadcast,
    connectToPeer,
  }
}
