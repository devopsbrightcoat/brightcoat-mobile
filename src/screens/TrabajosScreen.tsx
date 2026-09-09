import React from 'react'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { MockBanner } from '../components/MockBanner'
import { Panel } from '../components/Panel'
import { ScreenHeader } from '../components/ScreenHeader'
import { StatusPill } from '../components/StatusPill'
import { currency, employees, properties, serviceTypes, services } from '../mocks/data'
import { colors } from '../theme/colors'

export const TrabajosScreen = () => {
  const navigation = useNavigation()
  const propertyName = (id: string) => properties.find((p) => p.id === id)?.name ?? '—'
  const serviceTypeName = (id: string) => serviceTypes.find((s) => s.id === id)?.name ?? '—'
  const employeeName = (id?: string) => employees.find((e) => e.id === id)?.name ?? 'Sin asignar'

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Trabajos"
        subtitle={`${services.length} órdenes de trabajo`}
        showLogo
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <MockBanner />

        <View style={styles.list}>
          {services.map((service) => (
            <Panel key={service.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{propertyName(service.propertyId)}</Text>
                <StatusPill status={service.status} />
              </View>
              <Text style={styles.cardSubtitle}>{serviceTypeName(service.serviceTypeId)}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>{employeeName(service.employeeId)} · {service.scheduledDate}</Text>
                <Text style={styles.cardCost}>{currency(service.cost)}</Text>
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
    fontSize: 11,
    color: colors.ink500,
  },
  cardCost: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink200,
  },
})
