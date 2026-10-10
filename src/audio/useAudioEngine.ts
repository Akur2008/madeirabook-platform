'use client'

import { useAudioEngineContext } from './AudioEngineProvider'

export function useAudioEngine() {
  return useAudioEngineContext()
}
