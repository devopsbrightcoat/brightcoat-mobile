import React, { useCallback, useMemo, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { CheckCircle2, Clock, Receipt } from 'lucide-react-native'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Panel } from '../../components/common/Panel'
import { StatCard } from '../../components/common/StatCard'
import { StatusPill } from '../../components/common/StatusPill'
import { ImpuestosMonthDetailModal, type MonthGroup } from '../../components/impuestos/ImpuestosMonthDetailModal'
import { fetchCharges, fetchProperties, updateChargesTaxPaid } from '../../lib/api'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import { formatMonthLabel, parseISODate } from '../../lib/scheduleDates'
import { extractTaxFromTotal, SALES_TAX_RATE } from '../../lib/tax'
import { getErrorMessage } from '../../lib/errors'
import { colors } from '../../theme/colors'
import type { Charge } from '../../types'

// Formato con centavos — a diferencia del resto de la app (montos enteros,
// ver lib/format.ts), acá sí importan los centavos: es el monto real que
// hay que remitir al estado.
const currency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

// Tab "Impuestos" de FinanzasScreen — mismo criterio que ops-web
// (pages/Impuestos.tsx): agrupa por mes calendario los cobros ya "subidos a
// OPS" (status='paid', los únicos con generatedDate real — un cobro
// "pendiente por cobrar" todavía no genera obligación de impuesto) y
// extrae el 8.25% que ya viene incluido en cada monto (ver lib/tax.ts).
// Cada mes se marca pagado/pendiente en bloque acá, o cobro por cobro
// dentro de ImpuestosMonthDetailModal.
export const ImpuestosScreen = () => {
  const [refreshKey, setRefreshKey] = useState(0)
  const [detailMonthKey, setDetailMonthKey] = useState<string | null>(null)
  const [savingMonthKey, setSavingMonthKey] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const {
    data: charges,
    loading: loadingCharges,
    error,
    refreshing: refreshingCharges,
    refetch: refetchCharges,
  } = useSupabaseQuery(fetchCharges, [refreshKey])
  const {
    data: properties,
    loading: loadingProperties,
    refreshing: refreshingProperties,
    refetch: refetchProperties,
  } = useSupabaseQuery(fetchProperties, [refreshKey])

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
        let totalTax = 0
        let paidTax = 0
        for (const c of groupCharges) {
          const tax = extractTaxFromTotal(c.amount)
          totalTax += tax
          if (c.taxPaid) paidTax += tax
        }
        const totalAmount = groupCharges.reduce((sum, c) => sum + c.amount, 0)
        const allPaid = groupCharges.every((c) => c.taxPaid)
        const nonePaid = groupCharges.every((c) => !c.taxPaid)
        return {
          key,
          label: formatMonthLabel(year, month - 1),
          charges: groupCharges,
          totalBase: totalAmount - totalTax,
          totalTax,
          paidTax,
          pendingTax: totalTax - paidTax,
          taxStatus: (allPaid ? 'paid' : nonePaid ? 'pending' : 'partial') as MonthGroup['taxStatus'],
        }
      })
      .sort((a, b) => b.key.localeCompare(a.key))
  }, [charges])

  const activeMonth = months.find((m) => m.key === detailMonthKey) ?? null

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

      <ImpuestosMonthDetailModal
        month={activeMonth}
        propertyMap={propertyMap}
        onClose={() => setDetailMonthKey(null)}
        onChanged={() => setRefreshKey((k) => k + 1)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
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
    borderTopColor: 'rgba(255,255,255,0.05)',
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
    borderColor: 'rgba(255,255,255,0.1)',
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
