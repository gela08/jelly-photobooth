import { FilterType, LayoutType, PhotoSession } from './types'

const S = 2 // 2× scale for high-res output

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = src
  })
}

/** Cover-crop: draw image filling (dx,dy,dw,dh) with no distortion */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number, dy: number, dw: number, dh: number
) {
  const sa = img.naturalWidth / img.naturalHeight
  const da = dw / dh
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight
  if (sa > da) { sw = img.naturalHeight * da; sx = (img.naturalWidth - sw) / 2 }
  else { sh = img.naturalWidth / da; sy = (img.naturalHeight - sh) / 2 }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

function applyPixelFilter(
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
  ctx.beginPath()
  ctx.moveTo(x+r, y)
  ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r)
  ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h)
  ctx.lineTo(x+r, y+h); ctx.quadraticCurveTo(x, y+h, x, y+h-r)
  ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y)
  ctx.closePath()
}

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function drawVintagePaper(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#f5f0e8'; ctx.fillRect(0, 0, w, h)
  const vg = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w,h)*0.75)
  vg.addColorStop(0, 'rgba(245,240,232,0)'); vg.addColorStop(1, 'rgba(130,90,30,0.13)')
  ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h)
  ctx.globalAlpha = 0.018
  for (let i = 0; i < 8000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff'
    ctx.fillRect(Math.random()*w, Math.random()*h, 1, 1)
  }
  ctx.globalAlpha = 1
}

function drawBlackBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.fillStyle = '#121010'; ctx.fillRect(0, 0, w, h)
}

// ─────────────────────────────────────────────────────────────────────────────
// PHOTO DRAW HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Draw photo with white border/frame and shadow */
function drawPhotoFramed(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  filter: FilterType,
  x: number, y: number, w: number, h: number,
  bw = 5*S
) {
  ctx.save()
  ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = 10*S; ctx.shadowOffsetY = 3*S
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(x - bw, y - bw, w + bw*2, h + bw*2)
  ctx.restore()
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
  drawImageCover(ctx, img, x, y, w, h)
  ctx.restore()
  applyPixelFilter(ctx, filter, x, y, w, h)
}

/** Draw photo without border */
function drawPhoto(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  filter: FilterType,
  x: number, y: number, w: number, h: number
) {
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip()
  drawImageCover(ctx, img, x, y, w, h)
  ctx.restore()
  applyPixelFilter(ctx, filter, x, y, w, h)
}

// ─────────────────────────────────────────────────────────────────────────────
// TEXT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function drawStripTitle(ctx: CanvasRenderingContext2D, totalW: number, y: number, dark = false) {
  ctx.save()
  ctx.fillStyle = dark ? '#c4a882' : '#5c3d1e'
  ctx.font = `bold ${12*S}px Georgia, serif`
  ctx.textAlign = 'center'
  ctx.fillText('VINTAGE PHOTOBOOTH', totalW / 2, y)
  ctx.restore()
}

