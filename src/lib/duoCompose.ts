import { GIFEncoder, applyPalette, quantize } from 'gifenc'
import {
  applyPixelFilter,
  drawImageCover,
  drawPlacedStickers,
  drawPhoto,
  drawStripBottom,
  drawStripDecorations,
  drawThemeBackground,
  generatePhotoboothCanvas,
  loadImage,
  resolveEffectiveTheme,
} from './canvasExport'
import { DuoComposeMode, DuoCustomState, DuoPoseShot } from './duoProtocol'
import { DEFAULT_PHOTO_TRANSFORM, PhotoSession, PhotoTransform, PoseCount } from './types'

const S = 2

export interface DuoSessionSpec {
  shots: DuoPoseShot[]
  poseCount: PoseCount
  custom: DuoCustomState
  hostName?: string
  guestName?: string
}

/**
 * Combines a single pose's Host & Guest captures into one paired split-frame data URL
 * (used by 'side_by_side' and 'stacked' modes so all 22 booth layouts apply cleanly).
 */
export async function composeDuoPosePair(
  hostSrc: string,
  guestSrc: string,
  mode: Exclude<DuoComposeMode, 'twin_strip'>,
  hostTransform?: PhotoTransform,
  guestTransform?: PhotoTransform,
  dividerColor = 'rgba(245, 240, 232, 0.92)',
  targetWidth = 920
): Promise<string> {
  const [hostImg, guestImg] = await Promise.all([loadImage(hostSrc), loadImage(guestSrc)])
  const canvas = document.createElement('canvas')
  const width = targetWidth
  const height = Math.round(targetWidth * 0.75) // 4:3 booth frame ratio
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return hostSrc

  ctx.fillStyle = dividerColor
  ctx.fillRect(0, 0, width, height)

  const seam = Math.max(2, Math.round(width * 0.005))

  if (mode === 'side_by_side') {
    const halfW = Math.floor((width - seam) / 2)
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, halfW, height)
    ctx.clip()
    drawImageCover(ctx, hostImg, 0, 0, halfW, height, hostTransform ?? DEFAULT_PHOTO_TRANSFORM)
    ctx.restore()

    const rightX = halfW + seam
    const rightW = width - rightX
    ctx.save()
    ctx.beginPath()
    ctx.rect(rightX, 0, rightW, height)
    ctx.clip()
    drawImageCover(ctx, guestImg, rightX, 0, rightW, height, guestTransform ?? DEFAULT_PHOTO_TRANSFORM)
    ctx.restore()
  } else {
    const halfH = Math.floor((height - seam) / 2)
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, 0, width, halfH)
    ctx.clip()
    drawImageCover(ctx, hostImg, 0, 0, width, halfH, hostTransform ?? DEFAULT_PHOTO_TRANSFORM)
    ctx.restore()

    const bottomY = halfH + seam
    const bottomH = height - bottomY
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, bottomY, width, bottomH)
    ctx.clip()
    drawImageCover(ctx, guestImg, 0, bottomY, width, bottomH, guestTransform ?? DEFAULT_PHOTO_TRANSFORM)
    ctx.restore()
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}

/**
 * Generates the dedicated Twin Parallel Strips layout:
 * Left column shows Host's poses, Right column shows Guest's poses,
 * styled with the active strip theme, border style, decorations, stickers, and filter.
 */
