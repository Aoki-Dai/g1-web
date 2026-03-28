<script setup lang="ts">
import type { SpeedMode } from '../types'

defineProps<{
  speedMode: SpeedMode
  isPaused: boolean
  isMoving: boolean
}>()

defineEmits<{
  'update:speedMode': [mode: SpeedMode]
  pause: []
  resume: []
  stop: []
}>()
</script>

<template>
  <div class="safety-controls">
    <!-- 速度モード切替 -->
    <div class="speed-control">
      <span class="speed-label">移動速度</span>
      <div class="speed-toggle">
        <button
          class="speed-btn"
          :class="{ active: speedMode === 'slow' }"
          @click="$emit('update:speedMode', 'slow')"
        >
          ゆっくり
        </button>
        <button
          class="speed-btn"
          :class="{ active: speedMode === 'normal' }"
          @click="$emit('update:speedMode', 'normal')"
        >
          通常
        </button>
      </div>
    </div>

    <!-- 一時停止 / 緊急停止 -->
    <div class="action-buttons">
      <button
        v-if="isMoving && !isPaused"
        class="pause-btn"
        @click="$emit('pause')"
      >
        一時停止
      </button>
      <button
        v-else-if="isPaused"
        class="resume-btn"
        @click="$emit('resume')"
      >
        再開する
      </button>

      <button class="emergency-btn" @click="$emit('stop')">
        緊急停止
      </button>
    </div>
  </div>
</template>

<style scoped>
.safety-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 速度切替 */
.speed-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 10px 16px;
}

.speed-label {
  font-size: 14px;
  color: #555;
  font-weight: 600;
}

.speed-toggle {
  display: flex;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.speed-btn {
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 600;
  border: none;
  background: transparent;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.speed-btn.active {
  background: #3498db;
  color: #fff;
}

.speed-btn:first-child.active {
  background: #2ecc71;
  color: #000;
}

/* アクションボタン */
.action-buttons {
  display: flex;
  gap: 12px;
}

.pause-btn,
.resume-btn {
  flex: 1;
  padding: 16px;
  font-size: 16px;
  font-weight: bold;
  border-radius: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.pause-btn {
  background: #f39c12;
  color: #000;
  border: 2px solid #e67e22;
}

.pause-btn:hover {
  background: #e67e22;
}

.resume-btn {
  background: #2ecc71;
  color: #000;
  border: 2px solid #27ae60;
}

.resume-btn:hover {
  background: #27ae60;
}

.pause-btn:active,
.resume-btn:active {
  transform: scale(0.97);
}

.emergency-btn {
  flex: 1;
  padding: 16px;
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  background: #c0392b;
  border: 2px solid #e74c3c;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.05em;
}

.emergency-btn:hover {
  background: #e74c3c;
}

.emergency-btn:active {
  transform: scale(0.97);
}
</style>