function drawStripBottom(
  ctx: CanvasRenderingContext2D,
  caption: string,
  showDate: boolean,
  totalW: number,
  startY: number,
  dark = false
): number {
  let y = startY
  if (caption) {
    y += 18*S
    ctx.save()
    ctx.fillStyle = dark ? '#c4a882' : '#8b6914'
    ctx.font = `italic ${11*S}px Georgia, serif`
    ctx.textAlign = 'center'
    ctx.fillText(`"${caption}"`, totalW / 2, y)
    ctx.restore()
    y += 18*S
  }
  if (showDate) {
    if (!caption) y += 14*S
    ctx.save()
    ctx.fillStyle = dark ? '#8a7a6a' : '#9e8e7e'
    ctx.font = `${9*S}px 'Courier New', monospace`
    ctx.textAlign = 'center'
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    ctx.fillText(dateStr, totalW / 2, y)
    ctx.restore()
    y += 14*S
  }
  return y
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYOUT GENERATORS
// ─────────────────────────────────────────────────────────────────────────────

// ── CLASSIC STRIP ─────────────────────────────────────────────────────────────
// Portrait: single tall column (photos stacked vertically)
// Landscape: single wide row (photos side by side horizontally)

async function generateClassic(session: PhotoSession, canvas: HTMLCanvasElement, landscape = false) {
  const imgs = await Promise.all(session.photos.map(loadImage))
  const n = imgs.length
  const stripPad = 14*S
  const titleH = 28*S
  const captionH = (session.caption ? 34*S : 0) + (session.showDate ? 28*S : 0)

  // Portrait: 4:3 photos stacked vertically
  // Landscape: 16:9 photos side by side in a row
  const photoW = landscape ? 280*S : 200*S
  const photoH = landscape ? 160*S : 150*S
  const photoGap = 6*S
  const bottomPad = 16*S

  let totalW: number, totalH: number

  if (landscape) {
    totalW = stripPad*2 + n * photoW + (n - 1) * photoGap
    totalH = stripPad + titleH + photoH + bottomPad + captionH + stripPad
  } else {
    totalW = stripPad*2 + photoW
    totalH = stripPad + titleH + n * (photoH + photoGap) - photoGap + bottomPad + captionH + stripPad
  }

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  drawBlackBackground(ctx, totalW, totalH)

  // Title
  ctx.save()
  ctx.fillStyle = '#f5f0e8'
  ctx.font = `bold ${11*S}px Georgia, serif`
  ctx.textAlign = 'center'
  ctx.fillText('VINTAGE PHOTOBOOTH', totalW / 2, stripPad + titleH * 0.7)
  ctx.restore()

  // Decorative title line
  ctx.save()
  ctx.strokeStyle = 'rgba(196,168,130,0.35)'; ctx.lineWidth = 1
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
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, photoW, photoH); ctx.clip()
    drawImageCover(ctx, img, x, y, photoW, photoH); ctx.restore()
    applyPixelFilter(ctx, session.filter, x, y, photoW, photoH)

    // Thin dividers
    if (i < n - 1) {
      ctx.save()
      ctx.strokeStyle = 'rgba(196,168,130,0.2)'; ctx.lineWidth = 1
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
  ctx.strokeStyle = 'rgba(196,168,130,0.35)'; ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(stripPad, captionStartY - 8*S)
  ctx.lineTo(totalW - stripPad, captionStartY - 8*S)
  ctx.stroke()
  ctx.restore()

  drawStripBottom(ctx, session.caption, session.showDate, totalW, captionStartY, true)
}

// ── FILM STRIP ────────────────────────────────────────────────────────────────
// Portrait: sprocket holes left & right, photos stacked vertically
// Landscape: sprocket holes top & bottom, photos in a row

async function generateFilmstrip(session: PhotoSession, canvas: HTMLCanvasElement, landscape = false) {
  const imgs = await Promise.all(session.photos.map(loadImage))
  const n = imgs.length
  const sprocketW = 22*S
  const innerPad = 8*S
  const holeW = 12*S
  const holeH = 16*S
  const holeSpacing = holeH + 7*S
  const titleH = 22*S
  const topPad = 14*S
  const photoGap = 5*S
  const captionH = (session.caption ? 32*S : 0) + (session.showDate ? 24*S : 0)

  if (landscape) {
    // Landscape: sprocket top & bottom, photos side by side
    const photoW = 240*S
    const photoH = 160*S
    const totalW = topPad + titleH + n * (photoW + photoGap) - photoGap + 20*S + captionH + 20*S
    const totalH = sprocketW * 2 + photoH + innerPad * 2

    canvas.width = totalW; canvas.height = totalH
    const ctx = canvas.getContext('2d')!

    // Film body
    ctx.fillStyle = '#0e0b08'; ctx.fillRect(0, 0, totalW, totalH)
    ctx.fillStyle = '#1a1208'; ctx.fillRect(0, sprocketW, totalW, photoH + innerPad * 2)

    // Sprocket holes top & bottom
    const holeYT = Math.floor((sprocketW - holeW) / 2)
    const holeYB = sprocketW + photoH + innerPad * 2 + Math.floor((sprocketW - holeW) / 2)
    const holesCount = Math.ceil(totalW / holeSpacing) + 2
    for (let i = 0; i < holesCount; i++) {
      const hx = i * holeSpacing + 6*S
      ctx.fillStyle = '#050403'
      roundedRect(ctx, hx, holeYT, holeH, holeW, 2*S); ctx.fill()
      roundedRect(ctx, hx, holeYB, holeH, holeW, 2*S); ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
      roundedRect(ctx, hx, holeYT, holeH, holeW, 2*S); ctx.stroke()
      roundedRect(ctx, hx, holeYB, holeH, holeW, 2*S); ctx.stroke()
    }

    // Title
    ctx.save()
    ctx.fillStyle = '#c4a882'
    ctx.font = `bold ${9*S}px 'Courier New', monospace`
    ctx.textAlign = 'center'
    ctx.fillText('VINTAGE PHOTOBOOTH', totalW / 2, topPad + titleH * 0.65)
    ctx.restore()

    // Photos in a horizontal row
    const photoY = sprocketW + innerPad
    imgs.forEach((img, i) => {
      const photoX = topPad + titleH + i * (photoW + photoGap)
      drawPhoto(ctx, img, session.filter, photoX, photoY, photoW, photoH)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
      ctx.strokeRect(photoX, photoY, photoW, photoH)
      ctx.save()
      ctx.fillStyle = 'rgba(196,168,130,0.5)'
      ctx.font = `${7*S}px 'Courier New', monospace`
      ctx.textAlign = 'left'
      ctx.fillText(String(i+1).padStart(2,'0'), photoX+3*S, photoY+photoH-3*S)
      ctx.restore()
    })

    // Caption
    let cy = topPad + titleH + n * (photoW + photoGap) - photoGap + 16*S
    if (session.caption) {
      cy += 14*S
      ctx.save(); ctx.fillStyle = '#c4a882'; ctx.font = `italic ${10*S}px Georgia, serif`; ctx.textAlign = 'center'
      ctx.fillText(`"${session.caption}"`, totalW/2, cy); ctx.restore(); cy += 18*S
    }
    if (session.showDate) {
      ctx.save(); ctx.fillStyle = '#7a6a5a'; ctx.font = `${8*S}px 'Courier New', monospace`; ctx.textAlign = 'center'
      ctx.fillText(new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}), totalW/2, cy); ctx.restore()
    }

  } else {
    // Portrait: sprocket holes left & right, photos stacked vertically
    const photoW = 220*S
    const photoH = 165*S
    const totalW = sprocketW * 2 + photoW + innerPad * 2
    const totalH = topPad + titleH + n * (photoH + photoGap) - photoGap + 20*S + captionH + 20*S

    canvas.width = totalW; canvas.height = totalH
    const ctx = canvas.getContext('2d')!

    ctx.fillStyle = '#0e0b08'; ctx.fillRect(0, 0, totalW, totalH)
    ctx.fillStyle = '#1a1208'; ctx.fillRect(sprocketW, 0, photoW + innerPad*2, totalH)

    const holeXL = Math.floor((sprocketW - holeW) / 2)
    const holeXR = sprocketW + photoW + innerPad*2 + Math.floor((sprocketW - holeW) / 2)
    const holesCount = Math.ceil(totalH / holeSpacing) + 2
    for (let i = 0; i < holesCount; i++) {
      const hy = i * holeSpacing + 6*S
      ctx.fillStyle = '#050403'
      roundedRect(ctx, holeXL, hy, holeW, holeH, 2*S); ctx.fill()
      roundedRect(ctx, holeXR, hy, holeW, holeH, 2*S); ctx.fill()
      ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1
      roundedRect(ctx, holeXL, hy, holeW, holeH, 2*S); ctx.stroke()
      roundedRect(ctx, holeXR, hy, holeW, holeH, 2*S); ctx.stroke()
    }

    ctx.save()
    ctx.fillStyle = '#c4a882'
    ctx.font = `bold ${9*S}px 'Courier New', monospace`
    ctx.textAlign = 'center'
    ctx.fillText('VINTAGE PHOTOBOOTH', totalW/2, topPad + titleH * 0.65)
    ctx.restore()

    const photoX = sprocketW + innerPad
    imgs.forEach((img, i) => {
      const photoY = topPad + titleH + i * (photoH + photoGap)
      drawPhoto(ctx, img, session.filter, photoX, photoY, photoW, photoH)
      ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1
      ctx.strokeRect(photoX, photoY, photoW, photoH)
      ctx.save()
      ctx.fillStyle = 'rgba(196,168,130,0.5)'
      ctx.font = `${7*S}px 'Courier New', monospace`
      ctx.textAlign = 'left'
      ctx.fillText(String(i+1).padStart(2,'0'), photoX+3*S, photoY+photoH-3*S)
      ctx.restore()
    })

    let cy = topPad + titleH + n * (photoH + photoGap) - photoGap + 16*S
    if (session.caption) {
      cy += 14*S
      ctx.save(); ctx.fillStyle = '#c4a882'; ctx.font = `italic ${10*S}px Georgia, serif`; ctx.textAlign = 'center'
      ctx.fillText(`"${session.caption}"`, totalW/2, cy); ctx.restore(); cy += 18*S
    }
    if (session.showDate) {
      ctx.save(); ctx.fillStyle = '#7a6a5a'; ctx.font = `${8*S}px 'Courier New', monospace`; ctx.textAlign = 'center'
      ctx.fillText(new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'}), totalW/2, cy); ctx.restore()
    }
  }
}

