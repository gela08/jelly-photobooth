declare module 'gifenc' {
  export type PaletteColor = number[]
  export type Palette = PaletteColor[]

  export interface GIFWriteFrameOptions {
    transparent?: boolean
    transparentIndex?: number
    delay?: number
    palette?: Palette | null
    repeat?: number
    colorDepth?: number
    dispose?: number
    first?: boolean
  }

  export interface GIFEncoderInstance {
    reset(): void
    finish(): void
    bytes(): Uint8Array
    bytesView(): Uint8Array
    writeHeader(): void
    writeFrame(
      index: Uint8Array | Uint8ClampedArray,
      width: number,
      height: number,
      opts?: GIFWriteFrameOptions
    ): void
  }

  export function GIFEncoder(opt?: {
    initialCapacity?: number
    auto?: boolean
  }): GIFEncoderInstance

  export function quantize(
    rgba: Uint8Array | Uint8ClampedArray,
    maxColors: number,
    options?: {
      format?: 'rgb565' | 'rgb444' | 'rgba4444'
      oneBitAlpha?: boolean | number
      clearAlpha?: boolean
      clearAlphaThreshold?: number
      clearAlphaColor?: number
    }
  ): Palette

  export function applyPalette(
    rgba: Uint8Array | Uint8ClampedArray,
    palette: Palette,
    format?: 'rgb565' | 'rgb444' | 'rgba4444'
  ): Uint8Array
}
