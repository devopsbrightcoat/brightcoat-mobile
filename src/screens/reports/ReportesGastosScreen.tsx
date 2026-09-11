import React, { useMemo, useState } from 'react'
import { DollarSign, Percent, TrendingDown, TrendingUp } from 'lucide-react-native'
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { BarChart, LineChart } from 'react-native-chart-kit'
import { DashboardPanel } from '../../components/dashboard/DashboardPanel'
import { FilterCarousel } from '../../components/common/FilterCarousel'
import { SegmentedField } from '../../components/common/SegmentedField'
import { StatCard } from '../../components/common/StatCard'
import { fetchExpenses } from '../../lib/api'
import {
  computeDateRange,
  computeExpensesByPeriod,
  computeMonthlyFinancials,
  DASHBOARD_DATE_RANGE_OPTIONS,
  filterExpensesByRange,
  previousPeriod,
  REVENUE_PERIOD_GRANULARITY_OPTIONS,
  type DashboardDateRangeKey,
  type RevenuePeriodGranularity,
} from '../../lib/dashboardMetrics'
import { currency } from '../../lib/format'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import { colors } from '../../theme/colors'

const screenWidth = Dimensions.get('window').width
const COLOR_ORANGE = '#d95926'

const percent = (value: number) => `${value.toFixed(1)}%`

const lineChartConfig = {
  backgroundGradientFrom: colors.surfaceAlt,
  backgroundGradientTo: colors.surfaceAlt,
  decimalPlaces: 0,
  color: () => COLOR_ORANGE,
  labelColor: () => colors.ink400,
  propsForDots: { r: '0' },
}

const barChartConfig = {
  backgroundGradientFrom: colors.surfaceAlt,
  backgroundGradientTo: colors.surfaceAlt,
  decimalPlaces: 0,
  color: () => COLOR_ORANGE,
  labelColor: () => colors.ink400,
  barPercentage: 0.6,
}

// Reportes › Gastos — versión móvil de
// ops-web/src/pages/reportes/ReportesGastos.tsx. El detalle de gastos
// (factura, fecha, descripción, monto) ya está en la pestaña Gastos de
// Finanzas, con su propio filtro de fecha — no se duplica acá. Esto agrega
// la evolución por período y la comparación mensual que esa pestaña no
// puede armar sola.
export const ReportesGastosScreen = () => {
  const [rangeKey, setRangeKey] = useState<DashboardDateRangeKey>('this_month')
  const [granularity, setGranularity] = useState<RevenuePeriodGranularity>('day')

  const { data: expenses, loading, error, refreshing, refetch } = useSupabaseQuery(fetchExpenses, [])

  const range = useMemo(() => computeDateRange(rangeKey), [rangeKey])

  const periodExpenses = useMemo(() => filterExpensesByRange(expenses ?? [], range), [expenses, range])
  const total = useMemo(() => periodExpenses.reduce((sum, e) => sum + e.amount, 0), [periodExpenses])

  const previousTotal = useMemo(
    () => filterExpensesByRange(expenses ?? [], previousPeriod(range)).reduce((sum, e) => sum + e.amount, 0),
    [expenses, range],
  )
  const changePct = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : null

  const monthlyTrend = useMemo(() => computeMonthlyFinancials([], expenses ?? [], []), [expenses])
  const monthlyAverage = useMemo(
    () => (monthlyTrend.length === 0 ? 0 : monthlyTrend.reduce((sum, m) => sum + m.expenses, 0) / monthlyTrend.length),
    [monthlyTrend],
  )

  const expensesByPeriod = useMemo(
    () => computeExpensesByPeriod(expenses ?? [], range, granularity),
    [expenses, range, granularity],
  )

  const periodChartData = {
    labels: expensesByPeriod.length > 0 ? expensesByPeriod.map((e) => e.label) : ['—'],
    datasets: [{ data: expensesByPeriod.length > 0 ? expensesByPeriod.map((e) => e.total) : [0] }],
  }

  const monthlyChartData = {
    labels: monthlyTrend.map((m) => m.month),
    datasets: [{ data: monthlyTrend.map((m) => m.expenses) }],
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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={colors.gold400} colors={[colors.gold400]} />}
      >
        {error ? <Text style={styles.errorText}>No se pudieron cargar los gastos: {error}</Text> : null}

        <FilterCarousel
          label="Período"
          options={DASHBOARD_DATE_RANGE_OPTIONS}
          value={rangeKey}
          onChange={setRangeKey}
          style={styles.periodCarousel}
        />

        <View style={styles.statsGrid}>
          <StatCard label="Total del período" value={currency(total)} icon={DollarSign} />
          <StatCard
            label="Cambio vs. anterior"
            value={changePct == null ? '—' : percent(changePct)}
            icon={changePct != null && changePct > 0 ? TrendingUp : TrendingDown}
            tone={changePct == null ? 'default' : changePct > 0 ? 'warn' : 'good'}
            hint={`Anterior: ${currency(previousTotal)}`}
          />
          <StatCard label="Promedio mensual (12m)" value={currency(monthlyAverage)} icon={Percent} />
        </View>

        <View style={styles.panelWrap}>
          <DashboardPanel title="Gastos por período" subtitle="Rango seleccionado arriba">
            <View style={styles.granularityRow}>
              <SegmentedField
                label="Agrupar por"
                options={REVENUE_PERIOD_GRANULARITY_OPTIONS}
                value={granularity}
                onChange={setGranularity}
              />
            </View>
            {expensesByPeriod.length === 0 ? (
              <Text style={styles.emptyText}>No hay gastos en este período.</Text>
            ) : (
              <LineChart
                data={periodChartData}
                width={screenWidth - 64}
                height={180}
                withInnerLines={false}
                withOuterLines={false}
                withShadow={false}
                bezier
                chartConfig={lineChartConfig}
                style={styles.chart}
              />
            )}
          </DashboardPanel>
        </View>

        <View style={styles.panelWrap}>
          <DashboardPanel title="Tendencia y comparación mensual" subtitle="Últimos 12 meses, independiente del rango de arriba">
            <BarChart
              data={monthlyChartData}
              width={screenWidth - 64}
              height={200}
              fromZero
              withInnerLines={false}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={barChartConfig}
              style={styles.chart}
            />
          </DashboardPanel>
        </View>

        <Text style={styles.footerNote}>
          El listado completo de gastos (factura, fecha, descripción y monto, con su propio filtro de fecha) está en
          Finanzas › Gastos.
        </Text>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  scroll: { paddingBottom: 32 },
  errorText: { marginHorizontal: 20, marginTop: 16, fontSize: 13, color: colors.rose },
  periodCarousel: { marginTop: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, paddingTop: 16 },
  panelWrap: { marginHorizontal: 20, marginTop: 16 },
  granularityRow: { marginBottom: 12 },
  chart: { marginTop: 8, marginLeft: -16, borderRadius: 8 },
  emptyText: { paddingVertical: 20, textAlign: 'center', fontSize: 13, color: colors.ink500 },
  footerNote: { marginHorizontal: 20, marginTop: 20, fontSize: 12, color: colors.ink500 },
})
