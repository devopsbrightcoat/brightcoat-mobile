import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib'
import { shareFile } from './shareFile'
import { fetchCompanyInfoForPdf } from './companyInfo'
import { BRIGHTCOAT_LOGO_ASPECT_RATIO, BRIGHTCOAT_LOGO_BASE64 } from '../assets/brightcoatLogoBase64'
import type { Employee, PayrollEntry, Property } from '../types'

export type PayrollExportAudience = 'admin' | 'employee'

export type PayrollExportOptions = {
  // Nombre del empleado, cuando el export esta filtrado a uno solo — se usa
  // en el nombre del archivo.
  employeeName?: string
  // 'admin' (por defecto) incluye todo, igual que en web. 'employee' quita
  // Notas, Cobro y Ganancia — lo que no debe ver el empleado.
  audience?: PayrollExportAudience
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

const buildExportFilename = (employeeName: string | undefined) => {
  const dateSuffix = new Date().toISOString().slice(0, 10)
  return employeeName ? `${slugify(employeeName)}-planilla-${dateSuffix}` : `planillas-${dateSuffix}`
}

// Junta, para cada empleado presente en `entries`, el total de Pago — se usa
// para la linea de "Total pagado a..." al final, igual que en ops-web.
const sumByEmployee = (entries: PayrollEntry[]) => {
  const order: string[] = []
  const totals = new Map<string, number>()
  for (const e of entries) {
    const sales = e.items.reduce((sum, item) => sum + item.amount, 0)
    if (!totals.has(e.employeeId)) {
      order.push(e.employeeId)
      totals.set(e.employeeId, 0)
    }
    totals.set(e.employeeId, (totals.get(e.employeeId) ?? 0) + sales)
  }
  return { order, totals }
}

// Decodificador base64 -> bytes propio: RN no garantiza `atob` en todos los
// motores/versiones (igual que en exportEstimate.ts).
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

const GOLD_BG = rgb(253 / 255, 247 / 255, 231 / 255)
const INK = rgb(30 / 255, 31 / 255, 37 / 255)
const BORDER = rgb(226 / 255, 232 / 255, 240 / 255)
const HEADER_TEXT = rgb(120 / 255, 90 / 255, 20 / 255)
// Placa navy detras del logo (ver nota en ops-web/src/lib/pdfAssets.ts): el
// texto "BRIGHTCOAT" es plateado y casi no se ve sobre blanco.
const LOGO_PLATE_NAVY = rgb(0x0b / 255, 0x1c / 255, 0x38 / 255)

// Landscape Letter, en puntos (11in x 8.5in * 72).
const PAGE_WIDTH = 792
const PAGE_HEIGHT = 612
const MARGIN_X = 32

export const exportPayrollToPdf = async (
  entries: PayrollEntry[],
  properties: Property[],
  employees: Employee[],
  options: PayrollExportOptions = {},
): Promise<void> => {
  const { employeeName, audience = 'admin' } = options

  const head =
    audience === 'admin'
      ? ['Fecha', 'Propiedad', 'Unidad', 'Empleado', 'Servicio', 'Notas', 'Cobro', 'Pago', 'Ganancia']
      : ['Fecha', 'Propiedad', 'Unidad', 'Empleado', 'Servicio', 'Pago']
  const serviceIdx = head.indexOf('Servicio')
  const salesIdx = head.indexOf('Pago')

  const body: string[][] = []
  // Marca, por índice de fila, cuáles filas son la entrada principal (día/unidad/
  // servicio) para que el PDF las resalte en negrita y el desglose se vea normal.
  const bodyIsMain: boolean[] = []
  for (const e of entries) {
    const sales = e.items.reduce((sum, item) => sum + item.amount, 0)
    const profit = e.amount == null ? null : e.amount - sales
    const propertyName = properties.find((p) => p.id === e.propertyId)?.name ?? '—'
    const rowEmployeeName = employees.find((emp) => emp.id === e.employeeId)?.name ?? '—'

    const row =
      audience === 'admin'
        ? [
            e.date || '—',
            propertyName,
            e.unitLabel || '—',
            rowEmployeeName,
            e.serviceName || '—',
            e.notes || '—',
            e.amount == null ? 'Pendiente' : currency(e.amount),
            currency(sales),
            profit == null ? 'Pendiente' : currency(profit),
          ]
        : [e.date || '—', propertyName, e.unitLabel || '—', rowEmployeeName, e.serviceName || '—', currency(sales)]
    body.push(row)
    bodyIsMain.push(true)

    for (const item of e.items) {
      const itemRow = new Array(head.length).fill('')
      itemRow[serviceIdx] = `    • ${item.description}`
      itemRow[salesIdx] = currency(item.amount)
      body.push(itemRow)
      bodyIsMain.push(false)
    }
  }

  const { order: employeeOrder, totals: totalsByEmployee } = sumByEmployee(entries)

  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)
  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])

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

  // --- Encabezado: nombre de la empresa (el mismo que se edita en
  // Configuracion > General) y el logo arriba a la derecha — en la planilla
  // no hace falta repetir direccion ni contacto. ---
  const company = await fetchCompanyInfoForPdf()
  drawText(company.companyName, MARGIN_X, 18, { size: 11, font: fontBold, color: INK })

  try {
    const logoBytes = base64ToUint8Array(BRIGHTCOAT_LOGO_BASE64)
    const logoImage = await pdfDoc.embedPng(logoBytes)
    const logoWidth = 76
    const logoHeight = logoWidth * BRIGHTCOAT_LOGO_ASPECT_RATIO
    const logoX = PAGE_WIDTH - MARGIN_X - logoWidth
    const logoY = toY(8) - logoHeight
    const platePadding = 6
    page.drawRectangle({
      x: logoX - platePadding,
      y: logoY - platePadding,
      width: logoWidth + platePadding * 2,
      height: logoHeight + platePadding * 2,
      color: LOGO_PLATE_NAVY,
    })
    page.drawImage(logoImage, { x: logoX, y: logoY, width: logoWidth, height: logoHeight })
  } catch {
    // Si el logo no carga (ej. sin conexion al generar el PDF), seguimos sin
    // romper la descarga — el PDF sale sin logo pero con el resto del
    // encabezado.
  }

  page.drawLine({ start: { x: MARGIN_X, y: toY(26) }, end: { x: PAGE_WIDTH - MARGIN_X, y: toY(26) }, thickness: 0.6, color: BORDER })

  drawText(employeeName ? `Planilla — ${employeeName}` : 'Planillas', MARGIN_X, 42, { size: 13, font: fontBold, color: rgb(0, 0, 0) })

  // --- Tabla de planillas (dibujada a mano — pdf-lib no trae un helper de
  // tablas como jspdf-autotable) ---
  const columns =
    audience === 'admin'
      ? [
          { key: 'Fecha', width: 50, align: 'left' as const },
          { key: 'Propiedad', width: 108, align: 'left' as const },
          { key: 'Unidad', width: 55, align: 'left' as const },
          { key: 'Empleado', width: 88, align: 'left' as const },
          { key: 'Servicio', width: 108, align: 'left' as const },
          { key: 'Notas', width: 140, align: 'left' as const },
          { key: 'Cobro', width: 55, align: 'right' as const },
          { key: 'Pago', width: 55, align: 'right' as const },
          { key: 'Ganancia', width: 56, align: 'right' as const },
        ]
      : [
          { key: 'Fecha', width: 60, align: 'left' as const },
          { key: 'Propiedad', width: 158, align: 'left' as const },
          { key: 'Unidad', width: 80, align: 'left' as const },
          { key: 'Empleado', width: 140, align: 'left' as const },
          { key: 'Servicio', width: 192, align: 'left' as const },
          { key: 'Pago', width: 90, align: 'right' as const },
        ]
  const tableWidth = columns.reduce((sum, c) => sum + c.width, 0)
  const colX: number[] = []
  let runningX = MARGIN_X
  for (const col of columns) {
    colX.push(runningX)
    runningX += col.width
  }

  let tableTop = 52
  const rowPaddingY = 6
  const lineHeight = 10

  const drawHeaderRow = () => {
    drawRow(
      columns.map((c) => c.key),
      { bold: true, fill: GOLD_BG, textColor: HEADER_TEXT },
    )
  }

  const ensureSpace = (neededHeight: number) => {
    if (toY(tableTop + neededHeight) < 36) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      tableTop = 30
      drawHeaderRow()
    }
  }

  function drawRow(cells: string[], opts: { bold?: boolean; fill?: ReturnType<typeof rgb>; textColor?: ReturnType<typeof rgb> }) {
    const wrapped = cells.map((cell, i) =>
      wrapText(cell, opts.bold ? fontBold : font, 8.5, columns[i].width - 6),
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
          size: 8.5,
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

  drawHeaderRow()
  body.forEach((row, i) => drawRow(row, { bold: bodyIsMain[i] }))

  // --- Totales por empleado (y total general si hay mas de uno) ---
  tableTop += 14
  for (const employeeId of employeeOrder) {
    ensureSpace(16)
    const rowEmployeeName = employees.find((emp) => emp.id === employeeId)?.name ?? '—'
    drawText(`Total pagado a ${rowEmployeeName}: ${currency(totalsByEmployee.get(employeeId) ?? 0)}`, MARGIN_X, tableTop, {
      size: 10,
      font: fontBold,
      color: INK,
    })
    tableTop += 16
  }

  if (employeeOrder.length > 1) {
    const grandTotal = Array.from(totalsByEmployee.values()).reduce((sum, v) => sum + v, 0)
    ensureSpace(20)
    tableTop += 4
    drawText(`Total general: ${currency(grandTotal)}`, MARGIN_X, tableTop, { size: 11, font: fontBold, color: INK })
    tableTop += 16
  }

  const base64Pdf = await pdfDoc.saveAsBase64({ dataUri: true })
  await shareFile({
    url: base64Pdf,
    filename: buildExportFilename(employeeName),
    type: 'application/pdf',
  })
}
