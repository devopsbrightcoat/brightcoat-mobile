import React, { useMemo, useState } from 'react'
import { Banknote, CheckCircle2, Clock, Users } from 'lucide-react-native'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { FilterCarousel } from '../../components/common/FilterCarousel'
import { Panel } from '../../components/common/Panel'
import { StatCard } from '../../components/common/StatCard'
import { fetchEmployees, fetchPayrollEntries, fetchProperties } from '../../lib/api'
import {
  computeDateRange,
  computePayrollByEmployee,
  computePayrollByProperty,
  computePendingPayroll,
  DASHBOARD_DATE_RANGE_OPTIONS,
  filterPayrollByRange,
  type DashboardDateRangeKey,
} from '../../lib/dashboardMetrics'
import { currency } from '../../lib/format'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import { colors } from '../../theme/colors'

// Reportes › Planilla — versión móvil de
// ops-web/src/pages/reportes/ReportesPlanilla.tsx. Planillas.tsx (pestaña
// de Finanzas) ya deja ver/filtrar planilla por propiedad, empleado y
// fecha una por una — no se duplica acá. Esto agrega los dos reportes
// agregados que esa pantalla no arma sola: total pagado agrupado por
// dimensión, y una vista dedicada de "trabajo hecho, pago sin definir".
export const ReportesPlanillaScreen = () => {
  const [rangeKey, setRangeKey] = useState<DashboardDateRangeKey>('this_month')

  const {
    data: entries,
    loading: loadingEntries,
    error: errorEntries,
    refreshing: refreshingEntries,
    refetch: refetchEntries,
  } = useSupabaseQuery(fetchPayrollEntries, [])
  const {
    data: properties,
    loading: loadingProperties,
    error: errorProperties,
    refreshing: refreshingProperties,
    refetch: refetchProperties,
  } = useSupabaseQuery(fetchProperties, [])
  const {
    data: employees,
    loading: loadingEmployees,
    error: errorEmployees,
    refreshing: refreshingEmployees,
    refetch: refetchEmployees,
  } = useSupabaseQuery(fetchEmployees, [])

  const loading = loadingEntries || loadingProperties || loadingEmployees
  const error = errorEntries ?? errorProperties ?? errorEmployees
  const refreshing = refreshingEntries || refreshingProperties || refreshingEmployees
  const handleRefresh = () => {
    refetchEntries()
    refetchProperties()
    refetchEmployees()
  }

  const range = useMemo(() => computeDateRange(rangeKey), [rangeKey])

  const periodEntries = useMemo(() => filterPayrollByRange(entries ?? [], range), [entries, range])
  const totalPaid = useMemo(
    () => periodEntries.filter((e) => e.amount != null).reduce((sum, e) => sum + (e.amount as number), 0),
    [periodEntries],
  )
  const paidCount = useMemo(() => periodEntries.filter((e) => e.amount != null).length, [periodEntries])
  const pendingCountPeriod = useMemo(() => periodEntries.filter((e) => e.amount == null).length, [periodEntries])

  const byProperty = useMemo(
    () => computePayrollByProperty(entries ?? [], properties ?? [], range),
    [entries, properties, range],
  )
  const byEmployee = useMemo(
    () => computePayrollByEmployee(entries ?? [], employees ?? [], range),
    [entries, employees, range],
  )
  const pendingAll = useMemo(
    () => computePendingPayroll(entries ?? [], properties ?? [], employees ?? []),
    [entries, properties, employees],
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

        <FilterCarousel
          label="Período"
          options={DASHBOARD_DATE_RANGE_OPTIONS}
          value={rangeKey}
          onChange={setRangeKey}
          style={styles.periodCarousel}
        />

        <View style={styles.statsGrid}>
          <StatCard label="Total pagado" value={currency(totalPaid)} icon={Banknote} tone="good" />
          <StatCard label="Planillas pagadas" value={String(paidCount)} icon={CheckCircle2} />
          <StatCard label="Pendientes en período" value={String(pendingCountPeriod)} icon={Clock} tone="warn" />
          <StatCard label="Pendientes (todo el tiempo)" value={String(pendingAll.length)} icon={Users} tone="warn" />
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
          Trabajo ya hecho cuyo pago todavía no se definió — toda la cartera, no solo el período seleccionado arriba.
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

        <Text style={styles.footerNote}>
          El listado completo por planilla individual (con desglose de ventas y ganancia, filtrable por propiedad,
          empleado o fecha) está en Finanzas › Planillas.
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
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 8,
  },
  cardMeta: { fontSize: 11, color: colors.ink500 },
  cardMetaWarn: { fontSize: 11, color: colors.amber, fontWeight: '600' },
  amount: { fontSize: 13, fontWeight: '700', color: colors.white },
  amountGood: { fontSize: 13, fontWeight: '700', color: colors.emerald },
  footerNote: { marginHorizontal: 20, marginTop: 20, fontSize: 12, color: colors.ink500 },
})
