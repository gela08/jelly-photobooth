

// ── Filter types ──────────────────────────────────────────────────────────

export type FilterType =
  | 'none' | 'sepia' | 'bw' | 'warm' | 'grain' | 'faded'
  | 'cool' | 'golden' | 'noir' | 'dreamy' | 'lomo'
  | 'vintage90s' | 'y2k' | 'sunburn' | 'matte' | 'pinky'

// ── Layout types ──────────────────────────────────────────────────────────

export type LayoutType =
  // ─ Available for all pose counts ─
  | 'classic'          // Layout A/B/D: classic portrait strip (name on top, caption/date bottom)
  | 'classic_land'     // Classic strip — landscape orientation
  | 'wide_strip'       // Wide archival vertical strip (16:10 frames)
  | 'filmstrip'        // Film strip portrait — sprocket holes on both sides
  | 'filmstrip_land'   // Film strip — landscape orientation
  | 'postcard'         // 4×6 archival postcard with side editorial typography panel
  // ─ 2, 3, or 4 poses ─
  | 'double_cut'       // Twin side-by-side cut strips on a 4×6 print sheet
  // ─ 2 poses ─
  | 'twostrip'         // Layout J: 2 photos side by side in one wide frame
  | 'twostrip_land'    // Duo strip — landscape
  | 'overlap_2'        // Layered collage (1 large + 1 framed inset)
  | 'polaroid_2'       // 2 polaroids
  | 'diagonal_2'       // Diagonal 2 poses
  // ─ 3 poses ─
  | 'threestrip'       // Layout G: 3 photos side by side horizontal
  | 'threestrip_land'  // Triple strip — landscape
  | 'layout_h'         // Layout H: 1 large top-left + 2 smaller right column
  | 'banner_3'         // 1 wide top banner + 2 side-by-side bottom
  | 'triptych_3'       // 3 tall editorial vertical portrait windows
  | 'polaroid_3'       // 3 polaroids
  | 'diagonal_3'       // Diagonal 3 poses
  // ─ 4 poses ─
  | 'grid_4'           // 2×2 grid
  | 'grid_4_land'      // 2×2 grid landscape
  | 'bento_4'          // Asymmetric bento 2×2 mosaic
  | 'bookmark_4'       // Slim tall 4-cut bookmark strip
  | 'layout_e'         // Layout E: 1 large left + 3 stacked right
  | 'layout_9'         // Layout 9: 1 large top-left + 3 across bottom
  | 'polaroid_4'       // 4 polaroids scattered
  | 'diagonal_4'       // Diagonal 4 poses
  // ─ 6 poses ─
  | 'layout_3'         // Layout 3: 2×3 grid (3 cols × 2 rows)
  | 'layout_3_land'    // Layout 3 landscape
  | 'grid_6'           // 3×2 grid
  | 'collage_6'        // 1 large hero + 5 highlight frames
  | 'contact_6'        // 3×2 darkroom proof contact sheet

// ── Photo Framing Transform ───────────────────────────────────────────────

export interface PhotoTransform {
  /** Normalized pan offset X in [-1, 1] (0 = centered) */
  x: number
  /** Normalized pan offset Y in [-1, 1] (0 = centered) */
  y: number
  /** Zoom factor >= 1 (1 = cover fit) */
  zoom: number
}

export const DEFAULT_PHOTO_TRANSFORM: PhotoTransform = { x: 0, y: 0, zoom: 1 }

// ── Stickers ──────────────────────────────────────────────────────────────

export type StickerCategory =
  | 'cute'
  | 'sparkles'
  | 'vintage'
  | 'y2k'
  | 'words'
  | 'custom'

export interface StickerAsset {
  id: string
  label: string
  category: StickerCategory
  /** SVG data URL, uploaded image data URL, or /stickers/... public path */
  src: string
  isCustom?: boolean
  isPublicFile?: boolean
}

