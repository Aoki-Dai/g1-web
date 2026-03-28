<script setup lang="ts">
defineEmits<{
  stop: []
}>()
</script>

<template>
  <button class="emergency-btn" @click="$emit('stop')">
    緊急停止
  </button>
</template>

<style scoped>
.emergency-btn {
  width: 100%;
  padding: 20px;
  font-size: 22px;
  font-weight: bold;
  color: #fff;
  background: #c0392b;
  border: 3px solid #e74c3c;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: 0.1em;
}

.emergency-btn:hover {
  background: #e74c3c;
}

.emergency-btn:active {
  transform: scale(0.97);
}
</style>
