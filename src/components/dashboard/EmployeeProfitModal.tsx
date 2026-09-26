import { StyleSheet, Text, View } from 'react-native'
import { Modal } from '../common/Modal'
import { RankingBars } from './RankingBars'
import type { EmployeeProfit } from '../../lib/dashboardMetrics'
import { currency } from '../../lib/format'
import { colors } from '../../theme/colors'

const COLOR_GOLD = '#e3a730'
const COLOR_BLUE = '#3987e5'
const COLOR_AQUA = '#199e70'

type EmployeeProfitModalProps = {
  open: boolean
  data: EmployeeProfit[]
  onClose: () => void
}

const toItems = (data: EmployeeProfit[], key: 'sold' | 'paid' | 'profit') =>
  data.map((e) => ({
    id: e.employeeId,
    label: `${e.name} · ${e.jobCount} ${e.jobCount === 1 ? 'trabajo' : 'trabajos'}`,
    value: e[key],
  }))

// Mismas tres listas (Vendido/Pagado/Ganancia) que el panel compacto del
// Dashboard, pero con TODOS los empleados con planillas en el período — el
// panel compacto los limita a 8.
export const EmployeeProfitModal = ({ open, data, onClose }: EmployeeProfitModalProps) => {
  return (
    <Modal open={open} onClose={onClose} title="Vendido, pagado y ganancia por empleado">
      <Text style={styles.subtitle}>Todos los empleados con planillas en el período seleccionado.</Text>
      {data.length === 0 ? (
        <Text style={styles.empty}>No hay planillas cobradas en este período.</Text>
      ) : (
        <View style={styles.groups}>
          <View>
            <Text style={styles.label}>Vendido</Text>
            <RankingBars items={toItems(data, 'sold')} formatValue={currency} color={COLOR_BLUE} emptyText="" />
          </View>
          <View>
            <Text style={styles.label}>Pagado</Text>
            <RankingBars items={toItems(data, 'paid')} formatValue={currency} color={COLOR_AQUA} emptyText="" />
          </View>
          <View>
            <Text style={styles.label}>Ganancia</Text>
            <RankingBars items={toItems(data, 'profit')} formatValue={currency} color={COLOR_GOLD} emptyText="" />
          </View>
        </View>
      )}
    </Modal>
  )
}

const styles = StyleSheet.create({
  subtitle: {
    marginBottom: 12,
    fontSize: 12,
    color: colors.ink500,
  },
  empty: {
    paddingVertical: 20,
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink500,
  },
  groups: {
    gap: 18,
  },
  label: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    color: colors.ink300,
  },
})
