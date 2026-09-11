import React, { useMemo, useState } from 'react'
import { useRoute } from '@react-navigation/native'
import type { RouteProp } from '@react-navigation/native'
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react-native'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Panel } from '../../components/common/Panel'
import { SearchableSelect } from '../../components/common/SearchableSelect'
import { StatCard } from '../../components/common/StatCard'
import { StatusPill } from '../../components/common/StatusPill'
import { fetchCharges, fetchEmployees, fetchProperties, fetchSchedules, fetchServiceTypes } from '../../lib/api'
import { currency } from '../../lib/format'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import type { RootStackParamList } from '../../navigation/RootNavigator'
import { colors } from '../../theme/colors'

type Route = RouteProp<RootStackParamList, 'FinancieroPropiedad'>

// Reportes › Historial financiero de propiedad — "vista de detalle que
// combina ingresos, cobros y trabajos de una propiedad específica"
// (catálogo). En este modelo "ingresos" y "cobros" son la misma tabla
// (Charge: monto + estatus pagado/pendiente), así que se combinan en una
// sola sección — y "trabajos" es Schedule. Llega con propertyId ya
// seleccionado cuando se abre desde Actividad por propiedad, o se puede
// elegir cualquier propiedad (o todas) desde acá directamente.
export const FinancieroPropiedadScreen = () => {
  const route = useRoute<Route>()
  const [propertyId, setPropertyId] = useState(route.params?.propertyId ?? 'all')

  const { data: properties, loading: loadingProperties, error: errorProperties } = useSupabaseQuery(fetchProperties, [])
  const {
    data: charges,
    loading: loadingCharges,
    error: errorCharges,
    refreshing: refreshingCharges,
    refetch: refetchCharges,
  } = useSupabaseQuery(fetchCharges, [])
  const {
    data: schedules,
    loading: loadingSchedules,
    error: errorSchedules,
    refreshing: refreshingSchedules,
    refetch: refetchSchedules,
  } = useSupabaseQuery(fetchSchedules, [])
  const { data: serviceTypes, loading: loadingServiceTypes, error: errorServiceTypes } = useSupabaseQuery(
    fetchServiceTypes,
    [],
  )
  const { data: employees, loading: loadingEmployees, error: errorEmployees } = useSupabaseQuery(fetchEmployees, [])

  const loading = loadingProperties || loadingCharges || loadingSchedules || loadingServiceTypes || loadingEmployees
  const error = errorProperties ?? errorCharges ?? errorSchedules ?? errorServiceTypes ?? errorEmployees
  const refreshing = refreshingCharges || refreshingSchedules
  const handleRefresh = () => {
    refetchCharges()
    refetchSchedules()
  }

  const propertyOptions = useMemo(() => (properties ?? []).map((p) => ({ id: p.id, label: p.name })), [properties])
  const propertyName = (id: string) => properties?.find((p) => p.id === id)?.name ?? '—'
  const serviceTypeName = (id: string) => serviceTypes?.find((s) => s.id === id)?.name ?? '—'
  const employeeName = (id: string) => employees?.find((e) => e.id === id)?.name ?? 'Sin asignar'

  const filteredCharges = useMemo(
    () =>
      (charges ?? [])
        .filter((c) => propertyId === 'all' || c.propertyId === propertyId)
        .sort((a, b) => (b.generatedDate ?? '').localeCompare(a.generatedDate ?? '')),
    [charges, propertyId],
  )
  const filteredSchedules = useMemo(
    () =>
      (schedules ?? [])
        .filter((s) => propertyId === 'all' || s.propertyId === propertyId)
        .sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate)),
    [schedules, propertyId],
  )

  const totalRevenue = filteredCharges.reduce((sum, c) => sum + c.amount, 0)
  const collected = filteredCharges.filter((c) => c.status === 'paid').reduce((sum, c) => sum + c.amount, 0)
  const outstanding = filteredCharges.filter((c) => c.status === 'pending').reduce((sum, c) => sum + c.amount, 0)

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
        {error ? <Text style={styles.errorText}>No se pudieron cargar los datos: {error}</Text> : null}

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
          <StatCard label="Ingresos" value={currency(totalRevenue)} icon={TrendingUp} tone="good" />
          <StatCard label="Cobrado" value={currency(collected)} icon={Wallet} tone="good" />
          <StatCard label="Pendiente" value={currency(outstanding)} icon={TrendingDown} tone="warn" />
        </View>

        <Text style={styles.sectionTitle}>Cobros</Text>
        <Panel style={styles.listPanel}>
          {filteredCharges.length === 0 ? (
            <Text style={styles.emptyText}>Sin cobros registrados.</Text>
          ) : (
            filteredCharges.map((charge, index) => (
              <View key={charge.id} style={[styles.row, index === filteredCharges.length - 1 && styles.rowLast]}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {charge.description || (propertyId === 'all' ? propertyName(charge.propertyId) : 'Cobro')}
                  </Text>
                  <Text style={styles.rowSubtitle}>
                    {propertyId === 'all' ? `${propertyName(charge.propertyId)} · ` : ''}
                    {charge.generatedDate || '—'}
                  </Text>
                </View>
                <View style={styles.rowRight}>
                  <Text style={styles.rowAmount}>{currency(charge.amount)}</Text>
                  <StatusPill status={charge.status} />
                </View>
              </View>
            ))
          )}
        </Panel>

        <Text style={styles.sectionTitle}>Trabajos</Text>
        <Panel style={styles.listPanel}>
          {filteredSchedules.length === 0 ? (
            <Text style={styles.emptyText}>Sin trabajos registrados.</Text>
          ) : (
            filteredSchedules.map((schedule, index) => (
              <View key={schedule.id} style={[styles.row, index === filteredSchedules.length - 1 && styles.rowLast]}>
                <View style={styles.rowInfo}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {serviceTypeName(schedule.serviceTypeId)}
                  </Text>
                  <Text style={styles.rowSubtitle} numberOfLines={1}>
                    {propertyId === 'all' ? `${propertyName(schedule.propertyId)} · ` : ''}
                    {employeeName(schedule.employeeId)} · {schedule.scheduledDate}
                  </Text>
                </View>
                <StatusPill status={schedule.status} />
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
