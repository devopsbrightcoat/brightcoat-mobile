import React, { useMemo, useState } from 'react'
import { Banknote, Clock, DollarSign, Percent, TrendingDown, TrendingUp, Wallet } from 'lucide-react-native'
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { DashboardPanel } from '../../components/dashboard/DashboardPanel'
import { Panel } from '../../components/common/Panel'
import { ReportDateRangeBar } from '../../components/dashboard/ReportDateRangeBar'
import { RankingBars } from '../../components/dashboard/RankingBars'
import { ServiceCategoryModal } from '../../components/dashboard/ServiceCategoryModal'
import { SegmentedField } from '../../components/common/SegmentedField'
import { StatCard } from '../../components/common/StatCard'
import { useReferenceData } from '../../contexts/ReferenceDataContext'
import { fetchCharges, fetchExpenses, fetchPayrollEntries, fetchSchedules } from '../../lib/api'
import {
  computeKpis,
  computeMonthlyFinancials,
  computePropertyProfitability,
  computeRevenueByCategory,
  computeRevenueByPeriod,
  REVENUE_PERIOD_GRANULARITY_OPTIONS,
  type DateRange,
  type RevenuePeriodGranularity,
} from '../../lib/dashboardMetrics'
import { currency } from '../../lib/format'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'

const screenWidth = Dimensions.get('window').width

const COLOR_GOLD = '#e3a730'
const COLOR_BLUE = '#3987e5'
const COLOR_ORANGE = '#d95926'
const COLOR_AQUA = '#199e70'

const percent = (value: number) => `${value.toFixed(1)}%`

