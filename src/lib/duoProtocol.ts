import type {
  CountdownSeconds,
  FilterType,
  LayoutType,
  PhotoTransform,
  PlacedSticker,
  PoseCount,
  StripBorderStyle,
  StripDecoration,
  StripThemeId,
} from './types'

export type DuoRole = 'host' | 'guest'

export type DuoComposeMode = 'side_by_side' | 'stacked' | 'twin_strip'

export type DuoPhase = 'lobby' | 'shooting' | 'customizing'

export type DuoShootingStatus =
  | 'idle'
  | 'counting'
  | 'capturing'
  | 'pose_incomplete'
  | 'complete'

export interface DuoParticipant {
  clientId: string
  role: DuoRole
  name: string
  connected: boolean
  cameraReady: boolean
  readyForSession: boolean
}

export interface DuoRoomSettings {
  poseCount: PoseCount
  countdownSeconds: CountdownSeconds
  composeMode: DuoComposeMode
  liveMotionEnabled: boolean
}

export interface DuoCustomState {
  filter: FilterType
  layout: LayoutType
  composeMode: DuoComposeMode
  caption: string
  showDate: boolean
  stripTheme: StripThemeId
  borderStyle: StripBorderStyle
  stripDecoration: StripDecoration
  stickers: PlacedSticker[]
  hostTransforms: PhotoTransform[]
  guestTransforms: PhotoTransform[]
}

export interface DuoPoseShot {
  poseIndex: number
  hostPhoto?: string
  guestPhoto?: string
  hostBurst?: string[]
  guestBurst?: string[]
}

export interface DuoShootingState {
  currentPose: number
  totalPoses: number
  status: DuoShootingStatus
  captureAtServerMs: number | null
  countdownSeconds: CountdownSeconds
  capturedHostPoses: number[]
  capturedGuestPoses: number[]
}

export interface DuoRoomSnapshot {
  roomCode: string
  phase: DuoPhase
  participants: DuoParticipant[]
  settings: DuoRoomSettings
  shooting: DuoShootingState
  custom: DuoCustomState
  completedPoseCount: number
}

// ── Client → Server Messages ──────────────────────────────────────────────────

export type DuoClientMessage =
  | { type: 'duo:create_room'; clientId: string; name: string }
  | { type: 'duo:join_room'; roomCode: string; clientId: string; name: string }
  | { type: 'duo:leave_room'; roomCode: string; clientId: string }
  | { type: 'duo:ping'; clientSentMs: number }
  | { type: 'duo:update_settings'; roomCode: string; clientId: string; settings: Partial<DuoRoomSettings> }
  | { type: 'duo:camera_state'; roomCode: string; clientId: string; cameraReady: boolean }
  | { type: 'duo:ready_state'; roomCode: string; clientId: string; readyForSession: boolean }
  | { type: 'duo:start_shoot'; roomCode: string; clientId: string }
  | { type: 'duo:retry_pose'; roomCode: string; clientId: string; poseIndex: number }
  | { type: 'duo:retake_all'; roomCode: string; clientId: string }
  | {
      type: 'duo:pose_photo'
      roomCode: string
      clientId: string
      poseIndex: number
      photo: string
      burst?: string[]
    }
  | { type: 'duo:customize_update'; roomCode: string; clientId: string; custom: Partial<DuoCustomState> }
  | { type: 'duo:rtc_offer'; roomCode: string; clientId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'duo:rtc_answer'; roomCode: string; clientId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'duo:rtc_ice'; roomCode: string; clientId: string; candidate: RTCIceCandidateInit }
  | { type: 'duo:live_frame'; roomCode: string; clientId: string; frame: string }

// ── Server → Client Messages ──────────────────────────────────────────────────

export type DuoServerMessage =
  | { type: 'duo:error'; code: string; message: string }
  | { type: 'duo:pong'; clientSentMs: number; serverTimeMs: number }
  | { type: 'duo:room_joined'; role: DuoRole; room: DuoRoomSnapshot; shots: DuoPoseShot[] }
  | { type: 'duo:room_state'; room: DuoRoomSnapshot }
  | {
      type: 'duo:pose_countdown'
      poseIndex: number
      totalPoses: number
      countdownSeconds: CountdownSeconds
      serverNowMs: number
      captureAtServerMs: number
    }
  | { type: 'duo:pose_shot'; shot: DuoPoseShot }
  | { type: 'duo:sync_shots'; shots: DuoPoseShot[] }
  | { type: 'duo:custom_synced'; custom: DuoCustomState; fromClientId: string }
  | { type: 'duo:rtc_offer'; fromClientId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'duo:rtc_answer'; fromClientId: string; sdp: RTCSessionDescriptionInit }
  | { type: 'duo:rtc_ice'; fromClientId: string; candidate: RTCIceCandidateInit }
  | { type: 'duo:live_frame'; fromClientId: string; frame: string }
