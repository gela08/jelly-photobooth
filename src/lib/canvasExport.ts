import {
  FilterType,
  LayoutType,
  PhotoSession,
  PhotoTransform,
  PlacedSticker,
  StripBorderStyle,
  StripDecoration,
} from './types'
import { getStripTheme, StripThemeConfig } from './stripDesigns'

const S = 2 // 2× scale for high-res output

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

/** Deterministic PRNG so paper grain / stars don't flicker on every edit */
function createSeededRng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/** Cover-crop with optional pan/zoom transform: draw image filling (dx,dy,dw,dh) with no distortion */
export function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number,
  transform?: PhotoTransform
) {
  const nw = img.naturalWidth
  const nh = img.naturalHeight
  if (!nw || !nh || dw <= 0 || dh <= 0) return

  const sa = nw / nh
  const da = dw / dh
  let baseSw = nw
  let baseSh = nh
  if (sa > da) {
    baseSw = nh * da
  } else {
    baseSh = nw / da
  }

  const zoom = Math.max(1, Math.min(4, transform?.zoom ?? 1))
  const panX = Math.max(-1, Math.min(1, transform?.x ?? 0))
  const panY = Math.max(-1, Math.min(1, transform?.y ?? 0))

  const sw = baseSw / zoom
  const sh = baseSh / zoom
  const maxDx = Math.max(0, (nw - sw) / 2)
  const maxDy = Math.max(0, (nh - sh) / 2)

  const sx = maxDx * (1 - panX)
  const sy = maxDy * (1 - panY)

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

export function applyPixelFilter(
  ctx: CanvasRenderingContext2D,
  filter: FilterType,
  x: number, y: number, w: number, h: number
) {
  if (filter === 'none') return
  const ix = Math.round(x), iy = Math.round(y), iw = Math.round(w), ih = Math.round(h)
  if (iw <= 0 || ih <= 0) return
  try {
    const imageData = ctx.getImageData(ix, iy, iw, ih)
    const d = imageData.data
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2]
      switch (filter) {
        case 'sepia':
          d[i]   = Math.min(255, (r * 0.393 + g * 0.769 + b * 0.189) * 1.05)
          d[i+1] = Math.min(255, (r * 0.349 + g * 0.686 + b * 0.168) * 1.05)
          d[i+2] = Math.min(255, (r * 0.272 + g * 0.534 + b * 0.131) * 1.05)
          break
        case 'bw': {
          const lum = Math.min(255, Math.max(0, (r*0.299+g*0.587+b*0.114-128)*1.15+128))
          d[i] = d[i+1] = d[i+2] = lum; break
        }
        case 'noir': {
          const lum = Math.min(255, Math.max(0, (r*0.299+g*0.587+b*0.114-128)*1.4+128))
          d[i] = d[i+1] = d[i+2] = lum; break
        }
        case 'warm':
          d[i]=Math.min(255,r*1.1+12); d[i+1]=Math.min(255,g*0.94); d[i+2]=Math.min(255,b*0.82); break
        case 'grain': {
          const n = (Math.random()-0.5)*22
          d[i]=Math.min(255,Math.max(0,r*1.03+n)); d[i+1]=Math.min(255,Math.max(0,g*0.97+n)); d[i+2]=Math.min(255,Math.max(0,b*0.91+n)); break
        }
        case 'faded':
          d[i]=Math.min(255,r*0.85+30); d[i+1]=Math.min(255,g*0.85+28); d[i+2]=Math.min(255,b*0.85+25); break
        case 'cool':
          d[i]=Math.min(255,r*0.85); d[i+1]=Math.min(255,g*0.95); d[i+2]=Math.min(255,b*1.2); break
        case 'golden':
          d[i]=Math.min(255,r*1.15+15); d[i+1]=Math.min(255,g*1.02+5); d[i+2]=Math.min(255,b*0.72); break
        case 'dreamy':
          d[i]=Math.min(255,r*1.05+15); d[i+1]=Math.min(255,g*1.0+10); d[i+2]=Math.min(255,b*1.1+15); break
        case 'lomo': {
          const sat = Math.max(r,g,b)-Math.min(r,g,b)
          d[i]=Math.min(255,r+sat*0.3); d[i+1]=Math.min(255,g*0.9); d[i+2]=Math.min(255,b*0.9); break
        }
        case 'vintage90s':
          d[i]=Math.min(255,r*1.08+8); d[i+1]=Math.min(255,g*1.02+5); d[i+2]=Math.min(255,b*0.88); break
        case 'y2k':
          d[i]=Math.min(255,r*1.1+10); d[i+1]=Math.min(255,g*1.05); d[i+2]=Math.min(255,b*1.15+8); break
        case 'sunburn':
          d[i]=Math.min(255,r*1.2+20); d[i+1]=Math.min(255,g*1.0+5); d[i+2]=Math.min(255,b*0.75); break
        case 'matte':
          d[i]=Math.min(255,r*0.9+20); d[i+1]=Math.min(255,g*0.9+20); d[i+2]=Math.min(255,b*0.9+20); break
        case 'pinky':
          d[i]=Math.min(255,r*1.1+15); d[i+1]=Math.min(255,g*0.9+5); d[i+2]=Math.min(255,b*1.05+10); break
      }
    }
    ctx.putImageData(imageData, ix, iy)
  } catch { /* ignore cross-origin */ }
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x+rad, y)
  ctx.lineTo(x+w-rad, y); ctx.quadraticCurveTo(x+w, y, x+w, y+rad)
  ctx.lineTo(x+w, y+h-rad); ctx.quadraticCurveTo(x+w, y+h, x+w-rad, y+h)
  ctx.lineTo(x+rad, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-rad)
  ctx.lineTo(x, y+rad); ctx.quadraticCurveTo(x, y, x+rad, y)
  ctx.closePath()
}

// ─────────────────────────────────────────────────────────────────────────────
// THEME & BACKGROUND HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function resolveEffectiveTheme(session: PhotoSession, layout: LayoutType): StripThemeConfig {
  const selectedId = session.stripTheme ?? 'auto'
  if (selectedId !== 'auto') {
    return getStripTheme(selectedId)
  }

  if (layout === 'classic' || layout === 'classic_land') {
    return {
      id: 'auto',
      label: 'Classic Dark',
      description: '',
      swatchBg: '#121010',
      bgPrimary: '#121010',
      pattern: 'solid',
      isDark: true,
      titleColor: '#f5f0e8',
      captionColor: '#c4a882',
      dateColor: '#8a7a6a',
      dividerColor: 'rgba(196,168,130,0.35)',
      frameColor: '#ffffff',
    }
  }

  if (layout === 'filmstrip' || layout === 'filmstrip_land') {
    return {
      id: 'auto',
      label: 'Film Stock',
      description: '',
      swatchBg: '#0e0b08',
      bgPrimary: '#0e0b08',
      bgSecondary: '#1a1208',
      pattern: 'solid',
      isDark: true,
      titleColor: '#c4a882',
      captionColor: '#c4a882',
      dateColor: '#7a6a5a',
      dividerColor: 'rgba(255,255,255,0.08)',
      frameColor: '#ffffff',
    }
  }

  if (layout.startsWith('polaroid_')) {
    return {
      id: 'auto',
      label: 'Parchment',
      description: '',
      swatchBg: '#e8dcc8',
      bgPrimary: '#e8dcc8',
      pattern: 'paper',
      isDark: false,
      titleColor: '#5c3d1e',
      captionColor: '#8b6914',
      dateColor: '#9e8e7e',
      dividerColor: 'rgba(92,61,30,0.2)',
      frameColor: '#fefefe',
    }
  }

  return getStripTheme('vintage_cream')
}

