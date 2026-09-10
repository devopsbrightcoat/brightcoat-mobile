import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Panel } from '../../components/common/Panel'
import { StatCard } from '../../components/common/StatCard'
import { StatusPill } from '../../components/common/StatusPill'
import { AlertTriangle } from 'lucide-react-native'
import { employees, properties, serviceTypes, services } from '../../mocks/data'
import { colors } from '../../theme/colors'

const today = new Date().toISOString().slice(0, 10)

export const TrabajosAtrasadosScreen = () => {
  const propertyName = (id: string) => properties.find((p) => p.id === id)?.name ?? '—'
  const serviceTypeName = (id: string) => serviceTypes.find((s) => s.id === id)?.name ?? '—'
  const employeeName = (id?: string) => employees.find((e) => e.id === id)?.name ?? 'Sin asignar'

  const pending = useMemo(
    () =>
      services
        .filter((s) => s.status !== 'completed')
        .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate)),
    [],
  )

  const overdueCount = pending.filter((s) => s.scheduledDate < today).length

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.statsGrid}>
          <StatCard
            label="Trabajos atrasados"
            value={String(overdueCount)}
            icon={AlertTriangle}
            tone={overdueCount > 0 ? 'warn' : 'default'}
            hint={`${pending.length} pendientes o en proceso en total`}
          />
        </View>

        <Panel style={styles.listPanel}>
          {pending.map((s, index) => {
            const overdue = s.scheduledDate < today
            return (
              <View key={s.id} style={[styles.row, index === pending.length - 1 && styles.rowLast]}>
                <View style={styles.rowInfo}>
                  <View style={styles.titleRow}>
                    <Text style={styles.rowTitle} numberOfLines={1}>{propertyName(s.propertyId)}</Text>
                    {overdue ? <Text style={styles.overdueTag}>Atrasado</Text> : null}
                  </View>
                  <Text style={styles.rowSubtitle} numberOfLines={1}>
                    {serviceTypeName(s.serviceTypeId)} · {employeeName(s.employeeId)} · {s.scheduledDate}
                  </Text>
                </View>
                <StatusPill status={s.status} />
              </View>
            )
          })}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  overdueTag: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.rose,
    textTransform: 'uppercase',
  },
  rowSubtitle: {
    marginTop: 2,
    fontSize: 11,
    color: colors.ink500,
  },
})
