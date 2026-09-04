import React, { useMemo } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Panel } from '../../components/Panel'
import { currency, properties, services } from '../../mocks/data'
import { colors } from '../../theme/colors'

export const PropiedadesActividadScreen = () => {
  const rows = useMemo(
    () =>
      properties
        .map((property) => {
          const matches = services.filter((s) => s.propertyId === property.id)
          return {
            property,
            count: matches.length,
            total: matches.reduce((sum, s) => sum + s.cost, 0),
          }
        })
        .sort((a, b) => b.count - a.count || b.total - a.total),
    [],
  )

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.list}>
          {rows.map(({ property, count, total }, index) => (
            <Panel key={property.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.rankBadge}>
                  <Text style={styles.rankText}>{index + 1}</Text>
                </View>
                <View style={styles.cardHeaderText}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{property.name}</Text>
                  <Text style={styles.cardSubtitle}>{count} trabajos · {currency(total)}</Text>
                </View>
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
    gap: 12,
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
})