export interface PlacedSticker {
  uid: string
  assetId: string
  label: string
  src: string
  /** Normalized center X position [0..1] on the strip */
  x: number
  /** Normalized center Y position [0..1] on the strip */
  y: number
  /** Scale multiplier relative to default sticker size (0.35 .. 2.8) */
  scale: number
  /** Rotation in degrees (-180 .. 180) */
  rotation: number
}

// ── Strip Design System ───────────────────────────────────────────────────

export type StripThemeId =
  | 'auto'
  | 'studio_white'
  | 'vintage_cream'
  | 'film_noir'
  | 'pastel_pink'
  | 'rose_quartz'
  | 'butter_yellow'
  | 'lavender_milk'
  | 'baby_blue'
  | 'sage_matcha'
  | 'mint_retro'
  | 'cobalt_studio'
  | 'cherry_velvet'
  | 'espresso_roast'
  | 'matcha_dark'
  | 'peach_sorbet'
  | 'cotton_candy'
  | 'silver_chrome'
  | 'y2k_checker'
  | 'gingham_picnic'
  | 'gingham_sky'
  | 'polka_cream'
  | 'stripe_mocha'
  | 'midnight_stars'
  | 'kraft_scrapbook'
  | 'custom'

export type StripBorderStyle = 'classic' | 'rounded' | 'dashed' | 'none'

export type StripDecoration = 'none' | 'stars' | 'hearts' | 'corners' | 'sparkles'

// ── Live Motion & Video Session ───────────────────────────────────────────

export interface SessionVideoData {
  /** Per-pose captured burst frames (mirrored JPEG data URLs) spanning 1.5s before + still + 1.5s after */
  liveFramesPerPose: string[][]
  /** Index within each pose's liveFramesPerPose array where the shutter still occurs */
  shutterFrameIndex?: number
  /** Recorded full-session MediaRecorder Blob (used to slice ±1.5s Live Photo audio) */
  videoBlob?: Blob
  /** Recorded full-session MediaRecorder clip Blob URL (if supported) */
  videoUrl?: string
  /** Negotiated video MIME type (e.g. video/mp4 or video/webm) */
  videoMimeType?: string
  /** Suggested file extension ('mp4' | 'webm') */
  videoExt?: 'mp4' | 'webm'
  /** Elapsed recording duration in seconds */
  durationSec?: number
  /** Exact offset in ms from recording start when each pose shutter fired */
  poseShutterOffsetsMs?: number[]
  /** Whether microphone audio was captured into the recording */
  hasAudio?: boolean
  /** Non-fatal notice (e.g. mic denied or video codec unsupported) */
  warning?: string
}

// ── Session ───────────────────────────────────────────────────────────────

export interface PhotoSession {
  photos: string[]
  photoTransforms?: PhotoTransform[]
  filter: FilterType
  layout: LayoutType
  caption: string
  showDate: boolean
  poseCount: PoseCount
  stickers?: PlacedSticker[]
  stripTheme?: StripThemeId
  customStripColor?: string
  borderStyle?: StripBorderStyle
  stripDecoration?: StripDecoration
  liveFramesPerPose?: string[][]
  liveShutterFrameIndex?: number
}

// ── Setup options ─────────────────────────────────────────────────────────

export type PoseCount = 2 | 3 | 4 | 6
export type CountdownSeconds = 3 | 5 | 10

export const POSE_COUNT_OPTIONS: PoseCount[] = [2, 3, 4, 6]
export const COUNTDOWN_OPTIONS: CountdownSeconds[] = [3, 5, 10]

// ── Filter configs ────────────────────────────────────────────────────────

export interface FilterConfig {
  id: FilterType
  label: string
  cssFilter: string
  description: string
}