// ── DUO STRIP ─────────────────────────────────────────────────────────────────
// Portrait: 2 tall photos side-by-side
// Landscape: 2 wide photos stacked vertically

async function generateTwostrip(session: PhotoSession, canvas: HTMLCanvasElement, landscape = false) {
  const imgs = await Promise.all(session.photos.slice(0, 2).map(loadImage))
  const pad = 20*S, gap = 12*S, bw = 5*S
  const titleH = 26*S
  const captionH = (session.caption ? 34*S : 0) + (session.showDate ? 24*S : 0)

  if (landscape) {
    // Wide photos stacked vertically
    const photoW = 380*S, photoH = 214*S  // ~16:9
    const totalW = pad*2 + photoW + bw*2
    const totalH = pad + titleH + photoH*2 + bw*4 + gap + captionH + pad

    canvas.width = totalW; canvas.height = totalH
    const ctx = canvas.getContext('2d')!
    drawVintagePaper(ctx, totalW, totalH)
    drawStripTitle(ctx, totalW, pad + titleH*0.7)
    imgs.forEach((img, i) => {
      const x = pad + bw
      const y = pad + titleH + bw + i*(photoH + bw*2 + gap)
      drawPhotoFramed(ctx, img, session.filter, x, y, photoW, photoH, bw)
    })
    drawStripBottom(ctx, session.caption, session.showDate, totalW, pad+titleH+photoH*2+bw*4+gap)
  } else {
    // Tall photos side-by-side
    const photoW = 220*S, photoH = 310*S
    const totalW = pad*2 + photoW*2 + bw*4 + gap
    const totalH = pad + titleH + photoH + bw*2 + captionH + pad

    canvas.width = totalW; canvas.height = totalH
    const ctx = canvas.getContext('2d')!
    drawVintagePaper(ctx, totalW, totalH)
    drawStripTitle(ctx, totalW, pad + titleH*0.7)
    imgs.forEach((img, i) => {
      const x = pad + bw + i*(photoW + bw*2 + gap)
      const y = pad + titleH + bw
      drawPhotoFramed(ctx, img, session.filter, x, y, photoW, photoH, bw)
    })
    drawStripBottom(ctx, session.caption, session.showDate, totalW, pad+titleH+photoH+bw*2)
  }
}

