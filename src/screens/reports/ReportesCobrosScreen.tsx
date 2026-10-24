import React, { useMemo, useState } from 'react'
import { AlertTriangle, Clock, DollarSign, Receipt, X } from 'lucide-react-native'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Panel } from '../../components/common/Panel'
import { ReportExportButton } from '../../components/common/ReportExportButton'
import { ReportDateRangeBar } from '../../components/dashboard/ReportDateRangeBar'
import { buildCobrosReport } from '../../lib/reportExports'
import { SegmentedField } from '../../components/common/SegmentedField'
import { StatCard } from '../../components/common/StatCard'
import { StatusPill } from '../../components/common/StatusPill'
import { useReferenceData } from '../../contexts/ReferenceDataContext'
import { fetchCharges } from '../../lib/api'
import {
  AGING_BUCKET_LABELS,
  computeAgingByProperty,
  computeAgingDetail,
  computeOutstandingAging,
  filterChargesByRange,
  type DateRange,
} from '../../lib/dashboardMetrics'
import { currency } from '../../lib/format'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import type { ThemeColors } from '../../theme/colors'
import { useTheme } from '../../theme/ThemeContext'

const percent = (value: number) => `${value.toFixed(1)}%`

const makeBucketTone = (colors: ThemeColors): Record<string, { bg: string; text: string }> => ({
  '0–30 días': { bg: colors.tint06, text: colors.ink400 },
  '31–60 días': { bg: 'rgba(251,191,36,0.12)', text: colors.amber },
  '61–90 días': { bg: 'rgba(217,89,38,0.16)', text: '#e08a5c' },
  '+90 días': { bg: 'rgba(248,113,113,0.12)', text: colors.rose },
})

const SEVERE_BUCKETS = new Set(['61–90 días', '+90 días'])

