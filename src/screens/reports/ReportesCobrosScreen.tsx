import React, { useMemo, useState } from 'react'
import { AlertTriangle, Clock, DollarSign, Receipt } from 'lucide-react-native'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { FilterCarousel } from '../../components/common/FilterCarousel'
import { Panel } from '../../components/common/Panel'
import { SegmentedField } from '../../components/common/SegmentedField'
import { StatCard } from '../../components/common/StatCard'
import { StatusPill } from '../../components/common/StatusPill'
import { fetchCharges, fetchProperties } from '../../lib/api'
import {
  computeAgingDetail,
  computeDateRange,
  computeOutstandingAging,
  DASHBOARD_DATE_RANGE_OPTIONS,
  filterChargesByRange,
  type DashboardDateRangeKey,
} from '../../lib/dashboardMetrics'
import { currency } from '../../lib/format'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import { colors } from '../../theme/colors'

const percent = (value: number) => `${value.toFixed(1)}%`

const BUCKET_TONE: Record<string, { bg: string; text: string }> = {
  '0–30 días': { bg: 'rgba(255,255,255,0.06)', text: colors.ink400 },
  '31–60 días': { bg: 'rgba(251,191,36,0.12)', text: colors.amber },
  '61–90 días': { bg: 'rgba(217,89,38,0.16)', text: '#e08a5c' },
  '+90 días': { bg: 'rgba(248,113,113,0.12)', text: colors.rose },
}
const DEFAULT_BUCKET_TONE = { bg: 'rgba(255,255,255,0.06)', text: colors.ink400 }

const SEVERE_BUCKETS = new Set(['61–90 días', '+90 días'])

