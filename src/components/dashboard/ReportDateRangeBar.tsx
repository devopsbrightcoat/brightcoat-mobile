import { useState } from 'react'
import { Search } from 'lucide-react-native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { DatePicker } from '../common/DatePicker'
import type { DateRange } from '../../lib/dashboardMetrics'
import { colors } from '../../theme/colors'

type ReportDateRangeBarProps = {
  onGenerate: (range: DateRange) => void
  generated: boolean
}

// Barra "Desde / Hasta + Generar reporte" que usan todas las pantallas de
// Reportes — a pedido de Javier, el reporte ya no se calcula solo con un
// período preseleccionado al entrar a la pantalla (como sigue haciendo el
// FilterCarousel de DashboardScreen, que no cambia): acá primero se pide el
// rango con el DatePicker nativo, "Generar reporte" se habilita recién
// cuando Desde y Hasta están completos y Desde no es posterior a Hasta, y
// el reporte no se recalcula solo con cambiar las fechas — hay que volver a
// darle Generar reporte. Mismo comportamiento que
// ops-web/src/components/dashboard/ReportDateRangeBar.tsx, adaptado acá al
// DatePicker nativo en vez de <input type="date">.
export const ReportDateRangeBar = ({ onGenerate, generated }: ReportDateRangeBarProps) => {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const invalidOrder = !!from && !!to && from > to
  const canGenerate = !!from && !!to && !invalidOrder

  return (
    <View style={styles.wrap}>
      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <DatePicker label="Desde" value={from} onChange={setFrom} />
        </View>
        <View style={styles.dateField}>
          <DatePicker label="Hasta" value={to} onChange={setTo} />
        </View>
      </View>

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

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
