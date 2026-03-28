export type RobotStatus =
  | 'idle'
  | 'moving'
  | 'arrived'
  | 'error'
  | 'emergency_stopped'

export interface Position {
  x: number
  y: number
  theta: number
}

export interface Location {
  id: string
  name: string
  name_ja: string
  position: Position
}

export interface RobotState {
  status: RobotStatus
  current_position: Position
  current_location: string | null
  target_location: string | null
  battery_level: number
  message: string
}

export interface MoveResponse {
  success: boolean
  message: string
  task_id: string | null
}
