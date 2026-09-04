import React from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { Panel } from '../components/Panel'
import { serviceCategoryLabels, serviceTypes } from '../mocks/data'
import { colors } from '../theme/colors'

export const ConfiguracionScreen = () => {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionTitle}>Catálogo de tipos de servicio</Text>
        <Panel style={styles.panel}>
          {serviceTypes.map((type, index) => (
            <View key={type.id} style={[styles.row, index === serviceTypes.length - 1 && styles.rowLast]}>
              <Text style={styles.rowLabel}>{type.name}</Text>
              <Text style={styles.rowValue}>{serviceCategoryLabels[type.category]}</Text>
            </View>
          ))}
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
  sectionTitle: {
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.ink500,
  },
  panel: {
    marginHorizontal: 20,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 12,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 13,
    color: colors.ink200,
  },
  rowValue: {
    fontSize: 13,
    color: colors.ink400,
  },
})
