import React, { useMemo } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { DashboardPanel } from '../../components/dashboard/DashboardPanel'
import { Panel } from '../../components/common/Panel'
import { RankingBars } from '../../components/dashboard/RankingBars'
import { StatusPill } from '../../components/common/StatusPill'
import { fetchEmployees, fetchSchedules } from '../../lib/api'
import { computeEmployeeActivity } from '../../lib/dashboardMetrics'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import { colors } from '../../theme/colors'

// Reportes › Actividad por empleado — "distribución de la carga de trabajo
// entre empleados" (catálogo). A diferencia de la Productividad del
// Dashboard (solo cuenta "delivered"), acá se cuenta todo lo asignado —
// pendiente, en proceso y completado — porque la carga de trabajo incluye
// lo que todavía no se termina.
export const ProductividadEmpleadoScreen = () => {
  const {
    data: schedules,
    loading: loadingSchedules,
    error: errorSchedules,
    refreshing: refreshingSchedules,
    refetch: refetchSchedules,
  } = useSupabaseQuery(fetchSchedules, [])
  const {
    data: employees,
    loading: loadingEmployees,
    error: errorEmployees,
    refreshing: refreshingEmployees,
    refetch: refetchEmployees,
  } = useSupabaseQuery(fetchEmployees, [])

  const loading = loadingSchedules || loadingEmployees
  const error = errorSchedules ?? errorEmployees
  const refreshing = refreshingSchedules || refreshingEmployees
  const handleRefresh = () => {
    refetchSchedules()
    refetchEmployees()
  }

  const rows = useMemo(() => computeEmployeeActivity(schedules ?? [], employees ?? []), [schedules, employees])

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
        {error ? <Text style={styles.errorText}>No se pudieron cargar los empleados: {error}</Text> : null}

        <View style={styles.panelWrap}>
          <DashboardPanel title="Distribución de carga de trabajo" subtitle="Trabajos asignados por empleado">
            <RankingBars
              items={rows.map((r) => ({ id: r.employeeId, label: r.name, value: r.count }))}
              formatValue={(v) => `${v} trabajo${v === 1 ? '' : 's'}`}
              color={colors.gold500}
              emptyText="No hay empleados con trabajos asignados."
            />
          </DashboardPanel>
        </View>

        <View style={styles.list}>
          {rows.map((row) => (
            <Panel key={row.employeeId} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <View style={styles.titleRow}>
                    <Text style={styles.cardTitle}>{row.name}</Text>
                    {row.status === 'inactive' ? <StatusPill status="inactive" /> : null}
                  </View>
                </View>
                <Text style={styles.cardAmount}>
                  {row.count} total{row.count === 1 ? '' : 'es'}
                </Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>{row.completed} completados</Text>
                <Text style={styles.cardMeta}>{row.pending} pendientes/en proceso</Text>
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
  panelWrap: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  card: {
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  cardHeaderText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  cardAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gold400,
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
})
