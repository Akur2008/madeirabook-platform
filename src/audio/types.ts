export type ChannelName = 'globalAmbient' | 'sluiceBuffer' | 'videoAudio'

// One layer of a multi-source ambient scene. `gain` is the layer's weight
// inside the channel — effective loudness is gain × channel volume.
export interface AmbientLayer {
  src: string | string[]
  gain?: number
}

export interface ChannelState {
  volume: number
  playing: boolean
  url: string | null
}

export interface EngineState {
  started: boolean
  contextState: AudioContextState | 'uninitialized'
  channels: Record<ChannelName, ChannelState>
}

export const DEFAULT_AMBIENT_VOLUME = 0.25
export const DUCKED_AMBIENT_VOLUME = 0.05
export const DUCK_DURATION_MS = 400
export const CROSSFADE_DURATION_MS = 1500
