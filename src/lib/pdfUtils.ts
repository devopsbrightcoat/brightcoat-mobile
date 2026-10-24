import type { PDFFont } from 'pdf-lib'

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

export const base64ToUint8Array = (base64: string): Uint8Array => {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '')
  const bytes: number[] = []
  let buffer = 0
  let bits = 0
  for (let i = 0; i < clean.length; i++) {
    const value = BASE64_CHARS.indexOf(clean[i])
    if (value === -1) continue
    buffer = buffer * 64 + value
    bits += 6
    if (bits >= 8) {
      bits -= 8
      const divisor = 2 ** bits
      bytes.push(Math.floor(buffer / divisor) % 256)
      buffer %= divisor
    }
  }
  return Uint8Array.from(bytes)
}

export const sanitizePdfText = (text: string): string =>
  text
    .replace(/−/g, '-')
    .replace(/[^ -~ -ÿ–—‘’“”•…]/g, '')

export const wrapText = (text: string, font: PDFFont, size: number, maxWidth: number): string[] => {
  if (!text) return ['']
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current)
      current = word
    } else {
      current = candidate
    }
  }
  if (current) lines.push(current)
  return lines.length > 0 ? lines : ['']
}
