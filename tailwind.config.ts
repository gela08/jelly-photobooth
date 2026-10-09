import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-playfair)', 'Georgia', 'serif'],
        body: ['var(--font-crimson)', 'Georgia', 'serif'],
      },
      colors: {
        cream: 'var(--cream)',
        parchment: 'var(--parchment)',
        sepia: 'var(--sepia)',
        'vintage-brown': 'var(--vintage-brown)',
        'vintage-pink': 'var(--vintage-pink)',
        'warm-gray': 'var(--warm-gray)',
        'film-dark': 'var(--film-dark)',
        'aged-white': 'var(--aged-white)',
      },
    },
  },
  plugins: [],
}
export default config