// ── TRIPLE STRIP ──────────────────────────────────────────────────────────────
// Portrait: 3 tall photos side-by-side
// Landscape: 3 wide photos stacked vertically

async function generateThreestrip(session: PhotoSession, canvas: HTMLCanvasElement, landscape = false) {
  const imgs = await Promise.all(session.photos.slice(0, 3).map(loadImage))
  const pad = 20*S, gap = 10*S, bw = 5*S
  const titleH = 26*S
  const captionH = (session.caption ? 34*S : 0) + (session.showDate ? 24*S : 0)

  if (landscape) {
    // Wide photos stacked vertically
    const photoW = 380*S, photoH = 180*S
    const totalW = pad*2 + photoW + bw*2
    const totalH = pad + titleH + photoH*3 + bw*6 + gap*2 + captionH + pad

    canvas.width = totalW; canvas.height = totalH
    const ctx = canvas.getContext('2d')!
    drawVintagePaper(ctx, totalW, totalH)
    drawStripTitle(ctx, totalW, pad + titleH*0.7)
    imgs.forEach((img, i) => {
      const x = pad + bw
      const y = pad + titleH + bw + i*(photoH + bw*2 + gap)
      drawPhotoFramed(ctx, img, session.filter, x, y, photoW, photoH, bw)
    })
    drawStripBottom(ctx, session.caption, session.showDate, totalW, pad+titleH+photoH*3+bw*6+gap*2)
  } else {
    // Tall photos side-by-side
    const photoW = 160*S, photoH = 248*S
    const totalW = pad*2 + photoW*3 + bw*6 + gap*2
    const totalH = pad + titleH + photoH + bw*2 + captionH + pad

    canvas.width = totalW; canvas.height = totalH
    const ctx = canvas.getContext('2d')!
    drawVintagePaper(ctx, totalW, totalH)
    drawStripTitle(ctx, totalW, pad + titleH*0.7)
    imgs.forEach((img, i) => {
      const x = pad + bw + i*(photoW + bw*2 + gap)
      const y = pad + titleH + bw
      drawPhotoFramed(ctx, img, session.filter, x, y, photoW, photoH, bw)
    })
    drawStripBottom(ctx, session.caption, session.showDate, totalW, pad+titleH+photoH+bw*2)
  }
}

