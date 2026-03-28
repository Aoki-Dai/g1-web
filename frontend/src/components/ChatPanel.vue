<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import type { ChatMessage } from '../types'

const props = defineProps<{
  messages: ChatMessage[]
}>()

defineEmits<{
  speak: [text: string]
}>()

const scrollContainer = ref<HTMLElement | null>(null)

// 新しいメッセージが追加されたら自動スクロール
watch(() => props.messages.length, async () => {
  await nextTick()
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight
  }
})
</script>

<template>
  <div v-if="messages.length > 0" class="chat-panel" ref="scrollContainer">
    <div
      v-for="(msg, i) in messages"
      :key="i"
      class="chat-bubble"
      :class="msg.role"
    >
      <div class="bubble-header">
        <span class="bubble-role">{{ msg.role === 'user' ? 'あなた' : 'G1' }}</span>
      </div>
      <p class="bubble-text">{{ msg.text }}</p>
      <button
        v-if="msg.role === 'assistant' && msg.text"
        class="speak-btn"
        @click="$emit('speak', msg.text)"
        title="読み上げ"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.chat-panel {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 240px;
  overflow-y: auto;
  padding: 4px 0;
  scroll-behavior: smooth;
}

.chat-bubble {
  padding: 12px 16px;
  border-radius: 16px;
  max-width: 90%;
  position: relative;
  animation: slideIn 0.25s ease-out;
}

.chat-bubble.user {
  align-self: flex-end;
  background: #3498db;
  color: #fff;
  border-bottom-right-radius: 4px;
}

.chat-bubble.assistant {
  align-self: flex-start;
  background: #fff;
  color: #222;
  border: 1px solid #ddd;
  border-bottom-left-radius: 4px;
}

.bubble-header {
  margin-bottom: 4px;
}

.bubble-role {
  font-size: 11px;
  font-weight: bold;
  opacity: 0.7;
}

.bubble-text {
  font-size: 15px;
  line-height: 1.5;
  margin: 0;
  white-space: pre-wrap;
}

.speak-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background: none;
  border: none;
  color: #999;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.2s;
}

.speak-btn:hover {
  color: #3498db;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
