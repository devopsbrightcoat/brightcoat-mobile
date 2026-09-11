import React, { useMemo } from 'react'
import { ActivityIndicator, Dimensions, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { BarChart } from 'react-native-chart-kit'
import { Panel } from '../../components/common/Panel'
import { fetchProperties, fetchSchedules, fetchServiceTypes } from '../../lib/api'
import { computeServiceTypeActivity } from '../../lib/dashboardMetrics'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import { colors } from '../../theme/colors'

const screenWidth = Dimensions.get('window').width

// Reportes › Servicios realizados — "cantidad de trabajos por tipo de
// servicio, con desglose por propiedad" (catálogo). A diferencia de
// "Ingresos por tipo de servicio" del Dashboard (que suma $ de cobros),
// acá se cuentan trabajos (Schedule) — no hay monto en Schedule, eso vive
// en Charge.
export const ServiciosPorTipoScreen = () => {
  const {
    data: schedules,
    loading: loadingSchedules,
    error: errorSchedules,
    refreshing: refreshingSchedules,
    refetch: refetchSchedules,
  } = useSupabaseQuery(fetchSchedules, [])
  const {
    data: serviceTypes,
    loading: loadingServiceTypes,
    error: errorServiceTypes,
    refreshing: refreshingServiceTypes,
    refetch: refetchServiceTypes,
  } = useSupabaseQuery(fetchServiceTypes, [])
  const {
    data: properties,
    loading: loadingProperties,
    error: errorProperties,
    refreshing: refreshingProperties,
    refetch: refetchProperties,
  } = useSupabaseQuery(fetchProperties, [])

  const loading = loadingSchedules || loadingServiceTypes || loadingProperties
  const error = errorSchedules ?? errorServiceTypes ?? errorProperties
  const refreshing = refreshingSchedules || refreshingServiceTypes || refreshingProperties
  const handleRefresh = () => {
    refetchSchedules()
    refetchServiceTypes()
    refetchProperties()
  }

  const rows = useMemo(
    () => computeServiceTypeActivity(schedules ?? [], serviceTypes ?? [], properties ?? []),
    [schedules, serviceTypes, properties],
  )

  const chartData = {
    labels: rows.length > 0 ? rows.map((r) => (r.name.length > 10 ? `${r.name.slice(0, 9)}…` : r.name)) : ['—'],
    datasets: [{ data: rows.length > 0 ? rows.map((r) => r.count) : [0] }],
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.gold500} />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold400} colors={[colors.gold400]} />
        }
      >
        {error ? <Text style={styles.errorText}>No se pudieron cargar los servicios: {error}</Text> : null}

        <Panel style={styles.chartPanel}>
          <Text style={styles.panelTitle}>Trabajos por tipo de servicio</Text>
          {rows.length === 0 ? (
            <Text style={styles.emptyText}>No hay trabajos registrados.</Text>
          ) : (
            <BarChart
              data={chartData}
              width={screenWidth - 64}
              height={200}
              fromZero
              withInnerLines={false}
              yAxisLabel=""
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
          )}
        </Panel>

        <View style={styles.list}>
          {rows.map((row) => (
            <Panel key={row.serviceTypeId} style={styles.card}>
              <View style={styles.row}>
                <Text style={styles.rowTitle} numberOfLines={1}>
                  {row.name}
                </Text>
                <Text style={styles.rowAmount}>
                  {row.count} trabajo{row.count === 1 ? '' : 's'}
                </Text>
              </View>
              {row.byProperty.length > 0 ? (
                <View style={styles.breakdown}>
                  {row.byProperty.map((bp) => (
                    <View key={bp.propertyId} style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel} numberOfLines={1}>
                        {bp.name}
                      </Text>
                      <Text style={styles.breakdownValue}>{bp.count}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
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
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  scroll: {
    paddingBottom: 32,
  },
  errorText: {
    marginHorizontal: 20,
    marginTop: 16,
    fontSize: 13,
    color: colors.rose,
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
  emptyText: {
    paddingVertical: 20,
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink500,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  card: {
    padding: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  rowAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink200,
  },
  breakdown: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 8,
    gap: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  breakdownLabel: {
    flex: 1,
    fontSize: 11,
    color: colors.ink400,
  },
  breakdownValue: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink300,
  },
})
