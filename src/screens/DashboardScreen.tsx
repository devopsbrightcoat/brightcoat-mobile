import React, { useEffect, useMemo, useState } from 'react'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  DollarSign,
  Percent,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react-native'
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { SelectField } from '../components/common/SelectField'
import { StatCard } from '../components/common/StatCard'
import { StatusPill } from '../components/common/StatusPill'
import { DashboardPanel } from '../components/dashboard/DashboardPanel'
import { Pagination } from '../components/common/Pagination'
import { RankingBars } from '../components/dashboard/RankingBars'
import { ServiceCategoryModal } from '../components/dashboard/ServiceCategoryModal'
import { ScreenHeader } from '../components/common/ScreenHeader'
import { useReferenceData } from '../contexts/ReferenceDataContext'
import { fetchCharges, fetchExpenses, fetchPayrollEntries, fetchSchedules } from '../lib/api'
import {
  computeAlerts,
  computeDashboardFetchWindowStart,
  computeDateRange,
  computeEmployeeProductivity,
  computeKpis,
  computeMonthlyFinancials,
  computeOutstandingAging,
  computePendingSchedules,
  computeRevenueByCategory,
  computeRevenueByProperty,
  computeTodaySchedules,
  DASHBOARD_DATE_RANGE_OPTIONS,
  type DashboardDateRangeKey,
  type DashboardDateRangeSelection,
} from '../lib/dashboardMetrics'
import { currency } from '../lib/format'
import { getQuincenaForDate } from '../lib/quincena'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import { useTheme } from '../theme/ThemeContext'
import type { ThemeColors } from '../theme/colors'
import { QuincenaPicker } from '../components/dashboard/QuincenaPicker'

const screenWidth = Dimensions.get('window').width

// Cantidad fija de trabajos pendientes que se muestran por página en el
// panel "Trabajos Pendientes de Total" — así el panel no crece sin límite.
const PENDING_SCHEDULES_PAGE_SIZE = 5

const COLOR_GOLD = '#e3a730'
const COLOR_BLUE = '#3987e5'
const COLOR_ORANGE = '#d95926'
const COLOR_AQUA = '#199e70'

const percent = (value: number) => `${value.toFixed(1)}%`

