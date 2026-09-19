import { useMemo, useState } from 'react'
import { Search } from 'lucide-react-native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { DatePicker } from '../common/DatePicker'
import { SegmentedField } from '../common/SegmentedField'
import { QuincenaPicker } from './QuincenaPicker'
import type { DateRange } from '../../lib/dashboardMetrics'
import { getQuincenaForDate, getQuincenaRange, type QuincenaKey } from '../../lib/quincena'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'

type ReportDateRangeBarProps = {
  onGenerate: (range: DateRange) => void
  generated: boolean
}

export const ReportDateRangeBar = ({ onGenerate, generated }: ReportDateRangeBarProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [mode, setMode] = useState<'manual' | 'quincena'>('manual')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [quincena, setQuincena] = useState<QuincenaKey>(() => getQuincenaForDate())

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

  return (
    <View style={styles.wrap}>
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
        onPress={() => onGenerate({ start: from, end: to })}
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
    </View>
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
