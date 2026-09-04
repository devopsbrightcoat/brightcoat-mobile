import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { MockBanner } from '../components/MockBanner'
import { Panel } from '../components/Panel'
import { StatusPill } from '../components/StatusPill'
import { clientTypeLabels, properties } from '../mocks/data'
import { colors } from '../theme/colors'

export const PropiedadesScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <MockBanner />
        <Text style={styles.count}>{properties.length} propiedades registradas</Text>

        <View style={styles.list}>
          {properties.map((property) => (
            <Panel key={property.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle} numberOfLines={1}>{property.name}</Text>
                <StatusPill status={property.status} />
              </View>
              <Text style={styles.cardSubtitle}>{property.address}</Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>{clientTypeLabels[property.clientType]}</Text>
                {property.managerContact ? <Text style={styles.cardMeta}>{property.managerContact}</Text> : null}
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
})
