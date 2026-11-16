import { StickerAsset, StickerCategory } from './types'

export const STICKER_CATEGORIES: { id: StickerCategory; label: string }[] = [
  { id: 'cute', label: 'Cute' },
  { id: 'sparkles', label: 'Sparkles' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'y2k', label: 'Y2K' },
  { id: 'words', label: 'Words' },
  { id: 'custom', label: 'My Stickers' },
]

function svgSticker(viewBox: string, body: string, w = 256, h = 256): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${viewBox}">${body}</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

export const BUILTIN_STICKERS: StickerAsset[] = [
  // ── Cute & Kawaii ────────────────────────────────────────────────────────
  {
    id: 'cute-jelly-bear',
    label: 'Jelly Bear',
    category: 'cute',
    src: svgSticker(
      '0 0 100 100',
      `<circle cx="26" cy="28" r="14" fill="#d9a066" stroke="#5c3d1e" stroke-width="3.5"/>
       <circle cx="74" cy="28" r="14" fill="#d9a066" stroke="#5c3d1e" stroke-width="3.5"/>
       <circle cx="26" cy="28" r="7" fill="#f3c6a5"/>
       <circle cx="74" cy="28" r="7" fill="#f3c6a5"/>
       <ellipse cx="50" cy="56" rx="34" ry="30" fill="#e5b27a" stroke="#5c3d1e" stroke-width="3.5"/>
       <ellipse cx="50" cy="64" rx="14" ry="11" fill="#faf0e4"/>
       <circle cx="37" cy="51" r="4" fill="#3a2310"/>
       <circle cx="63" cy="51" r="4" fill="#3a2310"/>
       <circle cx="38.5" cy="49.5" r="1.4" fill="#fff"/>
       <circle cx="64.5" cy="49.5" r="1.4" fill="#fff"/>
       <ellipse cx="29" cy="60" rx="5.5" ry="3.5" fill="#f29da0" opacity="0.75"/>
       <ellipse cx="71" cy="60" rx="5.5" ry="3.5" fill="#f29da0" opacity="0.75"/>
       <ellipse cx="50" cy="60" rx="4.5" ry="3.2" fill="#5c3d1e"/>
       <path d="M44 67 Q50 72 56 67" fill="none" stroke="#5c3d1e" stroke-width="2.8" stroke-linecap="round"/>`
    ),
  },
  {
    id: 'cute-bunny-ears',
    label: 'Bunny Ears',
    category: 'cute',
    src: svgSticker(
      '0 0 100 100',
      `<ellipse cx="36" cy="48" rx="12" ry="34" transform="rotate(-10 36 48)" fill="#fff8f2" stroke="#5c3d1e" stroke-width="3.5"/>
       <ellipse cx="64" cy="48" rx="12" ry="34" transform="rotate(10 64 48)" fill="#fff8f2" stroke="#5c3d1e" stroke-width="3.5"/>
       <ellipse cx="36" cy="50" rx="6" ry="22" transform="rotate(-10 36 50)" fill="#f7b2bd"/>
       <ellipse cx="64" cy="50" rx="6" ry="22" transform="rotate(10 64 50)" fill="#f7b2bd"/>`
    ),
  },
  {
    id: 'cute-ribbon-bow',
    label: 'Ribbon Bow',
    category: 'cute',
    src: svgSticker(
      '0 0 100 100',
      `<path d="M48 48 L22 25 C12 34 12 58 24 64 L48 52 Z" fill="#f5a3b5" stroke="#6b3442" stroke-width="3.2" stroke-linejoin="round"/>
       <path d="M52 48 L78 25 C88 34 88 58 76 64 L52 52 Z" fill="#f5a3b5" stroke="#6b3442" stroke-width="3.2" stroke-linejoin="round"/>
       <path d="M45 54 L28 84 L40 80 L48 56 Z" fill="#ec8aa0" stroke="#6b3442" stroke-width="3" stroke-linejoin="round"/>
       <path d="M55 54 L72 84 L60 80 L52 56 Z" fill="#ec8aa0" stroke="#6b3442" stroke-width="3" stroke-linejoin="round"/>
       <rect x="42" y="41" width="16" height="16" rx="6" fill="#ffd1dc" stroke="#6b3442" stroke-width="3.2"/>`
    ),
  },
  {
    id: 'cute-cherry',
    label: 'Cherries',
    category: 'cute',
    src: svgSticker(
      '0 0 100 100',
      `<path d="M56 16 Q38 34 32 58" fill="none" stroke="#4f6d3a" stroke-width="3.5" stroke-linecap="round"/>
       <path d="M56 16 Q66 36 68 58" fill="none" stroke="#4f6d3a" stroke-width="3.5" stroke-linecap="round"/>
       <path d="M56 16 Q76 10 82 22 Q68 28 56 16 Z" fill="#7aa657" stroke="#3f592d" stroke-width="2.8"/>
       <circle cx="31" cy="68" r="17" fill="#d93848" stroke="#5c1620" stroke-width="3.2"/>
       <circle cx="69" cy="69" r="17" fill="#e64656" stroke="#5c1620" stroke-width="3.2"/>
       <ellipse cx="25" cy="61" rx="4.5" ry="2.8" transform="rotate(-30 25 61)" fill="#fff" opacity="0.75"/>
       <ellipse cx="63" cy="62" rx="4.5" ry="2.8" transform="rotate(-30 63 62)" fill="#fff" opacity="0.75"/>`
    ),
  },
  {
    id: 'cute-strawberry',
    label: 'Strawberry',
    category: 'cute',
    src: svgSticker(
      '0 0 100 100',
      `<path d="M50 26 C26 26 20 48 28 68 C35 84 44 90 50 90 C56 90 65 84 72 68 C80 48 74 26 50 26 Z" fill="#ea4c5c" stroke="#631b24" stroke-width="3.2"/>
       <path d="M32 28 L42 18 L50 26 L58 18 L68 28 L58 34 L50 29 L42 34 Z" fill="#71a84f" stroke="#375724" stroke-width="2.8" stroke-linejoin="round"/>
       <circle cx="38" cy="48" r="2" fill="#ffe9a6"/><circle cx="52" cy="44" r="2" fill="#ffe9a6"/>
       <circle cx="62" cy="52" r="2" fill="#ffe9a6"/><circle cx="43" cy="64" r="2" fill="#ffe9a6"/>
       <circle cx="58" cy="68" r="2" fill="#ffe9a6"/><circle cx="50" cy="77" r="2" fill="#ffe9a6"/>`
    ),
  },
  {
    id: 'cute-cloud',
    label: 'Happy Cloud',
    category: 'cute',
    src: svgSticker(
      '0 0 100 100',
      `<path d="M26 70 H74 C83 70 89 63 89 55 C89 47 82 41 74 41 C72 28 60 20 47 22 C36 24 29 33 28 43 C19 44 13 51 13 59 C13 65 19 70 26 70 Z" fill="#fffdf8" stroke="#5c3d1e" stroke-width="3.2"/>
       <circle cx="41" cy="52" r="2.8" fill="#5c3d1e"/><circle cx="59" cy="52" r="2.8" fill="#5c3d1e"/>
       <ellipse cx="34" cy="57" rx="4" ry="2.2" fill="#f5a3b5"/><ellipse cx="66" cy="57" rx="4" ry="2.2" fill="#f5a3b5"/>
       <path d="M46 57 Q50 61 54 57" fill="none" stroke="#5c3d1e" stroke-width="2.4" stroke-linecap="round"/>`
    ),
  },
  {
    id: 'cute-paw',
    label: 'Cat Paw',
    category: 'cute',
    src: svgSticker(
      '0 0 100 100',
      `<ellipse cx="50" cy="66" rx="22" ry="17" fill="#fff6ec" stroke="#5c3d1e" stroke-width="3.2"/>
       <ellipse cx="26" cy="43" rx="8" ry="10" transform="rotate(-18 26 43)" fill="#fff6ec" stroke="#5c3d1e" stroke-width="3"/>
       <ellipse cx="42" cy="31" rx="8" ry="11" transform="rotate(-6 42 31)" fill="#fff6ec" stroke="#5c3d1e" stroke-width="3"/>
       <ellipse cx="59" cy="31" rx="8" ry="11" transform="rotate(6 59 31)" fill="#fff6ec" stroke="#5c3d1e" stroke-width="3"/>
       <ellipse cx="74" cy="43" rx="8" ry="10" transform="rotate(18 74 43)" fill="#fff6ec" stroke="#5c3d1e" stroke-width="3"/>
       <ellipse cx="50" cy="68" rx="12" ry="9" fill="#f7b2bd"/>
       <circle cx="27" cy="44" r="4" fill="#f7b2bd"/><circle cx="42" cy="32" r="4" fill="#f7b2bd"/>
       <circle cx="59" cy="32" r="4" fill="#f7b2bd"/><circle cx="73" cy="44" r="4" fill="#f7b2bd"/>`
    ),
  },
  {
    id: 'cute-clover',
    label: 'Clover',
    category: 'cute',
    src: svgSticker(
      '0 0 100 100',
      `<path d="M50 54 Q52 78 62 90" fill="none" stroke="#456b32" stroke-width="4" stroke-linecap="round"/>
       <circle cx="50" cy="30" r="14" fill="#77b85a" stroke="#365726" stroke-width="3"/>
       <circle cx="30" cy="50" r="14" fill="#77b85a" stroke="#365726" stroke-width="3"/>
       <circle cx="70" cy="50" r="14" fill="#77b85a" stroke="#365726" stroke-width="3"/>
       <circle cx="50" cy="64" r="12" fill="#89c96c" stroke="#365726" stroke-width="3"/>
       <circle cx="50" cy="49" r="5" fill="#b2e695"/>`
    ),
  },

  // ── Sparkles & Hearts ────────────────────────────────────────────────────
  {
    id: 'sparkle-twinkle',
    label: 'Gold Sparkles',
    category: 'sparkles',
    src: svgSticker(
      '0 0 100 100',
      `<path d="M44 12 L50 38 L76 44 L50 50 L44 76 L38 50 L12 44 L38 38 Z" fill="#f6c85f" stroke="#7c5611" stroke-width="2.8" stroke-linejoin="round"/>
       <path d="M76 60 L79 71 L90 74 L79 77 L76 88 L73 77 L62 74 L73 71 Z" fill="#ffe18c" stroke="#7c5611" stroke-width="2.4" stroke-linejoin="round"/>
       <path d="M74 16 L76 23 L83 25 L76 27 L74 34 L72 27 L65 25 L72 23 Z" fill="#fff2b8" stroke="#7c5611" stroke-width="2" stroke-linejoin="round"/>`
    ),
  },
  {
    id: 'sparkle-double-heart',
    label: 'Twin Hearts',
    category: 'sparkles',
    src: svgSticker(
      '0 0 100 100',
      `<path d="M38 78 C16 64 12 46 21 35 C28 26 40 29 44 37 C48 29 60 26 67 35 C76 46 60 64 38 78 Z" fill="#ec6a82" stroke="#662231" stroke-width="3"/>
       <path d="M72 56 C60 48 58 37 64 30 C69 25 76 27 78 32 C81 27 88 25 92 30 C98 37 86 48 72 56 Z" fill="#f7b2bd" stroke="#662231" stroke-width="2.6"/>`
    ),
  },
  {
    id: 'sparkle-pixel-heart',
    label: 'Pixel Heart',
    category: 'sparkles',
    src: svgSticker(
      '0 0 100 100',
      `<path d="M22 22 H40 V31 H60 V22 H78 V31 H87 V50 H78 V60 H69 V69 H60 V78 H40 V69 H31 V60 H22 V50 H13 V31 H22 Z" fill="#e63e5d" stroke="#42101a" stroke-width="3.5" stroke-linejoin="miter"/>
       <rect x="24" y="32" width="10" height="10" fill="#ff9bb0"/>`
    ),
  },
  {
    id: 'sparkle-kiss',
    label: 'Kiss Stamp',
    category: 'sparkles',
    src: svgSticker(
      '0 0 100 100',
      `<path d="M12 50 Q30 28 45 38 Q50 41 55 38 Q70 28 88 50 Q68 48 50 53 Q32 48 12 50 Z" fill="#c9364a"/>
       <path d="M16 53 Q50 82 84 53 Q66 57 50 56 Q34 57 16 53 Z" fill="#d94458"/>`
    ),
  },
  {
    id: 'sparkle-halo',
    label: 'Angel Halo',
    category: 'sparkles',
    src: svgSticker(
      '0 0 100 100',
      `<ellipse cx="50" cy="48" rx="36" ry="15" fill="none" stroke="#855a12" stroke-width="11"/>
       <ellipse cx="50" cy="48" rx="36" ry="15" fill="none" stroke="#ffd86b" stroke-width="6.5"/>
       <path d="M24 41 Q50 32 76 41" fill="none" stroke="#fff9d6" stroke-width="2.5" stroke-linecap="round"/>`
    ),
  },
  {
    id: 'sparkle-confetti',
    label: 'Star Burst',
    category: 'sparkles',
    src: svgSticker(
      '0 0 100 100',
      `<polygon points="50,12 58,36 84,36 63,51 71,76 50,61 29,76 37,51 16,36 42,36" fill="#ffd35c" stroke="#6b4b12" stroke-width="3" stroke-linejoin="round"/>
       <circle cx="22" cy="18" r="4" fill="#f5a3b5"/><circle cx="82" cy="20" r="3.5" fill="#82c9b8"/>
       <circle cx="80" cy="78" r="4.5" fill="#f5a3b5"/><circle cx="18" cy="76" r="3.5" fill="#82c9b8"/>`
    ),
  },

  // ── Vintage & Film ───────────────────────────────────────────────────────
  {
    id: 'vintage-washi-kraft',
    label: 'Kraft Tape',
    category: 'vintage',
    src: svgSticker(
      '0 0 140 60',
      `<polygon points="6,10 134,10 129,22 135,34 130,50 8,50 13,34 7,22" fill="#dcc29a" fill-opacity="0.9" stroke="#8a6d46" stroke-width="2"/>
       <line x1="20" y1="22" x2="118" y2="22" stroke="#b59467" stroke-width="1" stroke-dasharray="5 5"/>
       <line x1="22" y1="38" x2="120" y2="38" stroke="#b59467" stroke-width="1" stroke-dasharray="5 5"/>`,
      280,
      120
    ),
  },
  {
    id: 'vintage-washi-gingham',
    label: 'Pink Tape',
    category: 'vintage',
    src: svgSticker(
      '0 0 140 60',
      `<defs>
         <pattern id="g" width="16" height="16" patternUnits="userSpaceOnUse">
           <rect width="16" height="16" fill="#fdebed"/>
           <rect width="8" height="16" fill="#f4b6c2" fill-opacity="0.5"/>
           <rect width="16" height="8" fill="#f4b6c2" fill-opacity="0.5"/>
         </pattern>
       </defs>
       <polygon points="8,10 134,10 128,24 134,37 128,50 8,50 14,37 7,24" fill="url(#g)" stroke="#a86875" stroke-width="2"/>`,
      280,
      120
    ),
  },
  {
    id: 'vintage-camera',
    label: '35mm Camera',
    category: 'vintage',
    src: svgSticker(
      '0 0 100 100',
      `<rect x="12" y="28" width="76" height="52" rx="7" fill="#3a2c22" stroke="#1c140e" stroke-width="3"/>
       <rect x="12" y="28" width="76" height="18" rx="6" fill="#d8cbb8" stroke="#1c140e" stroke-width="3"/>
       <rect x="24" y="19" width="22" height="10" rx="2" fill="#c4a882" stroke="#1c140e" stroke-width="2.5"/>
       <circle cx="72" cy="24" r="4.5" fill="#c9463d" stroke="#1c140e" stroke-width="2"/>
       <circle cx="50" cy="56" r="18" fill="#8b735b" stroke="#1c140e" stroke-width="3"/>
       <circle cx="50" cy="56" r="11" fill="#222a30" stroke="#e8dcc8" stroke-width="2"/>
       <circle cx="46" cy="52" r="3" fill="#fff" opacity="0.6"/>`
    ),
  },
  {
    id: 'vintage-wax-seal',
    label: 'Wax Seal',
    category: 'vintage',
    src: svgSticker(
      '0 0 100 100',
      `<path d="M50 10 C60 12 69 9 76 17 C84 22 89 31 87 42 C91 52 87 64 81 72 C76 82 65 88 54 87 C44 92 31 87 24 79 C15 74 10 62 14 51 C9 40 15 27 24 21 C30 12 40 12 50 10 Z" fill="#9c2f2f" stroke="#591515" stroke-width="3"/>
       <circle cx="50" cy="50" r="24" fill="#b33939" stroke="#751d1d" stroke-width="2.5"/>
       <path d="M50 63 C39 55 37 46 42 41 C45 37 49 39 50 43 C51 39 55 37 58 41 C63 46 61 55 50 63 Z" fill="#e8b8b0"/>`
    ),
  },
  {
    id: 'vintage-stamp',
    label: 'Postage Stamp',
    category: 'vintage',
    src: svgSticker(
      '0 0 110 90',
      `<rect x="10" y="10" width="90" height="70" fill="#faf3e3" stroke="#5c3d1e" stroke-width="3" stroke-dasharray="4 4"/>
       <rect x="16" y="16" width="78" height="58" fill="none" stroke="#8b6914" stroke-width="1.8"/>
       <text x="55" y="38" text-anchor="middle" font-family="Courier New, monospace" font-size="11" font-weight="bold" fill="#5c3d1e">JELLY POST</text>
       <text x="55" y="56" text-anchor="middle" font-family="Georgia, serif" font-size="14" font-style="italic" fill="#8b6914">Memories</text>
       <text x="55" y="69" text-anchor="middle" font-family="Courier New, monospace" font-size="8" fill="#9e8e7e">AIR MAIL · 35MM</text>`,
      260,
      210
    ),
  },
  {
    id: 'vintage-rec',
    label: 'REC Badge',
    category: 'vintage',
    src: svgSticker(
      '0 0 120 52',
      `<rect x="6" y="6" width="108" height="40" rx="6" fill="#181412" stroke="#f5f0e8" stroke-width="2.5"/>
       <circle cx="28" cy="26" r="8" fill="#e53e3e"/>
       <text x="44" y="32" font-family="Courier New, monospace" font-size="18" font-weight="bold" fill="#faf6ee">REC</text>`,
      260,
      114
    ),
  },

  // ── Y2K & Doodles ────────────────────────────────────────────────────────
  {
    id: 'y2k-sunglasses',
    label: 'Star Shades',
    category: 'y2k',
    src: svgSticker(
      '0 0 120 70',
      `<path d="M8 22 H112 V30 H102 L94 52 C88 58 68 58 64 46 L60 32 L56 46 C52 58 32 58 26 52 L18 30 H8 Z" fill="#231c26" stroke="#f5a3b5" stroke-width="3.5" stroke-linejoin="round"/>
       <path d="M22 28 L34 28 L26 42 Z" fill="#fff" opacity="0.35"/>
       <path d="M68 28 L80 28 L72 42 Z" fill="#fff" opacity="0.35"/>`,
      260,
      150
    ),
  },
  {
    id: 'y2k-butterfly',
    label: 'Butterfly',
    category: 'y2k',
    src: svgSticker(
      '0 0 100 100',
      `<path d="M48 48 C28 16 10 24 14 44 C16 54 32 56 48 52 Z" fill="#b79ced" stroke="#3c2a63" stroke-width="2.8"/>
       <path d="M52 48 C72 16 90 24 86 44 C84 54 68 56 52 52 Z" fill="#b79ced" stroke="#3c2a63" stroke-width="2.8"/>
       <path d="M48 54 C24 58 18 78 32 84 C42 88 48 74 49 58 Z" fill="#d9c6fa" stroke="#3c2a63" stroke-width="2.8"/>
       <path d="M52 54 C76 58 82 78 68 84 C58 88 52 74 51 58 Z" fill="#d9c6fa" stroke="#3c2a63" stroke-width="2.8"/>
       <rect x="47" y="34" width="6" height="36" rx="3" fill="#3c2a63"/>
       <path d="M48 34 Q40 20 34 22" fill="none" stroke="#3c2a63" stroke-width="2.2" stroke-linecap="round"/>
       <path d="M52 34 Q60 20 66 22" fill="none" stroke="#3c2a63" stroke-width="2.2" stroke-linecap="round"/>`
    ),
  },
  {
    id: 'y2k-cassette',
    label: 'Mixtape',
    category: 'y2k',
    src: svgSticker(
      '0 0 120 84',
      `<rect x="8" y="10" width="104" height="64" rx="6" fill="#2c2420" stroke="#14100d" stroke-width="3"/>
       <rect x="16" y="18" width="88" height="32" rx="3" fill="#faf0dc"/>
       <rect x="16" y="18" width="88" height="10" rx="2" fill="#e67e6e"/>
       <circle cx="38" cy="36" r="6" fill="#2c2420"/><circle cx="82" cy="36" r="6" fill="#2c2420"/>
       <rect x="48" y="32" width="24" height="8" rx="2" fill="#5c3d1e"/>
       <polygon points="28,74 34,60 86,60 92,74" fill="#463932" stroke="#14100d" stroke-width="2"/>`,
      260,
      182
    ),
  },
  {
    id: 'y2k-cd',
    label: 'Retro CD',
    category: 'y2k',
    src: svgSticker(
      '0 0 100 100',
      `<circle cx="50" cy="50" r="40" fill="#d9ecff" stroke="#425870" stroke-width="3"/>
       <path d="M50 50 L22 22 A40 40 0 0 1 68 15 Z" fill="#f7b2bd" opacity="0.6"/>
       <path d="M50 50 L78 78 A40 40 0 0 1 32 85 Z" fill="#b4f0d4" opacity="0.6"/>
       <circle cx="50" cy="50" r="14" fill="#ffffff" stroke="#425870" stroke-width="2.5"/>
       <circle cx="50" cy="50" r="6" fill="#d9ecff" stroke="#425870" stroke-width="2"/>`
    ),
  },
  {
    id: 'y2k-smiley-flower',
    label: 'Smiley Flower',
    category: 'y2k',
    src: svgSticker(
      '0 0 100 100',
      `<circle cx="50" cy="20" r="14" fill="#ff9ebc" stroke="#5c2838" stroke-width="2.8"/>
       <circle cx="78" cy="38" r="14" fill="#ff9ebc" stroke="#5c2838" stroke-width="2.8"/>
       <circle cx="68" cy="74" r="14" fill="#ff9ebc" stroke="#5c2838" stroke-width="2.8"/>
       <circle cx="32" cy="74" r="14" fill="#ff9ebc" stroke="#5c2838" stroke-width="2.8"/>
       <circle cx="22" cy="38" r="14" fill="#ff9ebc" stroke="#5c2838" stroke-width="2.8"/>
       <circle cx="50" cy="50" r="20" fill="#ffe066" stroke="#5c2838" stroke-width="3"/>
       <circle cx="43" cy="46" r="2.8" fill="#5c2838"/><circle cx="57" cy="46" r="2.8" fill="#5c2838"/>
       <path d="M41 55 Q50 63 59 55" fill="none" stroke="#5c2838" stroke-width="2.8" stroke-linecap="round"/>`
    ),
  },
  {
    id: 'y2k-swirl',
    label: 'Swirl Doodle',
    category: 'y2k',
    src: svgSticker(
      '0 0 100 100',
      `<path d="M52 50 C52 44 59 44 59 50 C59 59 44 61 42 50 C40 36 64 33 67 50 C70 69 34 73 30 50 C25 24 76 19 80 50" fill="none" stroke="#fff7ec" stroke-width="9" stroke-linecap="round"/>
       <path d="M52 50 C52 44 59 44 59 50 C59 59 44 61 42 50 C40 36 64 33 67 50 C70 69 34 73 30 50 C25 24 76 19 80 50" fill="none" stroke="#d97757" stroke-width="4.5" stroke-linecap="round"/>`
    ),
  },

  // ── Word Stamps & Badges ─────────────────────────────────────────────────
  {
    id: 'word-besties',
    label: 'BESTIES',
    category: 'words',
    src: svgSticker(
      '0 0 160 64',
      `<rect x="6" y="8" width="148" height="48" rx="24" fill="#f7b2bd" stroke="#5c2633" stroke-width="3.5"/>
       <text x="80" y="39" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-weight="bold" letter-spacing="2" fill="#5c2633">BESTIES</text>`,
      320,
      128
    ),
  },
  {
    id: 'word-xoxo',
    label: 'XOXO',
    category: 'words',
    src: svgSticker(
      '0 0 140 64',
      `<rect x="6" y="8" width="128" height="48" rx="10" fill="#faf3e3" stroke="#b33939" stroke-width="3.5"/>
       <text x="70" y="40" text-anchor="middle" font-family="Courier New, monospace" font-size="26" font-weight="bold" letter-spacing="3" fill="#b33939">XOXO</text>`,
      280,
      128
    ),
  },
  {
    id: 'word-so-cute',
    label: 'SO CUTE!',
    category: 'words',
    src: svgSticker(
      '0 0 164 64',
      `<rect x="6" y="8" width="152" height="48" rx="8" fill="#ffe270" stroke="#5c3d1e" stroke-width="3.5"/>
       <text x="82" y="39" text-anchor="middle" font-family="Georgia, serif" font-size="20" font-weight="bold" letter-spacing="1.5" fill="#5c3d1e">SO CUTE!</text>`,
      320,
      128
    ),
  },
  {
    id: 'word-memories',
    label: 'MEMORIES',
    category: 'words',
    src: svgSticker(
      '0 0 176 64',
      `<rect x="6" y="8" width="164" height="48" rx="6" fill="#5c3d1e" stroke="#f5f0e8" stroke-width="3"/>
       <text x="88" y="38" text-anchor="middle" font-family="Courier New, monospace" font-size="18" font-weight="bold" letter-spacing="2" fill="#faf6ee">MEMORIES</text>`,
      340,
      124
    ),
  },
  {
    id: 'word-snap',
    label: 'SNAP!',
    category: 'words',
    src: svgSticker(
      '0 0 140 64',
      `<polygon points="12,12 128,6 134,52 8,58" fill="#d94e4e" stroke="#ffffff" stroke-width="3.5"/>
       <text x="71" y="39" text-anchor="middle" font-family="Georgia, serif" font-size="24" font-weight="bold" font-style="italic" letter-spacing="2" fill="#ffffff">SNAP!</text>`,
      280,
      128
    ),
  },
]

const CUSTOM_STICKER_STORAGE_KEY = 'jelly-custom-stickers-v1'

export function loadCustomStickers(): StickerAsset[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CUSTOM_STICKER_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveCustomStickers(stickers: StickerAsset[]) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CUSTOM_STICKER_STORAGE_KEY, JSON.stringify(stickers))
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Scales an uploaded meme/sticker image down to <= 440px while preserving
 * PNG transparency so it stores cleanly in localStorage and exports crisply.
 */
export function processUploadedSticker(file: File): Promise<StickerAsset> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read file'))
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      const img = new Image()
      img.onerror = () => reject(new Error('Invalid image file'))
      img.onload = () => {
        const maxDim = 440
        let w = img.naturalWidth || 256
        let h = img.naturalHeight || 256
        if (w > maxDim || h > maxDim) {
          const scale = maxDim / Math.max(w, h)
          w = Math.round(w * scale)
          h = Math.round(h * scale)
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Canvas unavailable'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        const optimizedSrc = canvas.toDataURL('image/png')
        const baseName = file.name.replace(/\.[^/.]+$/, '').slice(0, 18) || 'Meme'
        resolve({
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          label: baseName,
          category: 'custom',
          src: optimizedSrc,
          isCustom: true,
        })
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  })
}
