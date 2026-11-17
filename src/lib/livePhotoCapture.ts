import { FILTERS, FilterType, LivePhotoItem } from './types'
import {
  computeHdVideoDimensions,
  createHdMediaRecorder,
  downloadUrl,
  selectSupportedVideoMimeType,
} from './liveExport'

function getCssFilter(filterId: FilterType): string {
  return FILTERS.find((f) => f.id === filterId)?.cssFilter ?? 'none'
}

interface RollingRecorderSlot {
  id: number
  recorder: MediaRecorder
  chunks: Blob[]
  startedAt: number
  stopped: Promise<Blob | null>
  resolveStopped: (blob: Blob | null) => void
}

interface BufferedFrame {
  ts: number
  dataUrl: string
}

/**
 * Maintains a continuous rolling pre-shutter video/audio buffer (~1.5s+) and
 * frame ring buffer so pressing the shutter captures ~1.5s BEFORE + exact still
 * + ~1.5s AFTER (~3s total) with synchronized microphone audio when permitted.
 */
export class RollingLivePhotoBuffer {
  private videoEl: HTMLVideoElement | null = null
  private cameraStream: MediaStream | null = null
  private micStream: MediaStream | null = null
  private recCanvas: HTMLCanvasElement | null = null
  private burstCanvas: HTMLCanvasElement | null = null
  private combinedStream: MediaStream | null = null
  private rafId: number | null = null
  private burstTimerId: number | null = null
  private cycleTimerId: number | null = null
  private filterGetter: () => FilterType

  private activeSlots: RollingRecorderSlot[] = []
  private nextSlotId = 1
  private frameRing: BufferedFrame[] = []
  private mimeInfo: { mimeType: string; ext: 'mp4' | 'webm' } | null = null
  private hasAudio = false
  private warning: string | undefined
  private running = false
  private captureLocked = false

  // Target 1.5s pre-roll + 1.5s post-roll = ~3s Live Photo
  private readonly preTargetMs = 1500
  private readonly postTargetMs = 1500
  private readonly staggerMs = 1350

  constructor(filterGetter: () => FilterType) {
    this.filterGetter = filterGetter
  }

  public isRunning() {
    return this.running
  }

  public getStatus() {
    return {
      running: this.running,
      hasAudio: this.hasAudio,
      warning: this.warning,
      bufferedMs:
        this.activeSlots.length > 0
          ? Math.max(...this.activeSlots.map((s) => Date.now() - s.startedAt))
          : 0,
    }
  }

