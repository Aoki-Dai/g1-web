<script setup lang="ts">
import type { RobotState } from '../types'

defineProps<{
  state: RobotState
  connected: boolean
}>()

const statusLabels: Record<string, string> = {
  idle: '待機中',
  moving: '移動中',
  arrived: '到着',
  error: 'エラー',
  emergency_stopped: '緊急停止',
}

const locationLabels: Record<string, string> = {
  kitchen: 'キッチン',
  table: 'テーブル',
  toilet: 'トイレ',
}
</script>

<template>
  <div class="status-bar">
    <div class="status-row">
      <span class="status-badge" :class="state.status">
        {{ statusLabels[state.status] || state.status }}
      </span>
      <span class="connection" :class="{ online: connected }">
        {{ connected ? '接続中' : '未接続' }}
      </span>
    </div>
    <div class="status-details">
      <span v-if="state.current_location">
        現在地: <strong>{{ locationLabels[state.current_location] || state.current_location }}</strong>
      </span>
      <span v-if="state.target_location">
        → {{ locationLabels[state.target_location] || state.target_location }}
      </span>
    </div>
    <div class="battery">
      <div class="battery-bar">
        <div class="battery-fill" :style="{ width: state.battery_level + '%' }"></div>
      </div>
      <span class="battery-text">{{ Math.round(state.battery_level) }}%</span>
    </div>
  </div>
</template>

<style scoped>
.status-bar {
  background: #fff;
  color: #222;
  border: 1px solid #ddd;
  padding: 16px 20px;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-weight: bold;
  font-size: 14px;
}

.status-badge.idle { background: #2ecc71; color: #000; }
.status-badge.moving { background: #3498db; color: #fff; }
.status-badge.arrived { background: #f39c12; color: #000; }
.status-badge.error { background: #e74c3c; color: #fff; }
.status-badge.emergency_stopped { background: #e74c3c; color: #fff; }

.connection {
  font-size: 12px;
  color: #888;
}
.connection.online {
  color: #2ecc71;
}

.status-details {
  font-size: 14px;
  color: #555;
}

.battery {
  display: flex;
  align-items: center;
  gap: 8px;
}

.battery-bar {
  flex: 1;
  height: 8px;
  background: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
}

.battery-fill {
  height: 100%;
  background: #2ecc71;
  border-radius: 4px;
  transition: width 0.3s;
}

.battery-text {
  font-size: 12px;
  color: #666;
  min-width: 36px;
}
</style>
