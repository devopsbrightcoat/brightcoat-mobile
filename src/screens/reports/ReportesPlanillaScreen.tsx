import React, { useMemo, useState } from 'react'
import { Banknote, CheckCircle2, Clock, DollarSign, TrendingUp, Users } from 'lucide-react-native'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { InlineSelect } from '../../components/common/InlineSelect'
import { Panel } from '../../components/common/Panel'
import { ReportDateRangeBar } from '../../components/dashboard/ReportDateRangeBar'
import { StatCard } from '../../components/common/StatCard'
import { useReferenceData } from '../../contexts/ReferenceDataContext'
import { fetchPayrollEntries } from '../../lib/api'
import {
  computePayrollByEmployee,
  computePayrollByProperty,
  computePendingPayroll,
  filterPayrollByRange,
  type DateRange,
} from '../../lib/dashboardMetrics'
import { currency } from '../../lib/format'
import { taxOnAmount, SALES_TAX_RATE } from '../../lib/tax'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import type { PayrollEntry } from '../../types'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'

type DetailRow = PayrollEntry & { sales: number; profit: number | null; tax: number | null }

export const ReportesPlanillaScreen = () => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [employeeId, setEmployeeId] = useState('all')
  const [appliedRange, setAppliedRange] = useState<DateRange | null>(null)

  const {
    data: entries,
    loading: loadingEntries,
    error: errorEntries,
    refreshing: refreshingEntries,
    refetch: refetchEntries,
  } = useSupabaseQuery(fetchPayrollEntries, [])
  const {
    properties,
    loadingProperties,
    errorProperties,
    refreshingProperties,
    refetchProperties,
    employees,
    loadingEmployees,
    errorEmployees,
    refreshingEmployees,
    refetchEmployees,
  } = useReferenceData()

  const loading = loadingEntries || loadingProperties || loadingEmployees
  const error = errorEntries ?? errorProperties ?? errorEmployees
  const refreshing = refreshingEntries || refreshingProperties || refreshingEmployees
  const handleRefresh = () => {
    refetchEntries()
    refetchProperties()
    refetchEmployees()
  }

  const employeeOptions = useMemo(() => (employees ?? []).map((e) => ({ id: e.id, label: e.name })), [employees])
  const propertyName = (id: string) => properties?.find((p) => p.id === id)?.name ?? '—'
  const employeeName = (id: string) => employees?.find((e) => e.id === id)?.name ?? '—'

  const range = useMemo(() => appliedRange ?? { start: '', end: '' }, [appliedRange])

  const employeeFilteredEntries = useMemo(
    () => (employeeId === 'all' ? entries ?? [] : (entries ?? []).filter((e) => e.employeeId === employeeId)),
    [entries, employeeId],
  )

  const periodEntries = useMemo(() => filterPayrollByRange(employeeFilteredEntries, range), [employeeFilteredEntries, range])
  const totalPaid = useMemo(
    () => periodEntries.filter((e) => e.amount != null).reduce((sum, e) => sum + (e.amount as number), 0),
    [periodEntries],
  )
  const paidCount = useMemo(() => periodEntries.filter((e) => e.amount != null).length, [periodEntries])
  const pendingCountPeriod = useMemo(() => periodEntries.filter((e) => e.amount == null).length, [periodEntries])

  const byProperty = useMemo(
    () => computePayrollByProperty(employeeFilteredEntries, properties ?? [], range),
    [employeeFilteredEntries, properties, range],
  )
  const byEmployee = useMemo(
    () => computePayrollByEmployee(employeeFilteredEntries, employees ?? [], range),
    [employeeFilteredEntries, employees, range],
  )
  const pendingAll = useMemo(
    () => computePendingPayroll(employeeFilteredEntries, properties ?? [], employees ?? []),
    [employeeFilteredEntries, properties, employees],
  )

  const detailRows = useMemo<DetailRow[]>(
    () =>
      periodEntries
        .map((e) => {
          const sales = e.items.reduce((sum, item) => sum + item.amount, 0)
          return {
            ...e,
            sales,
            profit: e.amount == null ? null : e.amount - sales,
            tax: e.amount == null ? null : taxOnAmount(e.amount),
          }
        })
        .sort((a, b) => b.date.localeCompare(a.date)),
    [periodEntries],
  )

  // Desglose financiero: cuánto se cobró a las propiedades, cuánto se le pagó a los
  // empleados por ese mismo trabajo ya cobrado, y la ganancia que queda entre ambos.
  const pagadoEmpleados = useMemo(
    () => detailRows.filter((r) => r.amount != null).reduce((sum, r) => sum + r.sales, 0),
    [detailRows],
  )
  const gananciaTotal = useMemo(() => detailRows.reduce((sum, r) => sum + (r.profit ?? 0), 0), [detailRows])
  const pagoPendienteCobro = useMemo(
    () => detailRows.filter((r) => r.amount == null).reduce((sum, r) => sum + r.sales, 0),
    [detailRows],
  )

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
        {error ? <Text style={styles.errorText}>No se pudieron cargar las planillas: {error}</Text> : null}

        <View style={styles.selectRow}>
          <InlineSelect
            options={employeeOptions}
            value={employeeId}
            onChange={setEmployeeId}
            allLabel="Todos los empleados"
            searchPlaceholder="Buscar empleado..."
          />
        </View>

        <ReportDateRangeBar onGenerate={setAppliedRange} generated={appliedRange !== null} />

        {!appliedRange ? (
          <Text style={styles.rangePlaceholder}>
            Elige un rango de fechas y dale &quot;Generar reporte&quot; para ver la información.
          </Text>
        ) : (
          <>
        <View style={styles.statsGrid}>
          <StatCard
            label="Cobrado a propiedades"
            value={currency(totalPaid)}
            icon={TrendingUp}
            tone="good"
            hint={`${paidCount} cobrada${paidCount === 1 ? '' : 's'}`}
          />
          <StatCard
            label="Pagado a empleados"
            value={currency(pagadoEmpleados)}
            icon={Banknote}
            hint={
              pagoPendienteCobro > 0
                ? `+ ${currency(pagoPendienteCobro)} pendiente de cobro`
                : 'Por lo ya cobrado'
            }
            hintTone={pagoPendienteCobro > 0 ? 'warn' : 'default'}
          />
          <StatCard
            label="Ganancia"
            value={currency(gananciaTotal)}
            icon={DollarSign}
            tone={gananciaTotal >= 0 ? 'good' : 'warn'}
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Planillas pagadas" value={String(paidCount)} icon={CheckCircle2} size="compact" />
          <StatCard label="Pendientes en período" value={String(pendingCountPeriod)} icon={Clock} tone="warn" size="compact" />
          <StatCard label="Pendientes (todo el tiempo)" value={String(pendingAll.length)} icon={Users} tone="warn" size="compact" />
        </View>

        <Text style={styles.sectionTitle}>Planilla por propiedad</Text>
        <View style={styles.list}>
          {byProperty.length === 0 ? (
            <Text style={styles.emptyText}>No hay planillas en este período.</Text>
          ) : (
            byProperty.map((row) => (
              <Panel key={row.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {row.name}
                  </Text>
                  <Text style={styles.amount}>{currency(row.totalPaid)}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardMeta}>
                    {row.paidCount} pagada{row.paidCount === 1 ? '' : 's'}
                  </Text>
                  <Text style={row.pendingCount > 0 ? styles.cardMetaWarn : styles.cardMeta}>
                    {row.pendingCount} pendiente{row.pendingCount === 1 ? '' : 's'}
                  </Text>
                </View>
              </Panel>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Planilla por empleado</Text>
        <View style={styles.list}>
          {byEmployee.length === 0 ? (
            <Text style={styles.emptyText}>No hay planillas en este período.</Text>
          ) : (
            byEmployee.map((row) => (
              <Panel key={row.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {row.name}
                  </Text>
                  <Text style={styles.amount}>{currency(row.totalPaid)}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardMeta}>
                    {row.paidCount} pagada{row.paidCount === 1 ? '' : 's'}
                  </Text>
                  <Text style={row.pendingCount > 0 ? styles.cardMetaWarn : styles.cardMeta}>
                    {row.pendingCount} pendiente{row.pendingCount === 1 ? '' : 's'}
                  </Text>
                </View>
              </Panel>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Planilla pendiente</Text>
        <Text style={styles.sectionHint}>
          Trabajo ya hecho cuyo cobro todavía no se ha definido — toda la cartera, no solo el período seleccionado arriba.
        </Text>
        <View style={styles.list}>
          {pendingAll.length === 0 ? (
            <Text style={styles.emptyText}>No hay planillas pendientes de pago.</Text>
          ) : (
            pendingAll.map((row) => (
              <Panel key={row.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {row.propertyName}
                    {row.unitLabel ? ` · ${row.unitLabel}` : ''}
                  </Text>
                  <Text style={styles.amountGood}>{currency(row.sales)}</Text>
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {row.employeeName} · {row.serviceName}
                  </Text>
                  <Text style={styles.cardMeta}>{row.date || '—'}</Text>
                </View>
              </Panel>
            ))
          )}
        </View>

        <Text style={styles.sectionTitle}>Detalle completo</Text>
        <Text style={styles.sectionHint}>
          Cada planilla individual del período, con desglose de cobro, impuesto, pago y ganancia.
        </Text>
        <View style={styles.list}>
          {detailRows.length === 0 ? (
            <Text style={styles.emptyText}>No hay planillas en este período.</Text>
          ) : (
            detailRows.map((row) => (
              <Panel key={row.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {row.serviceName}
                  </Text>
                  <Text style={row.amount == null ? styles.amountPending : styles.amount}>
                    {row.amount == null ? 'Pendiente' : currency(row.amount)}
                  </Text>
                </View>
                <Text style={styles.cardSubtitle} numberOfLines={1}>
                  {propertyName(row.propertyId)}
                  {row.unitLabel ? ` · ${row.unitLabel}` : ''} · {employeeName(row.employeeId)}
                </Text>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardMeta}>{row.date || '—'}</Text>
                  <View style={styles.cardFooterAmounts}>
                    <Text style={styles.cardMetaGood}>Pago {currency(row.sales)}</Text>
                    <Text style={row.profit != null && row.profit < 0 ? styles.cardMetaWarn : styles.cardMetaGold}>
                      Ganancia {row.profit == null ? 'Pendiente' : currency(row.profit)}
                    </Text>
                  </View>
                </View>
                {row.taxable ? (
                  <Text style={styles.cardTax}>
                    Impuesto ({(SALES_TAX_RATE * 100).toFixed(2)}%): {row.tax == null ? 'Pendiente' : currency(row.tax)}
                  </Text>
                ) : null}
              </Panel>
            ))
          )}
        </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  scroll: { paddingBottom: 32 },
  errorText: { marginHorizontal: 20, marginTop: 16, fontSize: 13, color: colors.rose },
  selectRow: { marginHorizontal: 20, marginTop: 16 },
  rangePlaceholder: { marginHorizontal: 20, marginTop: 40, textAlign: 'center', fontSize: 13, color: colors.ink500 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 20, paddingTop: 16 },
  sectionTitle: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.ink500,
  },
  sectionHint: { marginHorizontal: 20, marginTop: -4, marginBottom: 8, fontSize: 11, color: colors.ink500 },
  list: { paddingHorizontal: 20, gap: 10 },
  emptyText: { paddingVertical: 20, textAlign: 'center', fontSize: 13, color: colors.ink500 },
  card: { padding: 14 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.white },
  cardSubtitle: { marginTop: 4, fontSize: 12, color: colors.ink400 },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.tint05,
    paddingTop: 8,
  },
  cardFooterAmounts: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardMeta: { fontSize: 11, color: colors.ink500 },
  cardMetaWarn: { fontSize: 11, color: colors.amber, fontWeight: '600' },
  cardMetaGood: { fontSize: 11, color: colors.emerald, fontWeight: '600' },
  cardMetaGold: { fontSize: 11, color: colors.gold400, fontWeight: '600' },
  cardTax: { marginTop: 6, fontSize: 11, color: colors.ink500 },
  amount: { fontSize: 13, fontWeight: '700', color: colors.white },
  amountPending: { fontSize: 13, fontWeight: '700', color: colors.ink500 },
  amountGood: { fontSize: 13, fontWeight: '700', color: colors.emerald },
})
