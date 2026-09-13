import React, { useCallback, useMemo, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { DollarSign, Filter, Search } from 'lucide-react-native'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { ExpenseDetailModal } from '../../components/gastos/ExpenseDetailModal'
import { ExpenseFiltersModal } from '../../components/gastos/ExpenseFiltersModal'
import { Panel } from '../../components/common/Panel'
import { StatCard } from '../../components/common/StatCard'
import { fetchExpenses, fetchVendors } from '../../lib/api'
import { currency } from '../../lib/format'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import type { RootStackParamList } from '../../navigation/RootNavigator'
import { colors } from '../../theme/colors'
import type { Expense, Vendor } from '../../types'

type Nav = NativeStackNavigationProp<RootStackParamList>

// Tab "Gastos" de FinanzasScreen — mismos datos y filtros que
// ops-web/src/pages/Gastos.tsx. fetchExpenses/createExpense/updateExpense ya
// existían en lib/api.ts (portados junto con Horarios). Sin "Cargar Excel" —
// eso se queda solo en la web (ver ImportExpensesModal.tsx ahí).
//
// A diferencia de Cobros (sin creación manual), Gastos sí tiene CRUD
// completo: el botón "+" vive en el ScreenHeader de FinanzasScreen (ver
// `right` ahí, condicionado al tab activo) y abre AddExpenseScreen; tocar
// una tarjeta abre el detalle de solo lectura, que a su vez tiene un botón
// "Editar gasto" que navega a EditExpenseScreen — mismo criterio de
// pantalla completa (no modal) que Propiedades/Horarios.
export const GastosScreen = () => {
  const navigation = useNavigation<Nav>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [vendorId, setVendorId] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [detailExpense, setDetailExpense] = useState<Expense | null>(null)

  const { data: expenses, loading, error, refreshing, refetch } = useSupabaseQuery(fetchExpenses, [refreshKey])
  const { data: vendors } = useSupabaseQuery(fetchVendors, [refreshKey])
  const vendorMap = new Map((vendors ?? []).map((v: Vendor) => [v.id, v.name]))

  // Al volver de Agregar/Editar gasto, refresca la lista — mismo efecto que
  // PropiedadesScreen.
  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1)
    }, []),
  )

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    const min = amountMin ? Number(amountMin) : null
    const max = amountMax ? Number(amountMax) : null
    return (expenses ?? []).filter((e) => {
      if (q) {
        const matchesInvoice = (e.invoiceNumber ?? '').toLowerCase().includes(q)
        const matchesDescription = (e.description ?? '').toLowerCase().includes(q)
        if (!matchesInvoice && !matchesDescription) return false
      }
      if (dateFrom && e.date < dateFrom) return false
      if (dateTo && e.date > dateTo) return false
      if (min != null && !Number.isNaN(min) && e.amount < min) return false
      if (max != null && !Number.isNaN(max) && e.amount > max) return false
      if (vendorId && e.vendorId !== vendorId) return false
      return true
    })
  }, [expenses, searchText, dateFrom, dateTo, amountMin, amountMax, vendorId])

  const activeFilterCount = [dateFrom, dateTo, amountMin, amountMax, vendorId].filter(Boolean).length
  const totalAmount = filtered.reduce((sum, e) => sum + e.amount, 0)

  const renderItem = ({ item }: { item: Expense }) => (
    <TouchableOpacity activeOpacity={0.75} onPress={() => setDetailExpense(item)}>
      <Panel style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.invoiceNumber || 'Sin factura'}
          </Text>
          <Text style={styles.amount}>{currency(item.amount)}</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          {item.date || '—'}
          {item.vendorId && vendorMap.get(item.vendorId) ? ` · ${vendorMap.get(item.vendorId)}` : ''}
        </Text>
        {item.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}
      </Panel>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        <StatCard label="Total" value={currency(totalAmount)} icon={DollarSign} size="compact" />
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.ink500} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Buscar por factura o descripción…"
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
          <Text style={styles.errorText}>No se pudieron cargar los gastos: {error}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={colors.gold400} colors={[colors.gold400]} />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {activeFilterCount > 0 || searchText
                ? 'Ningún gasto con estos filtros.'
                : 'Todavía no hay gastos registrados.'}
            </Text>
          }
        />
      )}

      <ExpenseDetailModal
        expense={detailExpense}
        vendors={vendors ?? []}
        onClose={() => setDetailExpense(null)}
        onEdit={(expense) => {
          setDetailExpense(null)
          navigation.navigate('EditExpense', { expense })
        }}
      />

      <ExpenseFiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        dateFrom={dateFrom}
        dateTo={dateTo}
        amountMin={amountMin}
        amountMax={amountMax}
        vendorId={vendorId}
        vendors={vendors ?? []}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onAmountMinChange={setAmountMin}
        onAmountMaxChange={setAmountMax}
        onVendorIdChange={setVendorId}
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
  cardDescription: {
    marginTop: 6,
    fontSize: 12,
    color: colors.ink400,
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