export const ReportesCobrosScreen = () => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const BUCKET_TONE = useMemo(() => makeBucketTone(colors), [colors])
  const DEFAULT_BUCKET_TONE = useMemo(() => ({ bg: colors.tint06, text: colors.ink400 }), [colors])
  const [appliedRange, setAppliedRange] = useState<DateRange | null>(null)
  const [bucketFilter, setBucketFilter] = useState<string>('all')
  const [propertyFilter, setPropertyFilter] = useState<string>('all')

  const {
    data: charges,
    loading: loadingCharges,
    error: errorCharges,
    refreshing: refreshingCharges,
    refetch: refetchCharges,
  } = useSupabaseQuery(fetchCharges, [])
  const { properties, loadingProperties, errorProperties, refreshingProperties, refetchProperties } = useReferenceData()

  const loading = loadingCharges || loadingProperties
  const error = errorCharges ?? errorProperties
  const refreshing = refreshingCharges || refreshingProperties
  const handleRefresh = () => {
    refetchCharges()
    refetchProperties()
  }

  const range = useMemo(() => appliedRange ?? { start: '', end: '' }, [appliedRange])
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
  const agingByProperty = useMemo(() => computeAgingByProperty(charges ?? [], properties ?? []), [charges, properties])
  const agingDetailFiltered = useMemo(
    () =>
      agingDetail.filter(
        (row) =>
          (bucketFilter === 'all' || row.bucket === bucketFilter) &&
          (propertyFilter === 'all' || row.propertyId === propertyFilter),
      ),
    [agingDetail, bucketFilter, propertyFilter],
  )
  const togglePropertyFilter = (propertyId: string) =>
    setPropertyFilter((current) => (current === propertyId ? 'all' : propertyId))
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

        <ReportDateRangeBar onGenerate={setAppliedRange} generated={appliedRange !== null} />

        {!appliedRange ? (
          <Text style={styles.rangePlaceholder}>
            Elige un rango de fechas y dale &quot;Generar reporte&quot; para ver la información.
          </Text>
        ) : (
          <>
        <ReportExportButton
          disabled={!!error}
          buildReport={() =>
            buildCobrosReport({
              range,
              periodCharges,
              properties: properties ?? [],
              agingBuckets,
              agingByProperty,
              agingDetail: agingDetailFiltered,
              detailFilterLabel: [
                propertyFilter === 'all' ? null : propertyName(propertyFilter),
                bucketFilter === 'all' ? null : bucketFilter,
              ]
                .filter(Boolean)
                .join(' · '),
            })
          }
        />
        <View style={styles.statsGrid}>
          <StatCard label="Subido a OPS" value={currency(collected)} icon={DollarSign} tone="good" />
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
                  <StatusPill
                    status={charge.status}
                    label={charge.status === 'paid' ? 'Subido a OPS' : undefined}
                  />
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

        <Text style={styles.sectionTitle}>Cartera por propiedad</Text>
        <Text style={styles.sectionHintTight}>Toca una propiedad para ver su detalle abajo.</Text>
        <View style={styles.list}>
          {agingByProperty.length === 0 ? (
            <Text style={styles.emptyText}>No hay cobros pendientes.</Text>
          ) : (
            agingByProperty.map((row) => {
              const severeAmount = AGING_BUCKET_LABELS.filter((label) => SEVERE_BUCKETS.has(label)).reduce(
                (sum, label) => sum + (row.buckets[label] ?? 0),
                0,
              )
              return (
                <TouchableOpacity
                  key={row.propertyId}
                  activeOpacity={0.75}
                  onPress={() => togglePropertyFilter(row.propertyId)}
                >
                  <Panel style={propertyFilter === row.propertyId ? { ...styles.card, ...styles.cardSelected } : styles.card}>
                    <View style={styles.cardHeader}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {row.name}
                      </Text>
                      <Text style={styles.amount}>{currency(row.total)}</Text>
                    </View>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardMeta} numberOfLines={1}>
                        {row.count} cobro{row.count === 1 ? '' : 's'} · más antiguo {row.oldestDays} días
                      </Text>
                      {severeAmount > 0 ? (
                        <Text style={styles.severeAmount}>+60 días {currency(severeAmount)}</Text>
                      ) : null}
                    </View>
                  </Panel>
                </TouchableOpacity>
              )
            })
          )}
        </View>

        <View style={styles.segmentRow}>
          <SegmentedField label="Filtrar por antigüedad" options={bucketOptions} value={bucketFilter} onChange={setBucketFilter} />
        </View>

        <Text style={styles.sectionTitle}>Detalle de cartera pendiente</Text>
        {propertyFilter !== 'all' ? (
          <TouchableOpacity activeOpacity={0.75} onPress={() => setPropertyFilter('all')} style={styles.filterChip}>
            <Text style={styles.filterChipText} numberOfLines={1}>
              {propertyName(propertyFilter)}
            </Text>
            <X size={14} color={colors.gold400} />
          </TouchableOpacity>
        ) : null}
        <View style={styles.list}>
          {agingDetailFiltered.length === 0 ? (
            <Text style={styles.emptyText}>No hay cobros pendientes con estos filtros.</Text>
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
  segmentRow: { paddingHorizontal: 20, paddingTop: 16 },
  rangePlaceholder: { marginHorizontal: 20, marginTop: 40, textAlign: 'center', fontSize: 13, color: colors.ink500 },
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
    borderTopColor: colors.tint05,
    paddingTop: 8,
  },
  cardMeta: { flex: 1, fontSize: 11, color: colors.ink500 },
  amount: { fontSize: 13, fontWeight: '700', color: colors.white },
  bucketPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  bucketPillText: { fontSize: 11, fontWeight: '600' },
  sectionHintTight: {
    marginHorizontal: 20,
    marginTop: -4,
    marginBottom: 8,
    fontSize: 11,
    color: colors.ink500,
  },
  cardSelected: {
    borderWidth: 1,
    borderColor: colors.gold500,
  },
  severeAmount: {
    marginLeft: 8,
    fontSize: 11,
    fontWeight: '600',
    color: colors.rose,
  },
  filterChip: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 20,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(207,145,34,0.12)',
  },
  filterChipText: {
    maxWidth: 240,
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold400,
  },
})
