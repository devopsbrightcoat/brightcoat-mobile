import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import { shareFile } from './shareFile'
import { fetchCompanyInfoForPdf } from './companyInfo'
import { BRIGHTCOAT_LOGO_ASPECT_RATIO, BRIGHTCOAT_LOGO_BASE64 } from '../assets/brightcoatLogoBase64'

export type EstimateLineItem = {
  name: string
  description: string
  qty: number
  rate: number
}

export type EstimateExportData = {
  estimateNumber: number
  date: string // ISO yyyy-mm-dd
  propertyName: string
  unitLabel?: string
  propertyContact?: string
  items: EstimateLineItem[]
  note?: string
  // Título que aparece arriba del PDF (ej. "Estimate" o "Invoice") y en las
  // etiquetas de número/fecha — por defecto "Estimate".
  documentTitle?: string
}

const currency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

// Convierte un nombre a algo seguro para usar como nombre de archivo (sin
// acentos, espacios ni simbolos) — igual que en ops-web.
const slugify = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const formatUsDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return `${m}/${d}/${y}`
}

// Decodificador base64 -> bytes propio: RN no garantiza `atob` en todos los
// motores/versiones, así que no dependemos de eso para incrustar el logo.
const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const base64ToUint8Array = (base64: string): Uint8Array => {
  const clean = base64.replace(/[^A-Za-z0-9+/]/g, '')
  const bytes: number[] = []
  let buffer = 0
  let bits = 0
  for (let i = 0; i < clean.length; i++) {
    const value = BASE64_CHARS.indexOf(clean[i])
    if (value === -1) continue
    buffer = (buffer << 6) | value
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes.push((buffer >> bits) & 0xff)
    }
  }
  return Uint8Array.from(bytes)
}

