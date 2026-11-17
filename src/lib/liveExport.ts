import { GIFEncoder, applyPalette, quantize } from 'gifenc'
import { generatePhotoboothCanvas } from './canvasExport'
import { PhotoSession } from './types'

export interface NegotiatedVideoFormat {
  mimeType: string
  ext: 'mp4' | 'webm'
}

export function selectSupportedVideoMimeType(withAudio: boolean): NegotiatedVideoFormat | null {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return null
  }

  const candidates: NegotiatedVideoFormat[] = withAudio
    ? [
        { mimeType: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', ext: 'mp4' },
        { mimeType: 'video/webm;codecs=vp9,opus', ext: 'webm' },
        { mimeType: 'video/webm;codecs=vp8,opus', ext: 'webm' },
        { mimeType: 'video/mp4', ext: 'mp4' },
        { mimeType: 'video/webm', ext: 'webm' },
      ]
    : [
        { mimeType: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
        { mimeType: 'video/webm;codecs=vp9', ext: 'webm' },
        { mimeType: 'video/webm;codecs=vp8', ext: 'webm' },
        { mimeType: 'video/mp4', ext: 'mp4' },
        { mimeType: 'video/webm', ext: 'webm' },
      ]

  if (typeof MediaRecorder.isTypeSupported === 'function') {
    for (const c of candidates) {
      try {
        if (MediaRecorder.isTypeSupported(c.mimeType)) {
          return c
        }
      } catch {
        // continue checking fallbacks
      }
    }
  }

  // Fallback for browsers where MediaRecorder exists without isTypeSupported match
  return { mimeType: '', ext: 'webm' }
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const mins = Math.floor(safe / 60)
  const secs = safe % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function downloadUrl(url: string, filename: string) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export interface LiveStripGifResult {
  blob: Blob
  url: string
  width: number
  height: number
}

export interface RenderedLiveStripFrames {
  canvases: HTMLCanvasElement[]
  frameUrls: string[]
  shutterIndex: number
  width: number
  height: number
}

export interface ExtractedLiveAudio {
  audioBuffer: AudioBuffer
  wavUrl: string
  durationSec: number
}

export interface LivePhotoVideoResult {
  blob: Blob
  url: string
  mimeType: string
  ext: 'mp4' | 'webm'
  hasAudio: boolean
  durationSec: number
}

/**
 * Resolves the synchronized timeline of frames across all poses:
 * 1.5s before shutter -> shutter still -> 1.5s after shutter.
 */
function buildTimelineFrameIndices(
  livePerPose: string[][],
  shutterFrameIndex?: number
): { maxFrames: number; shutterStep: number } {
  const maxFrames = livePerPose.reduce((max, arr) => Math.max(max, arr?.length ?? 0), 0)
  const shutterStep =
    typeof shutterFrameIndex === 'number' && shutterFrameIndex >= 0 && shutterFrameIndex < maxFrames
      ? shutterFrameIndex
      : Math.floor(maxFrames / 2)
  return { maxFrames, shutterStep }
}

/**
 * Generates an animated iOS Live Photo / Life4Cuts-style looping GIF of the
 * full customized photo strip (1.5s before -> shutter still -> 1.5s after).
 */
export async function generateLiveStripGif(
  session: PhotoSession,
  onProgress?: (percent: number) => void
): Promise<LiveStripGifResult> {
  const livePerPose = session.liveFramesPerPose ?? []
  const { maxFrames, shutterStep } = buildTimelineFrameIndices(
    livePerPose,
    session.liveShutterFrameIndex
  )

  if (maxFrames === 0 || session.photos.length === 0) {
    throw new Error('No live frames available for GIF export')
  }

  const totalSteps = maxFrames
  const maxDim = 420 // Mobile-friendly file size & fast client-side encoding

  const gif = GIFEncoder()
  const scaleCanvas = document.createElement('canvas')
  const scaleCtx = scaleCanvas.getContext('2d', { willReadFrequently: true })
  if (!scaleCtx) {
    throw new Error('Canvas 2D context unavailable')
  }

  let outW = 0
  let outH = 0

  for (let step = 0; step < totalSteps; step++) {
    const isShutterFrame = step === shutterStep
    const framePhotos = session.photos.map((stillPhoto, poseIdx) => {
      if (isShutterFrame) return stillPhoto
      const burst = livePerPose[poseIdx]
      if (!burst || burst.length === 0) return stillPhoto
      const idx = Math.min(step, burst.length - 1)
      return burst[idx]
    })

    const frameSession: PhotoSession = {
      ...session,
      photos: framePhotos,
    }

    const fullCanvas = await generatePhotoboothCanvas(frameSession, undefined, {
      includeStickers: true,
    })

    if (outW === 0 || outH === 0) {
      const ratio = Math.min(1, maxDim / Math.max(fullCanvas.width, fullCanvas.height))
      outW = Math.max(120, Math.round(fullCanvas.width * ratio))
      outH = Math.max(120, Math.round(fullCanvas.height * ratio))
      scaleCanvas.width = outW
      scaleCanvas.height = outH
    }

    scaleCtx.clearRect(0, 0, outW, outH)
    scaleCtx.drawImage(fullCanvas, 0, 0, outW, outH)

    const { data } = scaleCtx.getImageData(0, 0, outW, outH)
    const palette = quantize(data, 256)
    const indexed = applyPalette(data, palette)

    // Hold slightly on the crisp shutter frame and final frame so the 3s loop breathes naturally
    const delay = isShutterFrame ? 280 : step === totalSteps - 1 ? 350 : 140

    gif.writeFrame(indexed, outW, outH, {
      palette,
      delay,
      repeat: 0,
    })

    onProgress?.(Math.round(((step + 1) / totalSteps) * 100))
    await new Promise((r) => setTimeout(r, 0))
  }

  gif.finish()
  const rawBytes = gif.bytes()
  const copy = new Uint8Array(rawBytes.length)
  copy.set(rawBytes)
  const blob = new Blob([copy.buffer], { type: 'image/gif' })
  const url = URL.createObjectURL(blob)

  return { blob, url, width: outW, height: outH }
}

/**
 * Pre-renders the customized strip across the 3.0-second iOS Live Photo window
 * (1.5s before shutter -> shutter still -> 1.5s after shutter) for interactive
 * hold-to-play preview and 3s video export.
 */
export async function renderLiveStripFrames(
  session: PhotoSession,
  maxDim = 720,
  onProgress?: (percent: number) => void
): Promise<RenderedLiveStripFrames> {
  const livePerPose = session.liveFramesPerPose ?? []
  const { maxFrames, shutterStep } = buildTimelineFrameIndices(
    livePerPose,
    session.liveShutterFrameIndex
  )

  if (maxFrames === 0 || session.photos.length === 0) {
    throw new Error('No live frames available for Live Photo rendering')
  }

  const canvases: HTMLCanvasElement[] = []
  const frameUrls: string[] = []
  let outW = 0
  let outH = 0

  for (let step = 0; step < maxFrames; step++) {
    const isShutterFrame = step === shutterStep
    const framePhotos = session.photos.map((stillPhoto, poseIdx) => {
      if (isShutterFrame) return stillPhoto
      const burst = livePerPose[poseIdx]
      if (!burst || burst.length === 0) return stillPhoto
      const idx = Math.min(step, burst.length - 1)
      return burst[idx]
    })

    const frameSession: PhotoSession = {
      ...session,
      photos: framePhotos,
    }

    const fullCanvas = await generatePhotoboothCanvas(frameSession, undefined, {
      includeStickers: true,
    })

    if (outW === 0 || outH === 0) {
      const ratio = Math.min(1, maxDim / Math.max(fullCanvas.width, fullCanvas.height))
      // Ensure even dimensions for H.264 / VP8 / VP9 video encoders
      outW = Math.max(160, Math.round((fullCanvas.width * ratio) / 2) * 2)
      outH = Math.max(160, Math.round((fullCanvas.height * ratio) / 2) * 2)
    }

    const c = document.createElement('canvas')
    c.width = outW
    c.height = outH
    const ctx = c.getContext('2d')
    if (ctx) {
      ctx.drawImage(fullCanvas, 0, 0, outW, outH)
    }
    canvases.push(c)
    frameUrls.push(c.toDataURL('image/jpeg', 0.86))

    onProgress?.(Math.round(((step + 1) / maxFrames) * 100))
    await new Promise((r) => setTimeout(r, 0))
  }

  return {
    canvases,
    frameUrls,
    shutterIndex: shutterStep,
    width: outW,
    height: outH,
  }
}

function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = Math.min(2, buffer.numberOfChannels)
  const sampleRate = buffer.sampleRate
  const length = buffer.length
  const bytesPerSample = 2
  const blockAlign = numChannels * bytesPerSample
  const dataSize = length * blockAlign
  const arrayBuffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(arrayBuffer)

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i))
    }
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // PCM format
  view.setUint16(22, numChannels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * blockAlign, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, 16, true) // bits per sample
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)

  const channels: Float32Array[] = []
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch))
  }

  let offset = 44
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < numChannels; ch++) {
      const sample = Math.max(-1, Math.min(1, channels[ch][i] ?? 0))
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true)
      offset += 2
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

