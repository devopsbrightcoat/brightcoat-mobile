import React, { useMemo, useState } from 'react'
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native'
import { BarChart } from 'react-native-chart-kit'
import { Panel } from '../../components/Panel'
import { SearchableSelect } from '../../components/SearchableSelect'
import { categoryLabels, currency, expenses, properties } from '../../mocks/data'
import { colors } from '../../theme/colors'

const screenWidth = Dimensions.get('window').width

export const GastosCategoriaScreen = () => {
  const [propertyId, setPropertyId] = useState('all')

  const propertyOptions = useMemo(() => properties.map((p) => ({ id: p.id, label: p.name })), [])

  const filtered = useMemo(
    () => expenses.filter((e) => propertyId === 'all' || e.propertyId === propertyId),
    [propertyId],
  )

  const rows = useMemo(() => {
    const categories = ['materials', 'labor', 'transport', 'tools', 'other'] as const
    return categories
      .map((category) => ({
        category: categoryLabels[category],
        total: filtered.filter((e) => e.category === category).reduce((sum, e) => sum + e.amount, 0),
      }))
      .filter((row) => row.total > 0)
  }, [filtered])

  const total = filtered.reduce((sum, e) => sum + e.amount, 0)

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

        <Panel style={styles.chartPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Gastos por categoría</Text>
            <Text style={styles.panelTotal}>{currency(total)}</Text>
          </View>
          {rows.length > 0 ? (
            <BarChart
              data={{ labels: rows.map((r) => r.category), datasets: [{ data: rows.map((r) => r.total) }] }}
              width={screenWidth - 64}
              height={200}
              fromZero
              withInnerLines={false}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={{
                backgroundGradientFrom: colors.surfaceAlt,
                backgroundGradientTo: colors.surfaceAlt,
                decimalPlaces: 0,
                color: () => colors.gold500,
                labelColor: () => colors.ink400,
                barPercentage: 0.6,
              }}
              style={styles.chart}
            />
          ) : (
            <Text style={styles.emptyText}>No hay gastos con este filtro.</Text>
          )}
        </Panel>

        <Panel style={styles.listPanel}>
          {filtered
            .slice()
            .sort((a, b) => b.date.localeCompare(a.date))
            .map((expense, index, arr) => (
              <View key={expense.id} style={[styles.row, index === arr.length - 1 && styles.rowLast]}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={1}>{expense.description}</Text>
                  <Text style={styles.rowSubtitle}>{categoryLabels[expense.category]} · {expense.date}</Text>
                </View>
                <Text style={styles.rowAmount}>{currency(expense.amount)}</Text>
              </View>
            ))}
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
  chartPanel: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  panelTotal: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gold400,
  },
  chart: {
    marginTop: 8,
    marginLeft: -16,
    borderRadius: 8,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.ink500,
    textAlign: 'center',
  },
  listPanel: {
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
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
    color: colors.ink200,
  },
})
