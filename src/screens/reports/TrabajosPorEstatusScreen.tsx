import React, { useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, Clock, RotateCcw, XCircle } from 'lucide-react-native'
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { DashboardPanel } from '../../components/dashboard/DashboardPanel'
import { SegmentedField } from '../../components/common/SegmentedField'
import { StatCard } from '../../components/common/StatCard'
import { fetchSchedules } from '../../lib/api'
import {
  computeOverdueSchedules,
  computeScheduleActivity,
  computeScheduleStatusBreakdown,
  type ScheduleActivityGranularity,
} from '../../lib/dashboardMetrics'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import { colors } from '../../theme/colors'

const screenWidth = Dimensions.get('window').width

const chartConfig = {
  backgroundGradientFrom: colors.surfaceAlt,
  backgroundGradientTo: colors.surfaceAlt,
  decimalPlaces: 0,
  color: () => colors.gold500,
  labelColor: () => colors.ink400,
  propsForDots: { r: '0' },
}

const GRANULARITY_OPTIONS: { value: ScheduleActivityGranularity; label: string }[] = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
]

// Reportes › Trabajos por estatus — categoría "Operaciones y Propiedades"
// (móvil primero) de la hoja de ruta. Completados/cancelados/pendientes se
// leen del status de Schedule; "atrasados" reutiliza
// computeOverdueSchedules (ya existía para el Dashboard). La evolución
// semanal/mensual es la cantidad de trabajos agendados por período — un
// desglose por estatus en el tiempo no entra bien en un LineChart de
// react-native-chart-kit (no tiene multi-serie apilada utilizable acá).
export const TrabajosPorEstatusScreen = () => {
  const [granularity, setGranularity] = useState<ScheduleActivityGranularity>('week')
  const { data: schedules, loading, error, refreshing, refetch } = useSupabaseQuery(fetchSchedules, [])

  const breakdown = useMemo(() => computeScheduleStatusBreakdown(schedules ?? []), [schedules])
  const overdueCount = useMemo(() => computeOverdueSchedules(schedules ?? []).length, [schedules])
  const activity = useMemo(() => computeScheduleActivity(schedules ?? [], granularity), [schedules, granularity])

  const countOf = (status: string) => breakdown.find((b) => b.status === status)?.count ?? 0
  const pendingCount = countOf('pending') + countOf('in_progress')
  const completedCount = countOf('delivered')
  const cancelledCount = countOf('cancelled')
  const rescheduledCount = countOf('rescheduled')

  const chartData = {
    labels: activity.length > 0 ? activity.map((a) => a.label) : ['—'],
    datasets: [{ data: activity.length > 0 ? activity.map((a) => a.count) : [0] }],
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.gold500} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={colors.gold400} colors={[colors.gold400]} />
        }
      >
        {error ? <Text style={styles.errorText}>No se pudieron cargar los trabajos: {error}</Text> : null}

        <View style={styles.statsGrid}>
          <StatCard label="Completados" value={String(completedCount)} icon={CheckCircle2} tone="good" />
          <StatCard label="Pendientes" value={String(pendingCount)} icon={Clock} tone="warn" />
          <StatCard label="Cancelados" value={String(cancelledCount)} icon={XCircle} />
          <StatCard
            label="Atrasados"
            value={String(overdueCount)}
            icon={AlertTriangle}
            tone={overdueCount > 0 ? 'warn' : 'default'}
          />
        </View>

        {rescheduledCount > 0 ? (
          <View style={styles.rescheduledRow}>
            <StatCard label="Reagendados" value={String(rescheduledCount)} icon={RotateCcw} size="compact" />
          </View>
        ) : null}

        <View style={styles.segmentRow}>
          <SegmentedField label="Agrupar por" options={GRANULARITY_OPTIONS} value={granularity} onChange={setGranularity} />
        </View>

        <View style={styles.panelWrap}>
          <DashboardPanel title="Evolución de trabajos" subtitle="Cantidad de trabajos agendados por período">
            {activity.length === 0 ? (
              <Text style={styles.emptyText}>No hay trabajos registrados.</Text>
            ) : (
              <LineChart
                data={chartData}
                width={screenWidth - 64}
                height={180}
                withInnerLines={false}
                withOuterLines={false}
                withShadow={false}
                bezier
                chartConfig={chartConfig}
                style={styles.chart}
              />
            )}
          </DashboardPanel>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  scroll: {
    paddingBottom: 32,
  },
  errorText: {
    marginHorizontal: 20,
    marginTop: 16,
    fontSize: 13,
    color: colors.rose,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  rescheduledRow: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  segmentRow: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  panelWrap: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  chart: {
    marginTop: 8,
    marginLeft: -16,
    borderRadius: 8,
  },
  emptyText: {
    paddingVertical: 20,
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink500,
  },
})