// ── LAYOUT H — 1 large + 2 small right column ─────────────────────────────────

async function generateLayoutH(session: PhotoSession, canvas: HTMLCanvasElement) {
  const imgs = await Promise.all(session.photos.slice(0, 3).map(loadImage))
  const pad = 24*S, gap = 10*S, bw = 5*S
  const titleH = 28*S
  const captionH = (session.caption ? 36*S : 0) + (session.showDate ? 26*S : 0)
  const bigW = 280*S, bigH = 210*S
  const smallW = 160*S, smallH = (bigH - gap) / 2
  const totalW = pad + bigW + bw*2 + gap + smallW + bw*2 + pad
  const totalH = pad + titleH + bigH + bw*2 + captionH + pad

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  drawVintagePaper(ctx, totalW, totalH)
  drawStripTitle(ctx, totalW, pad + titleH*0.7)
  drawPhotoFramed(ctx, imgs[0], session.filter, pad+bw, pad+titleH+bw, bigW, bigH, bw)
  const rx = pad + bigW + bw*2 + gap + bw
  drawPhotoFramed(ctx, imgs[1], session.filter, rx, pad+titleH+bw, smallW, smallH, bw)
  drawPhotoFramed(ctx, imgs[2], session.filter, rx, pad+titleH+bw+smallH+gap+bw*2, smallW, smallH, bw)
  drawStripBottom(ctx, session.caption, session.showDate, totalW, pad+titleH+bigH+bw*2)
}

// ── 2×2 GRID ──────────────────────────────────────────────────────────────────

async function generateGrid4(session: PhotoSession, canvas: HTMLCanvasElement, landscape = false) {
  const imgs = await Promise.all(session.photos.slice(0, 4).map(loadImage))
  const pad = 24*S, gap = 10*S, bw = 5*S
  const titleH = 28*S
  const photoW = landscape ? 230*S : 220*S
  const photoH = landscape ? 175*S : 165*S
  const captionH = (session.caption ? 36*S : 0) + (session.showDate ? 26*S : 0)
  const totalW = pad*2 + photoW*2 + bw*4 + gap
  const totalH = pad + titleH + photoH*2 + bw*4 + gap + captionH + pad

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  drawVintagePaper(ctx, totalW, totalH)
  drawStripTitle(ctx, totalW, pad + titleH*0.7)
  imgs.forEach((img, i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const x = pad + bw + col*(photoW + bw*2 + gap)
    const y = pad + titleH + bw + row*(photoH + bw*2 + gap)
    drawPhotoFramed(ctx, img, session.filter, x, y, photoW, photoH, bw)
  })
  drawStripBottom(ctx, session.caption, session.showDate, totalW, pad+titleH+photoH*2+bw*4+gap)
}

// ── LAYOUT E — 1 large left + 3 stacked right ─────────────────────────────────

async function generateLayoutE(session: PhotoSession, canvas: HTMLCanvasElement) {
  const imgs = await Promise.all(session.photos.slice(0, 4).map(loadImage))
  const pad = 24*S, gap = 8*S, bw = 5*S
  const titleH = 28*S
  const captionH = (session.caption ? 36*S : 0) + (session.showDate ? 26*S : 0)
  const bigH = 310*S, bigW = 230*S
  const smallW = 150*S, smallH = (bigH - gap*2) / 3
  const totalW = pad + bigW + bw*2 + gap + smallW + bw*2 + pad
  const totalH = pad + titleH + bigH + bw*2 + captionH + pad

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  drawVintagePaper(ctx, totalW, totalH)
  drawStripTitle(ctx, totalW, pad + titleH*0.7)
  drawPhotoFramed(ctx, imgs[0], session.filter, pad+bw, pad+titleH+bw, bigW, bigH, bw)
  const rx = pad + bigW + bw*2 + gap + bw
  for (let i = 0; i < 3; i++) {
    const y = pad + titleH + bw + i*(smallH + gap + bw*2)
    drawPhotoFramed(ctx, imgs[i+1], session.filter, rx, y, smallW, smallH, bw)
  }
  drawStripBottom(ctx, session.caption, session.showDate, totalW, pad+titleH+bigH+bw*2)
}

// ── LAYOUT 9 — 1 large top + 3 across bottom ──────────────────────────────────

