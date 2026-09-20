import { useMemo, useState } from 'react'
import { CalendarDays, Search } from 'lucide-react-native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { DatePicker } from '../common/DatePicker'
import { Modal } from '../common/Modal'
import { SegmentedField } from '../common/SegmentedField'
import { QuincenaPicker } from './QuincenaPicker'
import type { DateRange } from '../../lib/dashboardMetrics'
import { getQuincenaForDate, getQuincenaRange, type QuincenaKey } from '../../lib/quincena'
import { MONTH_NAMES } from '../../lib/scheduleDates'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'

type ReportDateRangeBarProps = {
  onGenerate: (range: DateRange) => void
  generated: boolean
}

const shortDateLabel = (iso: string) => {
  const date = new Date(`${iso}T00:00:00`)
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()].slice(0, 3)}`
}

export const ReportDateRangeBar = ({ onGenerate, generated }: ReportDateRangeBarProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [mode, setMode] = useState<'manual' | 'quincena'>('manual')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [quincena, setQuincena] = useState<QuincenaKey>(() => getQuincenaForDate())
  // Antes del primer "Generar reporte" el formulario va siempre expandido
  // (no hay nada que enfocar todavía). Una vez generado el reporte, se
  // colapsa detrás de un botón compacto — igual que el resto de filtros de
  // la app — para dejarle todo el espacio a la respuesta del reporte.
  const [panelOpen, setPanelOpen] = useState(false)

  const invalidOrder = !!from && !!to && from > to
  const canGenerate = !!from && !!to && !invalidOrder

  const handleModeChange = (next: 'manual' | 'quincena') => {
    setMode(next)
    if (next === 'quincena') {
      const range = getQuincenaRange(quincena)
      setFrom(range.start)
      setTo(range.end)
    }
  }

  const handleQuincenaChange = (key: QuincenaKey) => {
    setQuincena(key)
    const range = getQuincenaRange(key)
    setFrom(range.start)
    setTo(range.end)
  }

  const handleGenerate = () => {
    onGenerate({ start: from, end: to })
    setPanelOpen(false)
  }

  const rangeLabel = from && to ? `${shortDateLabel(from)} – ${shortDateLabel(to)}` : 'Elegir rango'

  const form = (
    <>
      <SegmentedField
        label="Tipo de filtro"
        options={[
          { value: 'manual', label: 'Rango manual' },
          { value: 'quincena', label: 'Por quincena' },
        ]}
        value={mode}
        onChange={handleModeChange}
      />

      {mode === 'manual' ? (
        <View style={styles.dateRow}>
          <View style={styles.dateField}>
            <DatePicker label="Desde" value={from} onChange={setFrom} />
          </View>
          <View style={styles.dateField}>
            <DatePicker label="Hasta" value={to} onChange={setTo} />
          </View>
        </View>
      ) : (
        <QuincenaPicker value={quincena} onChange={handleQuincenaChange} />
      )}

      <TouchableOpacity
        style={[styles.button, !canGenerate && styles.buttonDisabled]}
        activeOpacity={0.85}
        disabled={!canGenerate}
        onPress={handleGenerate}
      >
        <Search size={16} color={colors.brand900} />
        <Text style={styles.buttonText}>Generar reporte</Text>
      </TouchableOpacity>

      {invalidOrder ? (
        <Text style={styles.errorHint}>&quot;Desde&quot; no puede ser posterior a &quot;Hasta&quot;.</Text>
      ) : generated ? (
        <Text style={styles.hint}>Si cambias el rango, vuelve a darle &quot;Generar reporte&quot; para actualizar.</Text>
      ) : (
        <Text style={styles.hint}>Elige un rango de fechas para generar el reporte.</Text>
      )}
    </>
  )

  if (!generated) {
    return <View style={styles.wrap}>{form}</View>
  }

  return (
    <>
      <View style={styles.summaryRow}>
        <TouchableOpacity style={styles.summaryButton} activeOpacity={0.7} onPress={() => setPanelOpen(true)}>
          <CalendarDays size={14} color={colors.ink300} />
          <Text style={styles.summaryButtonText}>{rangeLabel}</Text>
        </TouchableOpacity>
      </View>

      <Modal open={panelOpen} onClose={() => setPanelOpen(false)} title="Rango del reporte" minHeight="60%">
        <View style={styles.modalForm}>{form}</View>
      </Modal>
    </>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surfaceAlt,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginHorizontal: 20,
    marginTop: 16,
  },
  summaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  summaryButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink300,
  },
  modalForm: {
    gap: 10,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateField: {
    flex: 1,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 10,
    backgroundColor: colors.gold500,
    paddingVertical: 12,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand900,
  },
  hint: {
    fontSize: 11,
    color: colors.ink500,
  },
  errorHint: {
    fontSize: 11,
    color: colors.rose,
  },
})
