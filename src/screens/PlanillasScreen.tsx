import React, { useCallback, useMemo, useState } from 'react'
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { CalendarDays, ChevronLeft, Plus, Search, Trash2, TrendingUp, Wallet } from 'lucide-react-native'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { ScreenHeader } from '../components/common/ScreenHeader'
import { ConfirmModal } from '../components/common/ConfirmModal'
import { Modal } from '../components/common/Modal'
import { Panel } from '../components/common/Panel'
import { StatCard } from '../components/common/StatCard'
import { StatusPill } from '../components/common/StatusPill'
import { QuincenaDateFilter } from '../components/dashboard/QuincenaDateFilter'
import { PayrollEntryDetailModal } from '../components/pagos/PayrollEntryDetailModal'
import { useReferenceData } from '../contexts/ReferenceDataContext'
import { deletePayrollEntry, fetchPayrollEntries } from '../lib/api'
import { formatFullDate, MONTH_NAMES } from '../lib/scheduleDates'
import { currency } from '../lib/format'
import { taxOnAmount, SALES_TAX_RATE } from '../lib/tax'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { useTheme } from '../theme/ThemeContext'
import type { ThemeColors } from '../theme/colors'
import type { Employee, PayrollEntry } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList>

type EmployeeStats = { count: number; sales: number; profit: number; pendingCount: number }