export const FILTERS: FilterConfig[] = [
  { id: 'none',       label: 'Original',    cssFilter: 'none', description: 'No filter' },
  { id: 'sepia',      label: 'Antique',     cssFilter: 'sepia(80%) contrast(1.1) brightness(1.05)', description: 'Classic sepia tones' },
  { id: 'bw',         label: 'B&W',         cssFilter: 'grayscale(100%) contrast(1.15) brightness(1.02)', description: 'Timeless black & white' },
  { id: 'warm',       label: 'Warm Retro',  cssFilter: 'sepia(30%) saturate(1.4) brightness(1.05) hue-rotate(-10deg)', description: 'Warm analog tones' },
  { id: 'grain',      label: 'Film Grain',  cssFilter: 'contrast(1.08) brightness(0.96) saturate(0.85)', description: 'Soft grainy film look' },
  { id: 'faded',      label: 'Faded',       cssFilter: 'contrast(0.85) brightness(1.12) saturate(0.7) sepia(15%)', description: 'Washed-out vintage' },
  { id: 'cool',       label: 'Cool Tone',   cssFilter: 'hue-rotate(180deg) saturate(0.8) brightness(1.05) contrast(1.05)', description: 'Cool blue vintage' },
  { id: 'golden',     label: 'Golden Hour', cssFilter: 'sepia(50%) saturate(1.6) brightness(1.1) hue-rotate(-20deg) contrast(1.05)', description: 'Warm golden tones' },
  { id: 'noir',       label: 'Noir',        cssFilter: 'grayscale(100%) contrast(1.4) brightness(0.88)', description: 'High-contrast noir' },
  { id: 'dreamy',     label: 'Dreamy',      cssFilter: 'brightness(1.15) saturate(1.3) contrast(0.9) hue-rotate(10deg)', description: 'Soft pastel dream' },
  { id: 'lomo',       label: 'Lomo',        cssFilter: 'saturate(1.8) contrast(1.3) brightness(0.92) hue-rotate(-5deg)', description: 'Vivid lomography' },
  { id: 'vintage90s', label: '90s Vibes',   cssFilter: 'sepia(20%) saturate(1.5) contrast(1.1) brightness(1.05) hue-rotate(5deg)', description: 'Nostalgic 90s print' },
  { id: 'y2k',        label: 'Y2K',         cssFilter: 'saturate(1.6) brightness(1.1) contrast(1.15) hue-rotate(15deg)', description: 'Early 2000s glossy' },
  { id: 'sunburn',    label: 'Sunburn',     cssFilter: 'sepia(40%) saturate(2) brightness(1.15) contrast(0.95) hue-rotate(-15deg)', description: 'Overexposed summer' },
  { id: 'matte',      label: 'Matte',       cssFilter: 'contrast(0.9) brightness(1.08) saturate(0.75)', description: 'Flat matte finish' },
  { id: 'pinky',      label: 'Pinky',       cssFilter: 'sepia(15%) saturate(1.4) brightness(1.08) hue-rotate(320deg) contrast(1.05)', description: 'Rose-tinted & soft' },
]

// ── Layout configs ────────────────────────────────────────────────────────

export interface LayoutConfig {
  id: LayoutType
  label: string
  description: string
  poses: PoseCount[]
  /** true if this is a side-by-side horizontal strip — shows positioning guide */
  isDuoOrTriple?: boolean
  orientation?: 'portrait' | 'landscape'
}

