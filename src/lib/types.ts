

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
  | 'filmstrip'        // Film strip portrait — sprocket holes on both sides
  | 'filmstrip_land'   // Film strip — landscape orientation
  // ─ 2 poses ─
  | 'twostrip'         // Layout J: 2 photos side by side in one wide frame
  | 'twostrip_land'    // Duo strip — landscape
  | 'polaroid_2'       // 2 polaroids
  | 'diagonal_2'       // Diagonal 2 poses
  // ─ 3 poses ─
  | 'threestrip'       // Layout G: 3 photos side by side horizontal
  | 'threestrip_land'  // Triple strip — landscape
  | 'layout_h'         // Layout H: 1 large top-left + 2 smaller right column
  | 'polaroid_3'       // 3 polaroids
  | 'diagonal_3'       // Diagonal 3 poses
  // ─ 4 poses ─
  | 'grid_4'           // 2×2 grid
  | 'grid_4_land'      // 2×2 grid landscape
  | 'layout_e'         // Layout E: 1 large left + 3 stacked right
  | 'layout_9'         // Layout 9: 1 large top-left + 3 across bottom
  | 'polaroid_4'       // 4 polaroids scattered
  | 'diagonal_4'       // Diagonal 4 poses
  // ─ 6 poses ─
  | 'layout_3'         // Layout 3: 2×3 grid (3 cols × 2 rows)
  | 'layout_3_land'    // Layout 3 landscape
  | 'grid_6'           // 3×2 grid (kept for compat)

// ── Session ───────────────────────────────────────────────────────────────

export interface PhotoSession {
  photos: string[]
  filter: FilterType
  layout: LayoutType
  caption: string
  showDate: boolean
  poseCount: PoseCount
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
  { id: 'filmstrip',      label: 'Film Strip',          description: 'Retro film with sprocket holes — portrait',         poses: [2, 3, 4, 6] },
  { id: 'filmstrip_land', label: 'Film Strip (H)',       description: 'Retro film strip — landscape',                      poses: [2, 3, 4, 6], orientation: 'landscape' },
  // ─ 2 poses ───────────────────────────────────────────────────────────────
  { id: 'twostrip',       label: 'Duo Strip',           description: 'Two photos side by side (Layout J)',                poses: [2], isDuoOrTriple: true },
  { id: 'twostrip_land',  label: 'Duo Strip (H)',        description: 'Duo strip — landscape',                             poses: [2], isDuoOrTriple: true, orientation: 'landscape' },
  { id: 'polaroid_2',     label: 'Polaroids',           description: 'Two scattered polaroid frames',                     poses: [2] },
  { id: 'diagonal_2',     label: 'Diagonal',            description: 'Staggered offset composition',                      poses: [2] },
  // ─ 3 poses ───────────────────────────────────────────────────────────────
  { id: 'threestrip',     label: 'Triple Strip',        description: 'Three photos side by side (Layout G)',              poses: [3], isDuoOrTriple: true },
  { id: 'threestrip_land',label: 'Triple Strip (H)',     description: 'Triple strip — landscape',                          poses: [3], isDuoOrTriple: true, orientation: 'landscape' },
  { id: 'layout_h',       label: '1+2 Feature',         description: '1 large top-left + 2 smaller right column',         poses: [3] },
  { id: 'polaroid_3',     label: 'Polaroids',           description: 'Three scattered polaroid frames',                   poses: [3] },
  { id: 'diagonal_3',     label: 'Diagonal',            description: 'Staggered offset composition',                      poses: [3] },
  // ─ 4 poses ───────────────────────────────────────────────────────────────
  { id: 'grid_4',         label: '2×2 Grid',            description: '4 photos in equal 2×2 grid',                        poses: [4] },
  { id: 'grid_4_land',    label: '2×2 Grid (H)',         description: '2×2 grid — landscape',                              poses: [4], orientation: 'landscape' },
  { id: 'layout_e',       label: 'Feature Left',        description: '1 large left + 3 stacked right (Layout E)',         poses: [4] },
  { id: 'layout_9',       label: 'Feature Top',         description: '1 large top-left + 3 across bottom (Layout 9)',     poses: [4] },
  { id: 'polaroid_4',     label: 'Polaroids',           description: 'Four scattered polaroid frames',                    poses: [4] },
  { id: 'diagonal_4',     label: 'Diagonal',            description: 'Staggered offset composition',                      poses: [4] },
  // ─ 6 poses ───────────────────────────────────────────────────────────────
  { id: 'layout_3',       label: '2×3 Grid',            description: '6 photos in 2 rows × 3 columns (Layout 3)',         poses: [6] },
  { id: 'layout_3_land',  label: '2×3 Grid (H)',         description: '2×3 grid — landscape',                              poses: [6], orientation: 'landscape' },
  { id: 'grid_6',         label: '3×2 Grid',            description: '6 photos in 3 rows × 2 columns',                   poses: [6] },
]

export function getLayoutsForPoseCount(poseCount: PoseCount): LayoutConfig[] {
  return ALL_LAYOUTS.filter((l) => l.poses.includes(poseCount))
}

export function getDefaultLayout(poseCount: PoseCount): LayoutType {
  const available = getLayoutsForPoseCount(poseCount)
  return available[0]?.id ?? 'classic'
}