export const ReportesFinancieroScreen = () => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: colors.surfaceAlt,
      backgroundGradientTo: colors.surfaceAlt,
      decimalPlaces: 0,
      color: () => colors.gold500,
      labelColor: () => colors.ink400,
      propsForDots: { r: '0' },
    }),
    [colors],
  )
  const compareChartConfig = useMemo(() => ({ ...chartConfig, color: () => colors.ink400 }), [chartConfig, colors])
  // Los montos del eje Y pueden llegar a 5 cifras (ej. "28534") — se abrevia
  // a formato "28.5k" para que quepan. Nota: formatYLabel es una prop
  // directa de LineChart/BarChart, no va dentro de chartConfig.
  const formatYAxisLabel = (yLabel: string) => {
    const value = Number(yLabel)
    if (Number.isNaN(value)) return yLabel
    if (Math.abs(value) < 1000) return String(Math.round(value))
    return `${(value / 1000).toFixed(1)}k`
  }
  const [appliedRange, setAppliedRange] = useState<DateRange | null>(null)
  const [periodGranularity, setPeriodGranularity] = useState<RevenuePeriodGranularity>('day')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)

  const {
    data: charges,
    loading: loadingCharges,
    error: errorCharges,
    refreshing: refreshingCharges,
    refetch: refetchCharges,
  } = useSupabaseQuery(fetchCharges, [])
  const {
    data: expenses,
    loading: loadingExpenses,
    error: errorExpenses,
    refreshing: refreshingExpenses,
    refetch: refetchExpenses,
  } = useSupabaseQuery(fetchExpenses, [])
  const {
    data: payrollEntries,
    loading: loadingPayroll,
    error: errorPayroll,
    refreshing: refreshingPayroll,
    refetch: refetchPayroll,
  } = useSupabaseQuery(fetchPayrollEntries, [])
  const {
    data: schedules,
    loading: loadingSchedules,
    error: errorSchedules,
    refreshing: refreshingSchedules,
    refetch: refetchSchedules,
  } = useSupabaseQuery(fetchSchedules, [])
  const {
    properties,
    loadingProperties,
    errorProperties,
    refreshingProperties,
    refetchProperties,
    serviceTypes,
    loadingServiceTypes,
    errorServiceTypes,
    refreshingServiceTypes,
    refetchServiceTypes,
  } = useReferenceData()

  const loading =
    loadingCharges || loadingExpenses || loadingPayroll || loadingSchedules || loadingProperties || loadingServiceTypes
  const error = errorCharges ?? errorExpenses ?? errorPayroll ?? errorSchedules ?? errorProperties ?? errorServiceTypes
  const refreshing =
    refreshingCharges || refreshingExpenses || refreshingPayroll || refreshingSchedules || refreshingProperties || refreshingServiceTypes
  const handleRefresh = () => {
    refetchCharges()
    refetchExpenses()
    refetchPayroll()
    refetchSchedules()
    refetchProperties()
    refetchServiceTypes()
  }

  const range = useMemo(() => appliedRange ?? { start: '', end: '' }, [appliedRange])

  const kpis = useMemo(
    () => computeKpis(charges ?? [], payrollEntries ?? [], expenses ?? [], schedules ?? [], range),
    [charges, payrollEntries, expenses, schedules, range],
  )
  const monthlyFinancials = useMemo(
    () => computeMonthlyFinancials(charges ?? [], expenses ?? [], payrollEntries ?? []),
    [charges, expenses, payrollEntries],
  )
  const revenueByCategory = useMemo(
    () => computeRevenueByCategory(charges ?? [], serviceTypes ?? [], range),
    [charges, serviceTypes, range],
  )
  const selectedCategory = useMemo(
    () => revenueByCategory.find((c) => (c.category ?? c.label) === selectedCategoryId) ?? null,
    [revenueByCategory, selectedCategoryId],
  )
  const revenueByPeriod = useMemo(
    () => computeRevenueByPeriod(charges ?? [], range, periodGranularity),
    [charges, range, periodGranularity],
  )
  const profitability = useMemo(
    () => computePropertyProfitability(charges ?? [], payrollEntries ?? [], properties ?? [], range),
    [charges, payrollEntries, properties, range],
  )
  const totalRevenue = useMemo(() => profitability.reduce((sum, p) => sum + p.revenue, 0), [profitability])

  const periodChartData = {
    labels: revenueByPeriod.length > 0 ? revenueByPeriod.map((r) => r.label) : ['—'],
    datasets: [{ data: revenueByPeriod.length > 0 ? revenueByPeriod.map((r) => r.revenue) : [0] }],
  }

  const compareChartData = {
    labels: monthlyFinancials.map((m) => m.month),
    datasets: [
      { data: monthlyFinancials.map((m) => m.revenue), color: () => COLOR_BLUE, strokeWidth: 2 },
      { data: monthlyFinancials.map((m) => m.expenses), color: () => COLOR_ORANGE, strokeWidth: 2 },
      { data: monthlyFinancials.map((m) => m.labor), color: () => COLOR_AQUA, strokeWidth: 2 },
    ],
    legend: ['Ingresos', 'Gastos', 'Pago a empleados'],
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
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold400} colors={[colors.gold400]} />
        }
      >
        {error ? <Text style={styles.errorText}>No se pudieron cargar los datos: {error}</Text> : null}

        <ReportDateRangeBar onGenerate={setAppliedRange} generated={appliedRange !== null} />

        {!appliedRange ? (
          <Text style={styles.rangePlaceholder}>
            Elige un rango de fechas y dale &quot;Generar reporte&quot; para ver la información.
          </Text>
        ) : (
          <>
        <View style={styles.statsGrid}>
          <StatCard label="Ingresos" value={currency(kpis.revenue)} icon={DollarSign} />
          <StatCard label="Cobrado" value={currency(kpis.collected)} icon={Wallet} tone="good" />
          <StatCard label="Pendiente" value={currency(kpis.outstanding)} icon={Clock} tone="warn" />
          <StatCard label="Pago a empleados" value={currency(kpis.laborCost)} icon={Banknote} />
          <StatCard label="Gastos" value={currency(kpis.expenses)} icon={TrendingDown} />
          <StatCard
            label="Ganancia estimada"
            value={currency(kpis.estimatedProfit)}
            icon={TrendingUp}
            tone={kpis.estimatedProfit >= 0 ? 'good' : 'warn'}
          />
          <StatCard
            label="Margen"
            value={kpis.profitMargin == null ? '—' : percent(kpis.profitMargin)}
            icon={Percent}
            tone={kpis.profitMargin == null ? 'default' : kpis.profitMargin < 15 ? 'warn' : 'good'}
          />
        </View>

        <View style={styles.panelWrap}>
          <DashboardPanel title="Ingresos por período" subtitle="Rango seleccionado arriba">
            <View style={styles.granularityRow}>
              <SegmentedField
                label="Agrupar por"
                options={REVENUE_PERIOD_GRANULARITY_OPTIONS}
                value={periodGranularity}
                onChange={setPeriodGranularity}
              />
            </View>
            {revenueByPeriod.length === 0 ? (
              <Text style={styles.emptyText}>No hay cobros en este período.</Text>
            ) : (
              <LineChart
                data={periodChartData}
                width={screenWidth - 64}
                height={180}
                withInnerLines={false}
                withOuterLines={false}
                withShadow={false}
                bezier
                chartConfig={chartConfig}
                formatYLabel={formatYAxisLabel}
                style={styles.chart}
              />
            )}
          </DashboardPanel>
        </View>

        <View style={styles.panelWrap}>
          <DashboardPanel title="Ingresos vs. gastos vs. pago a empleados" subtitle="Últimos 12 meses">
            <LineChart
              data={compareChartData}
              width={screenWidth - 64}
              height={200}
              withInnerLines={false}
              withOuterLines={false}
              withShadow={false}
              bezier
              chartConfig={compareChartConfig}
              formatYLabel={formatYAxisLabel}
              style={styles.chart}
            />
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLOR_BLUE }]} />
                <Text style={styles.legendLabel}>Ingresos</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLOR_ORANGE }]} />
                <Text style={styles.legendLabel}>Gastos</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLOR_AQUA }]} />
                <Text style={styles.legendLabel}>Pago a empleados</Text>
              </View>
            </View>
          </DashboardPanel>
        </View>

        <View style={styles.panelWrap}>
          <DashboardPanel title="Ingresos por categoría de servicio" subtitle="Período seleccionado">
            <RankingBars
              items={revenueByCategory.map((c) => ({ id: c.category ?? c.label, label: c.label, value: c.revenue }))}
              formatValue={currency}
              color={COLOR_GOLD}
              emptyText="No hay cobros en este período."
              onItemPress={(item) => setSelectedCategoryId(item.id)}
            />
          </DashboardPanel>
        </View>

        <Text style={styles.sectionTitle}>Rentabilidad por propiedad</Text>
        <Text style={styles.sectionHint}>
          Ganancia estimada = ingresos − costo de planilla de la propiedad. No reparte los gastos generales del
          negocio.
        </Text>
        <View style={styles.list}>
          {profitability.length === 0 ? (
            <Text style={styles.emptyText}>No hay cobros ni planillas en este período.</Text>
          ) : (
            profitability.map((row) => {
              const share = totalRevenue > 0 ? (row.revenue / totalRevenue) * 100 : 0
              return (
                <Panel key={row.propertyId} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {row.name}
                    </Text>
                    <Text style={[styles.cardProfit, row.estimatedProfit < 0 ? styles.negative : styles.positive]}>
                      {currency(row.estimatedProfit)}
                    </Text>
                  </View>
                  <Text style={styles.cardMeta}>
                    Ingresos {currency(row.revenue)} · {percent(share)} del total
                  </Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardMeta}>Costo laboral {currency(row.laborCost)}</Text>
                    <Text style={styles.cardMeta}>Margen {row.margin == null ? '—' : percent(row.margin)}</Text>
                  </View>
                </Panel>
              )
            })
          )}
        </View>
          </>
        )}
      </ScrollView>

      <ServiceCategoryModal category={selectedCategory} onClose={() => setSelectedCategoryId(null)} />
    </View>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  scroll: { paddingBottom: 32 },
  errorText: { marginHorizontal: 20, marginTop: 16, fontSize: 13, color: colors.rose },
  rangePlaceholder: { marginHorizontal: 20, marginTop: 40, textAlign: 'center', fontSize: 13, color: colors.ink500 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, paddingTop: 16 },
  panelWrap: { marginHorizontal: 20, marginTop: 16 },
  granularityRow: { marginBottom: 12 },
  chart: { marginTop: 8, marginLeft: -16, borderRadius: 8 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, marginTop: 8 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { height: 8, width: 8, borderRadius: 4 },
  legendLabel: { fontSize: 11, color: colors.ink400 },
  emptyText: { paddingVertical: 20, textAlign: 'center', fontSize: 13, color: colors.ink500 },
  sectionTitle: {
    marginHorizontal: 20,
    marginTop: 24,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.ink500,
  },
  sectionHint: { marginHorizontal: 20, marginTop: 4, marginBottom: 4, fontSize: 11, color: colors.ink500 },
  list: { paddingHorizontal: 20, paddingTop: 12, gap: 10 },
  card: { padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.white },
  cardProfit: { fontSize: 13, fontWeight: '700' },
  positive: { color: colors.emerald },
  negative: { color: colors.rose },
  cardFooter: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.tint05,
    paddingTop: 8,
  },
  cardMeta: { marginTop: 6, fontSize: 11, color: colors.ink500 },
})
