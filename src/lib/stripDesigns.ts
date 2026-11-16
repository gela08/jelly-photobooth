import { StripBorderStyle, StripDecoration, StripThemeId } from './types'

export type StripPatternType =
  | 'solid'
  | 'paper'
  | 'checker'
  | 'gingham'
  | 'starfield'
  | 'kraft'
  | 'gradient'
  | 'polka'
  | 'stripe'

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
    id: 'studio_white',
    label: 'Studio White',
    description: 'Crisp gallery white stock with charcoal archival ink',
    swatchBg: '#ffffff',
    bgPrimary: '#ffffff',
    pattern: 'paper',
    isDark: false,
    titleColor: '#26211d',
    captionColor: '#594e45',
    dateColor: '#85796e',
    dividerColor: 'rgba(38,33,29,0.16)',
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
    id: 'rose_quartz',
    label: 'Rose Quartz',
    description: 'Dusty velvet rose with deep berry ink',
    swatchBg: '#f2c6d0',
    bgPrimary: '#f2c6d0',
    bgSecondary: '#e5aebc',
    pattern: 'paper',
    isDark: false,
    titleColor: '#5f1d2e',
    captionColor: '#823247',
    dateColor: '#7e4856',
    dividerColor: 'rgba(95,29,46,0.22)',
    frameColor: '#fffafb',
  },
  {
    id: 'butter_yellow',
    label: 'Buttercream',
    description: 'Soft pastel lemon butter with caramel ink',
    swatchBg: '#fdf3c7',
    bgPrimary: '#fdf3c7',
    bgSecondary: '#f5e4a3',
    pattern: 'paper',
    isDark: false,
    titleColor: '#5e4312',
    captionColor: '#88631f',
    dateColor: '#8c723f',
    dividerColor: 'rgba(94,67,18,0.22)',
    frameColor: '#fffef9',
  },
  {
    id: 'lavender_milk',
    label: 'Lavender Milk',
    description: 'Dreamy pastel lilac with muted plum ink',
    swatchBg: '#ede4fa',
    bgPrimary: '#ede4fa',
    bgSecondary: '#dcccf5',
    pattern: 'paper',
    isDark: false,
    titleColor: '#482d6b',
    captionColor: '#694796',
    dateColor: '#786299',
    dividerColor: 'rgba(72,45,107,0.22)',
    frameColor: '#fdfcff',
  },
  {
    id: 'baby_blue',
    label: 'Powder Sky',
    description: 'Airy baby blue paper with slate-navy ink',
    swatchBg: '#e1effa',
    bgPrimary: '#e1effa',
    bgSecondary: '#c7e0f5',
    pattern: 'paper',
    isDark: false,
    titleColor: '#1f3f5e',
    captionColor: '#37628a',
    dateColor: '#5c7c99',
    dividerColor: 'rgba(31,63,94,0.22)',
    frameColor: '#ffffff',
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
  {
    id: 'sage_matcha',
    label: 'Matcha Latte',
    description: 'Earthy soft matcha green cardstock',
    swatchBg: '#dfe8d5',
    bgPrimary: '#dfe8d5',
    bgSecondary: '#c7d6b8',
    pattern: 'paper',
    isDark: false,
    titleColor: '#2e4422',
    captionColor: '#486637',
    dateColor: '#647d56',
    dividerColor: 'rgba(46,68,34,0.22)',
    frameColor: '#fcfef9',
  },
  {
    id: 'cobalt_studio',
    label: 'Cobalt Ink',
    description: 'Deep studio cobalt blue with crisp ivory text',
    swatchBg: '#16306e',
    bgPrimary: '#16306e',
    pattern: 'solid',
    isDark: true,
    titleColor: '#f6f8ff',
    captionColor: '#bfd4ff',
    dateColor: '#98b4eb',
    dividerColor: 'rgba(246,248,255,0.24)',
    frameColor: '#ffffff',
  },
  {
    id: 'cherry_velvet',
    label: 'Cherry Cola',
    description: 'Rich burgundy wine stock with champagne text',
    swatchBg: '#4a1420',
    bgPrimary: '#4a1420',
    pattern: 'solid',
    isDark: true,
    titleColor: '#fbe9ec',
    captionColor: '#f2b8c6',
    dateColor: '#cfa0ac',
    dividerColor: 'rgba(251,233,236,0.25)',
    frameColor: '#fff9fa',
  },
  {
    id: 'espresso_roast',
    label: 'Espresso',
    description: 'Deep roasted cocoa brown with warm oat ink',
    swatchBg: '#2c1b12',
    bgPrimary: '#2c1b12',
    pattern: 'solid',
    isDark: true,
    titleColor: '#f5ebd9',
    captionColor: '#dec29b',
    dateColor: '#a68c72',
    dividerColor: 'rgba(245,235,217,0.24)',
    frameColor: '#faf5ec',
  },
  {
    id: 'matcha_dark',
    label: 'Forest Pine',
    description: 'Deep botanical evergreen with warm cream text',
    swatchBg: '#173026',
    bgPrimary: '#173026',
    pattern: 'solid',
    isDark: true,
    titleColor: '#f2efe6',
    captionColor: '#c7dec9',
    dateColor: '#93b098',
    dividerColor: 'rgba(242,239,230,0.24)',
    frameColor: '#fafcf8',
  },
  {
    id: 'peach_sorbet',
    label: 'Peach Sunset',
    description: 'Warm peach-to-coral sunlit wash gradient',
    swatchBg: 'linear-gradient(180deg, #ffe5d6 0%, #f7bfa8 100%)',
    bgPrimary: '#ffe5d6',
    bgSecondary: '#f7bfa8',
    pattern: 'gradient',
    isDark: false,
    titleColor: '#692d1c',
    captionColor: '#94452e',
    dateColor: '#8c5a4b',
    dividerColor: 'rgba(105,45,28,0.22)',
    frameColor: '#fffaf7',
  },
  {
    id: 'cotton_candy',
    label: 'Cotton Candy',
    description: 'Soft rose pink fading into powder sky blue',
    swatchBg: 'linear-gradient(180deg, #fadce9 0%, #d9e9fd 100%)',
    bgPrimary: '#fadce9',
    bgSecondary: '#d9e9fd',
    pattern: 'gradient',
    isDark: false,
    titleColor: '#432d5e',
    captionColor: '#674b8c',
    dateColor: '#6c6687',
    dividerColor: 'rgba(67,45,94,0.2)',
    frameColor: '#ffffff',
  },
  {
    id: 'silver_chrome',
    label: 'Y2K Silver',
    description: 'Cool brushed metallic silver gradient',
    swatchBg: 'linear-gradient(180deg, #eef1f5 0%, #cdd5df 100%)',
    bgPrimary: '#eef1f5',
    bgSecondary: '#cdd5df',
    pattern: 'gradient',
    isDark: false,
    titleColor: '#222a36',
    captionColor: '#465266',
    dateColor: '#637085',
    dividerColor: 'rgba(34,42,54,0.2)',
    frameColor: '#ffffff',
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
    label: 'Berry Gingham',
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
    id: 'gingham_sky',
    label: 'Sky Gingham',
    description: 'Crisp picnic blue & cream gingham check',
    swatchBg: 'linear-gradient(90deg, rgba(164,206,245,0.48) 50%, transparent 50%), linear-gradient(rgba(164,206,245,0.48) 50%, #f5faff 50%)',
    bgPrimary: '#f5faff',
    bgSecondary: '#b5d6f5',
    pattern: 'gingham',
    isDark: false,
    titleColor: '#1f426b',
    captionColor: '#36659c',
    dateColor: '#5a7ea6',
    dividerColor: 'rgba(31,66,107,0.22)',
    frameColor: '#ffffff',
  },
  {
    id: 'polka_cream',
    label: 'Polka Cream',
    description: 'Warm oat cream dotted with soft caramel polka dots',
    swatchBg: 'radial-gradient(circle, #d6b694 22%, transparent 23%) 0 0 / 12px 12px, #fbf5eb',
    bgPrimary: '#fbf5eb',
    bgSecondary: '#d8b998',
    pattern: 'polka',
    isDark: false,
    titleColor: '#523419',
    captionColor: '#7a522c',
    dateColor: '#8c6d4e',
    dividerColor: 'rgba(82,52,25,0.22)',
    frameColor: '#ffffff',
  },
  {
    id: 'stripe_mocha',
    label: 'Pinstripe',
    description: 'Classic editorial oat & latte pinstripes',
    swatchBg: 'repeating-linear-gradient(90deg, #f8f2e8 0 6px, #e8dac6 6px 12px)',
    bgPrimary: '#f8f2e8',
    bgSecondary: '#e8dac6',
    pattern: 'stripe',
    isDark: false,
    titleColor: '#4c321c',
    captionColor: '#734f30',
    dateColor: '#856b52',
    dividerColor: 'rgba(76,50,28,0.22)',
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
]

export function buildCustomStripTheme(rawHex?: string): StripThemeConfig {
  const validHex =
    typeof rawHex === 'string' && /^#[0-9a-fA-F]{6}$/.test(rawHex.trim())
      ? rawHex.trim()
      : '#e8d5c4'

  const r = parseInt(validHex.slice(1, 3), 16)
  const g = parseInt(validHex.slice(3, 5), 16)
  const b = parseInt(validHex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const isDark = luminance < 0.5

  return {
    id: 'custom',
    label: 'Custom Color',
    description: `Custom tinted strip (${validHex.toUpperCase()})`,
    swatchBg: validHex,
    bgPrimary: validHex,
    pattern: 'paper',
    isDark,
    titleColor: isDark ? '#f8f4ec' : '#261b12',
    captionColor: isDark ? '#e6d3b3' : '#5c3d1e',
    dateColor: isDark ? 'rgba(248,244,236,0.72)' : 'rgba(38,27,18,0.68)',
    dividerColor: isDark ? 'rgba(248,244,236,0.26)' : 'rgba(38,27,18,0.22)',
    frameColor: '#ffffff',
  }
}

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

export function getStripTheme(id?: StripThemeId, customHex?: string): StripThemeConfig {
  if (id === 'custom') {
    return buildCustomStripTheme(customHex)
  }
  return STRIP_THEMES.find((t) => t.id === id) ?? STRIP_THEMES[0]
}