  public async start(
    videoEl: HTMLVideoElement,
    cameraStream: MediaStream,
    wantAudio: boolean
  ): Promise<{ hasAudio: boolean; warning?: string }> {
    this.stop()
    this.videoEl = videoEl
    this.cameraStream = cameraStream
    this.warning = undefined
    this.hasAudio = false
    this.frameRing = []

    if (typeof window === 'undefined' || videoEl.videoWidth === 0) {
      return { hasAudio: false, warning: 'Camera feed not ready for Live Photo buffering.' }
    }

    let audioTrack: MediaStreamTrack | null = null
    if (wantAudio && navigator.mediaDevices?.getUserMedia) {
      try {
        const mic = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false,
        })
        this.micStream = mic
        audioTrack = mic.getAudioTracks()[0] ?? null
        this.hasAudio = Boolean(audioTrack)
      } catch {
        this.warning = 'Microphone permission unavailable — Live Photos captured without audio.'
      }
    }

    this.mimeInfo = selectSupportedVideoMimeType(Boolean(audioTrack))
    this.running = true

    // Start frame ring buffer (covers 1.5s pre-roll at ~10fps for GIF compatibility)
    this.burstCanvas = document.createElement('canvas')
    this.sampleBurstFrame()
    this.burstTimerId = window.setInterval(() => {
      this.sampleBurstFrame()
    }, 105)

    // Prepare mirrored, filtered canvas stream for rolling MediaRecorders
    if (this.mimeInfo && typeof MediaRecorder !== 'undefined') {
      try {
        const supportsCapture =
          typeof HTMLCanvasElement !== 'undefined' &&
          typeof (
            document.createElement('canvas') as HTMLCanvasElement & {
              captureStream?: (fps?: number) => MediaStream
            }
          ).captureStream === 'function'

        if (supportsCapture) {
          const recCanvas = document.createElement('canvas')
          const hdSize = computeHdVideoDimensions(videoEl.videoWidth, videoEl.videoHeight)
          recCanvas.width = hdSize.width
          recCanvas.height = hdSize.height
          this.recCanvas = recCanvas
          const rCtx = recCanvas.getContext('2d')

          const drawLoop = () => {
            if (!this.running || !rCtx || !this.videoEl || this.videoEl.videoWidth === 0) return
            rCtx.save()
            rCtx.imageSmoothingEnabled = true
            rCtx.imageSmoothingQuality = 'high'
            const cssF = getCssFilter(this.filterGetter())
            if ('filter' in rCtx) {
              rCtx.filter = cssF
            }
            rCtx.scale(-1, 1)
            rCtx.drawImage(this.videoEl, -recCanvas.width, 0, recCanvas.width, recCanvas.height)
            rCtx.restore()
            this.rafId = window.requestAnimationFrame(drawLoop)
          }
          this.rafId = window.requestAnimationFrame(drawLoop)

          const stream = (
            recCanvas as HTMLCanvasElement & { captureStream: (fps?: number) => MediaStream }
          ).captureStream(30)
          if (audioTrack) stream.addTrack(audioTrack)
          this.combinedStream = stream
        } else {
          const tracks = [...cameraStream.getVideoTracks()]
          if (audioTrack) tracks.push(audioTrack)
          this.combinedStream = new MediaStream(tracks)
        }

        // Start first rolling slot immediately, then maintain overlapping staggered slots
        this.spawnSlot()
        this.cycleTimerId = window.setInterval(() => {
          this.maintainSlots()
        }, 350)
      } catch {
        this.warning =
          this.warning ??
          'Live Photo video recording is unsupported on this browser — still photos & motion frames captured.'
      }
    } else if (!this.mimeInfo) {
      this.warning =
        this.warning ??
        'Live Photo video recording is unsupported on this browser — still photos & motion frames captured.'
    }

    return { hasAudio: this.hasAudio, warning: this.warning }
  }

  private sampleBurstFrame() {
    const video = this.videoEl
    const burstCanvas = this.burstCanvas
    if (!video || !burstCanvas || video.videoWidth === 0) return

    const maxW = 380
    const scale = Math.min(1, maxW / video.videoWidth)
    const w = Math.max(160, Math.round(video.videoWidth * scale))
    const h = Math.max(120, Math.round(video.videoHeight * scale))
    if (burstCanvas.width !== w || burstCanvas.height !== h) {
      burstCanvas.width = w
      burstCanvas.height = h
    }
    const ctx = burstCanvas.getContext('2d')
    if (!ctx) return
    ctx.save()
    ctx.scale(-1, 1)
    ctx.drawImage(video, -w, 0, w, h)
    ctx.restore()
    const dataUrl = burstCanvas.toDataURL('image/jpeg', 0.78)
    const now = Date.now()
    this.frameRing.push({ ts: now, dataUrl })

    // Keep last ~2.2 seconds in the rolling ring so 1.5s pre-capture is always covered
    const cutoff = now - 2200
    while (this.frameRing.length > 0 && this.frameRing[0].ts < cutoff) {
      this.frameRing.shift()
    }
  }

  private spawnSlot(): RollingRecorderSlot | null {
    if (!this.combinedStream || !this.mimeInfo || typeof MediaRecorder === 'undefined') {
      return null
    }
    try {
      const recorder = createHdMediaRecorder(
        this.combinedStream,
        this.mimeInfo.mimeType,
        this.hasAudio
      )
      const chunks: Blob[] = []
      let resolveStopped!: (blob: Blob | null) => void
      const stopped = new Promise<Blob | null>((resolve) => {
        resolveStopped = resolve
      })

      recorder.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data)
      }
      recorder.onstop = () => {
        if (chunks.length === 0) {
          resolveStopped(null)
          return
        }
        const type = this.mimeInfo?.mimeType || recorder.mimeType || 'video/webm'
        resolveStopped(new Blob(chunks, { type }))
      }
      recorder.onerror = () => resolveStopped(null)

      const slot: RollingRecorderSlot = {
        id: this.nextSlotId++,
        recorder,
        chunks,
        startedAt: Date.now(),
        stopped,
        resolveStopped,
      }

      recorder.start(250)
      this.activeSlots.push(slot)
      return slot
    } catch {
      return null
    }
  }

  private discardSlot(slot: RollingRecorderSlot) {
    if (slot.recorder.state !== 'inactive') {
      try {
        slot.recorder.stop()
      } catch {
        slot.resolveStopped(null)
      }
    } else {
      slot.resolveStopped(null)
    }
  }

  private maintainSlots() {
    if (!this.running || this.captureLocked) return
    const now = Date.now()

    // Ensure a staggered secondary slot is started once the newest slot passes staggerMs
    const newest = this.activeSlots[this.activeSlots.length - 1]
    if (!newest || (now - newest.startedAt >= this.staggerMs && this.activeSlots.length < 3)) {
      this.spawnSlot()
    }

    // Recycle oldest slots only once the next slot already holds >= preTargetMs of pre-roll
    while (this.activeSlots.length >= 2) {
      const nextSlot = this.activeSlots[1]
      if (now - nextSlot.startedAt >= this.preTargetMs) {
        const oldest = this.activeSlots.shift()!
        this.discardSlot(oldest)
      } else {
        break
      }
    }
  }

  /**
   * Called at the exact shutter moment. Marks shutter timestamp, snapshots
   * the ~1.5s pre-capture frames & rolling video+audio slot, continues capturing
   * for ~1.5s AFTER the shutter, and returns the combined LivePhotoItem.
   */
  public async captureAtShutter(stillUrl: string): Promise<LivePhotoItem> {
    const shutterTs = Date.now()
    const id = `lp_${shutterTs}_${Math.random().toString(36).slice(2, 6)}`

    // Snapshot pre-shutter burst frames (~1.5s leading up to shutterTs)
    const preCutoff = shutterTs - this.preTargetMs
    const preFrames = this.frameRing
      .filter((f) => f.ts >= preCutoff && f.ts <= shutterTs)
      .map((f) => f.dataUrl)

    // Pick the active rolling recorder that best covers ~1.5s before shutterTs
    let chosenSlot: RollingRecorderSlot | null = null
    if (this.activeSlots.length > 0) {
      const candidates = [...this.activeSlots].sort((a, b) => a.startedAt - b.startedAt)
      // Prefer the youngest slot that still has >= preTargetMs pre-roll; otherwise the oldest slot
      const ideal = [...candidates]
        .reverse()
        .find((s) => shutterTs - s.startedAt >= this.preTargetMs)
      chosenSlot = ideal ?? candidates[0]

      // Remove chosenSlot from the active rotation so it isn't recycled during post-capture
      this.activeSlots = this.activeSlots.filter((s) => s.id !== chosenSlot!.id)
    }

    // Lock rotation briefly and immediately spawn a replacement slot for future shots
    this.captureLocked = true
    if (this.running && this.activeSlots.length === 0) {
      this.spawnSlot()
    }

    // Capture ~1.5s AFTER the shutter moment (both burst frames & chosen MediaRecorder)
    const elapsedSinceShutter = Date.now() - shutterTs
    const remainingPostMs = Math.max(200, this.postTargetMs - elapsedSinceShutter)
    await new Promise((r) => setTimeout(r, remainingPostMs))

    const postEndTs = Date.now()
    const postFrames = this.frameRing
      .filter((f) => f.ts > shutterTs && f.ts <= postEndTs)
      .map((f) => f.dataUrl)

    // Unlock rolling buffer for any subsequent shots
    this.captureLocked = false
    if (this.running) {
      this.maintainSlots()
    }

    const preMs = chosenSlot ? Math.max(0, shutterTs - chosenSlot.startedAt) : preFrames.length * 105
    const postMs = Math.max(0, postEndTs - shutterTs)

    let videoBlob: Blob | undefined
    let videoUrl: string | undefined
    if (chosenSlot) {
      if (chosenSlot.recorder.state !== 'inactive') {
        try {
          chosenSlot.recorder.stop()
        } catch {
          chosenSlot.resolveStopped(null)
        }
      }
      const blob = await Promise.race([
        chosenSlot.stopped,
        new Promise<null>((r) => setTimeout(() => r(null), 1200)),
      ])
      if (blob && blob.size > 0) {
        videoBlob = blob
        videoUrl = URL.createObjectURL(blob)
      }
    }

    // Merge pre-shutter + key moment + post-shutter burst frames (~3s motion for GIF strips)
    const combinedBurst = [...preFrames, ...postFrames]
    // Sample down to max ~18 frames for crisp, mobile-friendly GIF encoding
    const maxGifFrames = 18
    let sampledBurst = combinedBurst
    if (combinedBurst.length > maxGifFrames) {
      sampledBurst = []
      const step = (combinedBurst.length - 1) / (maxGifFrames - 1)
      for (let i = 0; i < maxGifFrames; i++) {
        sampledBurst.push(combinedBurst[Math.round(i * step)])
      }
    }

    const totalDurationSec = Number(((preMs + postMs) / 1000).toFixed(2))
    const keyPhotoOffsetSec = Number((preMs / 1000).toFixed(2))
    const resolvedMime = videoBlob?.type || this.mimeInfo?.mimeType || 'video/webm'
    const resolvedExt: 'mp4' | 'webm' = resolvedMime.includes('mp4')
      ? 'mp4'
      : this.mimeInfo?.ext || 'webm'

    return {
      id,
      stillUrl,
      videoBlob,
      videoUrl,
      videoMimeType: resolvedMime,
      videoExt: resolvedExt,
      durationSec: Math.max(1.5, totalDurationSec),
      keyPhotoOffsetSec,
      hasAudio: this.hasAudio && Boolean(videoUrl),
      burstFrames: sampledBurst.length > 0 ? sampledBurst : [stillUrl],
      warning: this.warning,
    }
  }

  public stop() {
    this.running = false
    this.captureLocked = false

    if (this.cycleTimerId !== null) {
      window.clearInterval(this.cycleTimerId)
      this.cycleTimerId = null
    }
    if (this.burstTimerId !== null) {
      window.clearInterval(this.burstTimerId)
      this.burstTimerId = null
    }
    if (this.rafId !== null) {
      window.cancelAnimationFrame(this.rafId)
      this.rafId = null
    }

    for (const slot of this.activeSlots) {
      this.discardSlot(slot)
    }
    this.activeSlots = []

    this.micStream?.getTracks().forEach((t) => t.stop())
    this.micStream = null
    this.combinedStream = null
    this.recCanvas = null
    this.burstCanvas = null
    this.frameRing = []
  }
}