export const DashboardScreen = () => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const chartConfig = useMemo(
    () => ({
      backgroundGradientFrom: colors.surfaceAlt,
      backgroundGradientTo: colors.surfaceAlt,
      decimalPlaces: 2,
      color: () => colors.ink400,
      labelColor: () => colors.ink400,
      propsForDots: { r: '0' },
    }),
    [colors],
  )
  const navigation = useNavigation()
  const [rangeSelection, setRangeSelection] = useState<DashboardDateRangeSelection>({ kind: 'preset', key: 'this_month' })
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [filtersExpanded, setFiltersExpanded] = useState(false)
  const [pendingPage, setPendingPage] = useState(1)

  // El Dashboard solo necesita datos de los últimos ~14 meses (ver
  // computeDashboardFetchWindowStart) — antes traía TODO el historial en
  // cada una de estas 4 consultas (peor en mobile: datos móviles/batería).
  const fetchWindowStart = useMemo(() => computeDashboardFetchWindowStart(), [])
  const { data: charges, loading: loadingCharges, error: errorCharges } = useSupabaseQuery(
    () => fetchCharges(fetchWindowStart),
    [fetchWindowStart],
  )
  const { data: expenses, loading: loadingExpenses, error: errorExpenses } = useSupabaseQuery(
    () => fetchExpenses(fetchWindowStart),
    [fetchWindowStart],
  )
  const { data: payrollEntries, loading: loadingPayroll, error: errorPayroll } = useSupabaseQuery(
    () => fetchPayrollEntries(fetchWindowStart),
    [fetchWindowStart],
  )
  const { data: schedules, loading: loadingSchedules, error: errorSchedules } = useSupabaseQuery(
    () => fetchSchedules(fetchWindowStart),
    [fetchWindowStart],
  )
  const {
    properties,
    loadingProperties,
    errorProperties,
    employees,
    loadingEmployees,
    errorEmployees,
    serviceTypes,
    loadingServiceTypes,
    errorServiceTypes,
  } = useReferenceData()

  const loading =
    loadingCharges || loadingExpenses || loadingPayroll || loadingSchedules || loadingProperties || loadingEmployees || loadingServiceTypes
  const error = errorCharges ?? errorExpenses ?? errorPayroll ?? errorSchedules ?? errorProperties ?? errorEmployees ?? errorServiceTypes

  const range = useMemo(() => computeDateRange(rangeSelection), [rangeSelection])

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

  const revenueByProperty = useMemo(
    () => computeRevenueByProperty(charges ?? [], properties ?? [], range),
    [charges, properties, range],
  )

  const employeeProductivity = useMemo(
    () => computeEmployeeProductivity(schedules ?? [], employees ?? [], range),
    [schedules, employees, range],
  )

  const todaySchedules = useMemo(() => computeTodaySchedules(schedules ?? []), [schedules])
  const pendingSchedules = useMemo(() => computePendingSchedules(schedules ?? []), [schedules])
  const outstandingAging = useMemo(() => computeOutstandingAging(charges ?? []), [charges])

  const pendingTotalPages = Math.max(1, Math.ceil(pendingSchedules.length / PENDING_SCHEDULES_PAGE_SIZE))
  // Si el rango de fechas cambia y la lista se encoge, volvemos a la página 1
  // en vez de quedarnos en una página vacía.
  useEffect(() => setPendingPage(1), [pendingSchedules])
  const pendingCurrentPage = Math.min(pendingPage, pendingTotalPages)
  const pendingPageItems = useMemo(
    () => pendingSchedules.slice(
      (pendingCurrentPage - 1) * PENDING_SCHEDULES_PAGE_SIZE,
      pendingCurrentPage * PENDING_SCHEDULES_PAGE_SIZE,
    ),
    [pendingSchedules, pendingCurrentPage],
  )

  const alerts = useMemo(
    () => computeAlerts(charges ?? [], payrollEntries ?? [], expenses ?? [], properties ?? [], range, currency),
    [charges, payrollEntries, expenses, properties, range],
  )

  const propertyName = (id: string) => properties?.find((p) => p.id === id)?.name ?? '—'
  const serviceTypeName = (id: string) => serviceTypes?.find((s) => s.id === id)?.name ?? '—'
  const employeeName = (id: string) => employees?.find((e) => e.id === id)?.name ?? '—'

  const revenueDeltaPct =
    kpis.revenuePrevious > 0 ? ((kpis.revenue - kpis.revenuePrevious) / kpis.revenuePrevious) * 100 : null
  const revenueHint =
    revenueDeltaPct == null
      ? 'Sin datos del período anterior'
      : `${revenueDeltaPct >= 0 ? '+' : ''}${revenueDeltaPct.toFixed(0)}% vs período anterior`

  const revenueTrendData = {
    labels: monthlyFinancials.map((m) => m.month),
    datasets: [{ data: monthlyFinancials.map((m) => m.revenue), color: () => COLOR_GOLD, strokeWidth: 2 }],
  }

  const financialsCompareData = {
    labels: monthlyFinancials.map((m) => m.month),
    datasets: [
      { data: monthlyFinancials.map((m) => m.revenue), color: () => COLOR_BLUE, strokeWidth: 2 },
      { data: monthlyFinancials.map((m) => m.expenses), color: () => COLOR_ORANGE, strokeWidth: 2 },
      { data: monthlyFinancials.map((m) => m.labor), color: () => COLOR_AQUA, strokeWidth: 2 },
    ],
    legend: ['Ingresos', 'Gastos', 'Pago a empleados'],
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Dashboard"
        subtitle="Resumen general del negocio"
        showLogo
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />

      <View style={styles.filterRow}>
        <TouchableOpacity style={styles.filterToggle} activeOpacity={0.7} onPress={() => setFiltersExpanded((prev) => !prev)}>
          <View style={styles.filterToggleLeft}>
            <SlidersHorizontal size={14} color={colors.ink300} />
            <Text style={styles.filterToggleText}>Filtros</Text>
          </View>
          {filtersExpanded ? <ChevronUp size={16} color={colors.ink400} /> : <ChevronDown size={16} color={colors.ink400} />}
        </TouchableOpacity>

        {filtersExpanded ? (
          <View style={styles.filterFields}>
            <SelectField
              label="Tipo de filtro"
              options={[
                { id: 'preset', label: 'Preset' },
                { id: 'quincena', label: 'Quincena' },
              ]}
              value={rangeSelection.kind}
              onChange={(kind) =>
                setRangeSelection(
                  kind === 'preset' ? { kind: 'preset', key: 'this_month' } : { kind: 'quincena', quincena: getQuincenaForDate() },
                )
              }
            />
            {rangeSelection.kind === 'preset' ? (
              <SelectField
                label="Período"
                options={DASHBOARD_DATE_RANGE_OPTIONS.map((option) => ({ id: option.value, label: option.label }))}
                value={rangeSelection.key}
                onChange={(key) => setRangeSelection({ kind: 'preset', key: key as DashboardDateRangeKey })}
              />
            ) : (
              <QuincenaPicker
                value={rangeSelection.quincena}
                onChange={(quincena) => setRangeSelection({ kind: 'quincena', quincena })}
              />
            )}
          </View>
        ) : null}
      </View>

      {error ? (
        <Text style={styles.errorText}>No se pudieron cargar los datos: {error}</Text>
      ) : loading ? (
        <ActivityIndicator style={styles.centered} color={colors.gold400} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.statsGrid}>
            <StatCard label="Ingresos" value={currency(kpis.revenue)} icon={DollarSign} hint={revenueHint} size="compact" />
            <StatCard label="Cobrado" value={currency(kpis.collected)} icon={Wallet} tone="good" size="compact" />
            <StatCard label="Pendiente" value={currency(kpis.outstanding)} icon={Clock} tone="warn" size="compact" />
            <StatCard label="Pago a empleados" value={currency(kpis.laborCost)} icon={Banknote} size="compact" />
            <StatCard label="Gastos" value={currency(kpis.expenses)} icon={TrendingDown} size="compact" />
            <StatCard
              label="Ganancia estimada"
              value={currency(kpis.estimatedProfit)}
              icon={TrendingUp}
              tone={kpis.estimatedProfit >= 0 ? 'good' : 'warn'}
              size="compact"
            />
            <StatCard
              label="Margen"
              value={kpis.profitMargin == null ? '—' : percent(kpis.profitMargin)}
              icon={Percent}
              tone={kpis.profitMargin == null ? 'default' : kpis.profitMargin < 15 ? 'warn' : 'good'}
              size="compact"
            />
          </View>

          <View style={styles.panelsGroup}>
            <DashboardPanel title="Tendencia de ingresos" subtitle="Últimos 12 meses">
              <LineChart
                data={revenueTrendData}
                width={screenWidth - 64}
                height={180}
                withInnerLines={false}
                withOuterLines={false}
                withShadow={false}
                bezier
                chartConfig={chartConfig}
                style={styles.chart}
              />
            </DashboardPanel>

            <DashboardPanel title="Ingresos vs. gastos vs. pago a empleados" subtitle="Últimos 12 meses">
              <LineChart
                data={financialsCompareData}
                width={screenWidth - 64}
                height={200}
                withInnerLines={false}
                withOuterLines={false}
                withShadow={false}
                bezier
                chartConfig={chartConfig}
                style={styles.chart}
              />
            </DashboardPanel>

            <DashboardPanel title="Ingresos por servicio" subtitle="Período seleccionado">
              <RankingBars
                items={revenueByCategory.map((c) => ({ id: c.category ?? c.label, label: c.label, value: c.revenue }))}
                formatValue={currency}
                color={COLOR_GOLD}
                emptyText="No hay cobros en este período."
                onItemPress={(item) => setSelectedCategoryId(item.id)}
              />
            </DashboardPanel>

            <DashboardPanel title="Ingresos por propiedad" subtitle="Top propiedades — período seleccionado">
              <RankingBars
                items={revenueByProperty.map((p) => ({ id: p.propertyId, label: p.name, value: p.revenue }))}
                formatValue={currency}
                color={COLOR_BLUE}
                emptyText="No hay cobros en este período."
              />
            </DashboardPanel>

            <DashboardPanel title="Productividad de empleados" subtitle="Trabajos completados — período seleccionado">
              <RankingBars
                items={employeeProductivity.map((e) => ({ id: e.employeeId, label: e.name, value: e.completedJobs }))}
                formatValue={(v) => String(v)}
                color={COLOR_AQUA}
                emptyText="No hay trabajos completados en este período."
              />
            </DashboardPanel>

            <DashboardPanel title="Trabajos de hoy" subtitle="Programación del día" action={<CalendarDays size={16} color={colors.ink500} />}>
              {todaySchedules.length === 0 ? (
                <Text style={styles.emptyText}>No hay trabajos programados para hoy.</Text>
              ) : (
                <View style={styles.listGroup}>
                  {todaySchedules.map((s, index) => (
                    <View key={s.id} style={[styles.jobRow, index === todaySchedules.length - 1 && styles.jobRowLast]}>
                      <View style={styles.jobInfo}>
                        <Text style={styles.jobTitle} numberOfLines={1}>{propertyName(s.propertyId)}</Text>
                        <Text style={styles.jobSubtitle} numberOfLines={1}>
                          {serviceTypeName(s.serviceTypeId)} · {employeeName(s.employeeId)}
                        </Text>
                      </View>
                      <StatusPill status={s.status} />
                    </View>
                  ))}
                </View>
              )}
            </DashboardPanel>

            <DashboardPanel
              title="Trabajos Pendientes de Total"
              subtitle={`${pendingSchedules.length} de ${(schedules ?? []).length} trabajos`}
              action={<CalendarClock size={16} color={colors.amber} />}
            >
              {pendingSchedules.length === 0 ? (
                <Text style={styles.emptyText}>No hay trabajos pendientes.</Text>
              ) : (
                <>
                  <View style={styles.listGroup}>
                    {pendingPageItems.map((s, index, arr) => (
                      <View key={s.id} style={[styles.jobRow, index === arr.length - 1 && styles.jobRowLast]}>
                        <View style={styles.jobInfo}>
                          <Text style={styles.jobTitle} numberOfLines={1}>{propertyName(s.propertyId)}</Text>
                          <Text style={styles.jobSubtitle} numberOfLines={1}>
                            {serviceTypeName(s.serviceTypeId)} · {employeeName(s.employeeId)} · {s.scheduledDate}
                          </Text>
                        </View>
                        <StatusPill status={s.status} />
                      </View>
                    ))}
                  </View>
                  <Pagination page={pendingCurrentPage} totalPages={pendingTotalPages} onChange={setPendingPage} />
                </>
              )}
            </DashboardPanel>

            <DashboardPanel title="Antigüedad de cobros pendientes" subtitle="Días desde que se generó el cobro" titleTone="danger">
              <View style={styles.agingList}>
                {outstandingAging.map((bucket) => (
                  <View key={bucket.label} style={styles.agingRow}>
                    <Text style={styles.agingLabel}>{bucket.label}</Text>
                    <Text style={styles.agingValue}>
                      {currency(bucket.amount)} <Text style={styles.agingCount}>({bucket.count})</Text>
                    </Text>
                  </View>
                ))}
              </View>
            </DashboardPanel>

            <DashboardPanel title="Alertas" subtitle="Cosas que vale la pena revisar">
              {alerts.length === 0 ? (
                <View style={styles.okRow}>
                  <CheckCircle2 size={16} color={colors.emerald} />
                  <Text style={styles.okText}>Todo en orden — no hay alertas activas.</Text>
                </View>
              ) : (
                <View style={styles.alertsList}>
                  {alerts.map((alert) => (
                    <View key={alert.key} style={styles.alertCard}>
                      <AlertTriangle size={16} color={colors.amber} style={styles.alertIcon} />
                      <View style={styles.alertTextGroup}>
                        <Text style={styles.alertTitle}>{alert.title}</Text>
                        <Text style={styles.alertDetail}>{alert.detail}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </DashboardPanel>
          </View>
        </ScrollView>
      )}

      <ServiceCategoryModal category={selectedCategory} onClose={() => setSelectedCategoryId(null)} />
    </View>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  filterRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  filterToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  filterToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  filterFields: {
    gap: 12,
    marginTop: 12,
  },
  scroll: {
    paddingBottom: 32,
  },
  centered: {
    marginTop: 40,
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
  panelsGroup: {
    gap: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  chart: {
    marginTop: 4,
    marginLeft: -16,
    borderRadius: 8,
  },
  emptyText: {
    paddingVertical: 12,
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink500,
  },
  listGroup: {
    gap: 0,
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.tint05,
    paddingVertical: 10,
    gap: 8,
  },
  jobRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.white,
  },
  jobSubtitle: {
    fontSize: 11,
    color: colors.ink500,
    marginTop: 2,
  },
  moreText: {
    marginTop: 8,
    fontSize: 12,
    color: colors.ink500,
  },
  agingList: {
    gap: 10,
  },
  agingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  agingLabel: {
    fontSize: 13,
    color: colors.ink300,
  },
  agingValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.rose,
  },
  agingCount: {
    fontWeight: '400',
    color: colors.ink500,
  },
  okRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  okText: {
    fontSize: 13,
    color: colors.emerald,
  },
  alertsList: {
    gap: 10,
  },
  alertCard: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(251,191,36,0.1)',
    padding: 12,
  },
  alertIcon: {
    marginTop: 2,
  },
  alertTextGroup: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gold300,
  },
  alertDetail: {
    marginTop: 2,
    fontSize: 12,
    color: colors.ink300,
  },
})
