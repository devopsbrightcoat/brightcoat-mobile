import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Panel } from '../../components/Panel'
import { currency, employees, services } from '../../mocks/data'
import { colors } from '../../theme/colors'

export const ProductividadEmpleadoScreen = () => {
  const rows = useMemo(
    () =>
      employees
        .map((employee) => {
          const assigned = services.filter((s) => s.employeeId === employee.id)
          return {
            employee,
            jobCount: assigned.length,
            total: assigned.reduce((sum, s) => sum + s.cost, 0),
          }
        })
        .sort((a, b) => b.total - a.total),
    [],
  )

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.list}>
          {rows.map(({ employee, jobCount, total }) => (
            <Panel key={employee.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>{employee.name}</Text>
                  <Text style={styles.cardSubtitle}>{employee.role}</Text>
                </View>
                <Text style={styles.cardAmount}>{currency(total)}</Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>{jobCount} trabajos asignados</Text>
                {employee.hourlyRate ? <Text style={styles.cardMeta}>${employee.hourlyRate}/hr</Text> : null}
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
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.ink400,
  },
  cardAmount: {
    fontSize: 14,
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