// Reportes › Cobros — versión móvil de
// ops-web/src/pages/reportes/ReportesCobros.tsx. "Cobros pendientes",
// "Cobros por propiedad" e "Historial de pagos" del catálogo ya están
// cubiertos por la pestaña Cobros de Finanzas (búsqueda + filtros) — no se
// duplican acá. Esto agrega lo que esa pestaña no tiene: filtro de fecha
// con "Cobrado vs. pendiente" e "Invoices por período", más el drill-down
// de antigüedad de cartera con detalle por cobro.
export const ReportesCobrosScreen = () => {
  const [rangeKey, setRangeKey] = useState<DashboardDateRangeKey>('this_month')
  const [bucketFilter, setBucketFilter] = useState<string>('all')

  const {
    data: charges,
    loading: loadingCharges,
    error: errorCharges,
    refreshing: refreshingCharges,
    refetch: refetchCharges,
  } = useSupabaseQuery(fetchCharges, [])
  const {
    data: properties,
    loading: loadingProperties,
    error: errorProperties,
    refreshing: refreshingProperties,
    refetch: refetchProperties,
  } = useSupabaseQuery(fetchProperties, [])

  const loading = loadingCharges || loadingProperties
  const error = errorCharges ?? errorProperties
  const refreshing = refreshingCharges || refreshingProperties
  const handleRefresh = () => {
    refetchCharges()
    refetchProperties()
  }

  const range = useMemo(() => computeDateRange(rangeKey), [rangeKey])
  const propertyName = (id: string) => properties?.find((p) => p.id === id)?.name ?? '—'

  const periodCharges = useMemo(() => filterChargesByRange(charges ?? [], range), [charges, range])
  const collected = useMemo(
    () => periodCharges.filter((c) => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0),
    [periodCharges],
  )
  const outstanding = useMemo(
    () => periodCharges.filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0),
    [periodCharges],
  )
  const totalPeriod = collected + outstanding
  const collectedPct = totalPeriod > 0 ? (collected / totalPeriod) * 100 : null

  const agingBuckets = useMemo(() => computeOutstandingAging(charges ?? []), [charges])
  const agingDetail = useMemo(() => computeAgingDetail(charges ?? [], properties ?? []), [charges, properties])
  const agingDetailFiltered = useMemo(
    () => (bucketFilter === 'all' ? agingDetail : agingDetail.filter((row) => row.bucket === bucketFilter)),
    [agingDetail, bucketFilter],
  )
  const bucketOptions = useMemo(
    () => [{ value: 'all', label: 'Todos' }, ...agingBuckets.map((b) => ({ value: b.label, label: b.label }))],
    [agingBuckets],
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
        {error ? <Text style={styles.errorText}>No se pudieron cargar los cobros: {error}</Text> : null}

        <FilterCarousel
          label="Período"
          options={DASHBOARD_DATE_RANGE_OPTIONS}
          value={rangeKey}
          onChange={setRangeKey}
          style={styles.periodCarousel}
        />

        <View style={styles.statsGrid}>
          <StatCard label="Cobrado" value={currency(collected)} icon={DollarSign} tone="good" />
          <StatCard label="Pendiente" value={currency(outstanding)} icon={Clock} tone="warn" />
          <StatCard label="% cobrado" value={collectedPct == null ? '—' : percent(collectedPct)} icon={Receipt} />
          <StatCard label="Cobros en el período" value={String(periodCharges.length)} icon={Receipt} />
        </View>

        <Text style={styles.sectionTitle}>Invoices por período</Text>
        <View style={styles.list}>
          {periodCharges.length === 0 ? (
            <Text style={styles.emptyText}>No hay cobros en este período.</Text>
          ) : (
            periodCharges.map((charge) => (
              <Panel key={charge.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {propertyName(charge.propertyId)}
                    {charge.unitLabel ? ` · ${charge.unitLabel}` : ''}
                  </Text>
                  <StatusPill status={charge.status} />
                </View>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardMeta} numberOfLines={1}>
                    {charge.invoiceNumber ? `Invoice #${charge.invoiceNumber}` : 'Sin invoice #'} ·{' '}
                    {charge.generatedDate || '—'}
                  </Text>
                  <Text style={styles.amount}>{currency(charge.amount)}</Text>
                </View>
              </Panel>
            ))
          )}
        </View>

        <View style={styles.statsGrid}>
          {agingBuckets.map((bucket) => (
            <StatCard
              key={bucket.label}
              label={bucket.label}
              value={currency(bucket.amount)}
              hint={`${bucket.count} cobro${bucket.count === 1 ? '' : 's'}`}
              icon={SEVERE_BUCKETS.has(bucket.label) ? AlertTriangle : Clock}
              tone={SEVERE_BUCKETS.has(bucket.label) ? 'warn' : 'default'}
              size="compact"
            />
          ))}
        </View>
        <Text style={styles.sectionHint}>
          Antigüedad calculada desde la fecha en que se generó el cobro — es sobre toda la cartera pendiente ahora
          mismo, no sobre el período seleccionado arriba.
        </Text>

        <View style={styles.segmentRow}>
          <SegmentedField label="Filtrar por antigüedad" options={bucketOptions} value={bucketFilter} onChange={setBucketFilter} />
        </View>

        <Text style={styles.sectionTitle}>Detalle de cartera pendiente</Text>
        <View style={styles.list}>
          {agingDetailFiltered.length === 0 ? (
            <Text style={styles.emptyText}>No hay cobros pendientes en este bucket.</Text>
          ) : (
            agingDetailFiltered.map((row) => {
              const tone = BUCKET_TONE[row.bucket] ?? DEFAULT_BUCKET_TONE
              return (
                <Panel key={row.chargeId} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {row.propertyName}
                      {row.unitLabel ? ` · ${row.unitLabel}` : ''}
                    </Text>
                    <View style={[styles.bucketPill, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.bucketPillText, { color: tone.text }]}>{row.bucket}</Text>
                    </View>
                  </View>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {row.invoiceNumber ? `Invoice #${row.invoiceNumber}` : 'Sin invoice #'} ·{' '}
                      {row.generatedDate || '—'} · {row.days} días
                    </Text>
                    <Text style={styles.amount}>{currency(row.amount)}</Text>
                  </View>
                </Panel>
              )
            })
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  scroll: { paddingBottom: 32 },
  errorText: { marginHorizontal: 20, marginTop: 16, fontSize: 13, color: colors.rose },
  segmentRow: { paddingHorizontal: 20, paddingTop: 16 },
  periodCarousel: { marginTop: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20, paddingTop: 16 },
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
  sectionHint: { marginHorizontal: 20, marginTop: 8, fontSize: 11, color: colors.ink500 },
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
  cardMeta: { flex: 1, fontSize: 11, color: colors.ink500 },
  amount: { fontSize: 13, fontWeight: '700', color: colors.white },
  bucketPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  bucketPillText: { fontSize: 11, fontWeight: '600' },
})
