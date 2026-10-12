import {
  CROSSFADE_DURATION_MS,
  ChannelName,
  ChannelState,
  DEFAULT_AMBIENT_VOLUME,
  DUCKED_AMBIENT_VOLUME,
  DUCK_DURATION_MS,
  EngineState,
} from './types'

type EngineListener = (state: EngineState) => void

interface ActiveSource {
  source: AudioBufferSourceNode
  gain: GainNode
  url: string
}

const CURVE_STEPS = 64

function fadeInCurve(from: number, to: number): Float32Array {
  const curve = new Float32Array(CURVE_STEPS)
  for (let i = 0; i < CURVE_STEPS; i++) {
    const t = i / (CURVE_STEPS - 1)
    curve[i] = from + (to - from) * Math.sin((t * Math.PI) / 2)
  }
  return curve
}

function fadeOutCurve(from: number, to: number): Float32Array {
  const curve = new Float32Array(CURVE_STEPS)
  for (let i = 0; i < CURVE_STEPS; i++) {
    const t = i / (CURVE_STEPS - 1)
    curve[i] = from + (to - from) * Math.cos((t * Math.PI) / 2)
  }
  return curve
}

export class AudioEngine {
  private ctx: AudioContext | null = null
  private channelGains: Record<ChannelName, GainNode> | null = null
  private buffers = new Map<string, Promise<AudioBuffer>>()
  private rawBuffers = new Map<string, Promise<ArrayBuffer>>()
  private ambientSource: ActiveSource | null = null
  private sluiceSource: ActiveSource | null = null
  private videoSource: ActiveSource | null = null
  private listeners = new Set<EngineListener>()
  private volumes: Record<ChannelName, number> = {
    globalAmbient: DEFAULT_AMBIENT_VOLUME,
    sluiceBuffer: 1,
    videoAudio: 1,
  }

  private ensureContext(): AudioContext {
    if (this.ctx) return this.ctx
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    this.ctx = new Ctor()
    this.channelGains = {
      globalAmbient: this.ctx.createGain(),
      sluiceBuffer: this.ctx.createGain(),
      videoAudio: this.ctx.createGain(),
    }
    for (const channel of Object.keys(this.channelGains) as ChannelName[]) {
      this.channelGains[channel].gain.value = this.volumes[channel]
      this.channelGains[channel].connect(this.ctx.destination)
    }
    return this.ctx
  }

