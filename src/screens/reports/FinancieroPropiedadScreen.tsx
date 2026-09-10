import React, { useMemo, useState } from 'react'
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react-native'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Panel } from '../../components/common/Panel'
import { SearchableSelect } from '../../components/common/SearchableSelect'
import { StatCard } from '../../components/common/StatCard'
import { StatusPill } from '../../components/common/StatusPill'
import { currency, expenses, income, properties } from '../../mocks/data'
import { colors } from '../../theme/colors'

export const FinancieroPropiedadScreen = () => {
  const [propertyId, setPropertyId] = useState('all')

  const propertyOptions = useMemo(() => properties.map((p) => ({ id: p.id, label: p.name })), [])

  const filteredIncome = useMemo(
    () => income.filter((i) => propertyId === 'all' || i.propertyId === propertyId),
    [propertyId],
  )
  const filteredExpenses = useMemo(
    () => expenses.filter((e) => propertyId === 'all' || e.propertyId === propertyId),
    [propertyId],
  )

  const totalIncome = filteredIncome.reduce((sum, i) => sum + i.amount, 0)
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.selectRow}>
          <SearchableSelect
            title="Seleccionar propiedad"
            options={propertyOptions}
            value={propertyId}
            onChange={setPropertyId}
            allLabel="Todas las propiedades"
            searchPlaceholder="Buscar propiedad..."
          />
        </View>

        <View style={styles.statsGrid}>
          <StatCard label="Ingresos" value={currency(totalIncome)} icon={TrendingUp} tone="good" />
          <StatCard label="Gastos" value={currency(totalExpenses)} icon={TrendingDown} />
          <StatCard label="Neto" value={currency(totalIncome - totalExpenses)} icon={Wallet} tone="good" />
        </View>

        <Text style={styles.sectionTitle}>Ingresos</Text>
        <Panel style={styles.listPanel}>
          {filteredIncome.length === 0 ? (
            <Text style={styles.emptyText}>Sin ingresos registrados.</Text>
          ) : (
            filteredIncome.map((entry, index) => (
              <View key={entry.id} style={[styles.row, index === filteredIncome.length - 1 && styles.rowLast]}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{entry.clientReference}</Text>
                  <Text style={styles.rowSubtitle}>{entry.date}</Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>{currency(entry.amount)}</Text>
                  <StatusPill status={entry.status} />
                </View>
              </View>
            ))
          )}
        </Panel>

        <Text style={styles.sectionTitle}>Gastos</Text>
        <Panel style={styles.listPanel}>
          {filteredExpenses.length === 0 ? (
            <Text style={styles.emptyText}>Sin gastos registrados.</Text>
          ) : (
            filteredExpenses.map((expense, index) => (
              <View key={expense.id} style={[styles.row, index === filteredExpenses.length - 1 && styles.rowLast]}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{expense.description}</Text>
                  <Text style={styles.rowSubtitle}>{expense.date}</Text>
                </View>
                <Text style={styles.rowAmount}>{currency(expense.amount)}</Text>
              </View>
            ))
          )}
        </Panel>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    paddingBottom: 32,
  },
  selectRow: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
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
  listPanel: {
    marginHorizontal: 20,
    paddingHorizontal: 16,
  },
  emptyText: {
    paddingVertical: 14,
    fontSize: 13,
    color: colors.ink500,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowInfo: {
    flex: 1,
  },
  rowRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: colors.ink500,
  },
  rowAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink200,
  },
})