const shortDateLabel = (iso: string) => {
  const date = new Date(`${iso}T00:00:00`)
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()].slice(0, 3)}`
}

export const PlanillasScreen = () => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const navigation = useNavigation<Nav>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null)
  const [employeeSearchText, setEmployeeSearchText] = useState('')
  const [searchText, setSearchText] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [dateFilterOpen, setDateFilterOpen] = useState(false)
  const [detailEntry, setDetailEntry] = useState<PayrollEntry | null>(null)
  const [deletingEntry, setDeletingEntry] = useState<PayrollEntry | null>(null)

  const {
    data: entries,
    loading: loadingEntries,
    error,
    refreshing: refreshingEntries,
    refetch: refetchEntries,
  } = useSupabaseQuery(
    () => fetchPayrollEntries(dateFrom || undefined, dateTo || undefined),
    [refreshKey, dateFrom, dateTo],
  )
  const {
    properties,
    loadingProperties,
    refreshingProperties,
    refetchProperties,
    employees,
    loadingEmployees,
    refreshingEmployees,
    refetchEmployees,
  } = useReferenceData()

  const propertyMap = useMemo(() => new Map((properties ?? []).map((p) => [p.id, p.name])), [properties])
  const employeeMap = useMemo(() => new Map((employees ?? []).map((e) => [e.id, e.name])), [employees])
  const selectedEmployee = (employees ?? []).find((e) => e.id === selectedEmployeeId) ?? null

  const hasDateFilter = Boolean(dateFrom) || Boolean(dateTo)
  const dateRangeLabel =
    dateFrom && dateTo
      ? `${shortDateLabel(dateFrom)} – ${shortDateLabel(dateTo)}`
      : dateFrom
        ? `Desde ${shortDateLabel(dateFrom)}`
        : dateTo
          ? `Hasta ${shortDateLabel(dateTo)}`
          : 'Todas las fechas'

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1)
    }, []),
  )

  const employeeStats = useMemo(() => {
    const map = new Map<string, EmployeeStats>()
    for (const entry of entries ?? []) {
      const sales = entry.items.reduce((sum, item) => sum + item.amount, 0)
      const current = map.get(entry.employeeId) ?? { count: 0, sales: 0, profit: 0, pendingCount: 0 }
      current.count += 1
      current.sales += sales
      if (entry.amount == null) current.pendingCount += 1
      else current.profit += entry.amount - sales
      map.set(entry.employeeId, current)
    }
    return map
  }, [entries])

  const employeeCards = useMemo(() => {
    const q = employeeSearchText.trim().toLowerCase()
    return (employees ?? [])
      .filter((e) => !q || e.name.toLowerCase().includes(q))
      .map((employee) => ({ employee, stats: employeeStats.get(employee.id) }))
  }, [employees, employeeSearchText, employeeStats])

  const filtered = useMemo(() => {
    if (!selectedEmployeeId) return []
    const q = searchText.trim().toLowerCase()
    return (entries ?? []).filter((entry) => {
      if (entry.employeeId !== selectedEmployeeId) return false
      if (q) {
        const propertyName = propertyMap.get(entry.propertyId) ?? ''
        const haystack = [propertyName, entry.unitLabel, entry.serviceName].filter(Boolean).join(' ').toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [entries, propertyMap, selectedEmployeeId, searchText])

  const totals = useMemo(() => {
    let sales = 0
    let profit = 0
    for (const entry of filtered) {
      const entrySales = entry.items.reduce((sum, item) => sum + item.amount, 0)
      sales += entrySales
      if (entry.amount != null) profit += entry.amount - entrySales
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

  const renderEmployeeCard = ({ item }: { item: { employee: Employee; stats: EmployeeStats | undefined } }) => {
    const { employee, stats } = item
    return (
      <TouchableOpacity activeOpacity={0.75} onPress={() => setSelectedEmployeeId(employee.id)}>
        <Panel style={styles.employeeCard}>
          <View style={styles.employeeCardHeader}>
            <View style={styles.employeeCardHeaderText}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {employee.name}
              </Text>
              <Text style={styles.cardSubtitle} numberOfLines={1}>
                {employee.role}
              </Text>
            </View>
            <StatusPill status={employee.status} />
          </View>
          <View style={styles.employeeCardStats}>
            <View>
              <Text style={styles.statLabel}>Planillas</Text>
              <Text style={styles.statValue}>{stats?.count ?? 0}</Text>
            </View>
            <View>
              <Text style={styles.statLabel}>Pago</Text>
              <Text style={styles.statValueGood}>{currency(stats?.sales ?? 0)}</Text>
            </View>
          </View>
          {stats && stats.pendingCount > 0 ? (
            <Text style={styles.pendingBadge}>
              {stats.pendingCount} {stats.pendingCount === 1 ? 'planilla pendiente' : 'planillas pendientes'} de cobro
            </Text>
          ) : null}
        </Panel>
      </TouchableOpacity>
    )
  }

  const renderItem = ({ item }: { item: PayrollEntry }) => {
    const sales = item.items.reduce((sum, i) => sum + i.amount, 0)
    const profit = item.amount == null ? null : item.amount - sales
    const tax = item.amount == null ? null : taxOnAmount(item.amount)
    return (
      <TouchableOpacity activeOpacity={0.75} onPress={() => setDetailEntry(item)}>
        <Panel style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {propertyMap.get(item.propertyId) ?? '—'}
              {item.unitLabel ? ` · ${item.unitLabel}` : ''}
            </Text>
            <View style={styles.cardHeaderActions}>
              <Text style={item.amount == null ? styles.pendingAmount : styles.amount}>
                {item.amount == null ? 'Pendiente' : currency(item.amount)}
              </Text>
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                onPress={(e) => {
                  e.stopPropagation()
                  setDeletingEntry(item)
                }}
              >
                <Trash2 size={15} color={colors.rose} />
              </TouchableOpacity>
            </View>
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
          {item.taxable && (
            <View style={styles.taxRow}>
              <Text style={styles.taxRowLabel}>Impuesto ({(SALES_TAX_RATE * 100).toFixed(2)}%)</Text>
              <Text style={styles.taxRowValue}>{tax == null ? 'Pendiente' : currency(tax)}</Text>
            </View>
          )}
        </Panel>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Planillas"
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        right={
          <TouchableOpacity
            onPress={() => navigation.navigate('AddPayrollEntry')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.addButton}
          >
            <Plus size={22} color={colors.gold500} />
          </TouchableOpacity>
        }
      />

      {selectedEmployeeId === null ? (
        <>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Search size={16} color={colors.ink500} />
              <TextInput
                value={employeeSearchText}
                onChangeText={setEmployeeSearchText}
                placeholder="Buscar empleado por nombre…"
                placeholderTextColor={colors.ink500}
                style={styles.searchInput}
                autoCorrect={false}
              />
            </View>

            <TouchableOpacity style={styles.dateButton} activeOpacity={0.7} onPress={() => setDateFilterOpen(true)}>
              <CalendarDays size={14} color={colors.ink300} />
              <Text style={styles.dateButtonText}>{dateRangeLabel}</Text>
            </TouchableOpacity>
          </View>

          {loadingEmployees ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.gold400} />
            </View>
          ) : (
            <FlatList
              data={employeeCards}
              keyExtractor={(item) => item.employee.id}
              renderItem={renderEmployeeCard}
              contentContainerStyle={styles.list}
              refreshControl={
                <RefreshControl refreshing={refreshingEmployees} onRefresh={refetchEmployees} tintColor={colors.gold400} colors={[colors.gold400]} />
              }
              ListEmptyComponent={
                <Text style={styles.emptyText}>
                  {employeeSearchText ? `Ningún empleado coincide con "${employeeSearchText}".` : 'Todavía no hay empleados registrados.'}
                </Text>
              }
            />
          )}
        </>
      ) : (
        <>
          <TouchableOpacity style={styles.backRow} activeOpacity={0.7} onPress={() => setSelectedEmployeeId(null)}>
            <ChevronLeft size={16} color={colors.ink300} />
            <Text style={styles.backText}>Empleados</Text>
          </TouchableOpacity>

          <Text style={styles.employeeHeading} numberOfLines={1}>
            {selectedEmployee ? `${selectedEmployee.name} — ${selectedEmployee.role}` : ''}
          </Text>

          <View style={styles.statsGrid}>
            <StatCard label="Pago" value={currency(totals.sales)} icon={TrendingUp} tone="good" size="compact" />
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

            <TouchableOpacity style={styles.dateButton} activeOpacity={0.7} onPress={() => setDateFilterOpen(true)}>
              <CalendarDays size={14} color={colors.ink300} />
              <Text style={styles.dateButtonText}>{dateRangeLabel}</Text>
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
                  {searchText ? 'No hay planillas con estos filtros.' : 'Todavía no hay planillas registradas para este empleado.'}
                </Text>
              }
            />
          )}
        </>
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

      <PayrollEntryDetailModal
        entry={detailEntry}
        propertyMap={propertyMap}
        employeeMap={employeeMap}
        onClose={() => setDetailEntry(null)}
        onEdit={(entry) => {
          setDetailEntry(null)
          navigation.navigate('EditPayrollEntry', { entry })
        }}
        onDelete={(entry) => {
          setDetailEntry(null)
          setDeletingEntry(entry)
        }}
      />

      <ConfirmModal
        open={deletingEntry !== null}
        onClose={() => setDeletingEntry(null)}
        title="Eliminar planilla"
        message={
          deletingEntry
            ? `¿Eliminar la planilla de "${deletingEntry.serviceName}" del ${formatFullDate(deletingEntry.date)}? Esta acción no se puede deshacer. Si estaba ligada a un horario, ese horario vuelve a estar disponible para seleccionarse.`
            : ''
        }
        onConfirm={async () => {
          if (!deletingEntry) return
          await deletePayrollEntry(deletingEntry.id)
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
  addButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
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
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink300,
  },
  employeeHeading: {
    marginTop: 4,
    paddingHorizontal: 20,
    fontSize: 12,
    color: colors.ink500,
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
  employeeCard: {
    padding: 14,
    marginBottom: 10,
  },
  employeeCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  employeeCardHeaderText: {
    flex: 1,
  },
  employeeCardStats: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 24,
    borderTopWidth: 1,
    borderTopColor: colors.tint05,
    paddingTop: 10,
  },
  statLabel: {
    fontSize: 11,
    color: colors.ink500,
  },
  statValue: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  statValueGood: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    color: colors.emerald,
  },
  pendingBadge: {
    marginTop: 8,
    fontSize: 11,
    fontWeight: '600',
    color: colors.amber,
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
  cardHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
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
