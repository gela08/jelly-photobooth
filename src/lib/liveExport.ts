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
        { mimeType: 'video/mp4', ext: 'mp4' },
        { mimeType: 'video/webm;codecs=vp9,opus', ext: 'webm' },
        { mimeType: 'video/webm;codecs=vp8,opus', ext: 'webm' },
        { mimeType: 'video/webm', ext: 'webm' },
      ]
    : [
        { mimeType: 'video/mp4;codecs=avc1.42E01E', ext: 'mp4' },
        { mimeType: 'video/mp4', ext: 'mp4' },
        { mimeType: 'video/webm;codecs=vp9', ext: 'webm' },
        { mimeType: 'video/webm;codecs=vp8', ext: 'webm' },
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

/**
 * Generates an animated iOS Live Photo / Life4Cuts-style looping GIF of the
 * full customized photo strip (including theme, layout, filter, caption, and stickers).
 */
export async function generateLiveStripGif(
  session: PhotoSession,
  onProgress?: (percent: number) => void
): Promise<LiveStripGifResult> {
  const livePerPose = session.liveFramesPerPose ?? []
  const maxFrames = livePerPose.reduce((max, arr) => Math.max(max, arr?.length ?? 0), 0)

  if (maxFrames === 0 || session.photos.length === 0) {
    throw new Error('No live frames available for GIF export')
  }

  // Include the crisp final still pose as the last frame so it holds cleanly at the end
  const totalSteps = maxFrames + 1
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
    const isFinalHold = step === totalSteps - 1
    const framePhotos = session.photos.map((stillPhoto, poseIdx) => {
      if (isFinalHold) return stillPhoto
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

    gif.writeFrame(indexed, outW, outH, {
      palette,
      delay: isFinalHold ? 650 : 115,
      repeat: 0,
    })

    onProgress?.(Math.round(((step + 1) / totalSteps) * 100))
    // Yield briefly so mobile UI stays responsive during encoding
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
