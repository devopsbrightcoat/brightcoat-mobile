import React, { useState } from 'react'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MockBanner } from '../components/MockBanner'
import { Panel } from '../components/Panel'
import { ScreenHeader } from '../components/ScreenHeader'
import { StatusPill } from '../components/StatusPill'
import { categoryLabels, currency, expenses, income, properties } from '../mocks/data'
import { colors } from '../theme/colors'

type TabKey = 'expenses' | 'income'

export const FinanzasScreen = () => {
  const navigation = useNavigation()
  const [tab, setTab] = useState<TabKey>('expenses')

  const propertyName = (id?: string) => (id ? properties.find((p) => p.id === id)?.name : 'Gasto general') ?? '—'

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Finanzas"
        subtitle="Gastos e ingresos por propiedad"
        showLogo
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <MockBanner />

        <View style={styles.tabRow}>
          <TouchableOpacity
            style={[styles.tab, tab === 'expenses' && styles.tabActive]}
            activeOpacity={0.7}
            onPress={() => setTab('expenses')}
          >
            <Text style={[styles.tabText, tab === 'expenses' && styles.tabTextActive]}>Gastos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'income' && styles.tabActive]}
            activeOpacity={0.7}
            onPress={() => setTab('income')}
          >
            <Text style={[styles.tabText, tab === 'income' && styles.tabTextActive]}>Ingresos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.list}>
          {tab === 'expenses'
            ? expenses.map((expense) => (
                <Panel key={expense.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{propertyName(expense.propertyId)}</Text>
                    <Text style={styles.amount}>{currency(expense.amount)}</Text>
                  </View>
                  <Text style={styles.cardSubtitle}>{categoryLabels[expense.category]} · {expense.date}</Text>
                </Panel>
              ))
            : income.map((entry) => (
                <Panel key={entry.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{propertyName(entry.propertyId)}</Text>
                    <Text style={styles.amount}>{currency(entry.amount)}</Text>
                  </View>
                  <Text style={styles.cardSubtitle} numberOfLines={1}>{entry.clientReference}</Text>
                  <View style={styles.cardFooter}>
                    <Text style={styles.cardMeta}>{entry.date}</Text>
                    <StatusPill status={entry.status} />
                  </View>
                </Panel>
              ))}
        </View>
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: colors.gold500,
    borderColor: colors.gold500,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink300,
  },
  tabTextActive: {
    color: colors.brand900,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 12,
    gap: 10,
  },
  card: {
    padding: 14,
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
    fontWeight: '600',
    color: colors.ink200,
  },
})