export const ALL_LAYOUTS: LayoutConfig[] = [
  // ─ All poses ─────────────────────────────────────────────────────────────
  { id: 'classic',        label: 'Classic Strip',      description: 'Portrait strip — name on top, caption below',      poses: [2, 3, 4, 6] },
  { id: 'classic_land',   label: 'Classic Strip (H)',   description: 'Landscape classic strip',                           poses: [2, 3, 4, 6], orientation: 'landscape' },
  { id: 'wide_strip',     label: 'Wide Strip',          description: 'Archival 16:10 wide editorial strip',               poses: [2, 3, 4, 6] },
  { id: 'filmstrip',      label: 'Film Strip',          description: 'Retro film with sprocket holes — portrait',         poses: [2, 3, 4, 6] },
  { id: 'filmstrip_land', label: 'Film Strip (H)',       description: 'Retro film strip — landscape',                      poses: [2, 3, 4, 6], orientation: 'landscape' },
  { id: 'postcard',       label: 'Postcard',            description: '4×6 archival postcard with side typography panel',  poses: [2, 3, 4, 6], orientation: 'landscape' },
  // ─ 2, 3, or 4 poses ──────────────────────────────────────────────────────
  { id: 'double_cut',     label: 'Double Cut (2×)',     description: 'Two matching strips side-by-side to cut & share',   poses: [2, 3, 4] },
  // ─ 2 poses ───────────────────────────────────────────────────────────────
  { id: 'twostrip',       label: 'Duo Strip',           description: 'Two photos side by side (Layout J)',                poses: [2], isDuoOrTriple: true },
  { id: 'twostrip_land',  label: 'Duo Strip (H)',        description: 'Duo strip — landscape',                             poses: [2], isDuoOrTriple: true, orientation: 'landscape' },
  { id: 'overlap_2',      label: 'Layered Duo',         description: 'Large hero portrait with overlapping inset frame',  poses: [2] },
  { id: 'polaroid_2',     label: 'Polaroids',           description: 'Two scattered polaroid frames',                     poses: [2] },
  { id: 'diagonal_2',     label: 'Diagonal',            description: 'Staggered offset composition',                      poses: [2] },
  // ─ 3 poses ───────────────────────────────────────────────────────────────
  { id: 'threestrip',     label: 'Triple Strip',        description: 'Three photos side by side (Layout G)',              poses: [3], isDuoOrTriple: true },
  { id: 'threestrip_land',label: 'Triple Strip (H)',     description: 'Triple strip — landscape',                          poses: [3], isDuoOrTriple: true, orientation: 'landscape' },
  { id: 'layout_h',       label: '1+2 Feature',         description: '1 large top-left + 2 smaller right column',         poses: [3] },
  { id: 'banner_3',       label: 'Top Banner',          description: 'Wide hero frame on top + 2 side-by-side below',     poses: [3] },
  { id: 'triptych_3',     label: 'Tall Triptych',       description: 'Three tall vertical editorial portrait panels',     poses: [3], orientation: 'landscape' },
  { id: 'polaroid_3',     label: 'Polaroids',           description: 'Three scattered polaroid frames',                   poses: [3] },
  { id: 'diagonal_3',     label: 'Diagonal',            description: 'Staggered offset composition',                      poses: [3] },
  // ─ 4 poses ───────────────────────────────────────────────────────────────
  { id: 'grid_4',         label: '2×2 Grid',            description: '4 photos in equal 2×2 grid',                        poses: [4] },
  { id: 'grid_4_land',    label: '2×2 Grid (H)',         description: '2×2 grid — landscape',                              poses: [4], orientation: 'landscape' },
  { id: 'bento_4',        label: 'Bento Mosaic',        description: 'Asymmetric wide & portrait editorial mosaic',       poses: [4] },
  { id: 'bookmark_4',     label: 'Slim Booth',          description: 'Tall slim 4-cut Life4Cuts-style portrait strip',    poses: [4] },
  { id: 'layout_e',       label: 'Feature Left',        description: '1 large left + 3 stacked right (Layout E)',         poses: [4] },
  { id: 'layout_9',       label: 'Feature Top',         description: '1 large top-left + 3 across bottom (Layout 9)',     poses: [4] },
  { id: 'polaroid_4',     label: 'Polaroids',           description: 'Four scattered polaroid frames',                    poses: [4] },
  { id: 'diagonal_4',     label: 'Diagonal',            description: 'Staggered offset composition',                      poses: [4] },
  // ─ 6 poses ───────────────────────────────────────────────────────────────
  { id: 'layout_3',       label: '2×3 Grid',            description: '6 photos in 2 rows × 3 columns (Layout 3)',         poses: [6] },
  { id: 'layout_3_land',  label: '2×3 Grid (H)',         description: '2×3 grid — landscape',                              poses: [6], orientation: 'landscape' },
  { id: 'grid_6',         label: '3×2 Grid',            description: '6 photos in 3 rows × 2 columns',                   poses: [6] },
  { id: 'collage_6',      label: 'Highlight 1+5',       description: '1 large hero feature + 5 surrounding frames',       poses: [6] },
  { id: 'contact_6',      label: 'Proof Sheet',         description: 'Darkroom 3×2 contact sheet with frame codes',       poses: [6], orientation: 'landscape' },
]