/**
 * Slices a 3.0-second AudioBuffer centered on a pose shutter (1.5s before + 1.5s after)
 * from the recorded MediaRecorder Blob.
 */
export async function extractPoseAudioSlice(
  videoBlob: Blob,
  shutterOffsetMs: number,
  windowBeforeSec = 1.5,
  windowAfterSec = 1.5
): Promise<ExtractedLiveAudio | null> {
  if (typeof window === 'undefined') return null
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioCtx) return null

  const ctx = new AudioCtx()
  try {
    const arr = await videoBlob.arrayBuffer()
    const decoded = await ctx.decodeAudioData(arr)
    if (!decoded || decoded.length === 0 || decoded.duration <= 0) {
      return null
    }

    const totalClipSec = windowBeforeSec + windowAfterSec
    const shutterSec = Math.max(0, shutterOffsetMs / 1000)
    const startSec = Math.max(0, Math.min(Math.max(0, decoded.duration - totalClipSec), shutterSec - windowBeforeSec))
    const endSec = Math.min(decoded.duration, startSec + totalClipSec)

    const sampleRate = decoded.sampleRate
    const startSample = Math.floor(startSec * sampleRate)
    const targetSamples = Math.max(1, Math.floor(totalClipSec * sampleRate))
    const availableSamples = Math.max(0, Math.floor(endSec * sampleRate) - startSample)
    const copySamples = Math.min(targetSamples, availableSamples)

    if (copySamples <= 0) return null

    const sliceBuffer = ctx.createBuffer(decoded.numberOfChannels, targetSamples, sampleRate)
    for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
      const src = decoded.getChannelData(ch)
      const dst = sliceBuffer.getChannelData(ch)
      for (let i = 0; i < copySamples; i++) {
        dst[i] = src[startSample + i] ?? 0
      }
    }

    const wavBlob = audioBufferToWavBlob(sliceBuffer)
    const wavUrl = URL.createObjectURL(wavBlob)

    return {
      audioBuffer: sliceBuffer,
      wavUrl,
      durationSec: totalClipSec,
    }
  } catch {
    return null
  } finally {
    ctx.close().catch(() => {})
  }
}

