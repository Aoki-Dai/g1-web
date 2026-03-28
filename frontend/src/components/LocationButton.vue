<script setup lang="ts">
import type { Location } from '../types'

defineProps<{
  location: Location
  disabled: boolean
  isCurrent: boolean
}>()

defineEmits<{
  select: [location: Location]
}>()
</script>

<template>
  <button
    class="location-btn"
    :class="{ current: isCurrent, disabled }"
    :disabled="disabled"
    @click="$emit('select', location)"
  >
    <span class="location-name-ja">{{ location.name_ja }}</span>
    <span class="location-name-en">{{ location.name }}</span>
    <span v-if="isCurrent" class="current-badge">現在地</span>
  </button>
</template>

<style scoped>
.location-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 120px;
  padding: 20px;
  border: 2px solid #3498db;
  border-radius: 16px;
  background: #16213e;
  color: #fff;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  position: relative;
}

.location-btn:hover:not(:disabled) {
  background: #1a3a5c;
  transform: scale(1.02);
}

.location-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.location-btn.current {
  border-color: #2ecc71;
  background: #1a2e1a;
}

.location-btn.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.location-name-ja {
  font-size: 28px;
  font-weight: bold;
}

.location-name-en {
  font-size: 14px;
  color: #888;
}

.current-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #2ecc71;
  color: #000;
  font-size: 11px;
  font-weight: bold;
  padding: 2px 8px;
  border-radius: 10px;
}
</style>