async function generateTwinStripCanvas(
  spec: DuoSessionSpec,
  overridePairs?: { host: string; guest: string }[],
  options?: { includeStickers?: boolean }
): Promise<HTMLCanvasElement> {
  const ordered = Array.from({ length: spec.poseCount }, (_, idx) => {
    if (overridePairs && overridePairs[idx]) {
      return overridePairs[idx]
    }
    const shot = spec.shots.find((s) => s.poseIndex === idx)
    return {
      host: shot?.hostPhoto || shot?.guestPhoto || '',
      guest: shot?.guestPhoto || shot?.hostPhoto || '',
    }
  }).filter((p) => p.host && p.guest)

  const [hostImgs, guestImgs] = await Promise.all([
    Promise.all(ordered.map((p) => loadImage(p.host))),
    Promise.all(ordered.map((p) => loadImage(p.guest))),
  ])

  const pseudoSession: PhotoSession = {
    photos: [],
    filter: spec.custom.filter,
    layout: spec.custom.layout,
    caption: spec.custom.caption,
    showDate: spec.custom.showDate,
    poseCount: spec.poseCount,
    stickers: spec.custom.stickers,
    stripTheme: spec.custom.stripTheme,
    borderStyle: spec.custom.borderStyle,
    stripDecoration: spec.custom.stripDecoration,
  }

  const theme = resolveEffectiveTheme(pseudoSession, 'classic')
  const borderStyle = spec.custom.borderStyle ?? 'classic'

  const n = Math.max(1, ordered.length)
  const colW = 195 * S
  const photoH = 146 * S
  const colGap = 14 * S
  const rowGap = 10 * S
  const padX = 24 * S
  const padTop = 24 * S
  const titleH = 44 * S
  const captionH = (spec.custom.caption ? 36 * S : 0) + (spec.custom.showDate ? 24 * S : 0)
  const padBottom = 22 * S

  const totalW = padX * 2 + colW * 2 + colGap
  const totalH = padTop + titleH + n * photoH + (n - 1) * rowGap + captionH + padBottom

  const canvas = document.createElement('canvas')
  canvas.width = totalW
  canvas.height = totalH
  const ctx = canvas.getContext('2d')!

  drawThemeBackground(ctx, totalW, totalH, theme)

  // Title & duo names subtitle
  ctx.save()
  ctx.fillStyle = theme.titleColor
  ctx.font = `bold ${11 * S}px 'Courier New', monospace`
  ctx.textAlign = 'center'
  ctx.fillText("JELLY'S DUO BOOTH", totalW / 2, padTop + 13 * S)

  const leftName = (spec.hostName || 'HOST').toUpperCase().slice(0, 14)
  const rightName = (spec.guestName || 'PARTNER').toUpperCase().slice(0, 14)
  ctx.fillStyle = theme.captionColor
  ctx.font = `${8.5 * S}px 'Courier New', monospace`
  ctx.fillText(`${leftName}  ×  ${rightName}`, totalW / 2, padTop + 30 * S)
  ctx.restore()

  // Center dotted divider between twin strips
  ctx.save()
  ctx.strokeStyle = theme.dividerColor
  ctx.lineWidth = 1.2 * S
  ctx.setLineDash([4 * S, 4 * S])
  const divX = totalW / 2
  ctx.beginPath()
  ctx.moveTo(divX, padTop + titleH - 4 * S)
  ctx.lineTo(divX, padTop + titleH + n * photoH + (n - 1) * rowGap + 4 * S)
  ctx.stroke()
  ctx.restore()

  const leftX = padX
  const rightX = padX + colW + colGap

  for (let i = 0; i < n; i++) {
    const y = padTop + titleH + i * (photoH + rowGap)
    const hImg = hostImgs[i]
    const gImg = guestImgs[i]
    if (hImg) {
      drawPhoto(
        ctx,
        hImg,
        spec.custom.filter,
        leftX,
        y,
        colW,
        photoH,
        spec.custom.hostTransforms?.[i],
        borderStyle,
        theme.isDark
      )
      if (spec.custom.filter !== 'none') {
        // drawPhoto already applies applyPixelFilter internally; no duplicate filter needed
        void applyPixelFilter
      }
    }
    if (gImg) {
      drawPhoto(
        ctx,
        gImg,
        spec.custom.filter,
        rightX,
        y,
        colW,
        photoH,
        spec.custom.guestTransforms?.[i],
        borderStyle,
        theme.isDark
      )
    }
  }

  const photosBottomY = padTop + titleH + n * photoH + (n - 1) * rowGap
  drawStripBottom(ctx, spec.custom.caption, spec.custom.showDate, totalW, photosBottomY, theme)
  drawStripDecorations(ctx, totalW, totalH, spec.custom.stripDecoration, theme)

  if ((options?.includeStickers ?? true) && spec.custom.stickers?.length) {
    await drawPlacedStickers(ctx, spec.custom.stickers, totalW, totalH)
  }

  return canvas
}