async function generateLayout9(session: PhotoSession, canvas: HTMLCanvasElement) {
  const imgs = await Promise.all(session.photos.slice(0, 4).map(loadImage))
  const pad = 24*S, gap = 10*S, bw = 5*S
  const titleH = 28*S
  const captionH = (session.caption ? 36*S : 0) + (session.showDate ? 26*S : 0)
  const bigW = 280*S, bigH = 210*S
  const smallH = 130*S
  const totalW = pad + bigW + bw*2 + pad
  const smallW = (totalW - pad*2 - bw*6 - gap*2) / 3
  const totalH = pad + titleH + bigH + bw*2 + gap + smallH + bw*2 + captionH + pad

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  drawVintagePaper(ctx, totalW, totalH)
  drawStripTitle(ctx, totalW, pad + titleH*0.7)
  drawPhotoFramed(ctx, imgs[0], session.filter, pad+bw, pad+titleH+bw, bigW, bigH, bw)
  const rowY = pad + titleH + bigH + bw*2 + gap + bw
  for (let i = 0; i < 3; i++) {
    const x = pad + bw + i*(smallW + bw*2 + gap)
    drawPhotoFramed(ctx, imgs[i+1], session.filter, x, rowY, smallW, smallH, bw)
  }
  drawStripBottom(ctx, session.caption, session.showDate, totalW, pad+titleH+bigH+bw*2+gap+smallH+bw*2)
}

// ── LAYOUT 3 — 3 cols × 2 rows ────────────────────────────────────────────────

async function generateLayout3(session: PhotoSession, canvas: HTMLCanvasElement, landscape = false) {
  const imgs = await Promise.all(session.photos.slice(0, 6).map(loadImage))
  const pad = 24*S, gap = 10*S, bw = 5*S
  const titleH = 28*S
  const photoW = landscape ? 210*S : 175*S
  const photoH = landscape ? 158*S : 132*S
  const captionH = (session.caption ? 36*S : 0) + (session.showDate ? 26*S : 0)
  const totalW = pad*2 + photoW*3 + bw*6 + gap*2
  const totalH = pad + titleH + photoH*2 + bw*4 + gap + captionH + pad

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  drawVintagePaper(ctx, totalW, totalH)
  drawStripTitle(ctx, totalW, pad + titleH*0.7)
  imgs.forEach((img, i) => {
    const col = i % 3, row = Math.floor(i / 3)
    const x = pad + bw + col*(photoW + bw*2 + gap)
    const y = pad + titleH + bw + row*(photoH + bw*2 + gap)
    drawPhotoFramed(ctx, img, session.filter, x, y, photoW, photoH, bw)
  })
  drawStripBottom(ctx, session.caption, session.showDate, totalW, pad+titleH+photoH*2+bw*4+gap)
}

// ── GRID 6 — 2 cols × 3 rows ──────────────────────────────────────────────────

async function generateGrid6(session: PhotoSession, canvas: HTMLCanvasElement) {
  const imgs = await Promise.all(session.photos.slice(0, 6).map(loadImage))
  const pad = 24*S, gap = 10*S, bw = 5*S
  const titleH = 28*S
  const photoW = 220*S, photoH = 165*S
  const captionH = (session.caption ? 36*S : 0) + (session.showDate ? 26*S : 0)
  const totalW = pad*2 + photoW*2 + bw*4 + gap
  const totalH = pad + titleH + photoH*3 + bw*6 + gap*2 + captionH + pad

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  drawVintagePaper(ctx, totalW, totalH)
  drawStripTitle(ctx, totalW, pad + titleH*0.7)
  imgs.forEach((img, i) => {
    const col = i % 2, row = Math.floor(i / 2)
    const x = pad + bw + col*(photoW + bw*2 + gap)
    const y = pad + titleH + bw + row*(photoH + bw*2 + gap)
    drawPhotoFramed(ctx, img, session.filter, x, y, photoW, photoH, bw)
  })
  drawStripBottom(ctx, session.caption, session.showDate, totalW, pad+titleH+photoH*3+bw*6+gap*2)
}

// ── POLAROID ──────────────────────────────────────────────────────────────────

