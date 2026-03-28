<script setup lang="ts">
import { ref, computed } from 'vue'
import type { ChatMessage, SpeedMode } from './types'
import { useRobot } from './composables/useRobot'
import { useVoiceInput } from './composables/useVoiceInput'
import RobotStatusBar from './components/RobotStatusBar.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import VoiceInput from './components/VoiceInput.vue'
import ChatPanel from './components/ChatPanel.vue'
import SafetyControls from './components/SafetyControls.vue'
import QuickActions from './components/QuickActions.vue'
import type { QuickAction } from './components/QuickActions.vue'

const quickActions: QuickAction[] = [
  { label: 'ゴミ箱はどこ？', query: 'ゴミ箱はどこ？' },
  { label: 'ペットボトルの捨て場所', query: 'ペットボトルどこに捨てればいい？' },
  { label: 'トイレに案内して', query: 'トイレに案内して' },
  { label: 'キッチンに行って', query: 'キッチンに行って' },
  { label: '今どこにいる？', query: '今どこにいる？' },
  { label: 'リモコンどこ？', query: 'リモコンどこに置いたっけ？' },
]

const {
  robotState,
  locations,
  isConnected,
  speedMode,
  isPaused,
  sendMove,
  sendStop,
  sendPause,
  sendResume,
  sendSpeedMode,
  sendAsk,
} = useRobot()

// --- 移動確認（音声経由） ---
const selectedLocationName = ref('')
const selectedLocationId = ref<string | null>(null)
const showConfirm = ref(false)

async function onConfirmMove() {
  if (!selectedLocationId.value) return
  showConfirm.value = false
  await sendMove(selectedLocationId.value)
  selectedLocationId.value = null
  selectedLocationName.value = ''
}

function onCancelMove() {
  showConfirm.value = false
  selectedLocationId.value = null
  selectedLocationName.value = ''
}

// --- 音声入力 & チャット ---
const chatMessages = ref<ChatMessage[]>([])
const isAsking = ref(false)

async function handleQuickAction(query: string) {
  await handleVoiceResult(query)
}

async function handleVoiceResult(text: string) {
  if (isAsking.value) return
  isAsking.value = true
  chatMessages.value.push({ role: 'user', text })

  try {
    const response = await sendAsk(text)
    chatMessages.value.push({ role: 'assistant', text: response.answer })

    // 回答にアクション（移動指示など）が含まれている場合
    if (response.action === 'move' && response.location_id) {
      const loc = locations.value.find(l => l.id === response.location_id)
      if (loc) {
        selectedLocationId.value = loc.id
        selectedLocationName.value = loc.name_ja
        showConfirm.value = true
      }
    }
  } catch {
    chatMessages.value.push({
      role: 'assistant',
      text: 'すみません、サーバーに接続できませんでした。もう一度お試しください。',
    })
  } finally {
    isAsking.value = false
    voiceResetStatus()
  }
}

const {
  status: voiceStatus,
  transcript: voiceTranscript,
  interimTranscript,
  isSupported: voiceSupported,
  startListening,
  resetStatus: voiceResetStatus,
} = useVoiceInput(handleVoiceResult)

// --- 音声読み上げ ---
function speakText(text: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ja-JP'
  utterance.rate = 0.9
  window.speechSynthesis.speak(utterance)
}

// --- 安全性制御 ---
const isMoving = computed(() => robotState.value.status === 'moving')

async function onSpeedModeChange(mode: SpeedMode) {
  await sendSpeedMode(mode)
}

async function onPause() {
  await sendPause()
}

async function onResume() {
  await sendResume()
}

async function onEmergencyStop() {
  await sendStop()
}
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>G1 Web Controller</h1>
    </header>

    <RobotStatusBar
      :state="robotState"
      :connected="isConnected"
    />

    <!-- 音声入力セクション -->
    <section class="voice-section">
      <h2>G1に話しかける</h2>
      <VoiceInput
        :status="voiceStatus"
        :transcript="voiceTranscript"
        :interim-transcript="interimTranscript"
        :supported="voiceSupported"
        @toggle="startListening"
      />
      <QuickActions
        :actions="quickActions"
        :disabled="isAsking || voiceStatus === 'listening'"
        @select="handleQuickAction"
      />
      <ChatPanel
        :messages="chatMessages"
        @speak="speakText"
      />
    </section>

    <div class="spacer"></div>

    <!-- 安全性コントロール（フッター） -->
    <footer class="app-footer">
      <SafetyControls
        :speed-mode="speedMode"
        :is-paused="isPaused"
        :is-moving="isMoving"
        @update:speed-mode="onSpeedModeChange"
        @pause="onPause"
        @resume="onResume"
        @stop="onEmergencyStop"
      />
    </footer>

    <ConfirmDialog
      :visible="showConfirm"
      :location-name="selectedLocationName"
      @confirm="onConfirmMove"
      @cancel="onCancelMove"
    />
  </div>
</template>

<style scoped>
.app {
  max-width: 480px;
  margin: 0 auto;
  padding: 16px;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.app-header h1 {
  font-size: 20px;
  text-align: center;
  color: #222;
  margin: 0;
}

.voice-section h2 {
  font-size: 16px;
  color: #666;
  margin: 0 0 8px;
}

.spacer {
  flex: 1;
}

.app-footer {
  position: sticky;
  bottom: 16px;
}
</style>