/**
 * Generates the final customized Remote Duo photobooth canvas for preview or export.
 */
export async function generateDuoPhotoboothCanvas(
  spec: DuoSessionSpec,
  options?: { includeStickers?: boolean; pairTargetWidth?: number }
): Promise<HTMLCanvasElement> {
  if (spec.custom.composeMode === 'twin_strip') {
    return generateTwinStripCanvas(spec, undefined, options)
  }

  const orderedShots = Array.from({ length: spec.poseCount }, (_, idx) => {
    return spec.shots.find((s) => s.poseIndex === idx)
  })

  const composedPhotos = await Promise.all(
    orderedShots.map((shot, idx) => {
      const h = shot?.hostPhoto || shot?.guestPhoto
      const g = shot?.guestPhoto || shot?.hostPhoto
      if (!h || !g) return Promise.resolve('')
      return composeDuoPosePair(
        h,
        g,
        spec.custom.composeMode as Exclude<DuoComposeMode, 'twin_strip'>,
        spec.custom.hostTransforms?.[idx],
        spec.custom.guestTransforms?.[idx],
        undefined,
        options?.pairTargetWidth ?? 920
      )
    })
  )

  const session: PhotoSession = {
    photos: composedPhotos.filter(Boolean),
    photoTransforms: composedPhotos.map(() => DEFAULT_PHOTO_TRANSFORM),
    filter: spec.custom.filter,
    layout: spec.custom.layout,
    caption: spec.custom.caption,
    showDate: spec.custom.showDate,
    poseCount: spec.poseCount,
    stickers: spec.custom.stickers,
    stripTheme: spec.custom.stripTheme,
    borderStyle: spec.custom.borderStyle,
    stripDecoration: spec.custom.stripDecoration,
  }

  return generatePhotoboothCanvas(session, undefined, options)
}

export async function downloadDuoPhoto(
  spec: DuoSessionSpec,
  format: 'print' | 'social' = 'print'
) {
  const canvas = await generateDuoPhotoboothCanvas(spec)
  const dateStr = new Date().toISOString().split('T')[0]
  const fileName = `jellybooth_duo_${dateStr}(for_${format}).png`

  if (format === 'social') {
    const socialW = 1080
    const socialH = 1350
    const social = document.createElement('canvas')
    social.width = socialW
    social.height = socialH
    const ctx = social.getContext('2d')!
    const pseudoSession: PhotoSession = {
      photos: [],
      filter: spec.custom.filter,
      layout: spec.custom.layout,
      caption: spec.custom.caption,
      showDate: spec.custom.showDate,
      poseCount: spec.poseCount,
      stripTheme: spec.custom.stripTheme,
    }
    const theme = resolveEffectiveTheme(pseudoSession, spec.custom.layout)

    ctx.fillStyle = theme.isDark ? '#1a1512' : '#f5f0e8'
    ctx.fillRect(0, 0, socialW, socialH)

    const scale = Math.min((socialW - 80) / canvas.width, (socialH - 100) / canvas.height)
    const sw = Math.round(canvas.width * scale)
    const sh = Math.round(canvas.height * scale)

    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.28)'
    ctx.shadowBlur = 32
    ctx.shadowOffsetY = 10
    ctx.drawImage(canvas, Math.round((socialW - sw) / 2), Math.round((socialH - sh) / 2), sw, sh)
    ctx.restore()

    const a = document.createElement('a')
    a.download = fileName
    a.href = social.toDataURL('image/png')
    a.click()
  } else {
    const a = document.createElement('a')
    a.download = fileName
    a.href = canvas.toDataURL('image/png')
    a.click()
  }
}

