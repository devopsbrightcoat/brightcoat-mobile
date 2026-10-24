import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage, type RGB } from 'pdf-lib'
import { BRIGHTCOAT_LOGO_ASPECT_RATIO, BRIGHTCOAT_LOGO_BASE64 } from '../assets/brightcoatLogoBase64'
import { fetchCompanyInfoForPdf } from './companyInfo'
import { base64ToUint8Array, sanitizePdfText, wrapText } from './pdfUtils'
import {
  buildReportFilename,
  formatReportCell,
  isNumericFormat,
  type ReportCell,
  type ReportColumn,
  type ReportExport,
} from './reportExports'
import { shareFile } from './shareFile'

const GOLD_BG = rgb(253 / 255, 247 / 255, 231 / 255)
const GOLD_DARK = rgb(120 / 255, 90 / 255, 20 / 255)
const INK = rgb(30 / 255, 31 / 255, 37 / 255)
const STRIPE = rgb(245 / 255, 245 / 255, 245 / 255)
const BORDER = rgb(226 / 255, 232 / 255, 240 / 255)
const MUTED = rgb(0.43, 0.43, 0.43)
const WHITE = rgb(1, 1, 1)
const BLACK = rgb(0, 0, 0)
const LOGO_PLATE_NAVY = rgb(0x0b / 255, 0x1c / 255, 0x38 / 255)

const PAGE_WIDTH = 792
const PAGE_HEIGHT = 612
const MARGIN_X = 32
const MARGIN_BOTTOM = 36
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2
const FONT_SIZE = 9
const LINE_HEIGHT = 11
const CELL_PADDING_X = 4
const CELL_PADDING_Y = 5

type Align = 'left' | 'right' | 'center'

type TableColumn = {
  header: string
  width: number
  align: Align
}

type RowStyle = {
  font: PDFFont
  size?: number
  textColor: RGB
  fill?: RGB
}

const formatCells = (cells: ReportCell[], columns: ReportColumn[], blankNulls = false) =>
  cells.map((cell, i) => (blankNulls && cell == null ? '' : formatReportCell(cell, columns[i]?.format)))

