import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ChevronLeft, ChevronRight, Filter, Pencil, Plus, Trash2 } from 'lucide-react-native'
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { ConfirmModal } from '../components/common/ConfirmModal'
import { Panel } from '../components/common/Panel'
import { ScreenHeader } from '../components/common/ScreenHeader'
import { StatusPill } from '../components/common/StatusPill'
import { ScheduleActionModal } from '../components/horarios/ScheduleActionModal'
import { ScheduleDetailModal } from '../components/horarios/ScheduleDetailModal'
import { ScheduleFiltersModal } from '../components/horarios/ScheduleFiltersModal'
import { deleteSchedule, fetchEmployees, fetchProperties, fetchSchedules, fetchServiceTypes } from '../lib/api'
import {
  DAY_LABELS,
  addDays,
  formatMonthLabel,
  formatWeekLabel,
  getWeeksInMonth,
  parseISODate,
  pickDateWithinWeek,
  pickWeekContaining,
  toISODate,
  type WeekRange,
} from '../lib/scheduleDates'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'
import type { Schedule } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList>

const today = new Date()

// Ancho de "slot" del carrusel de semanas: WEEK_ITEM_WIDTH es el chip
// visible, WEEK_ITEM_GAP el aire transparente alrededor. El slot completo
// (WEEK_SLOT_WIDTH) es lo que usa snapToInterval, y el padding lateral del
// FlatList (screenWidth - WEEK_SLOT_WIDTH) / 2 hace que el primer/último
// slot también puedan quedar centrados — es el truco estándar de RN para
// un carrusel centrado con "peek" de los vecinos a los lados.
const WEEK_ITEM_WIDTH = 210
const WEEK_ITEM_GAP = 14
const WEEK_SLOT_WIDTH = WEEK_ITEM_WIDTH + WEEK_ITEM_GAP
const screenWidth = Dimensions.get('window').width
const weekListPadding = Math.max(0, (screenWidth - WEEK_SLOT_WIDTH) / 2)

