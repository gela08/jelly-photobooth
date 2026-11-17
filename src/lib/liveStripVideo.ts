import { generatePhotoboothCanvas } from './canvasExport'
import {
  computeHdVideoDimensions,
  createHdMediaRecorder,
  selectSupportedVideoMimeType,
} from './liveExport'
import { LivePhotoItem, PhotoSession } from './types'

export interface LiveStripVideoResult {
  blob: Blob
  url: string
  width: number
  height: number
  ext: 'mp4' | 'webm'
  durationSec: number
  hasAudio: boolean
}

interface LoadedVideoSlot {
  poseIndex: number
  video: HTMLVideoElement
  startOffset: number
  endOffset: number
  hasAudio: boolean
}

function loadLiveVideoElement(lp: LivePhotoItem): Promise<HTMLVideoElement | null> {
  if (!lp.videoUrl || typeof document === 'undefined') return Promise.resolve(null)

  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.crossOrigin = 'anonymous'
    video.playsInline = true
    video.preload = 'auto'
    video.muted = true

    let settled = false
    const finish = (result: HTMLVideoElement | null) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      video.onloadeddata = null
      video.oncanplay = null
      video.onerror = null
      resolve(result)
    }

    const timer = window.setTimeout(() => {
      finish(video.readyState >= 2 && video.videoWidth > 0 ? video : null)
    }, 4500)

    const onReady = () => {
      if (video.videoWidth > 0) finish(video)
    }

    video.onloadeddata = onReady
    video.oncanplay = onReady
    video.onerror = () => finish(null)
    video.src = lp.videoUrl!
    try {
      video.load()
    } catch {
      // ignore load errors; timeout/onerror will settle cleanly
    }
  })
}

function seekVideoTo(video: HTMLVideoElement, targetSec: number): Promise<void> {
  return new Promise((resolve) => {
    const safeSec = Math.max(0, targetSec)
    if (
      !Number.isFinite(safeSec) ||
      Math.abs(video.currentTime - safeSec) < 0.04
    ) {
      resolve()
      return
    }
    let settled = false
    const done = () => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      video.onseeked = null
      resolve()
    }
    const timer = window.setTimeout(done, 700)
    video.onseeked = done
    try {
      video.currentTime = safeSec
    } catch {
      done()
    }
  })
}

/**
 * Exports an HD video (.mp4 or .webm) of the complete customized Live Photo Strip
 * (selected layout, strip design, border, decorations, filter, caption, date, stickers)
 * with all Live Photo poses animating simultaneously (~3s) and settling onto the crisp key still.
 */