/**
 * Exports a genuine 3.0-second iOS Live Photo Strip video (.mp4 / .webm)
 * combining the 3s moving strip frames (1.5s before + still + 1.5s after)
 * and the synchronized 3s audio clip.
 */
export async function generateLivePhotoStripVideo(
  rendered: RenderedLiveStripFrames,
  audioBuffer: AudioBuffer | null,
  onProgress?: (percent: number) => void
): Promise<LivePhotoVideoResult> {
  if (rendered.canvases.length === 0) {
    throw new Error('No rendered Live Photo frames available')
  }

  const canvas = document.createElement('canvas')
  canvas.width = rendered.width
  canvas.height = rendered.height
  const ctx = canvas.getContext('2d')
  if (!ctx || typeof canvas.captureStream !== 'function' || typeof MediaRecorder === 'undefined') {
    throw new Error('Video capture stream is unsupported in this browser')
  }

  const stream = canvas.captureStream(24)
  let audioCtx: AudioContext | null = null
  let audioSource: AudioBufferSourceNode | null = null
  let hasAudio = false

  if (audioBuffer) {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        audioCtx = new AudioCtx()
        const dest = audioCtx.createMediaStreamDestination()
        audioSource = audioCtx.createBufferSource()
        audioSource.buffer = audioBuffer
        audioSource.connect(dest)
        const track = dest.stream.getAudioTracks()[0]
        if (track) {
          stream.addTrack(track)
          hasAudio = true
        }
      }
    } catch {
      hasAudio = false
    }
  }

  const format = selectSupportedVideoMimeType(hasAudio) || { mimeType: '', ext: 'webm' as const }
  const chunks: Blob[] = []

  let recorder: MediaRecorder
  try {
    recorder = new MediaRecorder(stream, {
      videoBitsPerSecond: 2_200_000,
      ...(format.mimeType ? { mimeType: format.mimeType } : {}),
    })
  } catch {
    recorder = new MediaRecorder(stream)
  }

  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) chunks.push(ev.data)
  }

  const stopped = new Promise<Blob>((resolve, reject) => {
    recorder.onstop = () => {
      if (chunks.length === 0) {
        reject(new Error('Empty Live Photo video output'))
        return
      }
      resolve(new Blob(chunks, { type: format.mimeType || recorder.mimeType || 'video/webm' }))
    }
    recorder.onerror = () => reject(new Error('Live Photo video encoding failed'))
  })

  // Draw frame 0 immediately so the encoder starts with a valid frame
  ctx.drawImage(rendered.canvases[0], 0, 0)
  recorder.start(100)
  if (audioSource && audioCtx) {
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume().catch(() => {})
    }
    audioSource.start(0)
  }

  const totalDurationMs = 3000
  const startTime = performance.now()
  const frameCount = rendered.canvases.length

  await new Promise<void>((resolve) => {
    const tick = () => {
      const elapsed = performance.now() - startTime
      const ratio = Math.min(1, elapsed / totalDurationMs)
      const frameIdx = Math.min(frameCount - 1, Math.floor(ratio * frameCount))
      ctx.drawImage(rendered.canvases[frameIdx], 0, 0)
      onProgress?.(Math.round(ratio * 100))

      if (elapsed >= totalDurationMs) {
        resolve()
        return
      }
      window.setTimeout(tick, 40)
    }
    tick()
  })

  try {
    audioSource?.stop()
  } catch {
    // ignore
  }
  if (recorder.state !== 'inactive') {
    recorder.stop()
  }
  stream.getTracks().forEach((t) => t.stop())

  const blob = await stopped
  audioCtx?.close().catch(() => {})
  const url = URL.createObjectURL(blob)

  return {
    blob,
    url,
    mimeType: format.mimeType || blob.type || 'video/webm',
    ext: format.ext,
    hasAudio,
    durationSec: 3,
  }
}