export const exportReportToPdf = async (report: ReportExport): Promise<void> => {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.TimesRoman)
  const fontBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
  let page: PDFPage = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let cursor = 0

  const toY = (fromTop: number) => PAGE_HEIGHT - fromTop

  const drawText = (text: string, x: number, fromTop: number, style: RowStyle, align: Align = 'left') => {
    const safe = sanitizePdfText(text)
    const size = style.size ?? FONT_SIZE
    const width = style.font.widthOfTextAtSize(safe, size)
    const drawX = align === 'right' ? x - width : align === 'center' ? x - width / 2 : x
    page.drawText(safe, { x: drawX, y: toY(fromTop), size, font: style.font, color: style.textColor })
  }

  const addPage = () => {
    page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
    cursor = 30
  }

  const hasSpace = (height: number) => toY(cursor + height) >= MARGIN_BOTTOM

  const company = await fetchCompanyInfoForPdf()
  const logoWidth = 76
  const logoHeight = logoWidth * BRIGHTCOAT_LOGO_ASPECT_RATIO
  const platePadding = 6
  const plateTop = 8
  const plateHeight = logoHeight + platePadding * 2

  drawText(company.companyName, MARGIN_X, plateTop + plateHeight / 2 + 4.5, { font: fontBold, size: 12, textColor: INK })

  const logoImage = await pdfDoc.embedPng(base64ToUint8Array(BRIGHTCOAT_LOGO_BASE64)).catch(() => null)
  if (logoImage) {
    const logoX = PAGE_WIDTH - MARGIN_X - logoWidth
    const logoY = toY(plateTop + platePadding) - logoHeight
    page.drawRectangle({
      x: logoX - platePadding,
      y: logoY - platePadding,
      width: logoWidth + platePadding * 2,
      height: plateHeight,
      color: LOGO_PLATE_NAVY,
    })
    page.drawImage(logoImage, { x: logoX, y: logoY, width: logoWidth, height: logoHeight })
  }

  cursor = plateTop + plateHeight + 8
  page.drawLine({
    start: { x: MARGIN_X, y: toY(cursor) },
    end: { x: PAGE_WIDTH - MARGIN_X, y: toY(cursor) },
    thickness: 0.6,
    color: BORDER,
  })

  cursor += 20
  drawText(report.title, MARGIN_X, cursor, { font: fontBold, size: 15, textColor: BLACK })
  cursor += 15
  drawText(`Período: ${report.periodLabel}`, MARGIN_X, cursor, { font, size: 10.5, textColor: MUTED })
  cursor += 12

  const buildColumns = (columns: ReportColumn[], align?: Align): TableColumn[] => {
    const totalWeight = columns.reduce((total, column) => total + (column.weight ?? 1), 0)
    return columns.map((column) => ({
      header: column.header,
      width: (CONTENT_WIDTH * (column.weight ?? 1)) / totalWeight,
      align: align ?? (isNumericFormat(column.format) ? 'right' : 'left'),
    }))
  }

  const measureRow = (cells: string[], columns: TableColumn[], style: RowStyle) => {
    const size = style.size ?? FONT_SIZE
    const wrapped = cells.map((cell, i) =>
      wrapText(sanitizePdfText(cell), style.font, size, columns[i].width - CELL_PADDING_X * 2),
    )
    const lineCount = Math.max(...wrapped.map((lines) => lines.length), 1)
    return { wrapped, height: lineCount * LINE_HEIGHT + CELL_PADDING_Y * 2 }
  }

  const drawRow = (cells: string[], columns: TableColumn[], style: RowStyle) => {
    const { wrapped, height } = measureRow(cells, columns, style)
    if (style.fill) {
      page.drawRectangle({ x: MARGIN_X, y: toY(cursor + height), width: CONTENT_WIDTH, height, color: style.fill })
    }
    let x = MARGIN_X
    wrapped.forEach((lines, i) => {
      const column = columns[i]
      const anchor =
        column.align === 'right'
          ? x + column.width - CELL_PADDING_X
          : column.align === 'center'
            ? x + column.width / 2
            : x + CELL_PADDING_X
      lines.forEach((line, lineIndex) => {
        drawText(line, anchor, cursor + CELL_PADDING_Y + LINE_HEIGHT * (lineIndex + 1) - 2, style, column.align)
      })
      x += column.width
    })
    page.drawLine({
      start: { x: MARGIN_X, y: toY(cursor + height) },
      end: { x: MARGIN_X + CONTENT_WIDTH, y: toY(cursor + height) },
      thickness: 0.5,
      color: BORDER,
    })
    cursor += height
  }

  const drawTable = (columns: TableColumn[], rows: string[][], options: { headStyle: RowStyle; bodyStyle: RowStyle; totals?: string[] }) => {
    const headCells = columns.map((column) => column.header)
    const headHeight = measureRow(headCells, columns, options.headStyle).height
    const firstRowHeight = rows.length > 0 ? measureRow(rows[0], columns, options.bodyStyle).height : 0
    if (!hasSpace(headHeight + firstRowHeight)) addPage()
    drawRow(headCells, columns, options.headStyle)

    rows.forEach((row, index) => {
      const rowHeight = measureRow(row, columns, options.bodyStyle).height
      if (!hasSpace(rowHeight)) {
        addPage()
        drawRow(headCells, columns, options.headStyle)
      }
      drawRow(row, columns, { ...options.bodyStyle, fill: index % 2 === 1 ? STRIPE : options.bodyStyle.fill })
    })

    if (options.totals) {
      const totalsStyle: RowStyle = { font: fontBold, textColor: GOLD_DARK, fill: GOLD_BG }
      if (!hasSpace(measureRow(options.totals, columns, totalsStyle).height)) addPage()
      drawRow(options.totals, columns, totalsStyle)
    }
  }

  if (report.kpis.length > 0) {
    const kpiColumns = buildColumns(
      report.kpis.map((kpi) => ({ header: kpi.label })),
      'center',
    )
    drawTable(kpiColumns, [report.kpis.map((kpi) => formatReportCell(kpi.value, kpi.format))], {
      headStyle: { font: fontBold, textColor: GOLD_DARK, fill: GOLD_BG },
      bodyStyle: { font: fontBold, size: 11, textColor: INK },
    })
  }

  for (const section of report.sections) {
    cursor += 22
    const noteLines = section.note ? wrapText(sanitizePdfText(section.note), font, 9, CONTENT_WIDTH) : []
    if (!hasSpace(16 + noteLines.length * 11 + 60)) addPage()

    drawText(section.title, MARGIN_X, cursor, { font: fontBold, size: 12, textColor: BLACK })
    noteLines.forEach((line) => {
      cursor += 11
      drawText(line, MARGIN_X, cursor, { font, size: 9, textColor: MUTED })
    })
    cursor += 8

    const columns = buildColumns(section.columns)
    if (section.rows.length === 0) {
      drawRow(
        columns.map((column) => column.header),
        columns,
        { font: fontBold, textColor: WHITE, fill: INK },
      )
      cursor += 14
      drawText('Sin datos en este período.', MARGIN_X + CONTENT_WIDTH / 2, cursor, { font, textColor: MUTED }, 'center')
      continue
    }

    drawTable(
      columns,
      section.rows.map((row) => formatCells(row, section.columns)),
      {
        headStyle: { font: fontBold, textColor: WHITE, fill: INK },
        bodyStyle: { font, textColor: INK },
        totals: section.totals ? formatCells(section.totals, section.columns, true) : undefined,
      },
    )
  }

  const base64Pdf = await pdfDoc.saveAsBase64({ dataUri: true })
  await shareFile({
    url: base64Pdf,
    filename: buildReportFilename(report),
    type: 'application/pdf',
  })
}