  private decode(arrayBuffer: ArrayBuffer): Promise<AudioBuffer> {
    const ctx = this.ensureContext()
    return new Promise((resolve, reject) => {
      const maybePromise = ctx.decodeAudioData(arrayBuffer, resolve, reject)
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(reject)
      }
    })
  }

  private fetchBytes(url: string): Promise<ArrayBuffer> {
    let cached = this.rawBuffers.get(url)
    if (!cached) {
      cached = fetch(url).then((res) => {
        if (!res.ok) throw new Error(`fetch ${url} -> ${res.status}`)
        return res.arrayBuffer()
      })
      this.rawBuffers.set(url, cached)
      cached.catch(() => this.rawBuffers.delete(url))
    }
    return cached
  }

  preload(urls: string[]): void {
    for (const url of urls) {
      void this.fetchBytes(url).catch(() => undefined)
    }
  }

  private loadOne(url: string): Promise<AudioBuffer> {
    let cached = this.buffers.get(url)
    if (!cached) {
      cached = Promise.race([
        // decode on a copy: decodeAudioData detaches the buffer, and a retry
        // must still see intact bytes
        this.fetchBytes(url).then((buf) => this.decode(buf.slice(0))),
        new Promise<AudioBuffer>((_, reject) =>
          setTimeout(() => reject(new Error(`decode timeout: ${url}`)), 20000),
        ),
      ])
      this.buffers.set(url, cached)
      cached.catch(() => this.buffers.delete(url))
    }
    return cached
  }

  private async load(
    input: string | string[],
  ): Promise<{ buffer: AudioBuffer; url: string }> {
    const urls = Array.isArray(input) ? input : [input]
    let lastErr: unknown
    for (const url of urls) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          return { buffer: await this.loadOne(url), url }
        } catch (err) {
          lastErr = err
        }
      }
    }
    throw lastErr instanceof Error ? lastErr : new Error('all audio sources failed')
  }

  private makeSource(
    buffer: AudioBuffer,
    channelGain: GainNode,
    loop: boolean,
  ): ActiveSource {
    const ctx = this.ensureContext()
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()
    source.buffer = buffer
    source.loop = loop
    source.connect(gain)
    gain.connect(channelGain)
    return { source, gain, url: '' }
  }

  private stopActive(active: ActiveSource | null, fadeMs = 30): void {
    if (!active || !this.ctx) return
    try {
      const now = this.ctx.currentTime
      active.gain.gain.cancelScheduledValues(now)
      active.gain.gain.setValueAtTime(active.gain.gain.value, now)
      active.gain.gain.linearRampToValueAtTime(0, now + fadeMs / 1000)
      active.source.stop(now + fadeMs / 1000 + 0.01)
    } catch {
      // source may already be stopped
    }
    active.source.onended = null
  }

  private emit(): void {
    const state = this.getState()
    for (const listener of this.listeners) listener(state)
  }

  subscribe(listener: EngineListener): () => void {
    this.listeners.add(listener)
    listener(this.getState())
    return () => this.listeners.delete(listener)
  }

  getState(): EngineState {
    const channel = (active: ActiveSource | null, name: ChannelName): ChannelState => ({
      volume: this.volumes[name],
      playing: active !== null,
      url: active?.url ?? null,
    })
    return {
      started: this.ctx !== null && this.ctx.state === 'running',
      contextState: this.ctx?.state ?? 'uninitialized',
      channels: {
        globalAmbient: channel(this.ambientSource, 'globalAmbient'),
        sluiceBuffer: channel(this.sluiceSource, 'sluiceBuffer'),
        videoAudio: channel(this.videoSource, 'videoAudio'),
      },
    }
  }

  async start(): Promise<void> {
    const ctx = this.ensureContext()
    if (ctx.state !== 'running') {
      await ctx.resume()
    }
    this.emit()
  }

  async suspend(): Promise<void> {
    if (this.ctx && this.ctx.state === 'running') {
      await this.ctx.suspend()
    }
    this.emit()
  }

  async playAmbient(
    url: string | string[],
    options: { loop?: boolean; volume?: number } = {},
  ): Promise<void> {
    const ctx = this.ensureContext()
    const { loop = true, volume } = options
    if (volume !== undefined) this.setVolume('globalAmbient', volume)
    const { buffer, url: resolvedUrl } = await this.load(url)
    this.stopActive(this.ambientSource)
    const channelGain = this.channelGains!.globalAmbient
    const active = this.makeSource(buffer, channelGain, loop)
    active.url = resolvedUrl
    active.gain.gain.value = 1
    active.source.onended = () => {
      if (this.ambientSource === active) {
        this.ambientSource = null
        this.emit()
      }
    }
    active.source.start(ctx.currentTime)
    this.ambientSource = active
    this.emit()
  }

  async playSluice(url: string | string[], durationSec?: number): Promise<void> {
    const ctx = this.ensureContext()
    const { buffer, url: resolvedUrl } = await this.load(url)
    this.stopActive(this.sluiceSource)
    const active = this.makeSource(buffer, this.channelGains!.sluiceBuffer, false)
    active.url = resolvedUrl
    active.gain.gain.value = 1
    active.source.onended = () => {
      if (this.sluiceSource === active) {
        this.sluiceSource = null
        this.emit()
      }
    }
    const stopAt =
      durationSec !== undefined
        ? Math.min(durationSec, buffer.duration)
        : buffer.duration
    active.source.start(ctx.currentTime, 0, stopAt)
    this.sluiceSource = active
    this.emit()
  }

  async playVideo(url: string | string[], options: { loop?: boolean } = {}): Promise<void> {
    const ctx = this.ensureContext()
    const { buffer, url: resolvedUrl } = await this.load(url)
    this.stopActive(this.videoSource)
    const active = this.makeSource(
      buffer,
      this.channelGains!.videoAudio,
      options.loop ?? true,
    )
    active.url = resolvedUrl
    active.gain.gain.value = 1
    active.source.onended = () => {
      if (this.videoSource === active) {
        this.videoSource = null
        this.unduck()
        this.emit()
      }
    }
    active.source.start(ctx.currentTime)
    this.videoSource = active
    this.duck()
    this.emit()
  }

  stopVideo(): void {
    if (!this.videoSource) return
    this.stopActive(this.videoSource)
    this.videoSource = null
    this.unduck()
    this.emit()
  }

  stopAll(): void {
    this.stopActive(this.ambientSource)
    this.stopActive(this.sluiceSource)
    this.stopActive(this.videoSource)
    this.ambientSource = null
    this.sluiceSource = null
    this.videoSource = null
    this.setVolume('globalAmbient', DEFAULT_AMBIENT_VOLUME)
    this.emit()
  }

  setVolume(channel: ChannelName, value: number): void {
    this.volumes[channel] = value
    const gain = this.channelGains?.[channel]
    if (gain && this.ctx) {
      const now = this.ctx.currentTime
      gain.gain.cancelScheduledValues(now)
      gain.gain.setValueAtTime(value, now)
    }
    this.emit()
  }

  duck(targetVolume = DUCKED_AMBIENT_VOLUME, duration = DUCK_DURATION_MS): void {
    const gain = this.channelGains?.globalAmbient
    if (!gain || !this.ctx) return
    const now = this.ctx.currentTime
    const from = gain.gain.value
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(from, now)
    gain.gain.setValueCurveAtTime(fadeOutCurve(from, targetVolume), now, duration / 1000)
    this.volumes.globalAmbient = targetVolume
    this.emit()
  }

  unduck(targetVolume = DEFAULT_AMBIENT_VOLUME, duration = DUCK_DURATION_MS): void {
    const gain = this.channelGains?.globalAmbient
    if (!gain || !this.ctx) return
    const now = this.ctx.currentTime
    const from = gain.gain.value
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(from, now)
    gain.gain.setValueCurveAtTime(fadeInCurve(from, targetVolume), now, duration / 1000)
    this.volumes.globalAmbient = targetVolume
    this.emit()
  }

  async crossfade(
    _fromUrl: string,
    toUrl: string | string[],
    duration = CROSSFADE_DURATION_MS,
  ): Promise<void> {
    const ctx = this.ensureContext()
    const { buffer, url: resolvedUrl } = await this.load(toUrl)
    const channelGain = this.channelGains!.globalAmbient
    const durationSec = duration / 1000
    const now = ctx.currentTime

    const outgoing = this.ambientSource
    if (outgoing) {
      const from = outgoing.gain.gain.value
      outgoing.gain.gain.cancelScheduledValues(now)
      outgoing.gain.gain.setValueAtTime(from, now)
      outgoing.gain.gain.setValueCurveAtTime(fadeOutCurve(from, 0), now, durationSec)
      try {
        outgoing.source.stop(now + durationSec + 0.05)
      } catch {
        // already stopped
      }
      outgoing.source.onended = null
    }

    const incoming = this.makeSource(buffer, channelGain, true)
    incoming.url = resolvedUrl
    incoming.gain.gain.value = 0
    incoming.gain.gain.setValueCurveAtTime(fadeInCurve(0, 1), now, durationSec)
    incoming.source.onended = () => {
      if (this.ambientSource === incoming) {
        this.ambientSource = null
        this.emit()
      }
    }
    incoming.source.start(now)
    this.ambientSource = incoming
    this.emit()
  }
}
