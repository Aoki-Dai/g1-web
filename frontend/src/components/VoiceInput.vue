<script setup lang="ts">
defineProps<{
  status: 'idle' | 'listening' | 'processing' | 'unsupported'
  interimTranscript: string
  supported: boolean
}>()

defineEmits<{
  toggle: []
}>()
</script>

<template>
  <div class="voice-input">
    <button
      class="mic-btn"
      :class="{ listening: status === 'listening', processing: status === 'processing' }"
      :disabled="!supported || status === 'processing'"
      @click="$emit('toggle')"
    >
      <span class="mic-icon" aria-hidden="true">
        <svg v-if="status !== 'processing'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
          <line x1="8" y1="23" x2="16" y2="23"/>
        </svg>
        <svg v-else class="spinner" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-dasharray="31.4" stroke-dashoffset="10"/>
        </svg>
      </span>
      <span class="mic-ripple" v-if="status === 'listening'"></span>
      <span class="mic-ripple mic-ripple-2" v-if="status === 'listening'"></span>
    </button>

    <p class="mic-label">
      <template v-if="!supported">音声入力に対応していません</template>
      <template v-else-if="status === 'idle'">タップして話しかけてください</template>
      <template v-else-if="status === 'listening'">聞いています...</template>
      <template v-else-if="status === 'processing'">考えています...</template>
    </p>

    <p v-if="interimTranscript" class="interim-text">
      {{ interimTranscript }}
    </p>
  </div>
</template>

<style scoped>
.voice-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 0;
}

.mic-btn {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  border: 3px solid #3498db;
  background: #fff;
  color: #3498db;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.mic-btn:hover:not(:disabled) {
  background: #e8f4fd;
}

.mic-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.mic-btn.listening {
  border-color: #e74c3c;
  color: #e74c3c;
  background: #fde8e8;
}

.mic-btn.processing {
  border-color: #999;
  color: #999;
  cursor: wait;
}

.mic-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.mic-ripple {
  position: absolute;
  inset: -8px;
  border-radius: 50%;
  border: 2px solid #e74c3c;
  animation: ripple 1.5s ease-out infinite;
  pointer-events: none;
}

.mic-ripple-2 {
  animation-delay: 0.75s;
}

@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

.spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.mic-label {
  font-size: 14px;
  color: #666;
}

.interim-text {
  font-size: 16px;
  color: #333;
  background: #f0f0f0;
  padding: 8px 16px;
  border-radius: 12px;
  max-width: 100%;
  text-align: center;
  animation: fadeIn 0.2s;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
