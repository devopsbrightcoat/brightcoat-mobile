import React, { useMemo, useState } from 'react'
import { Clock, DollarSign, Filter, Search, Trash2 } from 'lucide-react-native'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { ChargeDetailModal } from '../../components/cobros/ChargeDetailModal'
import { ChargeFiltersModal } from '../../components/cobros/ChargeFiltersModal'
import { ChargeInvoiceModal } from '../../components/cobros/ChargeInvoiceModal'
import { ConfirmModal } from '../../components/common/ConfirmModal'
import { Panel } from '../../components/common/Panel'
import { StatCard } from '../../components/common/StatCard'
import { StatusPill } from '../../components/common/StatusPill'
import { useReferenceData } from '../../contexts/ReferenceDataContext'
import { deleteCharge, fetchCharges } from '../../lib/api'
import { currency } from '../../lib/format'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'
import type { Charge, PaymentStatus } from '../../types'

type StatusFilter = 'all' | PaymentStatus

export const CobrosScreen = () => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [propertyId, setPropertyId] = useState('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  const [serviceTypeId, setServiceTypeId] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [detailCharge, setDetailCharge] = useState<Charge | null>(null)
  const [invoiceCharge, setInvoiceCharge] = useState<Charge | null>(null)
  const [deletingCharge, setDeletingCharge] = useState<Charge | null>(null)

  const {
    data: charges,
    loading: loadingCharges,
    error,
    refreshing: refreshingCharges,
    refetch: refetchCharges,
  } = useSupabaseQuery(
    () => fetchCharges(dateFrom || undefined, dateTo || undefined),
    [refreshKey, dateFrom, dateTo],
  )
  const {
    properties,
    loadingProperties,
    refreshingProperties,
    refetchProperties,
    serviceTypes,
    loadingServiceTypes,
    refreshingServiceTypes,
    refetchServiceTypes,
  } = useReferenceData()

  const propertyMap = useMemo(() => new Map((properties ?? []).map((p) => [p.id, p.name])), [properties])
  const serviceTypeMap = useMemo(() => new Map((serviceTypes ?? []).map((t) => [t.id, t.name])), [serviceTypes])

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return (charges ?? []).filter((c) => {
      if (propertyId !== 'all' && c.propertyId !== propertyId) return false
      if (status !== 'all' && c.status !== status) return false
      if (serviceTypeId !== 'all' && c.serviceTypeId !== serviceTypeId) return false
      if (q) {
        const propertyName = propertyMap.get(c.propertyId) ?? ''
        const haystack = [propertyName, c.unitLabel, c.description, c.notes, c.responsible, c.invoiceNumber]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [charges, propertyMap, propertyId, status, serviceTypeId, searchText])

  const activeFilterCount =
    (propertyId !== 'all' ? 1 : 0) +
    (status !== 'all' ? 1 : 0) +
    (serviceTypeId !== 'all' ? 1 : 0) +
    (dateFrom ? 1 : 0) +
    (dateTo ? 1 : 0)
  const totalPaid = (charges ?? []).filter((c) => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0)
  const totalPending = (charges ?? []).filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0)

  const loading = loadingCharges || loadingProperties || loadingServiceTypes
  const refreshing = refreshingCharges || refreshingProperties || refreshingServiceTypes
  const handleRefresh = () => {
    refetchCharges()
    refetchProperties()
    refetchServiceTypes()
  }

  const renderItem = ({ item }: { item: Charge }) => (
    <TouchableOpacity activeOpacity={0.75} onPress={() => setDetailCharge(item)}>
      <Panel style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {propertyMap.get(item.propertyId) ?? '—'}
            {item.isFixed ? ' · N/A' : item.unitLabel ? ` · ${item.unitLabel}` : ''}
          </Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => setInvoiceCharge(item)} hitSlop={8}>
              <StatusPill status={item.status} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation()
                setDeletingCharge(item)
              }}
              hitSlop={8}
            >
              <Trash2 size={15} color={colors.rose} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {(item.serviceTypeId ? serviceTypeMap.get(item.serviceTypeId) : undefined) ?? '—'} ·{' '}
          {item.generatedDate || '—'}
        </Text>
        {item.description || item.notes ? (
          <Text style={styles.cardNote} numberOfLines={2}>
            {item.description || item.notes}
          </Text>
        ) : null}
        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {item.invoiceNumber ? `Invoice #${item.invoiceNumber}` : 'Sin invoice #'}
          </Text>
          <Text style={styles.amount}>{currency(item.amount)}</Text>
        </View>
      </Panel>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        <StatCard label="Cobrado" value={currency(totalPaid)} icon={DollarSign} tone="good" size="compact" />
        <StatCard label="Pendiente" value={currency(totalPending)} icon={Clock} tone="warn" size="compact" />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.ink500} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar…"
            placeholderTextColor={colors.ink500}
            style={styles.searchInput}
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity style={styles.filtersButton} activeOpacity={0.7} onPress={() => setFiltersOpen(true)}>
          <Filter size={14} color={colors.ink300} />
          <Text style={styles.filtersButtonText}>Filtros</Text>
          {activeFilterCount > 0 ? (
            <View style={styles.filtersBadge}>
              <Text style={styles.filtersBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold400} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>No se pudieron cargar los cobros: {error}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold400} colors={[colors.gold400]} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {activeFilterCount > 0 || searchText
                ? 'No hay cobros con estos filtros.'
                : 'Todavía no hay cobros registrados.'}
            </Text>
          }
        />
      )}

      <ChargeDetailModal
        charge={detailCharge}
        propertyMap={propertyMap}
        serviceTypeMap={serviceTypeMap}
        onClose={() => setDetailCharge(null)}
      />

      <ChargeInvoiceModal
        charge={invoiceCharge}
        onClose={() => setInvoiceCharge(null)}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />

      <ChargeFiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        properties={properties ?? []}
        serviceTypes={serviceTypes ?? []}
        propertyId={propertyId}
        status={status}
        serviceTypeId={serviceTypeId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onPropertyChange={setPropertyId}
        onStatusChange={setStatus}
        onServiceTypeChange={setServiceTypeId}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      <ConfirmModal
        open={deletingCharge !== null}
        onClose={() => setDeletingCharge(null)}
        title="Eliminar cobro"
        message={
          deletingCharge?.serviceTypeId && deletingCharge?.generatedDate
            ? 'Este cobro puede venir de un horario ya entregado. Si es así, el horario vuelve a quedar pendiente de cobro. ¿Eliminar de todas formas? Esta acción no se puede deshacer.'
            : '¿Eliminar este cobro? Esta acción no se puede deshacer.'
        }
        onConfirm={async () => {
          if (!deletingCharge) return
          await deleteCharge(deletingCharge.id)
          setRefreshKey((k) => k + 1)
        }}
      />
    </View>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
    padding: 0,
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.tint10,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  filtersButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink300,
  },
  filtersBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold500,
    paddingHorizontal: 4,
  },
  filtersBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.brand900,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  errorText: {
    fontSize: 13,
    color: colors.rose,
    textAlign: 'center',
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 10,
  },
  card: {
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  cardNote: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
    color: colors.rose,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: colors.ink400,
  },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.tint05,
    paddingTop: 8,
  },
  cardMeta: {
    fontSize: 11,
    color: colors.ink500,
  },
  amount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  emptyText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink500,
  },
})
