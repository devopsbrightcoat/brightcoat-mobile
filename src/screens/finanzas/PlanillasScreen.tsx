import React, { useCallback, useMemo, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Filter, Search, TrendingUp, Wallet } from 'lucide-react-native'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { PayrollEntryDetailModal } from '../../components/pagos/PayrollEntryDetailModal'
import { PayrollFiltersModal } from '../../components/pagos/PayrollFiltersModal'
import { Panel } from '../../components/common/Panel'
import { StatCard } from '../../components/common/StatCard'
import { fetchEmployees, fetchPayrollEntries, fetchProperties } from '../../lib/api'
import { currency } from '../../lib/format'
import { taxOnAmount, SALES_TAX_RATE } from '../../lib/tax'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import type { RootStackParamList } from '../../navigation/RootNavigator'
import { colors } from '../../theme/colors'
import type { PayrollEntry } from '../../types'

type Nav = NativeStackNavigationProp<RootStackParamList>

// Tab "Planillas" de FinanzasScreen — mismos datos y filtros que
// ops-web/src/pages/Planillas.tsx. fetchPayrollEntries/createPayrollEntry/
// updatePayrollEntry ya existían en lib/api.ts (portados junto con
// Horarios), así que este tab también es puro UI. Venta y Ganancia no se
// guardan — se calculan acá igual que en PayrollEntryDetailModal/web: Venta
// es la suma del desglose, Ganancia es Venta - Pago (o "Pendiente" si el
// pago todavía no se define).
//
// Igual que Gastos: el botón "+" vive en el ScreenHeader de FinanzasScreen,
// tocar una tarjeta abre el detalle de solo lectura (con botón "Editar
// planilla" adentro que navega a EditPayrollEntryScreen), y useFocusEffect
// refresca la lista al volver de Agregar/Editar.
export const PlanillasScreen = () => {
  const navigation = useNavigation<Nav>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [propertyId, setPropertyId] = useState('all')
  const [employeeId, setEmployeeId] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [detailEntry, setDetailEntry] = useState<PayrollEntry | null>(null)

  const {
    data: entries,
    loading: loadingEntries,
    error,
    refreshing: refreshingEntries,
    refetch: refetchEntries,
  } = useSupabaseQuery(fetchPayrollEntries, [refreshKey])
  const {
    data: properties,
    loading: loadingProperties,
    refreshing: refreshingProperties,
    refetch: refetchProperties,
  } = useSupabaseQuery(fetchProperties, [refreshKey])
  const {
    data: employees,
    loading: loadingEmployees,
    refreshing: refreshingEmployees,
    refetch: refetchEmployees,
  } = useSupabaseQuery(fetchEmployees, [refreshKey])

  const propertyMap = useMemo(() => new Map((properties ?? []).map((p) => [p.id, p.name])), [properties])
  const employeeMap = useMemo(() => new Map((employees ?? []).map((e) => [e.id, e.name])), [employees])

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1)
    }, []),
  )

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    return (entries ?? []).filter((entry) => {
      if (propertyId !== 'all' && entry.propertyId !== propertyId) return false
      if (employeeId !== 'all' && entry.employeeId !== employeeId) return false
      if (dateFrom && entry.date < dateFrom) return false
      if (dateTo && entry.date > dateTo) return false
      if (q) {
        const propertyName = propertyMap.get(entry.propertyId) ?? ''
        const employeeName = employeeMap.get(entry.employeeId) ?? ''
        const haystack = [propertyName, entry.unitLabel, employeeName, entry.serviceName].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [entries, propertyMap, employeeMap, propertyId, employeeId, dateFrom, dateTo, searchText])

  const activeFilterCount =
    (propertyId !== 'all' ? 1 : 0) + (employeeId !== 'all' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)

  const totals = useMemo(() => {
    let sales = 0
    let profit = 0
    for (const entry of filtered) {
      const entrySales = entry.items.reduce((sum, item) => sum + item.amount, 0)
      sales += entrySales
      if (entry.amount != null) profit += entrySales - entry.amount
    }
    return { sales, profit }
  }, [filtered])

  const loading = loadingEntries || loadingProperties || loadingEmployees
  const refreshing = refreshingEntries || refreshingProperties || refreshingEmployees
  const handleRefresh = () => {
    refetchEntries()
    refetchProperties()
    refetchEmployees()
  }

  const renderItem = ({ item }: { item: PayrollEntry }) => {
    const sales = item.items.reduce((sum, i) => sum + i.amount, 0)
    const profit = item.amount == null ? null : sales - item.amount
    // Informativo únicamente (8.25% fijo sobre el pago) — no se resta de
    // nada ni se guarda en base de datos, ver lib/tax.ts.
    const tax = item.amount == null ? null : taxOnAmount(item.amount)
    return (
      <TouchableOpacity activeOpacity={0.75} onPress={() => setDetailEntry(item)}>
        <Panel style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {propertyMap.get(item.propertyId) ?? '—'}
              {item.unitLabel ? ` · ${item.unitLabel}` : ''}
            </Text>
            <Text style={item.amount == null ? styles.pendingAmount : styles.amount}>
              {item.amount == null ? 'Pendiente' : currency(item.amount)}
            </Text>
          </View>
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {employeeMap.get(item.employeeId) ?? '—'} · {item.serviceName}
          </Text>
          <View style={styles.cardFooter}>
            <Text style={styles.cardMeta} numberOfLines={1}>
              {item.date || '—'}
            </Text>
            <Text style={profit == null ? styles.pendingSmall : profit < 0 ? styles.negativeSmall : styles.profitSmall}>
              {profit == null ? 'Ganancia pendiente' : `Ganancia ${currency(profit)}`}
            </Text>
          </View>
          <View style={styles.taxRow}>
            <Text style={styles.taxRowLabel}>Impuesto ({(SALES_TAX_RATE * 100).toFixed(2)}%)</Text>
            <Text style={styles.taxRowValue}>{tax == null ? 'Pendiente' : currency(tax)}</Text>
          </View>
        </Panel>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        <StatCard label="Ventas" value={currency(totals.sales)} icon={TrendingUp} tone="good" size="compact" />
        <StatCard label="Ganancia" value={currency(totals.profit)} icon={Wallet} size="compact" />
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
          <Text style={styles.errorText}>No se pudieron cargar las planillas: {error}</Text>
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
                ? 'No hay planillas con estos filtros.'
                : 'Todavía no hay planillas registradas.'}
            </Text>
          }
        />
      )}

      <PayrollEntryDetailModal
        entry={detailEntry}
        propertyMap={propertyMap}
        employeeMap={employeeMap}
        onClose={() => setDetailEntry(null)}
        onEdit={(entry) => {
          setDetailEntry(null)
          navigation.navigate('EditPayrollEntry', { entry })
        }}
      />

      <PayrollFiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        properties={properties ?? []}
        employees={employees ?? []}
        propertyId={propertyId}
        employeeId={employeeId}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onPropertyChange={setPropertyId}
        onEmployeeChange={setEmployeeId}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
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
    borderColor: 'rgba(255,255,255,0.1)',
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
    borderColor: 'rgba(255,255,255,0.1)',
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
  cardMeta: {
    fontSize: 11,
    color: colors.ink500,
  },
  amount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  pendingAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink500,
  },
  profitSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gold400,
  },
  negativeSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.rose,
  },
  pendingSmall: {
    fontSize: 11,
    color: colors.ink500,
  },
  taxRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taxRowLabel: {
    fontSize: 11,
    color: colors.ink500,
  },
  taxRowValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.gold400,
  },
  emptyText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink500,
  },
})