const wrapText = (text: string, font: PDFFont, size: number, maxWidth: number): string[] => {
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

const GOLD = rgb(207 / 255, 145 / 255, 34 / 255)
const GOLD_BG = rgb(253 / 255, 247 / 255, 231 / 255)
const INK = rgb(30 / 255, 31 / 255, 37 / 255)
const GREY = rgb(100 / 255, 100 / 255, 100 / 255)
const LIGHT_GREY = rgb(140 / 255, 140 / 255, 140 / 255)
const BORDER = rgb(226 / 255, 232 / 255, 240 / 255)
const HEADER_TEXT = rgb(120 / 255, 90 / 255, 20 / 255)
// Placa navy detrás del logo (ver nota en ops-web/src/lib/pdfAssets.ts): el
// texto "BRIGHTCOAT" es plateado y casi no se ve sobre blanco.
const LOGO_PLATE_NAVY = rgb(0x0b / 255, 0x1c / 255, 0x38 / 255)

const PAGE_WIDTH = 612 // Letter, en puntos (8.5in * 72)
const PAGE_HEIGHT = 792 // 11in * 72
const MARGIN_X = 42

export const exportEstimateToPdf = async (data: EstimateExportData): Promise<void> => {
  const { estimateNumber, date, propertyName, unitLabel, propertyContact, items, note } = data
  const title = data.documentTitle?.trim() || 'Estimate'
  const company = await fetchCompanyInfoForPdf()

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

  // pdf-lib dibuja con el origen (0,0) en la esquina inferior izquierda y el
  // eje Y creciendo hacia arriba — este helper deja pensar "de arriba hacia
  // abajo" como en el resto del diseño, igual que el PDF de Planillas.
  let cursorYFromTop = 0
  const toY = (fromTop: number) => PAGE_HEIGHT - fromTop

  const drawText = (
    text: string,
    xFromLeft: number,
    fromTop: number,
    opts: { size: number; font: PDFFont; color: ReturnType<typeof rgb>; align?: 'left' | 'right' },
  ) => {
    const width = opts.font.widthOfTextAtSize(text, opts.size)
    const x = opts.align === 'right' ? xFromLeft - width : xFromLeft
    page.drawText(text, { x, y: toY(fromTop), size: opts.size, font: opts.font, color: opts.color })
  }

  // --- Encabezado: título + datos de la empresa a la izquierda, logo a la
  // derecha (mismo layout que usa ops-web) ---
  drawText(title.toUpperCase(), MARGIN_X, 28, { size: 20, font: fontBold, color: GOLD })

  const colWidth = 270
  const nameLines = wrapText(company.companyName, fontBold, 11, colWidth)
  nameLines.forEach((line, i) => drawText(line, MARGIN_X, 42 + i * 13, { size: 11, font: fontBold, color: INK }))

  const addressStartY = 42 + nameLines.length * 13 + 2
  const addressLines = wrapText(company.address, font, 9, colWidth)
  addressLines.forEach((line, i) => drawText(line, MARGIN_X, addressStartY + i * 11, { size: 9, font, color: GREY }))

  const col2X = MARGIN_X + colWidth + 10
  drawText(company.email, col2X, 42, { size: 9, font, color: GREY })
  drawText(company.phone, col2X, 53, { size: 9, font, color: GREY })

  try {
    const logoBytes = base64ToUint8Array(BRIGHTCOAT_LOGO_BASE64)
    const logoImage = await pdfDoc.embedPng(logoBytes)
    const logoWidth = 108
    const logoHeight = logoWidth * BRIGHTCOAT_LOGO_ASPECT_RATIO
    const logoX = PAGE_WIDTH - MARGIN_X - logoWidth
    // El logo queda centrado verticalmente contra el bloque de datos de la
    // empresa (nombre + dirección a la izquierda, email/teléfono a la
    // derecha), igual que en ops-web, en vez de una posición fija.
    const infoTop = 42 - 9
    const addressBottom = addressStartY + Math.max(addressLines.length - 1, 0) * 11 + 4
    const phoneBottom = 53 + 4
    const infoBottom = Math.max(addressBottom, phoneBottom)
    const infoCenterFromTop = (infoTop + infoBottom) / 2
    const platePadding = 8
    const logoTopFromTop = infoCenterFromTop - logoHeight / 2
    const logoY = toY(logoTopFromTop) - logoHeight
    page.drawRectangle({
      x: logoX - platePadding,
      y: logoY - platePadding,
      width: logoWidth + platePadding * 2,
      height: logoHeight + platePadding * 2,
      color: LOGO_PLATE_NAVY,
    })
    page.drawImage(logoImage, {
      x: logoX,
      y: logoY,
      width: logoWidth,
      height: logoHeight,
    })
  } catch {
    // Si el logo no carga, seguimos sin romper la descarga del estimado.
  }

  // --- Franja con el nombre de la propiedad/proyecto + datos del estimado ---
  const bandTop = 142
  let bandHeight = 124
  if (unitLabel) bandHeight += 20
  if (propertyContact) bandHeight += 18
  page.drawRectangle({
    x: MARGIN_X,
    y: toY(bandTop + bandHeight),
    width: PAGE_WIDTH - MARGIN_X * 2,
    height: bandHeight,
    color: GOLD_BG,
  })

  cursorYFromTop = bandTop + 30
  drawText(propertyName, MARGIN_X + 16, cursorYFromTop, { size: 14, font: fontBold, color: GOLD })

  if (unitLabel) {
    cursorYFromTop += 18
    drawText(`Unit #: ${unitLabel}`, MARGIN_X + 16, cursorYFromTop, { size: 10, font, color: INK })
  }

  if (propertyContact) {
    cursorYFromTop += 16
    drawText(propertyContact, MARGIN_X + 16, cursorYFromTop, { size: 9, font, color: GREY })
  }

  cursorYFromTop += 12
  page.drawLine({
    start: { x: MARGIN_X + 16, y: toY(cursorYFromTop) },
    end: { x: PAGE_WIDTH - MARGIN_X - 16, y: toY(cursorYFromTop) },
    thickness: 0.75,
    color: GOLD,
    dashArray: [2, 2],
  })

  cursorYFromTop += 24
  drawText(`${title} details`, MARGIN_X + 16, cursorYFromTop, { size: 11, font: fontBold, color: INK })

  cursorYFromTop += 16
  drawText(`${title} no.: ${estimateNumber}`, MARGIN_X + 16, cursorYFromTop, { size: 9.5, font, color: rgb(0.24, 0.24, 0.24) })
  cursorYFromTop += 14
  drawText(`${title} date: ${formatUsDate(date)}`, MARGIN_X + 16, cursorYFromTop, { size: 9.5, font, color: rgb(0.24, 0.24, 0.24) })

  // --- Tabla de productos/servicios (dibujada a mano — pdf-lib no trae un
  // helper de tablas como jspdf-autotable) ---
  const columns = [
    { key: '#', width: 20, align: 'left' as const },
    { key: 'Date', width: 44, align: 'left' as const },
    { key: 'Product or service', width: 108, align: 'left' as const },
    { key: 'Description', width: 198, align: 'left' as const },
    { key: 'Qty', width: 30, align: 'right' as const },
    { key: 'Rate', width: 54, align: 'right' as const },
    { key: 'Amount', width: 54, align: 'right' as const },
  ]
  const tableWidth = columns.reduce((sum, c) => sum + c.width, 0)
  const colX: number[] = []
  let runningX = MARGIN_X
  for (const col of columns) {
    colX.push(runningX)
    runningX += col.width
  }

  let tableTop = bandTop + bandHeight + 26
  const rowPaddingY = 7
  const lineHeight = 10.5

  const ensureSpace = (neededHeight: number) => {
    if (toY(tableTop + neededHeight) < 70) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      tableTop = 40
    }
  }

  const drawRow = (cells: string[], opts: { bold?: boolean; fill?: ReturnType<typeof rgb>; textColor?: ReturnType<typeof rgb> }) => {
    const wrapped = cells.map((cell, i) =>
      wrapText(cell, opts.bold ? fontBold : font, 9, columns[i].width - 6),
    )
    const lineCount = Math.max(...wrapped.map((lines) => lines.length), 1)
    const rowHeight = lineCount * lineHeight + rowPaddingY * 2
    ensureSpace(rowHeight)

    if (opts.fill) {
      page.drawRectangle({ x: MARGIN_X, y: toY(tableTop + rowHeight), width: tableWidth, height: rowHeight, color: opts.fill })
    }

    wrapped.forEach((lines, i) => {
      const col = columns[i]
      const x = col.align === 'right' ? colX[i] + col.width - 3 : colX[i] + 3
      lines.forEach((line, li) => {
        drawText(line, x, tableTop + rowPaddingY + lineHeight * (li + 1) - 2, {
          size: 9,
          font: opts.bold ? fontBold : font,
          color: opts.textColor ?? INK,
          align: col.align,
        })
      })
    })

    page.drawLine({
      start: { x: MARGIN_X, y: toY(tableTop + rowHeight) },
      end: { x: MARGIN_X + tableWidth, y: toY(tableTop + rowHeight) },
      thickness: 0.5,
      color: BORDER,
    })

    tableTop += rowHeight
  }

  drawRow(
    columns.map((c) => c.key),
    { bold: true, fill: GOLD_BG, textColor: HEADER_TEXT },
  )

  items.forEach((item, idx) => {
    drawRow(
      [String(idx + 1), '', item.name, item.description, String(item.qty), currency(item.rate), currency(item.qty * item.rate)],
      {},
    )
  })

  // Bordes verticales de la tabla.
  let borderX = MARGIN_X
  for (const col of columns) {
    page.drawLine({ start: { x: borderX, y: toY(bandTop + bandHeight + 26) }, end: { x: borderX, y: toY(tableTop) }, thickness: 0.5, color: BORDER })
    borderX += col.width
  }
  page.drawLine({ start: { x: borderX, y: toY(bandTop + bandHeight + 26) }, end: { x: borderX, y: toY(tableTop) }, thickness: 0.5, color: BORDER })

  // --- Total ---
  const total = items.reduce((sum, item) => sum + item.qty * item.rate, 0)
  // Más despegado de la tabla que antes (no pegado contra la última fila).
  const totalY = tableTop + 56
  // El espacio que se verifica tiene que cubrir hasta donde realmente cae
  // el total (más el nuevo espacio extra de separación), no solo un margen
  // fijo — si no, podía terminar dibujándose fuera de la hoja.
  ensureSpace(64)
  page.drawLine({ start: { x: PAGE_WIDTH - MARGIN_X - 170, y: toY(totalY - 12) }, end: { x: PAGE_WIDTH - MARGIN_X, y: toY(totalY - 12) }, thickness: 0.5, color: BORDER })
  drawText('Total', PAGE_WIDTH - MARGIN_X - 85, totalY, { size: 11, font: fontBold, color: INK, align: 'right' })
  drawText(currency(total), PAGE_WIDTH - MARGIN_X, totalY, { size: 14, font: fontBold, color: INK, align: 'right' })

  // --- Nota para el cliente (igual que "Add note to customer" en
  // QuickBooks) — visible en el PDF, debajo del total ---
  let afterTotalY = totalY + 16
  const trimmedNote = note?.trim()
  if (trimmedNote) {
    ensureSpace(80)
    drawText('Nota para el cliente', MARGIN_X, afterTotalY, { size: 9.5, font: fontBold, color: INK })
    afterTotalY += 13
    const noteLines = wrapText(trimmedNote, font, 9, PAGE_WIDTH - MARGIN_X * 2)
    noteLines.forEach((line, i) => drawText(line, MARGIN_X, afterTotalY + i * 11, { size: 9, font, color: GREY }))
    afterTotalY += noteLines.length * 11
  }

  // --- Pie: líneas para aceptar el estimado ---
  ensureSpace(90)
  const footerY = Math.max(tableTop + 70, afterTotalY + 16)
  page.drawLine({ start: { x: MARGIN_X, y: toY(footerY) }, end: { x: MARGIN_X + 180, y: toY(footerY) }, thickness: 0.5, color: BORDER })
  page.drawLine({ start: { x: MARGIN_X + 216, y: toY(footerY) }, end: { x: MARGIN_X + 396, y: toY(footerY) }, thickness: 0.5, color: BORDER })
  drawText('Accepted date', MARGIN_X, footerY + 13, { size: 9, font, color: GREY })
  drawText('Accepted by', MARGIN_X + 216, footerY + 13, { size: 9, font, color: GREY })

  drawText('1/1', PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - 28, { size: 8, font, color: LIGHT_GREY, align: 'right' })

  const base64Pdf = await pdfDoc.saveAsBase64({ dataUri: true })
  await shareFile({
    url: base64Pdf,
    filename: `${slugify(title)}-${estimateNumber}`,
    type: 'application/pdf',
  })
}
