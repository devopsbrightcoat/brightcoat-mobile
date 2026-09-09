import React from 'react'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { MockBanner } from '../components/MockBanner'
import { Panel } from '../components/Panel'
import { ScreenHeader } from '../components/ScreenHeader'
import { StatusPill } from '../components/StatusPill'
import { employees, services } from '../mocks/data'
import { colors } from '../theme/colors'

export const EmpleadosScreen = () => {
  const navigation = useNavigation()
  const jobCount = (employeeId: string) => services.filter((s) => s.employeeId === employeeId).length

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Empleados"
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <MockBanner />
        <Text style={styles.count}>{employees.length} empleados registrados</Text>

        <View style={styles.list}>
          {employees.map((employee) => (
            <Panel key={employee.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle}>{employee.name}</Text>
                  <Text style={styles.cardSubtitle}>{employee.role}</Text>
                </View>
                <StatusPill status={employee.status} />
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>{jobCount(employee.id)} trabajos asignados</Text>
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
  count: {
    marginHorizontal: 20,
    marginTop: 14,
    fontSize: 12,
    color: colors.ink500,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 10,
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