async function generatePolaroid(session: PhotoSession, canvas: HTMLCanvasElement) {
  const imgs = await Promise.all(session.photos.map(loadImage))
  const n = imgs.length

  // Photo area dimensions inside each polaroid
  const photoW = 200*S
  const photoH = 150*S  // 4:3

  // Polaroid frame: thin top/sides, thick bottom (for caption area)
  const frameTop = 10*S
  const frameSide = 10*S
  const frameBottom = 44*S
  const frameW = photoW + frameSide * 2
  const frameH = photoH + frameTop + frameBottom

  // Layout columns
  // 2 photos → 1 col (stacked), 3 photos → 1 col, 4 photos → 2 cols
  const cols = n <= 3 ? 1 : 2
  const rows = Math.ceil(n / cols)

  const pad = 40*S
  const gap = 28*S
  const titleH = 32*S
  const captionH = (session.caption ? 40*S : 0) + (session.showDate ? 28*S : 0)

  // Extra space for rotation overflow
  const overflow = 28*S

  const totalW = pad * 2 + cols * frameW + (cols - 1) * gap + overflow * 2
  const totalH = pad + titleH + rows * frameH + (rows - 1) * gap + captionH + pad + overflow

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!

  // Parchment bg
  ctx.fillStyle = '#e8dcc8'; ctx.fillRect(0, 0, totalW, totalH)
  const vg = ctx.createRadialGradient(totalW/2, totalH/2, 0, totalW/2, totalH/2, Math.max(totalW,totalH)*0.7)
  vg.addColorStop(0, 'rgba(232,220,200,0)'); vg.addColorStop(1, 'rgba(120,80,20,0.10)')
  ctx.fillStyle = vg; ctx.fillRect(0, 0, totalW, totalH)

  // Grain
  ctx.globalAlpha = 0.015
  for (let i = 0; i < 5000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? '#000' : '#fff'
    ctx.fillRect(Math.random()*totalW, Math.random()*totalH, 1, 1)
  }
  ctx.globalAlpha = 1

  drawStripTitle(ctx, totalW, pad + titleH * 0.7)

  const angles = [-2.5, 2.2, -1.8, 2.8]

  // Offset so photos start centered accounting for overflow
  const startX = overflow + pad + (totalW - overflow*2 - pad*2 - cols*frameW - (cols-1)*gap) / 2

  imgs.forEach((img, i) => {
    const col = n <= 3 ? 0 : i % cols
    const row = n <= 3 ? i : Math.floor(i / cols)

    const bx = startX + col * (frameW + gap)
    const by = pad + titleH + row * (frameH + gap)
    const cx = bx + frameW / 2
    const cy = by + frameH / 2
    const angle = (angles[i % angles.length] * Math.PI) / 180

    // Off-screen canvas for polaroid
    const off = document.createElement('canvas')
    off.width = frameW + 24*S
    off.height = frameH + 24*S
    const oc = off.getContext('2d')!

    const ox = 12*S, oy = 12*S  // offset within offscreen canvas

    // Shadow
    oc.save()
    oc.shadowColor = 'rgba(0,0,0,0.28)'; oc.shadowBlur = 20*S; oc.shadowOffsetY = 7*S
    oc.fillStyle = '#fefefe'; oc.fillRect(ox, oy, frameW, frameH)
    oc.restore()

    // White polaroid body
    oc.fillStyle = '#fefefe'; oc.fillRect(ox, oy, frameW, frameH)

    // Photo inside
    oc.save()
    oc.beginPath()
    oc.rect(ox + frameSide, oy + frameTop, photoW, photoH)
    oc.clip()
    drawImageCover(oc, img, ox + frameSide, oy + frameTop, photoW, photoH)
    oc.restore()
    applyPixelFilter(oc, session.filter, ox + frameSide, oy + frameTop, photoW, photoH)

    // Subtle inner border on photo
    oc.save()
    oc.strokeStyle = 'rgba(0,0,0,0.08)'; oc.lineWidth = 1
    oc.strokeRect(ox + frameSide, oy + frameTop, photoW, photoH)
    oc.restore()

    // Draw rotated onto main canvas
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angle)
    ctx.drawImage(off, -(frameW/2 + 12*S), -(frameH/2 + 12*S))
    ctx.restore()
  })

  const bottomY = pad + titleH + rows * frameH + (rows - 1) * gap + overflow / 2
  drawStripBottom(ctx, session.caption, session.showDate, totalW, bottomY)
}

// ── DIAGONAL ──────────────────────────────────────────────────────────────────

