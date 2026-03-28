<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Location, ChatMessage, SpeedMode } from './types'
import { useRobot } from './composables/useRobot'
import { useVoiceInput } from './composables/useVoiceInput'
import RobotStatusBar from './components/RobotStatusBar.vue'
import LocationButton from './components/LocationButton.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import VoiceInput from './components/VoiceInput.vue'
import ChatPanel from './components/ChatPanel.vue'
import SafetyControls from './components/SafetyControls.vue'

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

// --- 場所選択 ---
const selectedLocation = ref<Location | null>(null)
const showConfirm = ref(false)

function onSelectLocation(location: Location) {
  selectedLocation.value = location
  showConfirm.value = true
}

async function onConfirmMove() {
  if (!selectedLocation.value) return
  showConfirm.value = false
  await sendMove(selectedLocation.value.id)
  selectedLocation.value = null
}

function onCancelMove() {
  showConfirm.value = false
  selectedLocation.value = null
}

// --- 音声入力 & チャット ---
const chatMessages = ref<ChatMessage[]>([])

async function handleVoiceResult(text: string) {
  chatMessages.value.push({ role: 'user', text })

  try {
    const response = await sendAsk(text)
    chatMessages.value.push({ role: 'assistant', text: response.answer })

    // 回答にアクション（移動指示など）が含まれている場合
    if (response.action === 'move' && response.location_id) {
      const loc = locations.value.find(l => l.id === response.location_id)
      if (loc) {
        onSelectLocation(loc)
      }
    }
  } catch {
    chatMessages.value.push({
      role: 'assistant',
      text: 'すみません、うまく聞き取れませんでした。もう一度お願いします。',
    })
  } finally {
    voiceResetStatus()
  }
}

const {
  status: voiceStatus,
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
        :interim-transcript="interimTranscript"
        :supported="voiceSupported"
        @toggle="startListening"
      />
      <ChatPanel
        :messages="chatMessages"
        @speak="speakText"
      />
    </section>

    <!-- 場所選択セクション -->
    <section class="locations">
      <h2>行き先を選択</h2>
      <div class="location-grid">
        <LocationButton
          v-for="loc in locations"
          :key="loc.id"
          :location="loc"
          :disabled="robotState.status === 'moving'"
          :is-current="robotState.current_location === loc.id"
          @select="onSelectLocation"
        />
      </div>
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
      :location-name="selectedLocation?.name_ja ?? ''"
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

.voice-section h2,
.locations h2 {
  font-size: 16px;
  color: #666;
  margin: 0 0 8px;
}

.location-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.spacer {
  flex: 1;
}

.app-footer {
  position: sticky;
  bottom: 16px;
}
</style>
