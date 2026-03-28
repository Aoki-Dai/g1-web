<script setup lang="ts">
defineProps<{
  visible: boolean
  locationName: string
}>()

defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="overlay" @click.self="$emit('cancel')">
      <div class="dialog">
        <p class="dialog-message">
          ロボットを<strong>{{ locationName }}</strong>に移動しますか？
        </p>
        <div class="dialog-actions">
          <button class="btn-cancel" @click="$emit('cancel')">キャンセル</button>
          <button class="btn-confirm" @click="$emit('confirm')">移動する</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 16px;
  padding: 32px;
  max-width: 400px;
  width: 90%;
  text-align: center;
}

.dialog-message {
  font-size: 20px;
  color: #222;
  margin-bottom: 24px;
}

.dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn-cancel,
.btn-confirm {
  padding: 12px 32px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  border: none;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-cancel {
  background: #e0e0e0;
  color: #222;
}

.btn-confirm {
  background: #3498db;
  color: #fff;
}

.btn-cancel:hover,
.btn-confirm:hover {
  opacity: 0.85;
}
</style>