export function getLayoutsForPoseCount(poseCount: PoseCount): LayoutConfig[] {
  return ALL_LAYOUTS.filter((l) => l.poses.includes(poseCount))
}

export function getDefaultLayout(poseCount: PoseCount): LayoutType {
  const available = getLayoutsForPoseCount(poseCount)
  return available[0]?.id ?? 'classic'
}

/**
 * Returns the exact target aspect ratio (width / height) of each photo slot
 * for a given layout, matching the dimensions used in canvasExport.ts.
 */
export function getLayoutSlotAspectRatios(layout: LayoutType, poseCount: PoseCount): number[] {
  const fill = (ratio: number) => Array.from({ length: poseCount }, () => ratio)

  switch (layout) {
    case 'classic':
      return fill(200 / 150) // 4:3
    case 'classic_land':
      return fill(280 / 160) // 7:4
    case 'wide_strip':
      return fill(240 / 150) // 16:10
    case 'double_cut':
      return fill(165 / 124) // ~4:3
    case 'postcard':
      return fill(4 / 3) // exact 4:3 across 2, 3, 4, 6
    case 'filmstrip':
      return fill(220 / 165) // 4:3
    case 'filmstrip_land':
      return fill(240 / 160) // 3:2
    case 'twostrip':
      return fill(220 / 310) // ~0.71 portrait
    case 'twostrip_land':
      return fill(380 / 214) // ~16:9
    case 'overlap_2':
      return [360 / 270, 216 / 162] // both 4:3
    case 'threestrip':
      return fill(160 / 248) // ~0.645 portrait
    case 'threestrip_land':
      return fill(380 / 180) // ~2.11 landscape
    case 'layout_h':
      return [280 / 210, 160 / 95, 160 / 95]
    case 'banner_3':
      return [430 / 215, 205 / 165, 205 / 165]
    case 'triptych_3':
      return fill(156 / 260) // 3:5 portrait
    case 'grid_4':
      return fill(220 / 165) // 4:3
    case 'grid_4_land':
      return fill(280 / 190)
    case 'bento_4':
      return [280 / 180, 160 / 180, 160 / 180, 280 / 180]
    case 'bookmark_4':
      return fill(160 / 192) // 5:6 slim portrait
    case 'layout_e': {
      const smallH = (310 - 8 * 4.5) / 3
      return [330 / 310, 150 / smallH, 150 / smallH, 150 / smallH]
    }
    case 'layout_9': {
      const totalW = 24 + 480 + 5 * 2 + 24
      const smallW = (totalW - 24 * 2 - 5 * 6 - 10 * 2) / 3
      return [480 / 320, smallW / 130, smallW / 130, smallW / 130]
    }
    case 'layout_3':
      return fill(175 / 132)
    case 'layout_3_land':
      return fill(210 / 158)
    case 'grid_6':
      return fill(220 / 165)
    case 'collage_6':
      return [290 / 250, 135 / 115, 135 / 115, 135 / 112, 135 / 112, 135 / 112]
    case 'contact_6':
      return fill(196 / 147) // 4:3
    case 'polaroid_2':
    case 'polaroid_3':
    case 'polaroid_4':
      return fill(200 / 150) // 4:3
    case 'diagonal_2':
    case 'diagonal_3':
    case 'diagonal_4':
      return fill(260 / 195) // 4:3
    default:
      return fill(4 / 3)
  }
}