export function drawThemeBackground(ctx: CanvasRenderingContext2D, w: number, h: number, theme: StripThemeConfig) {
  const rng = createSeededRng(Math.round(w * 13 + h * 7))

  switch (theme.pattern) {
    case 'solid': {
      ctx.fillStyle = theme.bgPrimary
      ctx.fillRect(0, 0, w, h)
      break
    }
    case 'checker': {
      const size = 18 * S
      const cols = Math.ceil(w / size)
      const rows = Math.ceil(h / size)
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          ctx.fillStyle = (r + c) % 2 === 0 ? theme.bgPrimary : (theme.bgSecondary || '#e5d1b4')
          ctx.fillRect(c * size, r * size, size + 0.5, size + 0.5)
        }
      }
      break
    }
    case 'gingham': {
      ctx.fillStyle = theme.bgPrimary
      ctx.fillRect(0, 0, w, h)
      const stripe = 18 * S
      ctx.save()
      ctx.fillStyle = theme.bgSecondary || '#f7ccd5'
      ctx.globalAlpha = 0.45
      for (let x = 0; x < w; x += stripe * 2) {
        ctx.fillRect(x, 0, stripe, h)
      }
      for (let y = 0; y < h; y += stripe * 2) {
        ctx.fillRect(0, y, w, stripe)
      }
      ctx.restore()
      break
    }
    case 'starfield': {
      const grad = ctx.createLinearGradient(0, 0, 0, h)
      grad.addColorStop(0, theme.bgPrimary)
      grad.addColorStop(1, theme.bgSecondary || '#2a335c')
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      ctx.save()
      const count = Math.max(55, Math.round((w * h) / (14000 * S)))
      for (let i = 0; i < count; i++) {
        const sx = rng() * w
        const sy = rng() * h
        const sr = (0.8 + rng() * 1.6) * S
        ctx.globalAlpha = 0.28 + rng() * 0.65
        ctx.fillStyle = i % 5 === 0 ? '#ffd98e' : '#f7ebd2'
        if (i % 7 === 0) {
          // 4-point star
          const arm = sr * 2.2
          ctx.beginPath()
          ctx.moveTo(sx, sy - arm)
          ctx.lineTo(sx + sr * 0.45, sy - sr * 0.45)
          ctx.lineTo(sx + arm, sy)
          ctx.lineTo(sx + sr * 0.45, sy + sr * 0.45)
          ctx.lineTo(sx, sy + arm)
          ctx.lineTo(sx - sr * 0.45, sy + sr * 0.45)
          ctx.lineTo(sx - arm, sy)
          ctx.lineTo(sx - sr * 0.45, sy - sr * 0.45)
          ctx.closePath()
          ctx.fill()
        } else {
          ctx.beginPath()
          ctx.arc(sx, sy, sr * 0.65, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      ctx.restore()
      break
    }
    case 'kraft': {
      ctx.fillStyle = theme.bgPrimary
      ctx.fillRect(0, 0, w, h)
      const vg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.78)
      vg.addColorStop(0, 'rgba(255,248,235,0.06)')
      vg.addColorStop(1, 'rgba(65,38,14,0.16)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, w, h)

      ctx.save()
      for (let i = 0; i < 4500; i++) {
        ctx.globalAlpha = 0.04 + rng() * 0.05
        ctx.fillStyle = rng() > 0.45 ? '#4a2e12' : '#f5e6cc'
        const px = rng() * w
        const py = rng() * h
        ctx.fillRect(px, py, (1 + rng() * 2) * S, 1 * S)
      }
      ctx.restore()
      break
    }
    case 'paper':
    default: {
      ctx.fillStyle = theme.bgPrimary
      ctx.fillRect(0, 0, w, h)
      const vg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.75)
      vg.addColorStop(0, 'rgba(245,240,232,0)')
      vg.addColorStop(1, theme.isDark ? 'rgba(0,0,0,0.2)' : 'rgba(130,90,30,0.12)')
      ctx.fillStyle = vg
      ctx.fillRect(0, 0, w, h)

      ctx.save()
      ctx.globalAlpha = 0.018
      for (let i = 0; i < 6500; i++) {
        ctx.fillStyle = rng() > 0.5 ? '#000' : '#fff'
        ctx.fillRect(rng() * w, rng() * h, 1, 1)
      }
      ctx.restore()
      break
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO DRAW HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Draw photo with configurable frame style and shadow */
export function drawPhotoFramed(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  filter: FilterType,
  x: number, y: number, w: number, h: number,
  bw = 5 * S,
  transform?: PhotoTransform,
  borderStyle: StripBorderStyle = 'classic',
  frameColor = '#ffffff'
) {
  const radius = borderStyle === 'rounded' ? 8 * S : 0

  if (borderStyle !== 'none' && bw > 0) {
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.22)'
    ctx.shadowBlur = 10 * S
    ctx.shadowOffsetY = 3 * S
    ctx.fillStyle = frameColor
    if (radius > 0) {
      roundedRect(ctx, x - bw, y - bw, w + bw * 2, h + bw * 2, radius + bw * 0.4)
      ctx.fill()
    } else {
      ctx.fillRect(x - bw, y - bw, w + bw * 2, h + bw * 2)
    }
    ctx.restore()
  }

  ctx.save()
  if (radius > 0) {
    roundedRect(ctx, x, y, w, h, radius)
  } else {
    ctx.beginPath()
    ctx.rect(x, y, w, h)
  }
  ctx.clip()
  drawImageCover(ctx, img, x, y, w, h, transform)
  ctx.restore()

  applyPixelFilter(ctx, filter, x, y, w, h)

  if (borderStyle === 'dashed') {
    ctx.save()
    ctx.strokeStyle = 'rgba(92,61,30,0.38)'
    ctx.lineWidth = 1.4 * S
    ctx.setLineDash([4 * S, 3 * S])
    const inset = bw > 0 ? bw * 0.5 : 3 * S
    ctx.strokeRect(x - inset, y - inset, w + inset * 2, h + inset * 2)
    ctx.restore()
  }
}

/** Draw photo without outer mat (used by classic/filmstrip, still honors rounded/dashed accents) */
export function drawPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  filter: FilterType,
  x: number, y: number, w: number, h: number,
  transform?: PhotoTransform,
  borderStyle: StripBorderStyle = 'classic',
  isDark = true
) {
  const radius = borderStyle === 'rounded' ? 7 * S : 0
  ctx.save()
  if (radius > 0) {
    roundedRect(ctx, x, y, w, h, radius)
  } else {
    ctx.beginPath()
    ctx.rect(x, y, w, h)
  }
  ctx.clip()
  drawImageCover(ctx, img, x, y, w, h, transform)
  ctx.restore()

  applyPixelFilter(ctx, filter, x, y, w, h)

  if (borderStyle === 'dashed') {
    ctx.save()
    ctx.strokeStyle = isDark ? 'rgba(245,240,232,0.45)' : 'rgba(92,61,30,0.4)'
    ctx.lineWidth = 1.2 * S
    ctx.setLineDash([4 * S, 3 * S])
    ctx.strokeRect(x + 2 * S, y + 2 * S, w - 4 * S, h - 4 * S)
    ctx.restore()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function drawStripTitle(ctx: CanvasRenderingContext2D, totalW: number, y: number, theme: StripThemeConfig) {
  ctx.save()
  ctx.fillStyle = theme.titleColor
  ctx.font = `bold ${12 * S}px 'Courier New', monospace`
  ctx.textAlign = 'center'
  ctx.fillText("JELLY'S PHOTOBOOTH", totalW / 2, y)
  ctx.restore()
}

export function drawStripBottom(
  ctx: CanvasRenderingContext2D,
  caption: string,
  showDate: boolean,
  totalW: number,
  startY: number,
  theme: StripThemeConfig
): number {
  let y = startY
  if (caption) {
    y += 18 * S
    ctx.save()
    ctx.fillStyle = theme.captionColor
    ctx.font = `italic ${11 * S}px 'Courier New', monospace`
    ctx.textAlign = 'center'
    ctx.fillText(`"${caption}"`, totalW / 2, y)
    ctx.restore()
    y += 18 * S
  }
  if (showDate) {
    if (!caption) y += 14 * S
    ctx.save()
    ctx.fillStyle = theme.dateColor
    ctx.font = `${9 * S}px 'Courier New', monospace`
    ctx.textAlign = 'center'
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    ctx.fillText(dateStr, totalW / 2, y)
    ctx.restore()
    y += 14 * S
  }
  return y
}

// ─────────────────────────────────────────────────────────────────────────────
// DECORATIONS & STICKERS OVERLAY
// ─────────────────────────────────────────────────────────────────────────────

function drawMiniStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 === 0 ? r : r * 0.45
    const a = (Math.PI / 5) * i - Math.PI / 2
    const px = cx + Math.cos(a) * rad
    const py = cy + Math.sin(a) * rad
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawMiniSparkle(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, color: string) {
  ctx.save()
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(cx, cy - r)
  ctx.lineTo(cx + r * 0.28, cy - r * 0.28)
  ctx.lineTo(cx + r, cy)
  ctx.lineTo(cx + r * 0.28, cy + r * 0.28)
  ctx.lineTo(cx, cy + r)
  ctx.lineTo(cx - r * 0.28, cy + r * 0.28)
  ctx.lineTo(cx - r, cy)
  ctx.lineTo(cx - r * 0.28, cy - r * 0.28)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawMiniHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save()
  ctx.fillStyle = color
  ctx.translate(cx, cy)
  ctx.beginPath()
  const s = size * 0.065
  ctx.moveTo(0, 4 * s)
  ctx.bezierCurveTo(-12 * s, -4 * s, -12 * s, -15 * s, 0, -8 * s)
  ctx.bezierCurveTo(12 * s, -15 * s, 12 * s, -4 * s, 0, 4 * s)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

export function drawStripDecorations(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  decoration: StripDecoration | undefined,
  theme: StripThemeConfig
) {
  if (!decoration || decoration === 'none') return

  const inset = 10 * S
  const accent = theme.isDark ? '#f5d287' : theme.captionColor
  const accentSoft = theme.isDark ? 'rgba(245,210,135,0.65)' : 'rgba(139,105,20,0.55)'

  if (decoration === 'corners') {
    const len = 18 * S
    ctx.save()
    ctx.strokeStyle = accent
    ctx.lineWidth = 2 * S
    ctx.lineCap = 'square'

    // Top-left
    ctx.beginPath(); ctx.moveTo(inset, inset + len); ctx.lineTo(inset, inset); ctx.lineTo(inset + len, inset); ctx.stroke()
    // Top-right
    ctx.beginPath(); ctx.moveTo(w - inset - len, inset); ctx.lineTo(w - inset, inset); ctx.lineTo(w - inset, inset + len); ctx.stroke()
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(inset, h - inset - len); ctx.lineTo(inset, h - inset); ctx.lineTo(inset + len, h - inset); ctx.stroke()
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(w - inset - len, h - inset); ctx.lineTo(w - inset, h - inset); ctx.lineTo(w - inset, h - inset - len); ctx.stroke()

    ctx.restore()
    return
  }

  const corners = [
    { x: inset + 8 * S, y: inset + 8 * S, r: 6.5 * S },
    { x: w - inset - 8 * S, y: inset + 8 * S, r: 6.5 * S },
    { x: inset + 10 * S, y: h - inset - 10 * S, r: 7 * S },
    { x: w - inset - 10 * S, y: h - inset - 10 * S, r: 7 * S },
  ]

  if (decoration === 'stars') {
    corners.forEach((p, idx) => {
      drawMiniStar(ctx, p.x, p.y, p.r, idx % 2 === 0 ? accent : accentSoft)
    })
    drawMiniStar(ctx, inset + 22 * S, inset + 12 * S, 3.2 * S, accentSoft)
    drawMiniStar(ctx, w - inset - 22 * S, h - inset - 14 * S, 3.2 * S, accentSoft)
  } else if (decoration === 'hearts') {
    const heartColor = theme.isDark ? '#f5a3b5' : '#d15c74'
    corners.forEach((p) => {
      drawMiniHeart(ctx, p.x, p.y + 3 * S, 10 * S, heartColor)
    })
  } else if (decoration === 'sparkles') {
    corners.forEach((p) => {
      drawMiniSparkle(ctx, p.x, p.y, p.r * 1.15, accent)
    })
    drawMiniSparkle(ctx, inset + 22 * S, inset + 12 * S, 4 * S, accentSoft)
    drawMiniSparkle(ctx, w - inset - 22 * S, inset + 12 * S, 4 * S, accentSoft)
    drawMiniSparkle(ctx, inset + 22 * S, h - inset - 12 * S, 4 * S, accentSoft)
    drawMiniSparkle(ctx, w - inset - 22 * S, h - inset - 12 * S, 4 * S, accentSoft)
  }
}

export async function drawPlacedStickers(
  ctx: CanvasRenderingContext2D,
  stickers: PlacedSticker[],
  w: number,
  h: number
) {
  if (!stickers.length) return
  const uniqueSrcs = Array.from(new Set(stickers.map((s) => s.src)))
  const imageMap = new Map<string, HTMLImageElement>()

  await Promise.all(
    uniqueSrcs.map(async (src) => {
      try {
        const img = await loadImage(src)
        imageMap.set(src, img)
      } catch {
        // Ignore broken sticker URLs so export still completes
      }
    })
  )

  const baseDim = Math.min(w, h) * 0.18

  for (const sticker of stickers) {
    const img = imageMap.get(sticker.src)
    if (!img) continue

    const nw = img.naturalWidth || 256
    const nh = img.naturalHeight || 256
    const aspect = nw / nh
    const boxDim = baseDim * Math.max(0.3, Math.min(3, sticker.scale))

    let drawW: number
    let drawH: number
    if (aspect >= 1) {
      drawW = boxDim
      drawH = boxDim / aspect
    } else {
      drawH = boxDim
      drawW = boxDim * aspect
    }

    ctx.save()
    ctx.translate(sticker.x * w, sticker.y * h)
    ctx.rotate((sticker.rotation * Math.PI) / 180)
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.restore()
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT GENERATORS
// ─────────────────────────────────────────────────────────────────────────────

// ── CLASSIC STRIP ─────────────────────────────────────────────────────────────
async function generateClassic(
  session: PhotoSession,
  canvas: HTMLCanvasElement,
  theme: StripThemeConfig,
  landscape = false
) {
  const imgs = await Promise.all(session.photos.map(loadImage))
  const n = imgs.length
  const stripPad = 14 * S
  const titleH = 28 * S
  const captionH = (session.caption ? 34 * S : 0) + (session.showDate ? 28 * S : 0)
  const borderStyle = session.borderStyle ?? 'classic'

  const photoW = landscape ? 280 * S : 200 * S
  const photoH = landscape ? 160 * S : 150 * S
  const photoGap = 6 * S
  const bottomPad = 16 * S

  let totalW: number, totalH: number

  if (landscape) {
    totalW = stripPad * 2 + n * photoW + (n - 1) * photoGap
    totalH = stripPad + titleH + photoH + bottomPad + captionH + stripPad
  } else {
    totalW = stripPad * 2 + photoW
    totalH = stripPad + titleH + n * (photoH + photoGap) - photoGap + bottomPad + captionH + stripPad
  }

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  drawThemeBackground(ctx, totalW, totalH, theme)

  // Title
  ctx.save()
  ctx.fillStyle = theme.titleColor
  ctx.font = `bold ${10 * S}px 'Courier New', monospace`
  ctx.textAlign = 'center'
  ctx.fillText("JELLY'S PHOTOBOOTH", totalW / 2, stripPad + titleH * 0.7)
  ctx.restore()

  // Decorative title line
  ctx.save()
  ctx.strokeStyle = theme.dividerColor; ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(stripPad, stripPad + titleH + 2)
  ctx.lineTo(totalW - stripPad, stripPad + titleH + 2)
  ctx.stroke()
  ctx.restore()

  // Photos
  imgs.forEach((img, i) => {
    let x: number, y: number
    if (landscape) {
      x = stripPad + i * (photoW + photoGap)
      y = stripPad + titleH
    } else {
      x = stripPad
      y = stripPad + titleH + i * (photoH + photoGap)
    }
    drawPhoto(ctx, img, session.filter, x, y, photoW, photoH, session.photoTransforms?.[i], borderStyle, theme.isDark)

    // Thin dividers
    if (i < n - 1) {
      ctx.save()
      ctx.strokeStyle = theme.dividerColor; ctx.lineWidth = 1
      ctx.beginPath()
      if (landscape) {
        const divX = x + photoW + photoGap / 2
        ctx.moveTo(divX, stripPad + titleH); ctx.lineTo(divX, stripPad + titleH + photoH)
      } else {
        const divY = y + photoH + photoGap / 2
        ctx.moveTo(x, divY); ctx.lineTo(x + photoW, divY)
      }
      ctx.stroke(); ctx.restore()
    }
  })

  const captionStartY = landscape
    ? stripPad + titleH + photoH + bottomPad
    : stripPad + titleH + n * (photoH + photoGap) - photoGap + bottomPad

  // Decorative caption line
  ctx.save()
  ctx.strokeStyle = theme.dividerColor; ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(stripPad, captionStartY - 8 * S)
  ctx.lineTo(totalW - stripPad, captionStartY - 8 * S)
  ctx.stroke()
  ctx.restore()

  drawStripBottom(ctx, session.caption, session.showDate, totalW, captionStartY, theme)
}

// ── FILM STRIP ────────────────────────────────────────────────────────────────
async function generateFilmstrip(
  session: PhotoSession,
  canvas: HTMLCanvasElement,
  theme: StripThemeConfig,
  landscape = false
) {
  const imgs = await Promise.all(session.photos.map(loadImage))
  const n = imgs.length
  const sprocketW = 22 * S
  const innerPad = 8 * S
  const holeW = 12 * S
  const holeH = 16 * S
  const holeSpacing = holeH + 7 * S
  const titleH = 22 * S
  const topPad = 14 * S
  const photoGap = 5 * S
  const captionH = (session.caption ? 32 * S : 0) + (session.showDate ? 24 * S : 0)
  const borderStyle = session.borderStyle ?? 'classic'
  const isDefaultTheme = (session.stripTheme ?? 'auto') === 'auto'

  if (landscape) {
    const photoW = 240 * S
    const photoH = 160 * S
    const totalW = topPad + titleH + n * (photoW + photoGap) - photoGap + 20 * S + captionH + 20 * S
    const totalH = sprocketW * 2 + photoH + innerPad * 2

    canvas.width = totalW; canvas.height = totalH
    const ctx = canvas.getContext('2d')!

    drawThemeBackground(ctx, totalW, totalH, theme)
    ctx.fillStyle = isDefaultTheme ? '#1a1208' : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(92,61,30,0.09)')
    ctx.fillRect(0, sprocketW, totalW, photoH + innerPad * 2)

    const holeYT = Math.floor((sprocketW - holeW) / 2)
    const holeYB = sprocketW + photoH + innerPad * 2 + Math.floor((sprocketW - holeW) / 2)
    const holesCount = Math.ceil(totalW / holeSpacing) + 2
    for (let i = 0; i < holesCount; i++) {
      const hx = i * holeSpacing + 6 * S
      ctx.fillStyle = isDefaultTheme || theme.isDark ? '#050403' : 'rgba(40,26,12,0.72)'
      roundedRect(ctx, hx, holeYT, holeH, holeW, 2 * S); ctx.fill()
      roundedRect(ctx, hx, holeYB, holeH, holeW, 2 * S); ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
      roundedRect(ctx, hx, holeYT, holeH, holeW, 2 * S); ctx.stroke()
      roundedRect(ctx, hx, holeYB, holeH, holeW, 2 * S); ctx.stroke()
    }

    ctx.save()
    ctx.fillStyle = theme.titleColor
    ctx.font = `bold ${9 * S}px 'Courier New', monospace`
    ctx.textAlign = 'center'
    ctx.fillText("JELLY'S PHOTOBOOTH", totalW / 2, topPad + titleH * 0.65)
    ctx.restore()

    const photoY = sprocketW + innerPad
    imgs.forEach((img, i) => {
      const photoX = topPad + titleH + i * (photoW + photoGap)
      drawPhoto(ctx, img, session.filter, photoX, photoY, photoW, photoH, session.photoTransforms?.[i], borderStyle, theme.isDark)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
      ctx.strokeRect(photoX, photoY, photoW, photoH)
      ctx.save()
      ctx.fillStyle = 'rgba(245,235,215,0.65)'
      ctx.font = `${7 * S}px 'Courier New', monospace`
      ctx.textAlign = 'left'
      ctx.fillText(String(i + 1).padStart(2, '0'), photoX + 3 * S, photoY + photoH - 3 * S)
      ctx.restore()
    })

    let cy = topPad + titleH + n * (photoW + photoGap) - photoGap + 16 * S
    if (session.caption) {
      cy += 14 * S
      ctx.save(); ctx.fillStyle = theme.captionColor; ctx.font = `italic ${10 * S}px Georgia, serif`; ctx.textAlign = 'center'
      ctx.fillText(`"${session.caption}"`, totalW / 2, cy); ctx.restore(); cy += 18 * S
    }
    if (session.showDate) {
      ctx.save(); ctx.fillStyle = theme.dateColor; ctx.font = `${8 * S}px 'Courier New', monospace`; ctx.textAlign = 'center'
      ctx.fillText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), totalW / 2, cy); ctx.restore()
    }
  } else {
    const photoW = 220 * S
    const photoH = 165 * S
    const totalW = sprocketW * 2 + photoW + innerPad * 2
    const totalH = topPad + titleH + n * (photoH + photoGap) - photoGap + 20 * S + captionH + 20 * S

    canvas.width = totalW; canvas.height = totalH
    const ctx = canvas.getContext('2d')!

    drawThemeBackground(ctx, totalW, totalH, theme)
    ctx.fillStyle = isDefaultTheme ? '#1a1208' : (theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(92,61,30,0.09)')
    ctx.fillRect(sprocketW, 0, photoW + innerPad * 2, totalH)

    const holeXL = Math.floor((sprocketW - holeW) / 2)
    const holeXR = sprocketW + photoW + innerPad * 2 + Math.floor((sprocketW - holeW) / 2)
    const holesCount = Math.ceil(totalH / holeSpacing) + 2
    for (let i = 0; i < holesCount; i++) {
      const hy = i * holeSpacing + 6 * S
      ctx.fillStyle = isDefaultTheme || theme.isDark ? '#050403' : 'rgba(40,26,12,0.72)'
      roundedRect(ctx, holeXL, hy, holeW, holeH, 2 * S); ctx.fill()
      roundedRect(ctx, holeXR, hy, holeW, holeH, 2 * S); ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
      roundedRect(ctx, holeXL, hy, holeW, holeH, 2 * S); ctx.stroke()
      roundedRect(ctx, holeXR, hy, holeW, holeH, 2 * S); ctx.stroke()
    }

    ctx.save()
    ctx.fillStyle = theme.titleColor
    ctx.font = `bold ${9 * S}px 'Courier New', monospace`
    ctx.textAlign = 'center'
    ctx.fillText("JELLY'S PHOTOBOOTH", totalW / 2, topPad + titleH * 0.65)
    ctx.restore()

    const photoX = sprocketW + innerPad
    imgs.forEach((img, i) => {
      const photoY = topPad + titleH + i * (photoH + photoGap)
      drawPhoto(ctx, img, session.filter, photoX, photoY, photoW, photoH, session.photoTransforms?.[i], borderStyle, theme.isDark)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
      ctx.strokeRect(photoX, photoY, photoW, photoH)
      ctx.save()
      ctx.fillStyle = 'rgba(245,235,215,0.65)'
      ctx.font = `${7 * S}px 'Courier New', monospace`
      ctx.textAlign = 'left'
      ctx.fillText(String(i + 1).padStart(2, '0'), photoX + 3 * S, photoY + photoH - 3 * S)
      ctx.restore()
    })

    let cy = topPad + titleH + n * (photoH + photoGap) - photoGap + 16 * S
    if (session.caption) {
      cy += 14 * S
      ctx.save(); ctx.fillStyle = theme.captionColor; ctx.font = `italic ${10 * S}px Georgia, serif`; ctx.textAlign = 'center'
      ctx.fillText(`"${session.caption}"`, totalW / 2, cy); ctx.restore(); cy += 18 * S
    }
    if (session.showDate) {
      ctx.save(); ctx.fillStyle = theme.dateColor; ctx.font = `${8 * S}px 'Courier New', monospace`; ctx.textAlign = 'center'
      ctx.fillText(new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), totalW / 2, cy); ctx.restore()
    }
  }
}

// ── DUO STRIP ─────────────────────────────────────────────────────────────────
async function generateTwostrip(
  session: PhotoSession,
  canvas: HTMLCanvasElement,
  theme: StripThemeConfig,
  landscape = false
) {
  const imgs = await Promise.all(session.photos.slice(0, 2).map(loadImage))
  const pad = 20 * S, gap = 12 * S, bw = 5 * S
  const titleH = 26 * S
  const captionH = (session.caption ? 34 * S : 0) + (session.showDate ? 24 * S : 0)
  const borderStyle = session.borderStyle ?? 'classic'

  if (landscape) {
    const photoW = 380 * S, photoH = 214 * S
    const totalW = pad * 2 + photoW + bw * 2
    const totalH = pad + titleH + photoH * 2 + bw * 4 + gap + captionH + pad

    canvas.width = totalW; canvas.height = totalH
    const ctx = canvas.getContext('2d')!
    drawThemeBackground(ctx, totalW, totalH, theme)
    drawStripTitle(ctx, totalW, pad + titleH * 0.7, theme)
    imgs.forEach((img, i) => {
      const x = pad + bw
      const y = pad + titleH + bw + i * (photoH + bw * 2 + gap)
      drawPhotoFramed(ctx, img, session.filter, x, y, photoW, photoH, bw, session.photoTransforms?.[i], borderStyle, theme.frameColor)
    })
    drawStripBottom(ctx, session.caption, session.showDate, totalW, pad + titleH + photoH * 2 + bw * 4 + gap, theme)
  } else {
    const photoW = 220 * S, photoH = 310 * S
    const totalW = pad * 2 + photoW * 2 + bw * 4 + gap
    const totalH = pad + titleH + photoH + bw * 2 + captionH + pad

    canvas.width = totalW; canvas.height = totalH
    const ctx = canvas.getContext('2d')!
    drawThemeBackground(ctx, totalW, totalH, theme)
    drawStripTitle(ctx, totalW, pad + titleH * 0.7, theme)
    imgs.forEach((img, i) => {
      const x = pad + bw + i * (photoW + bw * 2 + gap)
      const y = pad + titleH + bw
      drawPhotoFramed(ctx, img, session.filter, x, y, photoW, photoH, bw, session.photoTransforms?.[i], borderStyle, theme.frameColor)
    })
    drawStripBottom(ctx, session.caption, session.showDate, totalW, pad + titleH + photoH + bw * 2, theme)
  }
}

// ── TRIPLE STRIP ──────────────────────────────────────────────────────────────
async function generateThreestrip(
  session: PhotoSession,
  canvas: HTMLCanvasElement,
  theme: StripThemeConfig,
  landscape = false
) {
  const imgs = await Promise.all(session.photos.slice(0, 3).map(loadImage))
  const pad = 20 * S, gap = 10 * S, bw = 5 * S
  const titleH = 26 * S
  const captionH = (session.caption ? 34 * S : 0) + (session.showDate ? 24 * S : 0)
  const borderStyle = session.borderStyle ?? 'classic'

  if (landscape) {
    const photoW = 380 * S, photoH = 180 * S
    const totalW = pad * 2 + photoW + bw * 2
    const totalH = pad + titleH + photoH * 3 + bw * 6 + gap * 2 + captionH + pad

    canvas.width = totalW; canvas.height = totalH
    const ctx = canvas.getContext('2d')!
    drawThemeBackground(ctx, totalW, totalH, theme)
    drawStripTitle(ctx, totalW, pad + titleH * 0.7, theme)
    imgs.forEach((img, i) => {
      const x = pad + bw
      const y = pad + titleH + bw + i * (photoH + bw * 2 + gap)
      drawPhotoFramed(ctx, img, session.filter, x, y, photoW, photoH, bw, session.photoTransforms?.[i], borderStyle, theme.frameColor)
    })
    drawStripBottom(ctx, session.caption, session.showDate, totalW, pad + titleH + photoH * 3 + bw * 6 + gap * 2, theme)
  } else {
    const photoW = 160 * S, photoH = 248 * S
    const totalW = pad * 2 + photoW * 3 + bw * 6 + gap * 2
    const totalH = pad + titleH + photoH + bw * 2 + captionH + pad

    canvas.width = totalW; canvas.height = totalH
    const ctx = canvas.getContext('2d')!
    drawThemeBackground(ctx, totalW, totalH, theme)
    drawStripTitle(ctx, totalW, pad + titleH * 0.7, theme)
    imgs.forEach((img, i) => {
      const x = pad + bw + i * (photoW + bw * 2 + gap)
      const y = pad + titleH + bw
      drawPhotoFramed(ctx, img, session.filter, x, y, photoW, photoH, bw, session.photoTransforms?.[i], borderStyle, theme.frameColor)
    })
    drawStripBottom(ctx, session.caption, session.showDate, totalW, pad + titleH + photoH + bw * 2, theme)
  }
}

// ── LAYOUT H — 1 large + 2 small right column ─────────────────────────────────
async function generateLayoutH(session: PhotoSession, canvas: HTMLCanvasElement, theme: StripThemeConfig) {
  const imgs = await Promise.all(session.photos.slice(0, 3).map(loadImage))
  const pad = 24 * S, gap = 10 * S, bw = 5 * S
  const titleH = 28 * S
  const captionH = (session.caption ? 36 * S : 0) + (session.showDate ? 26 * S : 0)
  const bigW = 280 * S, bigH = 210 * S
  const smallW = 160 * S, smallH = (bigH - gap) / 2
  const totalW = pad + bigW + bw * 2 + gap + smallW + bw * 2 + pad
  const totalH = pad + titleH + bigH + bw * 2 + captionH + pad
  const borderStyle = session.borderStyle ?? 'classic'

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  drawThemeBackground(ctx, totalW, totalH, theme)
  drawStripTitle(ctx, totalW, pad + titleH * 0.7, theme)
  drawPhotoFramed(ctx, imgs[0], session.filter, pad + bw, pad + titleH + bw, bigW, bigH, bw, session.photoTransforms?.[0], borderStyle, theme.frameColor)
  const rx = pad + bigW + bw * 2 + gap + bw
  drawPhotoFramed(ctx, imgs[1], session.filter, rx, pad + titleH + bw, smallW, smallH, bw, session.photoTransforms?.[1], borderStyle, theme.frameColor)
  drawPhotoFramed(ctx, imgs[2], session.filter, rx, pad + titleH + bw + smallH + gap + bw * 2, smallW, smallH, bw, session.photoTransforms?.[2], borderStyle, theme.frameColor)
  drawStripBottom(ctx, session.caption, session.showDate, totalW, pad + titleH + bigH + bw * 2, theme)
}

// ── 2×2 GRID ──────────────────────────────────────────────────────────────────
async function generateGrid4(
  session: PhotoSession,
  canvas: HTMLCanvasElement,
  theme: StripThemeConfig,
  landscape = false
) {
  const imgs = await Promise.all(session.photos.slice(0, 4).map(loadImage))
  const pad = 24 * S
  const bw = landscape ? 0 : 5 * S
  const gap = landscape ? 0 : 12 * S
  const borderStyle = session.borderStyle ?? 'classic'

  const titleH = 28 * S
  const captionH = (session.caption ? 36 * S : 0) + (session.showDate ? 26 * S : 0)

  const photoW = landscape ? 280 * S : 220 * S
  const photoH = landscape ? 190 * S : 165 * S

  const totalW = pad * 2 + photoW * 2 + bw * 4 + gap
  const totalH = pad + titleH + photoH * 2 + bw * 4 + gap + captionH + pad

  canvas.width = totalW
  canvas.height = totalH
  const ctx = canvas.getContext('2d')!

  drawThemeBackground(ctx, totalW, totalH, theme)
  drawStripTitle(ctx, totalW, pad + titleH * 0.7, theme)

  imgs.forEach((img, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const x = pad + bw + col * (photoW + bw * 2 + gap)
    const y = pad + titleH + bw + row * (photoH + bw * 2 + gap)
    if (bw === 0) {
      drawPhoto(ctx, img, session.filter, x, y, photoW, photoH, session.photoTransforms?.[i], borderStyle, theme.isDark)
    } else {
      drawPhotoFramed(ctx, img, session.filter, x, y, photoW, photoH, bw, session.photoTransforms?.[i], borderStyle, theme.frameColor)
    }
  })

  drawStripBottom(
    ctx,
    session.caption,
    session.showDate,
    totalW,
    pad + titleH + photoH * 2 + bw * 4 + gap,
    theme
  )
}

// ── LAYOUT E — 1 large left + 3 stacked right ─────────────────────────────────
async function generateLayoutE(session: PhotoSession, canvas: HTMLCanvasElement, theme: StripThemeConfig) {
  const imgs = await Promise.all(session.photos.slice(0, 4).map(loadImage))
  const pad = 24 * S, gap = 8 * S, bw = 5 * S
  const titleH = 28 * S
  const captionH = (session.caption ? 36 * S : 0) + (session.showDate ? 26 * S : 0)
  const bigH = 310 * S, bigW = 330 * S
  const smallW = 150 * S, smallH = (bigH - gap * 4.5) / 3
  const totalW = pad + bigW + bw * 2 + gap + smallW + bw * 2 + pad
  const totalH = pad + titleH + bigH + bw * 2 + captionH + pad
  const borderStyle = session.borderStyle ?? 'classic'

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  drawThemeBackground(ctx, totalW, totalH, theme)
  drawStripTitle(ctx, totalW, pad + titleH * 0.7, theme)
  drawPhotoFramed(ctx, imgs[0], session.filter, pad + bw, pad + titleH + bw, bigW, bigH, bw, session.photoTransforms?.[0], borderStyle, theme.frameColor)
  const rx = pad + bigW + bw * 2 + gap + bw
  for (let i = 0; i < 3; i++) {
    const y = pad + titleH + bw + i * (smallH + gap + bw * 2)
    drawPhotoFramed(ctx, imgs[i + 1], session.filter, rx, y, smallW, smallH, bw, session.photoTransforms?.[i + 1], borderStyle, theme.frameColor)
  }
  drawStripBottom(ctx, session.caption, session.showDate, totalW, pad + titleH + bigH + bw * 2, theme)
}

// ── LAYOUT 9 — 1 large top + 3 across bottom ──────────────────────────────────
async function generateLayout9(session: PhotoSession, canvas: HTMLCanvasElement, theme: StripThemeConfig) {
  const imgs = await Promise.all(session.photos.slice(0, 4).map(loadImage))
  const pad = 24 * S, gap = 10 * S, bw = 5 * S
  const titleH = 28 * S
  const captionH = (session.caption ? 36 * S : 0) + (session.showDate ? 26 * S : 0)
  const bigW = 480 * S, bigH = 320 * S
  const smallH = 130 * S
  const totalW = pad + bigW + bw * 2 + pad
  const smallW = (totalW - pad * 2 - bw * 6 - gap * 2) / 3
  const totalH = pad + titleH + bigH + bw * 2 + gap + smallH + bw * 2 + captionH + pad
  const borderStyle = session.borderStyle ?? 'classic'

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  drawThemeBackground(ctx, totalW, totalH, theme)
  drawStripTitle(ctx, totalW, pad + titleH * 0.7, theme)
  drawPhotoFramed(ctx, imgs[0], session.filter, pad + bw, pad + titleH + bw, bigW, bigH, bw, session.photoTransforms?.[0], borderStyle, theme.frameColor)
  const rowY = pad + titleH + bigH + bw * 2 + gap + bw
  for (let i = 0; i < 3; i++) {
    const x = pad + bw + i * (smallW + bw * 2 + gap)
    drawPhotoFramed(ctx, imgs[i + 1], session.filter, x, rowY, smallW, smallH, bw, session.photoTransforms?.[i + 1], borderStyle, theme.frameColor)
  }
  drawStripBottom(ctx, session.caption, session.showDate, totalW, pad + titleH + bigH + bw * 2 + gap + smallH + bw * 2, theme)
}

// ── LAYOUT 3 — 3 cols × 2 rows ────────────────────────────────────────────────
async function generateLayout3(
  session: PhotoSession,
  canvas: HTMLCanvasElement,
  theme: StripThemeConfig,
  landscape = false
) {
  const imgs = await Promise.all(session.photos.slice(0, 6).map(loadImage))
  const pad = 24 * S, gap = 10 * S, bw = 5 * S
  const titleH = 28 * S
  const photoW = landscape ? 210 * S : 175 * S
  const photoH = landscape ? 158 * S : 132 * S
  const captionH = (session.caption ? 36 * S : 0) + (session.showDate ? 26 * S : 0)
  const totalW = pad * 2 + photoW * 3 + bw * 6 + gap * 2
  const totalH = pad + titleH + photoH * 2 + bw * 4 + gap + captionH + pad
  const borderStyle = session.borderStyle ?? 'classic'

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  drawThemeBackground(ctx, totalW, totalH, theme)
  drawStripTitle(ctx, totalW, pad + titleH * 0.7, theme)
  imgs.forEach((img, i) => {
    const col = i % 3, row = Math.floor(i / 3)
    const x = pad + bw + col * (photoW + bw * 2 + gap)
    const y = pad + titleH + bw + row * (photoH + bw * 2 + gap)
    drawPhotoFramed(ctx, img, session.filter, x, y, photoW, photoH, bw, session.photoTransforms?.[i], borderStyle, theme.frameColor)
  })
  drawStripBottom(ctx, session.caption, session.showDate, totalW, pad + titleH + photoH * 2 + bw * 4 + gap, theme)
}

// ── GRID 6 — 2 cols × 3 rows ──────────────────────────────────────────────────
async function generateGrid6(session: PhotoSession, canvas: HTMLCanvasElement, theme: StripThemeConfig) {
  const imgs = await Promise.all(session.photos.slice(0, 6).map(loadImage))
  const pad = 24 * S, gap = 10 * S, bw = 5 * S
  const titleH = 28 * S
  const photoW = 220 * S, photoH = 165 * S
  const captionH = (session.caption ? 36 * S : 0) + (session.showDate ? 26 * S : 0)
  const totalW = pad * 2 + photoW * 2 + bw * 4 + gap
  const totalH = pad + titleH + photoH * 3 + bw * 6 + gap * 2 + captionH + pad
  const borderStyle = session.borderStyle ?? 'classic'

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  drawThemeBackground(ctx, totalW, totalH, theme)
  drawStripTitle(ctx, totalW, pad + titleH * 0.7, theme)
  imgs.forEach((img, i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const x = pad + bw + col * (photoW + bw * 2 + gap)
    const y = pad + titleH + bw + row * (photoH + bw * 2 + gap)
    drawPhotoFramed(ctx, img, session.filter, x, y, photoW, photoH, bw, session.photoTransforms?.[i], borderStyle, theme.frameColor)
  })
  drawStripBottom(ctx, session.caption, session.showDate, totalW, pad + titleH + photoH * 3 + bw * 6 + gap * 2, theme)
}

// ── POLAROID ──────────────────────────────────────────────────────────────────
async function generatePolaroid(session: PhotoSession, canvas: HTMLCanvasElement, theme: StripThemeConfig) {
  const imgs = await Promise.all(session.photos.map(loadImage))
  const n = imgs.length
  const borderStyle = session.borderStyle ?? 'classic'

  const photoW = 200 * S
  const photoH = 150 * S

  const frameTop = 10 * S
  const frameSide = 10 * S
  const frameBottom = 44 * S
  const frameW = photoW + frameSide * 2
  const frameH = photoH + frameTop + frameBottom

  const cols = n <= 3 ? 1 : 2
  const rows = Math.ceil(n / cols)

  const pad = 40 * S
  const gap = 28 * S
  const titleH = 32 * S
  const captionH = (session.caption ? 40 * S : 0) + (session.showDate ? 28 * S : 0)
  const overflow = 28 * S

  const totalW = pad * 2 + cols * frameW + (cols - 1) * gap + overflow * 2
  const totalH = pad + titleH + rows * frameH + (rows - 1) * gap + captionH + pad + overflow

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!

  drawThemeBackground(ctx, totalW, totalH, theme)
  drawStripTitle(ctx, totalW, pad + titleH * 0.7, theme)

  const angles = [-2.5, 2.2, -1.8, 2.8]
  const startX = overflow + pad + (totalW - overflow * 2 - pad * 2 - cols * frameW - (cols - 1) * gap) / 2
  const polaroidCardColor = theme.frameColor || '#fefefe'

  imgs.forEach((img, i) => {
    const col = n <= 3 ? 0 : i % cols
    const row = n <= 3 ? i : Math.floor(i / cols)

    const bx = startX + col * (frameW + gap)
    const by = pad + titleH + row * (frameH + gap)
    const cx = bx + frameW / 2
    const cy = by + frameH / 2
    const angle = (angles[i % angles.length] * Math.PI) / 180

    const off = document.createElement('canvas')
    off.width = frameW + 24 * S
    off.height = frameH + 24 * S
    const oc = off.getContext('2d')!

    const ox = 12 * S, oy = 12 * S
    const cardRadius = borderStyle === 'rounded' ? 8 * S : 0

    // Shadow
    if (borderStyle !== 'none') {
      oc.save()
      oc.shadowColor = 'rgba(0,0,0,0.28)'; oc.shadowBlur = 20 * S; oc.shadowOffsetY = 7 * S
      oc.fillStyle = polaroidCardColor
      if (cardRadius > 0) { roundedRect(oc, ox, oy, frameW, frameH, cardRadius); oc.fill() }
      else { oc.fillRect(ox, oy, frameW, frameH) }
      oc.restore()
    }

    // Card body
    oc.fillStyle = polaroidCardColor
    if (cardRadius > 0) { roundedRect(oc, ox, oy, frameW, frameH, cardRadius); oc.fill() }
    else { oc.fillRect(ox, oy, frameW, frameH) }

    if (borderStyle === 'dashed') {
      oc.save()
      oc.strokeStyle = 'rgba(92,61,30,0.35)'
      oc.lineWidth = 1.2 * S
      oc.setLineDash([4 * S, 3 * S])
      oc.strokeRect(ox + 3 * S, oy + 3 * S, frameW - 6 * S, frameH - 6 * S)
      oc.restore()
    }

    // Photo inside
    oc.save()
    if (borderStyle === 'rounded') {
      roundedRect(oc, ox + frameSide, oy + frameTop, photoW, photoH, 5 * S)
    } else {
      oc.beginPath()
      oc.rect(ox + frameSide, oy + frameTop, photoW, photoH)
    }
    oc.clip()
    drawImageCover(oc, img, ox + frameSide, oy + frameTop, photoW, photoH, session.photoTransforms?.[i])
    oc.restore()
    applyPixelFilter(oc, session.filter, ox + frameSide, oy + frameTop, photoW, photoH)

    oc.save()
    oc.strokeStyle = 'rgba(0,0,0,0.08)'; oc.lineWidth = 1
    oc.strokeRect(ox + frameSide, oy + frameTop, photoW, photoH)
    oc.restore()

    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    ctx.drawImage(off, -(frameW / 2 + 12 * S), -(frameH / 2 + 12 * S))
    ctx.restore()
  })

  const bottomY = pad + titleH + rows * frameH + (rows - 1) * gap + overflow / 2
  drawStripBottom(ctx, session.caption, session.showDate, totalW, bottomY, theme)
}

// ── DIAGONAL ──────────────────────────────────────────────────────────────────
async function generateDiagonal(session: PhotoSession, canvas: HTMLCanvasElement, theme: StripThemeConfig) {
  const imgs = await Promise.all(session.photos.map(loadImage))
  const n = imgs.length
  const photoW = 260 * S, photoH = 195 * S, bw = 5 * S
  const pad = 32 * S, titleH = 30 * S
  const offset = 32 * S, overlap = 20 * S
  const captionH = (session.caption ? 40 * S : 0) + (session.showDate ? 26 * S : 0)
  const totalW = pad * 2 + photoW + bw * 2 + offset
  const rowH = photoH + bw * 2 - overlap
  const totalH = pad + titleH + n * rowH + overlap + captionH + pad
  const borderStyle = session.borderStyle ?? 'classic'

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  drawThemeBackground(ctx, totalW, totalH, theme)
  drawStripTitle(ctx, totalW, pad + titleH * 0.7, theme)

  imgs.forEach((img, i) => {
    const isRight = i % 2 === 1
    const x = pad + bw + (isRight ? offset : 0)
    const y = pad + titleH + bw + i * rowH
    drawPhotoFramed(ctx, img, session.filter, x, y, photoW, photoH, bw, session.photoTransforms?.[i], borderStyle, theme.frameColor)
  })

  drawStripBottom(ctx, session.caption, session.showDate, totalW, pad + titleH + n * rowH + overlap + bw, theme)
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export async function generatePhotoboothCanvas(
  session: PhotoSession,
  layoutOverride?: LayoutType,
  options?: { includeStickers?: boolean }
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  const layout = layoutOverride ?? session.layout
  const theme = resolveEffectiveTheme(session, layout)

  switch (layout) {
    case 'classic':           await generateClassic(session, canvas, theme, false); break
    case 'classic_land':      await generateClassic(session, canvas, theme, true); break
    case 'filmstrip':         await generateFilmstrip(session, canvas, theme, false); break
    case 'filmstrip_land':    await generateFilmstrip(session, canvas, theme, true); break
    case 'twostrip':          await generateTwostrip(session, canvas, theme, false); break
    case 'twostrip_land':     await generateTwostrip(session, canvas, theme, true); break
    case 'threestrip':        await generateThreestrip(session, canvas, theme, false); break
    case 'threestrip_land':   await generateThreestrip(session, canvas, theme, true); break
    case 'layout_h':          await generateLayoutH(session, canvas, theme); break
    case 'grid_4':            await generateGrid4(session, canvas, theme, false); break
    case 'grid_4_land':       await generateGrid4(session, canvas, theme, true); break
    case 'layout_e':          await generateLayoutE(session, canvas, theme); break
    case 'layout_9':          await generateLayout9(session, canvas, theme); break
    case 'layout_3':          await generateLayout3(session, canvas, theme, false); break
    case 'layout_3_land':     await generateLayout3(session, canvas, theme, true); break
    case 'grid_6':            await generateGrid6(session, canvas, theme); break
    case 'polaroid_2':
    case 'polaroid_3':
    case 'polaroid_4':        await generatePolaroid(session, canvas, theme); break
    case 'diagonal_2':
    case 'diagonal_3':
    case 'diagonal_4':        await generateDiagonal(session, canvas, theme); break
    default:                  await generateClassic(session, canvas, theme, false); break
  }

  const ctx = canvas.getContext('2d')!
  drawStripDecorations(ctx, canvas.width, canvas.height, session.stripDecoration, theme)

  if ((options?.includeStickers ?? true) && session.stickers?.length) {
    await drawPlacedStickers(ctx, session.stickers, canvas.width, canvas.height)
  }

  return canvas
}

export async function downloadPhoto(session: PhotoSession, format: 'print' | 'social' = 'print') {
  const canvas = await generatePhotoboothCanvas(session)
  const dateStr = new Date().toISOString().split('T')[0]
  const fileName = `jellybooth_${dateStr}(for_${format}).png`

  if (format === 'social') {
    const socialW = 1080, socialH = 1350
    const social = document.createElement('canvas')
    social.width = socialW; social.height = socialH

    const ctx = social.getContext('2d')!
    const theme = resolveEffectiveTheme(session, session.layout)

    // Complementary social backdrop
    ctx.fillStyle = theme.isDark ? '#1a1512' : '#f5f0e8'
    ctx.fillRect(0, 0, socialW, socialH)

    const vg = ctx.createRadialGradient(socialW / 2, socialH / 2, 0, socialW / 2, socialH / 2, socialW * 0.8)
    vg.addColorStop(0, 'rgba(245,240,232,0)')
    vg.addColorStop(1, theme.isDark ? 'rgba(0,0,0,0.45)' : 'rgba(130,90,30,0.12)')
    ctx.fillStyle = vg
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