/**
 * Encodes an iOS Live Photo-style looping GIF of the completed Remote Duo strip
 * combining both participants' pre-shutter bursts!
 */
export async function generateDuoLiveStripGif(
  spec: DuoSessionSpec,
  onProgress?: (percent: number) => void
): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  const ordered = Array.from({ length: spec.poseCount }, (_, idx) => {
    return spec.shots.find((s) => s.poseIndex === idx)
  })

  const maxFrames = ordered.reduce((acc, s) => {
    const hLen = s?.hostBurst?.length ?? 0
    const gLen = s?.guestBurst?.length ?? 0
    return Math.max(acc, hLen, gLen)
  }, 0)

  if (maxFrames === 0) {
    throw new Error('No live burst frames recorded for this Duo session.')
  }

  const totalSteps = maxFrames + 1
  const maxDim = 420
  const gif = GIFEncoder()
  const scaleCanvas = document.createElement('canvas')
  const scaleCtx = scaleCanvas.getContext('2d', { willReadFrequently: true })
  if (!scaleCtx) throw new Error('Canvas 2D context unavailable')

  let outW = 0
  let outH = 0

  for (let step = 0; step < totalSteps; step++) {
    const isFinalHold = step === totalSteps - 1
    let fullCanvas: HTMLCanvasElement

    if (spec.custom.composeMode === 'twin_strip') {
      const pairs = ordered.map((shot) => {
        const stillH = shot?.hostPhoto || shot?.guestPhoto || ''
        const stillG = shot?.guestPhoto || shot?.hostPhoto || ''
        if (isFinalHold) return { host: stillH, guest: stillG }
        const hBurst = shot?.hostBurst
        const gBurst = shot?.guestBurst
        return {
          host: hBurst?.length ? hBurst[Math.min(step, hBurst.length - 1)] : stillH,
          guest: gBurst?.length ? gBurst[Math.min(step, gBurst.length - 1)] : stillG,
        }
      })
      fullCanvas = await generateTwinStripCanvas(spec, pairs, { includeStickers: true })
    } else {
      const composed = await Promise.all(
        ordered.map((shot, idx) => {
          const stillH = shot?.hostPhoto || shot?.guestPhoto || ''
          const stillG = shot?.guestPhoto || shot?.hostPhoto || ''
          if (!stillH || !stillG) return Promise.resolve('')
          const hBurst = shot?.hostBurst
          const gBurst = shot?.guestBurst
          const hSrc = !isFinalHold && hBurst?.length ? hBurst[Math.min(step, hBurst.length - 1)] : stillH
          const gSrc = !isFinalHold && gBurst?.length ? gBurst[Math.min(step, gBurst.length - 1)] : stillG
          return composeDuoPosePair(
            hSrc,
            gSrc,
            spec.custom.composeMode as Exclude<DuoComposeMode, 'twin_strip'>,
            spec.custom.hostTransforms?.[idx],
            spec.custom.guestTransforms?.[idx],
            undefined,
            420
          )
        })
      )
      const frameSession: PhotoSession = {
        photos: composed.filter(Boolean),
        photoTransforms: composed.map(() => DEFAULT_PHOTO_TRANSFORM),
        filter: spec.custom.filter,
        layout: spec.custom.layout,
        caption: spec.custom.caption,
        showDate: spec.custom.showDate,
        poseCount: spec.poseCount,
        stickers: spec.custom.stickers,
        stripTheme: spec.custom.stripTheme,
        borderStyle: spec.custom.borderStyle,
        stripDecoration: spec.custom.stripDecoration,
      }
      fullCanvas = await generatePhotoboothCanvas(frameSession, undefined, { includeStickers: true })
    }

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
