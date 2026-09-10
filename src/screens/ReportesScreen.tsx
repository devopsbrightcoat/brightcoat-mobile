import React from 'react'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import { LineChart } from 'lucide-react-native'
import { StyleSheet, Text, View } from 'react-native'
import { ScreenHeader } from '../components/common/ScreenHeader'
import { colors } from '../theme/colors'

// Reportería queda pendiente a propósito (tanto en móvil como en la web) —
// los reportes que ya existían acá seguían mostrando datos de ejemplo
// (mocks/data.ts), no datos reales. En vez de dejar esa lista visible y dar
// la impresión de que ya funciona, se reemplaza por un estado "en
// construcción" simple hasta que se retome este módulo. Las pantallas de
// cada reporte (screens/reports/) se quedan en el código sin tocar, listas
// para cuando se conecten a datos reales.
export const ReportesScreen = () => {
  const navigation = useNavigation()

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Reportes"
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />
      <View style={styles.emptyState}>
        <View style={styles.emptyIcon}>
          <LineChart size={20} color={colors.ink400} />
        </View>
        <Text style={styles.emptyTitle}>Reportería en construcción</Text>
        <Text style={styles.emptyDescription}>Estamos trabajando en esta sección. Disponible próximamente.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    height: 48,
    width: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink200,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 12,
    color: colors.ink500,
    textAlign: 'center',
  },
})
