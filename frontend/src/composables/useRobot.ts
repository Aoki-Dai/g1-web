import { ref, onMounted, onUnmounted } from 'vue'
import type { Location, RobotState, MoveResponse } from '../types'

const robotState = ref<RobotState>({
  status: 'idle',
  current_position: { x: 0, y: 0, theta: 0 },
  current_location: null,
  target_location: null,
  battery_level: 100,
  message: '',
})

const locations = ref<Location[]>([])
const isConnected = ref(false)

let ws: WebSocket | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectDelay = 1000

function connectWebSocket() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const wsUrl = `${protocol}//${window.location.host}/ws/robot/status`

  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    isConnected.value = true
    reconnectDelay = 1000
  }

  ws.onmessage = (event) => {
    try {
      robotState.value = JSON.parse(event.data)
    } catch {
      // ignore parse errors
    }
  }

  ws.onclose = () => {
    isConnected.value = false
    scheduleReconnect()
  }

  ws.onerror = () => {
    ws?.close()
  }
}

function scheduleReconnect() {
  if (reconnectTimer) return
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null
    connectWebSocket()
    reconnectDelay = Math.min(reconnectDelay * 2, 5000)
  }, reconnectDelay)
}

function disconnectWebSocket() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  ws?.close()
  ws = null
}

async function fetchLocations() {
  const res = await fetch('/api/locations')
  const data = await res.json()
  locations.value = data.locations
}

async function sendMove(locationId: string): Promise<MoveResponse> {
  const res = await fetch('/api/robot/move', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ location_id: locationId }),
  })
  return res.json()
}

async function sendStop(): Promise<MoveResponse> {
  const res = await fetch('/api/robot/stop', { method: 'POST' })
  return res.json()
}

export function useRobot() {
  onMounted(() => {
    fetchLocations()
    connectWebSocket()
  })

  onUnmounted(() => {
    disconnectWebSocket()
  })

  return {
    robotState,
    locations,
    isConnected,
    sendMove,
    sendStop,
  }
}