// Agenda semanal de servicios por propiedad y empleado — versión móvil de
// ops-web/src/pages/Horarios.tsx. Antes vivía en TrabajosScreen.tsx con el
// nombre "Trabajos" (heredado del placeholder de mocks que reemplazó la
// Fase 2); se renombró a Horarios para que coincida con el nombre real del
// módulo en el drawer y en ops-web. La tabla de la web se vuelve una lista
// de tarjetas tocables; sin exportar a Excel (eso se queda solo en
// ops-web, ver el plan).
export const HorariosScreen = () => {
  const navigation = useNavigation<Nav>()
  const [refreshKey, setRefreshKey] = useState(0)

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1)
    }, []),
  )

  const { data: schedules, loading, error } = useSupabaseQuery(fetchSchedules, [refreshKey])
  const { data: properties } = useSupabaseQuery(fetchProperties, [refreshKey])
  const { data: serviceTypes } = useSupabaseQuery(fetchServiceTypes, [refreshKey])
  const { data: employees } = useSupabaseQuery(fetchEmployees, [refreshKey])

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const weeks = useMemo(() => getWeeksInMonth(viewYear, viewMonth), [viewYear, viewMonth])

  const [selectedWeek, setSelectedWeek] = useState<WeekRange>(() => pickWeekContaining(weeks, today))
  const [selectedDateIso, setSelectedDateIso] = useState(() => toISODate(pickDateWithinWeek(selectedWeek, today)))

  const [actionSchedule, setActionSchedule] = useState<Schedule | null>(null)
  const [detailSchedule, setDetailSchedule] = useState<Schedule | null>(null)
  const [deletingSchedule, setDeletingSchedule] = useState<Schedule | null>(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [filterPropertyId, setFilterPropertyId] = useState('all')
  const [filterEmployeeId, setFilterEmployeeId] = useState('all')

  const weekListRef = useRef<FlatList<WeekRange>>(null)

  const changeMonth = (delta: number) => {
    let year = viewYear
    let month = viewMonth + delta
    if (month < 0) {
      month = 11
      year -= 1
    } else if (month > 11) {
      month = 0
      year += 1
    }
    const newWeeks = getWeeksInMonth(year, month)
    const newWeek = pickWeekContaining(newWeeks, today)
    setViewYear(year)
    setViewMonth(month)
    setSelectedWeek(newWeek)
    setSelectedDateIso(toISODate(pickDateWithinWeek(newWeek, today)))
  }

  const pickWeek = (week: WeekRange) => {
    setSelectedWeek(week)
    setSelectedDateIso(toISODate(pickDateWithinWeek(week, today)))
  }

  // Índice de la semana seleccionada dentro de `weeks` — se usa tanto para
  // centrar el carrusel (efecto de abajo) como referencia visual.
  const selectedWeekIndex = weeks.findIndex((w) => toISODate(w.start) === toISODate(selectedWeek.start))

  // Mantiene la semana seleccionada centrada bajo el mes: corre al tocar un
  // chip, al cambiar de mes (chevrons), y al terminar de arrastrar el
  // carrusel (el handler de abajo ya deja el scroll ahí, esto solo
  // confirma/corrige si hizo falta).
  useEffect(() => {
    if (selectedWeekIndex < 0) return
    weekListRef.current?.scrollToOffset({ offset: selectedWeekIndex * WEEK_SLOT_WIDTH, animated: true })
  }, [selectedWeekIndex, weeks])

  const handleWeekCarouselSettle = (offsetX: number) => {
    const index = Math.round(offsetX / WEEK_SLOT_WIDTH)
    const clamped = Math.max(0, Math.min(weeks.length - 1, index))
    const week = weeks[clamped]
    if (week && toISODate(week.start) !== toISODate(selectedWeek.start)) {
      pickWeek(week)
    }
  }

  const propertyMap = useMemo(() => new Map((properties ?? []).map((p) => [p.id, p.name])), [properties])
  const serviceTypeMap = useMemo(() => new Map((serviceTypes ?? []).map((t) => [t.id, t.name])), [serviceTypes])
  const employeeMap = useMemo(() => new Map((employees ?? []).map((e) => [e.id, e.name])), [employees])

  const dayRows = useMemo(
    () =>
      (schedules ?? [])
        .filter((s) => s.scheduledDate === selectedDateIso)
        .filter((s) => filterPropertyId === 'all' || s.propertyId === filterPropertyId)
        .filter((s) => filterEmployeeId === 'all' || s.employeeId === filterEmployeeId),
    [schedules, selectedDateIso, filterPropertyId, filterEmployeeId],
  )

  const activeFilterCount = (filterPropertyId !== 'all' ? 1 : 0) + (filterEmployeeId !== 'all' ? 1 : 0)
  const selectedDate = parseISODate(selectedDateIso)
  const monthLower = formatMonthLabel(selectedDate.getFullYear(), selectedDate.getMonth()).split(' ')[0].toLowerCase()

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Horarios"
        subtitle="Agenda semanal de servicios"
        showLogo
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        right={
          <TouchableOpacity
            onPress={() => navigation.navigate('AddSchedule', { defaultDate: selectedDateIso })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.addButton}
          >
            <Plus size={22} color={colors.gold500} />
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.monthNav}>
          <TouchableOpacity style={styles.monthButton} activeOpacity={0.7} onPress={() => changeMonth(-1)}>
            <ChevronLeft size={16} color={colors.ink300} />
          </TouchableOpacity>
          <Text style={styles.monthLabel}>{formatMonthLabel(viewYear, viewMonth)}</Text>
          <TouchableOpacity style={styles.monthButton} activeOpacity={0.7} onPress={() => changeMonth(1)}>
            <ChevronRight size={16} color={colors.ink300} />
          </TouchableOpacity>
        </View>

        <FlatList
          ref={weekListRef}
          data={weeks}
          keyExtractor={(week) => toISODate(week.start)}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={WEEK_SLOT_WIDTH}
          decelerationRate="fast"
          disableIntervalMomentum
          style={styles.weekCarousel}
          contentContainerStyle={{ paddingHorizontal: weekListPadding }}
          getItemLayout={(_, index) => ({ length: WEEK_SLOT_WIDTH, offset: WEEK_SLOT_WIDTH * index, index })}
          onMomentumScrollEnd={(e) => handleWeekCarouselSettle(e.nativeEvent.contentOffset.x)}
          renderItem={({ item: week }) => {
            const isSelected = toISODate(week.start) === toISODate(selectedWeek.start)
            return (
              <View style={styles.weekSlot}>
                <TouchableOpacity
                  style={[styles.weekChip, isSelected && styles.weekChipSelected]}
                  activeOpacity={0.8}
                  onPress={() => pickWeek(week)}
                >
                  <Text style={[styles.weekChipText, isSelected && styles.weekChipTextSelected]}>
                    Semana del {formatWeekLabel(week)}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          }}
        />

        <View style={styles.dayStrip}>
          {DAY_LABELS.map((label, i) => {
            const day = addDays(selectedWeek.start, i)
            const dayIso = toISODate(day)
            const isSelected = dayIso === selectedDateIso
            return (
              <TouchableOpacity
                key={dayIso}
                style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                activeOpacity={0.75}
                onPress={() => setSelectedDateIso(dayIso)}
              >
                <Text style={[styles.dayCellLabel, isSelected && styles.dayCellLabelSelected]}>{label}</Text>
                <Text style={[styles.dayCellNumber, isSelected && styles.dayCellNumberSelected]}>{day.getDate()}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listTitle}>
              {DAY_LABELS[(selectedDate.getDay() + 6) % 7]} {selectedDate.getDate()} de {monthLower}
            </Text>
            <TouchableOpacity style={styles.filtersButton} activeOpacity={0.7} onPress={() => setFiltersOpen(true)}>
              <Filter size={14} color={colors.ink300} />
              <Text style={styles.filtersButtonText}>Filtros</Text>
              {activeFilterCount > 0 ? (
                <View style={styles.filtersBadge}>
                  <Text style={styles.filtersBadgeText}>{activeFilterCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.gold400} />
            </View>
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : dayRows.length === 0 ? (
            <Panel style={styles.emptyPanel}>
              <Text style={styles.emptyText}>
                {activeFilterCount > 0 ? 'No hay horarios para este día con estos filtros.' : 'No hay horarios para este día.'}
              </Text>
            </Panel>
          ) : (
            <View style={styles.list}>
              {dayRows.map((row) => {
                const delivered = row.status === 'delivered'
                return (
                  <TouchableOpacity key={row.id} activeOpacity={0.8} onPress={() => setDetailSchedule(row)}>
                    <Panel style={styles.card}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle} numberOfLines={1}>
                          {propertyMap.get(row.propertyId) ?? '—'}
                          {row.unitLabel ? ` · ${row.unitLabel}` : ''}
                        </Text>
                        <TouchableOpacity
                          disabled={delivered}
                          activeOpacity={0.7}
                          onPress={() => setActionSchedule(row)}
                          style={delivered ? styles.statusButtonDisabled : undefined}
                        >
                          <StatusPill status={row.status} />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.cardSubtitle}>{serviceTypeMap.get(row.serviceTypeId) ?? '—'}</Text>
                      <View style={styles.cardFooter}>
                        <Text style={styles.cardMeta}>
                          {employeeMap.get(row.employeeId) ?? '—'}
                        </Text>
                        <View style={styles.footerActions}>
                          <TouchableOpacity
                            disabled={delivered}
                            activeOpacity={0.7}
                            style={[styles.editButton, delivered && styles.editButtonDisabled]}
                            onPress={() => navigation.navigate('EditSchedule', { schedule: row })}
                          >
                            <Pencil size={12} color={colors.ink300} />
                            <Text style={styles.editButtonText}>Editar</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            disabled={delivered}
                            activeOpacity={0.7}
                            style={[styles.deleteButton, delivered && styles.editButtonDisabled]}
                            onPress={() => setDeletingSchedule(row)}
                          >
                            <Trash2 size={12} color={colors.rose} />
                            <Text style={styles.deleteButtonText}>Eliminar</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </Panel>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
        </View>
      </ScrollView>

      <ScheduleActionModal
        schedule={actionSchedule}
        onClose={() => setActionSchedule(null)}
        onSaved={() => setRefreshKey((k) => k + 1)}
      />

      <ScheduleDetailModal
        schedule={detailSchedule}
        propertyMap={propertyMap}
        serviceTypeMap={serviceTypeMap}
        employeeMap={employeeMap}
        onClose={() => setDetailSchedule(null)}
      />

      <ScheduleFiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        properties={properties ?? []}
        employees={employees ?? []}
        propertyId={filterPropertyId}
        employeeId={filterEmployeeId}
        onPropertyChange={setFilterPropertyId}
        onEmployeeChange={setFilterEmployeeId}
      />

      <ConfirmModal
        open={deletingSchedule !== null}
        onClose={() => setDeletingSchedule(null)}
        title="Eliminar horario"
        message={
          deletingSchedule
            ? `¿Eliminar el horario de "${propertyMap.get(deletingSchedule.propertyId) ?? '—'}"${
                deletingSchedule.unitLabel ? ` (${deletingSchedule.unitLabel})` : ''
              } del ${deletingSchedule.scheduledDate}? Esta acción no se puede deshacer.`
            : ''
        }
        onConfirm={async () => {
          if (!deletingSchedule) return
          await deleteSchedule(deletingSchedule.id)
          setRefreshKey((k) => k + 1)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  addButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  scroll: {
    paddingBottom: 32,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 16,
  },
  monthButton: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    padding: 8,
  },
  monthLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  weekCarousel: {
    marginTop: 14,
  },
  weekSlot: {
    width: WEEK_SLOT_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekChip: {
    width: WEEK_ITEM_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  weekChipSelected: {
    borderColor: colors.gold500,
    backgroundColor: colors.gold500,
  },
  weekChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink300,
    textAlign: 'center',
  },
  weekChipTextSelected: {
    color: colors.brand900,
    fontWeight: '700',
  },
  dayStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 16,
  },
  dayCell: {
    flex: 1,
    marginHorizontal: 2,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
  },
  dayCellSelected: {
    backgroundColor: colors.gold500,
  },
  dayCellLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.ink300,
  },
  dayCellLabelSelected: {
    color: colors.brand900,
  },
  dayCellNumber: {
    marginTop: 2,
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  dayCellNumberSelected: {
    color: colors.brand900,
  },
  listSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  listTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink300,
  },
  filtersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  filtersButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink300,
  },
  filtersBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold500,
    paddingHorizontal: 4,
  },
  filtersBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.brand900,
  },
  centered: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 13,
    color: colors.rose,
  },
  emptyPanel: {
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink500,
  },
  list: {
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
  statusButtonDisabled: {
    opacity: 0.6,
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
    flex: 1,
    fontSize: 11,
    color: colors.ink500,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  editButtonDisabled: {
    opacity: 0.4,
  },
  editButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.ink300,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  deleteButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: colors.rose,
  },
})