export async function exportLivePhotoStripVideo(
  session: PhotoSession,
  livePhotos: LivePhotoItem[],
  onProgress?: (percent: number) => void
): Promise<LiveStripVideoResult> {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    throw new Error('Video recording is not supported on this browser.')
  }

  const probeCanvas = document.createElement('canvas') as HTMLCanvasElement & {
    captureStream?: (fps?: number) => MediaStream
  }
  if (typeof probeCanvas.captureStream !== 'function') {
    throw new Error('Canvas stream capture is not supported on this browser.')
  }

  if (session.photos.length === 0 || !livePhotos.some((lp) => Boolean(lp.videoUrl))) {
    throw new Error('No Live Photo motion clips available for HD strip export.')
  }

  // Load & cue each pose's video element
  const loadedVideos = await Promise.all(
    session.photos.map((_, idx) => {
      const lp = livePhotos[idx]
      return lp?.videoUrl ? loadLiveVideoElement(lp) : Promise.resolve(null)
    })
  )

  const activeSlots: LoadedVideoSlot[] = []
  for (let i = 0; i < session.photos.length; i++) {
    const v = loadedVideos[i]
    const lp = livePhotos[i]
    if (!v || !lp) continue
    const startOffset = Math.max(0, lp.keyPhotoOffsetSec - 1.5)
    const clipDur = Number.isFinite(v.duration) && v.duration > 0 ? v.duration : lp.durationSec
    const endOffset = Math.min(clipDur || 3.4, lp.keyPhotoOffsetSec + 1.55)
    await seekVideoTo(v, startOffset)
    activeSlots.push({
      poseIndex: i,
      video: v,
      startOffset,
      endOffset: Math.max(startOffset + 1.2, endOffset),
      hasAudio: lp.hasAudio,
    })
  }

  if (activeSlots.length === 0) {
    throw new Error('Could not load Live Photo video clips for strip export.')
  }

  // Track resources for guaranteed cleanup
  const audioNodes: AudioNode[] = []
  let audioCtx: AudioContext | null = null
  let mixedStream: MediaStream | null = null
  let recorder: MediaRecorder | null = null

  const cleanup = () => {
    for (const slot of activeSlots) {
      try {
        slot.video.pause()
        slot.video.removeAttribute('src')
        slot.video.load()
      } catch {
        // ignore cleanup errors
      }
    }
    for (const node of audioNodes) {
      try {
        node.disconnect()
      } catch {
        // ignore
      }
    }
    if (audioCtx) {
      audioCtx.close().catch(() => {})
      audioCtx = null
    }
    if (mixedStream) {
      mixedStream.getTracks().forEach((t) => {
        try {
          t.stop()
        } catch {
          // ignore
        }
      })
      mixedStream = null
    }
  }

  try {
    const stripCanvas = document.createElement('canvas')
    const initialOverrides: (CanvasImageSource | undefined)[] = session.photos.map(
      (_, idx) => activeSlots.find((s) => s.poseIndex === idx)?.video
    )

    await generatePhotoboothCanvas(session, undefined, {
      includeStickers: true,
      sourceOverrides: initialOverrides,
      fastCssFilter: true,
      targetCanvas: stripCanvas,
    })

    const hdSize = computeHdVideoDimensions(stripCanvas.width, stripCanvas.height)
    const outCanvas = document.createElement('canvas') as HTMLCanvasElement & {
      captureStream: (fps?: number) => MediaStream
    }
    outCanvas.width = hdSize.width
    outCanvas.height = hdSize.height
    const outCtx = outCanvas.getContext('2d')
    if (!outCtx) {
      throw new Error('Canvas 2D context unavailable.')
    }
    outCtx.imageSmoothingEnabled = true
    outCtx.imageSmoothingQuality = 'high'
    outCtx.drawImage(stripCanvas, 0, 0, hdSize.width, hdSize.height)

    // Mix synchronized audio from Live Photo clips via Web Audio when available
    const audioSlots = activeSlots.filter((s) => s.hasAudio)
    let hasMixedAudio = false
    let mixedAudioTrack: MediaStreamTrack | null = null

    if (audioSlots.length > 0 && typeof AudioContext !== 'undefined') {
      try {
        audioCtx = new AudioContext()
        if (audioCtx.state === 'suspended') {
          await audioCtx.resume()
        }
        const dest = audioCtx.createMediaStreamDestination()
        const gainVal = 1 / Math.max(1, audioSlots.length)

        for (const slot of audioSlots) {
          slot.video.muted = false
          slot.video.volume = 1
          const src = audioCtx.createMediaElementSource(slot.video)
          const gain = audioCtx.createGain()
          gain.gain.value = gainVal
          src.connect(gain)
          gain.connect(dest)
          audioNodes.push(src, gain)
        }
        mixedAudioTrack = dest.stream.getAudioTracks()[0] ?? null
        hasMixedAudio = Boolean(mixedAudioTrack)
      } catch {
        // Graceful silent fallback if browser restricts MediaElementAudioSourceNode
        for (const slot of activeSlots) {
          slot.video.muted = true
        }
        if (audioCtx) {
          audioCtx.close().catch(() => {})
          audioCtx = null
        }
        mixedAudioTrack = null
        hasMixedAudio = false
      }
    }

    const mimeInfo = selectSupportedVideoMimeType(hasMixedAudio)
    if (!mimeInfo) {
      throw new Error('No supported HD video encoder found on this browser.')
    }

    const canvasStream = outCanvas.captureStream(30)
    const combinedTracks = [...canvasStream.getVideoTracks()]
    if (mixedAudioTrack) {
      combinedTracks.push(mixedAudioTrack)
    }
    mixedStream = new MediaStream(combinedTracks)

    recorder = createHdMediaRecorder(mixedStream, mimeInfo.mimeType, hasMixedAudio)
    const chunks: Blob[] = []
    const stoppedPromise = new Promise<Blob>((resolve, reject) => {
      recorder!.ondataavailable = (ev) => {
        if (ev.data && ev.data.size > 0) chunks.push(ev.data)
      }
      recorder!.onstop = () => {
        if (chunks.length === 0) {
          reject(new Error('Recorded Live Photo strip video was empty.'))
          return
        }
        const type = mimeInfo.mimeType || recorder!.mimeType || 'video/webm'
        resolve(new Blob(chunks, { type }))
      }
      recorder!.onerror = () => {
        reject(new Error('Live Photo strip video encoding failed.'))
      }
    })

    const maxPlayWindowMs = activeSlots.reduce((max, slot) => {
      const spanMs = Math.round((slot.endOffset - slot.startOffset) * 1000)
      return Math.max(max, spanMs)
    }, 2800)
    const motionDurationMs = Math.min(3800, Math.max(2500, maxPlayWindowMs))
    const finalStillHoldMs = 650
    const totalDurationMs = motionDurationMs + finalStillHoldMs

    onProgress?.(5)
    recorder.start(200)

    // Start all Live Photo clips simultaneously
    await Promise.all(
      activeSlots.map((slot) =>
        slot.video.play().catch(() => {
          slot.video.muted = true
          return slot.video.play().catch(() => {})
        })
      )
    )

    const startedAt = performance.now()
    let inHoldPhase = false

    while (true) {
      const elapsed = performance.now() - startedAt
      if (elapsed >= totalDurationMs) break

      const inMotion = elapsed < motionDurationMs
      if (!inMotion && !inHoldPhase) {
        inHoldPhase = true
        for (const slot of activeSlots) {
          slot.video.pause()
        }
      }

      const frameOverrides = inMotion
        ? session.photos.map((_, idx) => {
            const slot = activeSlots.find((s) => s.poseIndex === idx)
            if (!slot) return undefined
            if (slot.video.ended || slot.video.currentTime >= slot.endOffset) {
              if (!slot.video.paused) slot.video.pause()
              return undefined // settle individual frame onto its crisp still image
            }
            return slot.video
          })
        : undefined

      await generatePhotoboothCanvas(session, undefined, {
        includeStickers: true,
        sourceOverrides: frameOverrides,
        fastCssFilter: true,
        targetCanvas: stripCanvas,
      })

      outCtx.drawImage(stripCanvas, 0, 0, hdSize.width, hdSize.height)

      const pct = Math.min(95, Math.max(5, Math.round((elapsed / totalDurationMs) * 90) + 5))
      onProgress?.(pct)

      await new Promise<void>((resolve) => {
        let done = false
        const settle = () => {
          if (done) return
          done = true
          resolve()
        }
        window.setTimeout(settle, 40)
        if (typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(() => settle())
        }
      })
    }

    if (recorder.state !== 'inactive') {
      recorder.stop()
    }

    const blob = await Promise.race([
      stoppedPromise,
      new Promise<never>((_, reject) =>
        window.setTimeout(() => reject(new Error('Video finalization timed out.')), 4000)
      ),
    ])

    onProgress?.(100)
    const ext: 'mp4' | 'webm' =
      (blob.type || mimeInfo.mimeType).includes('mp4') ? 'mp4' : mimeInfo.ext
    const url = URL.createObjectURL(blob)

    cleanup()

    return {
      blob,
      url,
      width: hdSize.width,
      height: hdSize.height,
      ext,
      durationSec: Number((totalDurationMs / 1000).toFixed(2)),
      hasAudio: hasMixedAudio,
    }
  } catch (err) {
    if (recorder && recorder.state !== 'inactive') {
      try {
        recorder.stop()
      } catch {
        // ignore
      }
    }
    cleanup()
    throw err
  }
}
