<script setup lang="ts">
import { ref } from 'vue'
import type { Location } from './types'
import { useRobot } from './composables/useRobot'
import RobotStatusBar from './components/RobotStatusBar.vue'
import LocationButton from './components/LocationButton.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'
import EmergencyStop from './components/EmergencyStop.vue'

const { robotState, locations, isConnected, sendMove, sendStop } = useRobot()

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

    <footer class="app-footer">
      <EmergencyStop @stop="onEmergencyStop" />
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

.locations h2 {
  font-size: 16px;
  color: #666;
  margin: 0 0 12px;
}

.location-grid {
  display: grid;
  grid-template-columns: 1fr;
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
