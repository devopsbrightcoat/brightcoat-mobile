import React, { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { CalendarDays, CheckCircle2, Clock, Receipt } from 'lucide-react-native'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Modal } from '../../components/common/Modal'
import { Panel } from '../../components/common/Panel'
import { StatCard } from '../../components/common/StatCard'
import { StatusPill } from '../../components/common/StatusPill'
import { QuincenaDateFilter } from '../../components/dashboard/QuincenaDateFilter'
import { ImpuestosMonthDetailModal, type MonthGroup } from '../../components/impuestos/ImpuestosMonthDetailModal'
import { useReferenceData } from '../../contexts/ReferenceDataContext'
import { fetchCharges, updateChargesTaxPaid } from '../../lib/api'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import { formatMonthLabel, parseISODate, MONTH_NAMES } from '../../lib/scheduleDates'
import { computeChargeTax, SALES_TAX_RATE } from '../../lib/tax'
import { getErrorMessage } from '../../lib/errors'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'
import type { Charge } from '../../types'

const currency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

const shortDateLabel = (iso: string) => {
  const date = new Date(`${iso}T00:00:00`)
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()].slice(0, 3)}`
}

export const ImpuestosScreen = () => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [refreshKey, setRefreshKey] = useState(0)
  const [detailMonthKey, setDetailMonthKey] = useState<string | null>(null)
  const [savingMonthKey, setSavingMonthKey] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [dateFilterOpen, setDateFilterOpen] = useState(false)

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
  const { properties, loadingProperties, refreshingProperties, refetchProperties } = useReferenceData()

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1)
    }, []),
  )

  const propertyMap = useMemo(() => new Map((properties ?? []).map((p) => [p.id, p.name])), [properties])

  const months = useMemo<MonthGroup[]>(() => {
    const taxable = (charges ?? []).filter((c) => c.status === 'paid' && c.generatedDate)
    const groups = new Map<string, Charge[]>()
    for (const charge of taxable) {
      const date = parseISODate(charge.generatedDate!)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(charge)
    }
    return Array.from(groups.entries())
      .map(([key, groupCharges]) => {
        const [year, month] = key.split('-').map(Number)
        let totalBase = 0
        let totalTax = 0
        let paidTax = 0
        for (const c of groupCharges) {
          const { base, tax } = computeChargeTax(c.amount, c.taxIncluded)
          totalBase += base
          totalTax += tax
          if (c.taxPaid) paidTax += tax
        }
        const allPaid = groupCharges.every((c) => c.taxPaid)
        const nonePaid = groupCharges.every((c) => !c.taxPaid)
        return {
          key,
          label: formatMonthLabel(year, month - 1),
          charges: groupCharges,
          totalBase,
          totalTax,
          paidTax,
          pendingTax: totalTax - paidTax,
          taxStatus: (allPaid ? 'paid' : nonePaid ? 'pending' : 'partial') as MonthGroup['taxStatus'],
        }
      })
      .sort((a, b) => b.key.localeCompare(a.key))
  }, [charges])

  const activeMonth = months.find((m) => m.key === detailMonthKey) ?? null

  const hasDateFilter = Boolean(dateFrom) || Boolean(dateTo)
  const dateRangeLabel =
    dateFrom && dateTo
      ? `${shortDateLabel(dateFrom)} – ${shortDateLabel(dateTo)}`
      : dateFrom
        ? `Desde ${shortDateLabel(dateFrom)}`
        : dateTo
          ? `Hasta ${shortDateLabel(dateTo)}`
          : 'Todas las fechas'

  const totalTax = months.reduce((sum, m) => sum + m.totalTax, 0)
  const totalPaid = months.reduce((sum, m) => sum + m.paidTax, 0)
  const totalPending = months.reduce((sum, m) => sum + m.pendingTax, 0)

  const loading = loadingCharges || loadingProperties
  const refreshing = refreshingCharges || refreshingProperties
  const handleRefresh = () => {
    refetchCharges()
    refetchProperties()
  }

  const handleToggleMonth = async (month: MonthGroup) => {
    const markPaid = month.taxStatus !== 'paid'
    setSavingMonthKey(month.key)
    setActionError(null)
    try {
      await updateChargesTaxPaid(
        month.charges.map((c) => c.id),
        markPaid,
      )
      setRefreshKey((k) => k + 1)
    } catch (err) {
      setActionError(getErrorMessage(err, 'No se pudo actualizar el estado del impuesto.'))
    } finally {
      setSavingMonthKey(null)
    }
  }

  const renderItem = ({ item }: { item: MonthGroup }) => {
    const willMarkPaid = item.taxStatus !== 'paid'
    return (
      <TouchableOpacity activeOpacity={0.75} onPress={() => setDetailMonthKey(item.key)}>
        <Panel style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{item.label}</Text>
            {item.taxStatus === 'partial' ? (
              <View style={styles.partialPill}>
                <Text style={styles.partialPillText}>Parcial</Text>
              </View>
            ) : (
              <StatusPill status={item.taxStatus} />
            )}
          </View>
          <Text style={styles.cardSubtitle}>
            {item.charges.length} {item.charges.length === 1 ? 'cobro' : 'cobros'} · Base {currency(item.totalBase)}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.taxLabel}>Impuesto ({(SALES_TAX_RATE * 100).toFixed(2)}%)</Text>
            <Text style={styles.taxValue}>{currency(item.totalTax)}</Text>
          </View>
          <TouchableOpacity
            style={styles.actionButton}
            disabled={savingMonthKey === item.key}
            onPress={(e) => {
              e.stopPropagation()
              handleToggleMonth(item)
            }}
          >
            <Text style={styles.actionButtonText}>
              {savingMonthKey === item.key ? 'Guardando…' : willMarkPaid ? 'Marcar pagado' : 'Marcar pendiente'}
            </Text>
          </TouchableOpacity>
        </Panel>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.dateFilterRow}>
        <TouchableOpacity style={styles.dateButton} activeOpacity={0.7} onPress={() => setDateFilterOpen(true)}>
          <CalendarDays size={14} color={colors.ink300} />
          <Text style={styles.dateButtonText}>{dateRangeLabel}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <StatCard label="Impuesto" value={currency(totalTax)} icon={Receipt} size="compact" />
        <StatCard label="Pagado" value={currency(totalPaid)} icon={CheckCircle2} tone="good" size="compact" />
        <StatCard label="Pendiente" value={currency(totalPending)} icon={Clock} tone="warn" size="compact" />
      </View>

      {actionError ? <Text style={styles.actionErrorText}>{actionError}</Text> : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold400} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>No se pudieron cargar los impuestos: {error}</Text>
        </View>
      ) : (
        <FlatList
          data={months}
          keyExtractor={(item) => item.key}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold400} colors={[colors.gold400]} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>Todavía no hay cobros subidos a OPS con los que calcular impuestos.</Text>
          }
        />
      )}

      <Modal open={dateFilterOpen} onClose={() => setDateFilterOpen(false)} title="Quincena" minHeight="55%">
        <QuincenaDateFilter dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={setDateFrom} onDateToChange={setDateTo} />

        <TouchableOpacity
          style={[styles.clearButton, !hasDateFilter && styles.clearButtonDisabled]}
          activeOpacity={0.7}
          disabled={!hasDateFilter}
          onPress={() => {
            setDateFrom('')
            setDateTo('')
          }}
        >
          <Text style={[styles.clearButtonText, !hasDateFilter && styles.clearButtonTextDisabled]}>Limpiar filtro</Text>
        </TouchableOpacity>
      </Modal>

      <ImpuestosMonthDetailModal
        month={activeMonth}
        propertyMap={propertyMap}
        onClose={() => setDetailMonthKey(null)}
        onChanged={() => setRefreshKey((k) => k + 1)}
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
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  dateFilterRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  dateButton: {
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
  dateButtonText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink300,
  },
  clearButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    paddingVertical: 12,
  },
  clearButtonDisabled: {
    opacity: 0.4,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink300,
  },
  clearButtonTextDisabled: {
    color: colors.ink500,
  },
  actionErrorText: {
    marginTop: 10,
    marginHorizontal: 20,
    fontSize: 12,
    color: colors.rose,
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
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
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
  taxLabel: {
    fontSize: 11,
    color: colors.ink500,
  },
  taxValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gold400,
  },
  partialPill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  partialPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.amber,
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.tint10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink300,
  },
  emptyText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink500,
  },
})
