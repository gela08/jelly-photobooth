import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { StickerAsset } from '@/lib/types'

const ALLOWED_EXTS = new Set(['.png', '.webp', '.jpg', '.jpeg', '.svg', '.gif'])

function scanStickersDir(dir: string, urlPrefix: string, results: StickerAsset[]) {
  if (!fs.existsSync(dir)) return
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      scanStickersDir(fullPath, `${urlPrefix}/${encodeURIComponent(entry.name)}`, results)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (!ALLOWED_EXTS.has(ext)) continue
      const label = path.basename(entry.name, ext).replace(/[-_]+/g, ' ').slice(0, 22)
      results.push({
        id: `public-${urlPrefix}-${entry.name}`,
        label: label || 'Sticker',
        category: 'custom',
        src: `${urlPrefix}/${encodeURIComponent(entry.name)}`,
        isPublicFile: true,
      })
    }
  }
}

export async function GET() {
  try {
    const stickersDir = path.join(process.cwd(), 'public', 'stickers')
    const stickers: StickerAsset[] = []
    scanStickersDir(stickersDir, '/stickers', stickers)
    return NextResponse.json({ stickers })
  } catch {
    return NextResponse.json({ stickers: [] })
  }
}
