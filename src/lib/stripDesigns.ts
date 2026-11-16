import { StripBorderStyle, StripDecoration, StripThemeId } from './types'

export type StripPatternType = 'solid' | 'paper' | 'checker' | 'gingham' | 'starfield' | 'kraft'

export interface StripThemeConfig {
  id: StripThemeId
  label: string
  description: string
  /** CSS swatch preview background for UI selector */
  swatchBg: string
  bgPrimary: string
  bgSecondary?: string
  pattern: StripPatternType
  isDark: boolean
  titleColor: string
  captionColor: string
  dateColor: string
  dividerColor: string
  frameColor: string
}

export const STRIP_THEMES: StripThemeConfig[] = [
  {
    id: 'auto',
    label: 'Layout Default',
    description: 'Uses each layout’s signature paper or film style',
    swatchBg: 'linear-gradient(135deg, #f5f0e8 50%, #121010 50%)',
    bgPrimary: '#f5f0e8',
    pattern: 'paper',
    isDark: false,
    titleColor: '#5c3d1e',
    captionColor: '#8b6914',
    dateColor: '#9e8e7e',
    dividerColor: 'rgba(92,61,30,0.2)',
    frameColor: '#ffffff',
  },
  {
    id: 'vintage_cream',
    label: 'Vintage Cream',
    description: 'Warm archival paper with sepia ink',
    swatchBg: '#f5f0e8',
    bgPrimary: '#f5f0e8',
    pattern: 'paper',
    isDark: false,
    titleColor: '#5c3d1e',
    captionColor: '#8b6914',
    dateColor: '#9e8e7e',
    dividerColor: 'rgba(139,105,20,0.28)',
    frameColor: '#ffffff',
  },
  {
    id: 'film_noir',
    label: 'Darkroom',
    description: 'Matte black film stock with warm gold text',
    swatchBg: '#121010',
    bgPrimary: '#121010',
    pattern: 'solid',
    isDark: true,
    titleColor: '#f5f0e8',
    captionColor: '#c4a882',
    dateColor: '#8a7a6a',
    dividerColor: 'rgba(196,168,130,0.3)',
    frameColor: '#faf6ee',
  },
  {
    id: 'pastel_pink',
    label: 'Blush Milk',
    description: 'Soft strawberry milk pastel paper',
    swatchBg: '#fbe8ec',
    bgPrimary: '#fbe8ec',
    bgSecondary: '#f3d2da',
    pattern: 'paper',
    isDark: false,
    titleColor: '#7a3548',
    captionColor: '#a64d64',
    dateColor: '#9c6e7a',
    dividerColor: 'rgba(122,53,72,0.22)',
    frameColor: '#fffcfd',
  },
  {
    id: 'y2k_checker',
    label: 'Y2K Checker',
    description: 'Playful cream & cocoa checkerboard',
    swatchBg: 'repeating-conic-gradient(#f5ead8 0% 25%, #d6bf9e 0% 50%) 50% / 14px 14px',
    bgPrimary: '#f5ead8',
    bgSecondary: '#e5d1b4',
    pattern: 'checker',
    isDark: false,
    titleColor: '#472c14',
    captionColor: '#6e4722',
    dateColor: '#7c5d41',
    dividerColor: 'rgba(71,44,20,0.28)',
    frameColor: '#ffffff',
  },
  {
    id: 'gingham_picnic',
    label: 'Gingham',
    description: 'Sweet strawberry-cream gingham plaid',
    swatchBg: 'linear-gradient(90deg, rgba(240,176,188,0.45) 50%, transparent 50%), linear-gradient(rgba(240,176,188,0.45) 50%, #fff7f8 50%)',
    bgPrimary: '#fff7f8',
    bgSecondary: '#f7ccd5',
    pattern: 'gingham',
    isDark: false,
    titleColor: '#7a2e40',
    captionColor: '#a8475e',
    dateColor: '#9e6b77',
    dividerColor: 'rgba(122,46,64,0.22)',
    frameColor: '#ffffff',
  },
  {
    id: 'midnight_stars',
    label: 'Midnight Sky',
    description: 'Deep starry navy with silver-gold accents',
    swatchBg: 'radial-gradient(circle at 30% 30%, #2a335c, #13172b)',
    bgPrimary: '#14182b',
    bgSecondary: '#2a335c',
    pattern: 'starfield',
    isDark: true,
    titleColor: '#f7ebd2',
    captionColor: '#ffd98e',
    dateColor: '#9ba6cc',
    dividerColor: 'rgba(247,235,210,0.25)',
    frameColor: '#faf6ee',
  },
  {
    id: 'kraft_scrapbook',
    label: 'Kraft Paper',
    description: 'Warm recycled scrapbook cardstock',
    swatchBg: '#d8be98',
    bgPrimary: '#d8be98',
    bgSecondary: '#bfa074',
    pattern: 'kraft',
    isDark: false,
    titleColor: '#3d2511',
    captionColor: '#5c3a1c',
    dateColor: '#6e5237',
    dividerColor: 'rgba(61,37,17,0.28)',
    frameColor: '#fdfaf3',
  },
  {
    id: 'mint_retro',
    label: 'Mint Soda',
    description: 'Cool pastel mint with espresso ink',
    swatchBg: '#dff0e7',
    bgPrimary: '#dff0e7',
    bgSecondary: '#c2dfd0',
    pattern: 'paper',
    isDark: false,
    titleColor: '#294c3c',
    captionColor: '#3e6e58',
    dateColor: '#628574',
    dividerColor: 'rgba(41,76,60,0.22)',
    frameColor: '#ffffff',
  },
]

export interface StripBorderConfig {
  id: StripBorderStyle
  label: string
}

export const STRIP_BORDERS: StripBorderConfig[] = [
  { id: 'classic', label: 'Classic Mat' },
  { id: 'rounded', label: 'Soft Rounded' },
  { id: 'dashed', label: 'Scrapbook' },
  { id: 'none', label: 'Borderless' },
]

export interface StripDecorationConfig {
  id: StripDecoration
  label: string
}

export const STRIP_DECORATIONS: StripDecorationConfig[] = [
  { id: 'none', label: 'Clean' },
  { id: 'corners', label: 'Photo Corners' },
  { id: 'stars', label: 'Stars' },
  { id: 'hearts', label: 'Hearts' },
  { id: 'sparkles', label: 'Sparkles' },
]

export function getStripTheme(id?: StripThemeId): StripThemeConfig {
  return STRIP_THEMES.find((t) => t.id === id) ?? STRIP_THEMES[0]
}
