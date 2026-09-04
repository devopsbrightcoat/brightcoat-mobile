import React, { useMemo } from 'react'
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native'
import { BarChart } from 'react-native-chart-kit'
import { Panel } from '../../components/Panel'
import { currency, serviceTypes, services } from '../../mocks/data'
import { colors } from '../../theme/colors'

const screenWidth = Dimensions.get('window').width

export const ServiciosPorTipoScreen = () => {
  const rows = useMemo(
    () =>
      serviceTypes
        .map((type) => {
          const matches = services.filter((s) => s.serviceTypeId === type.id)
          return {
            name: type.name,
            count: matches.length,
            total: matches.reduce((sum, s) => sum + s.cost, 0),
          }
        })
        .sort((a, b) => b.total - a.total),
    [],
  )

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Panel style={styles.chartPanel}>
          <Text style={styles.panelTitle}>Ingresos por tipo de servicio</Text>
          <BarChart
            data={{
              labels: rows.map((r) => r.name.split(' ')[0]),
              datasets: [{ data: rows.map((r) => r.total) }],
            }}
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
        </Panel>

        <Panel style={styles.listPanel}>
          {rows.map((row, index) => (
            <View key={row.name} style={[styles.row, index === rows.length - 1 && styles.rowLast]}>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle} numberOfLines={1}>{row.name}</Text>
                <Text style={styles.rowSubtitle}>{row.count} trabajos</Text>
              </View>
              <Text style={styles.rowAmount}>{currency(row.total)}</Text>
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
  chartPanel: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  chart: {
    marginTop: 8,
    marginLeft: -16,
    borderRadius: 8,
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
