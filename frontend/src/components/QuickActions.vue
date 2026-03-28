<script setup lang="ts">
export interface QuickAction {
  label: string
  query: string
}

defineProps<{
  actions: QuickAction[]
  disabled: boolean
}>()

defineEmits<{
  select: [query: string]
}>()
</script>

<template>
  <div class="quick-actions">
    <button
      v-for="action in actions"
      :key="action.query"
      class="quick-btn"
      :disabled="disabled"
      @click="$emit('select', action.query)"
    >
      {{ action.label }}
    </button>
  </div>
</template>

<style scoped>
.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-btn {
  padding: 8px 16px;
  font-size: 14px;
  font-weight: 500;
  color: #3498db;
  background: #fff;
  border: 1.5px solid #3498db;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.quick-btn:hover:not(:disabled) {
  background: #3498db;
  color: #fff;
}

.quick-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.quick-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