/**
 * Exports a single Live Photo's still image with the active CSS filter applied.
 */
export async function exportFilteredLiveStill(
  stillUrl: string,
  filter: FilterType,
  filename: string
): Promise<boolean> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image()
    el.crossOrigin = 'anonymous'
    el.onload = () => resolve(el)
    el.onerror = () => reject(new Error('Could not load Live Photo still image.'))
    el.src = stillUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth || 1280
  canvas.height = img.naturalHeight || 960
  const ctx = canvas.getContext('2d')
  if (!ctx) return false

  const cssFilter = getCssFilter(filter)
  if ('filter' in ctx && cssFilter !== 'none') {
    ctx.filter = cssFilter
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

  const url = canvas.toDataURL('image/png')
  downloadUrl(url, filename)
  return true
}

/**
 * Downloads both paired components (key still PNG + motion clip) using matching
 * base filenames so the relationship between still and motion clip is preserved.
 */
export async function exportPairedLivePhoto(
  item: LivePhotoItem,
  poseIndex: number,
  filter: FilterType
): Promise<{ stillSaved: boolean; videoSaved: boolean }> {
  const dateStr = new Date().toISOString().split('T')[0]
  const baseName = `jellybooth_${dateStr}_live_pose${poseIndex + 1}`

  const stillSaved = await exportFilteredLiveStill(
    item.stillUrl,
    filter,
    `${baseName}_still.png`
  )

  let videoSaved = false
  if (item.videoUrl) {
    await new Promise((r) => setTimeout(r, 180))
    downloadUrl(item.videoUrl, `${baseName}_motion.${item.videoExt || 'webm'}`)
    videoSaved = true
  }

  return { stillSaved, videoSaved }
}
