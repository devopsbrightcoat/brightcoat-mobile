import React, { useMemo, useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Panel } from '../../components/common/Panel'
import { ReportDateRangeBar } from '../../components/dashboard/ReportDateRangeBar'
import { SegmentedField } from '../../components/common/SegmentedField'
import { StatusPill } from '../../components/common/StatusPill'
import { useReferenceData } from '../../contexts/ReferenceDataContext'
import { fetchSchedules } from '../../lib/api'
import { computePropertyActivity, filterSchedulesByRange, type DateRange } from '../../lib/dashboardMetrics'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import type { RootStackParamList } from '../../navigation/RootNavigator'
import { colors } from '../../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList>
type FilterKey = 'all' | 'active' | 'inactive'

const FILTER_OPTIONS: { value: FilterKey; label: string }[] = [
  { value: 'all', label: 'Todas' },
  { value: 'active', label: 'Activas' },
  { value: 'inactive', label: 'Inactivas' },
]

export const PropiedadesActividadScreen = () => {
  const navigation = useNavigation<Nav>()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [appliedRange, setAppliedRange] = useState<DateRange | null>(null)

  const {
    data: schedules,
    loading: loadingSchedules,
    error: errorSchedules,
    refreshing: refreshingSchedules,
    refetch: refetchSchedules,
  } = useSupabaseQuery(fetchSchedules, [])
  const { properties, loadingProperties, errorProperties, refreshingProperties, refetchProperties } = useReferenceData()

  const loading = loadingSchedules || loadingProperties
  const error = errorSchedules ?? errorProperties
  const refreshing = refreshingSchedules || refreshingProperties
  const handleRefresh = () => {
    refetchSchedules()
    refetchProperties()
  }

  const range = useMemo(() => appliedRange ?? { start: '', end: '' }, [appliedRange])
  const rangedSchedules = useMemo(() => filterSchedulesByRange(schedules ?? [], range), [schedules, range])

  const rows = useMemo(() => {
    const all = computePropertyActivity(rangedSchedules, properties ?? [])
    return filter === 'all' ? all : all.filter((r) => r.status === filter)
  }, [rangedSchedules, properties, filter])

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
        {error ? <Text style={styles.errorText}>No se pudieron cargar las propiedades: {error}</Text> : null}

        <ReportDateRangeBar onGenerate={setAppliedRange} generated={appliedRange !== null} />

        {!appliedRange ? (
          <Text style={styles.rangePlaceholder}>
            Elige un rango de fechas y dale &quot;Generar reporte&quot; para ver la información.
          </Text>
        ) : (
          <>
        <View style={styles.segmentRow}>
          <SegmentedField label="Mostrar" options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
        </View>

        <View style={styles.list}>
          {rows.length === 0 ? (
            <Text style={styles.emptyText}>No hay propiedades con estos filtros.</Text>
          ) : (
            rows.map((row, index) => (
              <TouchableOpacity
                key={row.propertyId}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('FinancieroPropiedad', { propertyId: row.propertyId })}
              >
                <Panel style={styles.card}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{index + 1}</Text>
                  </View>
                  <View style={styles.cardHeaderText}>
                    <View style={styles.titleRow}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {row.name}
                      </Text>
                      {row.status === 'inactive' ? <StatusPill status="inactive" /> : null}
                    </View>
                    <Text style={styles.cardSubtitle}>
                      {row.count} trabajo{row.count === 1 ? '' : 's'}
                    </Text>
                  </View>
                </Panel>
              </TouchableOpacity>
            ))
          )}
        </View>
          </>
        )}
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
  rangePlaceholder: {
    marginHorizontal: 20,
    marginTop: 40,
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink500,
  },
  segmentRow: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  emptyText: {
    paddingVertical: 20,
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink500,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  rankBadge: {
    height: 28,
    width: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(207,145,34,0.12)',
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gold400,
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
    flexShrink: 1,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.ink400,
  },
})
