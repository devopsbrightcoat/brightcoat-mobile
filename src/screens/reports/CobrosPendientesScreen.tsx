import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Panel } from '../../components/common/Panel'
import { StatCard } from '../../components/common/StatCard'
import { Wallet } from 'lucide-react-native'
import { currency, income, properties } from '../../mocks/data'
import { colors } from '../../theme/colors'

export const CobrosPendientesScreen = () => {
  const propertyName = (id: string) => properties.find((p) => p.id === id)?.name ?? '—'

  const pending = income
    .filter((i) => i.status === 'pending')
    .sort((a, b) => a.date.localeCompare(b.date))

  const total = pending.reduce((sum, i) => sum + i.amount, 0)

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statsGrid}>
          <StatCard label="Total por cobrar" value={currency(total)} icon={Wallet} tone="warn" hint={`${pending.length} facturas pendientes`} />
        </View>

        <Panel style={styles.listPanel}>
          {pending.length === 0 ? (
            <Text style={styles.emptyText}>No hay cobros pendientes.</Text>
          ) : (
            pending.map((entry, index) => (
              <View key={entry.id} style={[styles.row, index === pending.length - 1 && styles.rowLast]}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{propertyName(entry.propertyId)}</Text>
                  <Text style={styles.rowSubtitle} numberOfLines={1}>{entry.clientReference} · {entry.date}</Text>
                </View>
                <Text style={styles.rowAmount}>{currency(entry.amount)}</Text>
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
  statsGrid: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  listPanel: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
  },
  emptyText: {
    paddingVertical: 16,
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
    color: colors.amber,
  },
})
