import React from 'react'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import {
  AlertTriangle,
  Banknote,
  Building2,
  ChevronRight,
  PieChart,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react-native'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { MockBanner } from '../components/MockBanner'
import { ScreenHeader } from '../components/ScreenHeader'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList>

const reports = [
  {
    key: 'FinancieroPropiedad' as const,
    title: 'Financiero por propiedad',
    description: 'Ingresos, gastos y neto de cada propiedad',
    icon: Building2,
  },
  {
    key: 'GastosCategoria' as const,
    title: 'Gastos por categoría',
    description: 'Materiales, mano de obra, transporte y herramientas',
    icon: PieChart,
  },
  {
    key: 'CobrosPendientes' as const,
    title: 'Cobros pendientes',
    description: 'Facturas de clientes todavía sin pagar',
    icon: Wallet,
  },
  {
    key: 'ServiciosPorTipo' as const,
    title: 'Servicios por tipo',
    description: 'Ingresos generados por cada tipo de servicio',
    icon: Banknote,
  },
  {
    key: 'TrabajosAtrasados' as const,
    title: 'Trabajos pendientes / atrasados',
    description: 'Órdenes de trabajo sin completar, con las vencidas marcadas',
    icon: AlertTriangle,
  },
  {
    key: 'ProductividadEmpleado' as const,
    title: 'Productividad por empleado',
    description: 'Trabajos asignados e ingresos generados por empleado',
    icon: Users,
  },
  {
    key: 'PropiedadesActividad' as const,
    title: 'Propiedades con más actividad',
    description: 'Ranking de propiedades por número de trabajos',
    icon: TrendingUp,
  },
]

export const ReportesScreen = () => {
  const navigation = useNavigation<Nav>()

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Reportes"
        subtitle="Elige el reporte que necesitas"
        showLogo
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <MockBanner />

        <View style={styles.list}>
          {reports.map(({ key, title, description, icon: Icon }) => (
            <TouchableOpacity
              key={key}
              style={styles.row}
              activeOpacity={0.7}
              onPress={() => navigation.navigate(key)}
            >
              <View style={styles.iconChip}>
                <Icon size={18} color={colors.gold400} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{title}</Text>
                <Text style={styles.rowDescription}>{description}</Text>
              </View>
              <ChevronRight size={18} color={colors.ink500} />
            </TouchableOpacity>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  iconChip: {
    height: 36,
    width: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(207,145,34,0.1)',
  },
  rowText: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  rowDescription: {
    marginTop: 2,
    fontSize: 12,
    color: colors.ink500,
  },
})