async function generateDiagonal(session: PhotoSession, canvas: HTMLCanvasElement) {
  const imgs = await Promise.all(session.photos.map(loadImage))
  const n = imgs.length
  const photoW = 260*S, photoH = 195*S, bw = 5*S
  const pad = 32*S, titleH = 30*S
  const offset = 32*S, overlap = 20*S
  const captionH = (session.caption ? 40*S : 0) + (session.showDate ? 26*S : 0)
  const totalW = pad*2 + photoW + bw*2 + offset
  const rowH = photoH + bw*2 - overlap
  const totalH = pad + titleH + n*rowH + overlap + captionH + pad

  canvas.width = totalW; canvas.height = totalH
  const ctx = canvas.getContext('2d')!
  drawVintagePaper(ctx, totalW, totalH)
  drawStripTitle(ctx, totalW, pad + titleH * 0.7)

  imgs.forEach((img, i) => {
    const isRight = i % 2 === 1
    const x = pad + bw + (isRight ? offset : 0)
    const y = pad + titleH + bw + i * rowH
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 12*S
    ctx.shadowOffsetX = isRight ? 3*S : -3*S; ctx.shadowOffsetY = 4*S
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(x - bw, y - bw, photoW + bw*2, photoH + bw*2)
    ctx.restore()
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, photoW, photoH); ctx.clip()
    drawImageCover(ctx, img, x, y, photoW, photoH); ctx.restore()
    applyPixelFilter(ctx, session.filter, x, y, photoW, photoH)
  })

  drawStripBottom(ctx, session.caption, session.showDate, totalW, pad+titleH+n*rowH+overlap+bw)
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────────────────────

export async function generatePhotoboothCanvas(session: PhotoSession, layoutOverride?: LayoutType): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas')
  const layout = layoutOverride ?? session.layout

  switch (layout) {
    case 'classic':           await generateClassic(session, canvas, false); break
    case 'classic_land':      await generateClassic(session, canvas, true); break
    case 'filmstrip':         await generateFilmstrip(session, canvas, false); break
    case 'filmstrip_land':    await generateFilmstrip(session, canvas, true); break
    case 'twostrip':          await generateTwostrip(session, canvas, false); break
    case 'twostrip_land':     await generateTwostrip(session, canvas, true); break
    case 'threestrip':        await generateThreestrip(session, canvas, false); break
    case 'threestrip_land':   await generateThreestrip(session, canvas, true); break
    case 'layout_h':          await generateLayoutH(session, canvas); break
    case 'grid_4':            await generateGrid4(session, canvas, false); break
    case 'grid_4_land':       await generateGrid4(session, canvas, true); break
    case 'layout_e':          await generateLayoutE(session, canvas); break
    case 'layout_9':          await generateLayout9(session, canvas); break
    case 'layout_3':          await generateLayout3(session, canvas, false); break
    case 'layout_3_land':     await generateLayout3(session, canvas, true); break
    case 'grid_6':            await generateGrid6(session, canvas); break
    case 'polaroid_2':
    case 'polaroid_3':
    case 'polaroid_4':        await generatePolaroid(session, canvas); break
    case 'diagonal_2':
    case 'diagonal_3':
    case 'diagonal_4':        await generateDiagonal(session, canvas); break
    default:                  await generateClassic(session, canvas, false); break
  }

  return canvas
}

export async function downloadPhoto(session: PhotoSession, format: 'print' | 'social' = 'print') {
  const canvas = await generatePhotoboothCanvas(session)
  const ts = Date.now()

  if (format === 'social') {
    const socialW = 1080, socialH = 1350
    const social = document.createElement('canvas')
    social.width = socialW; social.height = socialH
    const ctx = social.getContext('2d')!
    ctx.fillStyle = '#f5f0e8'; ctx.fillRect(0, 0, socialW, socialH)
    const vg = ctx.createRadialGradient(socialW/2, socialH/2, 0, socialW/2, socialH/2, socialW*0.8)
    vg.addColorStop(0, 'rgba(245,240,232,0)'); vg.addColorStop(1, 'rgba(130,90,30,0.12)')
    ctx.fillStyle = vg; ctx.fillRect(0, 0, socialW, socialH)
    const scale = Math.min((socialW - 80) / canvas.width, (socialH - 100) / canvas.height)
    const sw = Math.round(canvas.width * scale), sh = Math.round(canvas.height * scale)
    ctx.drawImage(canvas, Math.round((socialW - sw) / 2), Math.round((socialH - sh) / 2), sw, sh)
    const a = document.createElement('a')
    a.download = `vintage-photobooth-social-${ts}.png`; a.href = social.toDataURL('image/png'); a.click()
  } else {
    const a = document.createElement('a')
    a.download = `vintage-photobooth-${ts}.png`; a.href = canvas.toDataURL('image/png'); a.click()
  }
}
