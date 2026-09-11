import React from 'react'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import {
  Activity,
  Banknote,
  Briefcase,
  ChevronRight,
  ClipboardList,
  DollarSign,
  LineChart,
  Receipt,
  TrendingDown,
  Users2,
} from 'lucide-react-native'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Panel } from '../components/common/Panel'
import { ScreenHeader } from '../components/common/ScreenHeader'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList>

type ReportRoute =
  | 'ReportesFinanciero'
  | 'ReportesCobros'
  | 'ReportesGastos'
  | 'ReportesPlanilla'
  | 'TrabajosPorEstatus'
  | 'PropiedadesActividad'
  | 'ProductividadEmpleado'
  | 'ServiciosPorTipo'
  | 'FinancieroPropiedad'

type ReportItem = { route: ReportRoute; title: string; description: string; icon: typeof LineChart }

const FINANCIAL_ITEMS: ReportItem[] = [
  {
    route: 'ReportesFinanciero',
    title: 'Financiero',
    description: 'Resumen financiero, ingresos por período y rentabilidad por propiedad.',
    icon: DollarSign,
  },
  {
    route: 'ReportesCobros',
    title: 'Cobros',
    description: 'Cobrado vs. pendiente, invoices por período y antigüedad de cartera.',
    icon: Receipt,
  },
  {
    route: 'ReportesGastos',
    title: 'Gastos',
    description: 'Evolución del gasto por período y comparación mensual.',
    icon: TrendingDown,
  },
  {
    route: 'ReportesPlanilla',
    title: 'Planilla',
    description: 'Planilla por propiedad, por empleado y pendiente de pago.',
    icon: Banknote,
  },
]

const OPERATIONS_ITEMS: ReportItem[] = [
  {
    route: 'TrabajosPorEstatus',
    title: 'Trabajos por estatus',
    description: 'Completados, cancelados, pendientes y atrasados, con su evolución semanal o mensual.',
    icon: ClipboardList,
  },
  {
    route: 'PropiedadesActividad',
    title: 'Actividad por propiedad',
    description: 'Cantidad de trabajos por propiedad, con ranking y filtro de inactivas.',
    icon: Briefcase,
  },
  {
    route: 'ProductividadEmpleado',
    title: 'Actividad por empleado',
    description: 'Distribución de la carga de trabajo entre empleados.',
    icon: Users2,
  },
  {
    route: 'ServiciosPorTipo',
    title: 'Servicios realizados',
    description: 'Cantidad de trabajos por tipo de servicio, con desglose por propiedad.',
    icon: Activity,
  },
  {
    route: 'FinancieroPropiedad',
    title: 'Historial financiero de propiedad',
    description: 'Ingresos, cobros y trabajos de una propiedad específica.',
    icon: LineChart,
  },
]

// Categoría "Operaciones y Propiedades" (móvil primero) se construyó
// primero acá; Financiero/Cobros/Gastos/Planilla vivían solo en ops-web
// hasta ahora — mismas agregaciones de dashboardMetrics.ts (ya portadas
// acá), adaptadas a los patrones de UI de mobile: SegmentedField en vez de
// <select>, tarjetas en vez de tabla ordenable.
export const ReportesScreen = () => {
  const navigation = useNavigation<Nav>()

  const handlePress = (route: ReportRoute) => {
    switch (route) {
      case 'ReportesFinanciero':
        navigation.navigate('ReportesFinanciero')
        return
      case 'ReportesCobros':
        navigation.navigate('ReportesCobros')
        return
      case 'ReportesGastos':
        navigation.navigate('ReportesGastos')
        return
      case 'ReportesPlanilla':
        navigation.navigate('ReportesPlanilla')
        return
      case 'TrabajosPorEstatus':
        navigation.navigate('TrabajosPorEstatus')
        return
      case 'PropiedadesActividad':
        navigation.navigate('PropiedadesActividad')
        return
      case 'ProductividadEmpleado':
        navigation.navigate('ProductividadEmpleado')
        return
      case 'ServiciosPorTipo':
        navigation.navigate('ServiciosPorTipo')
        return
      case 'FinancieroPropiedad':
        navigation.navigate('FinancieroPropiedad')
        return
    }
  }

  const renderItem = ({ route, title, description, icon: Icon }: ReportItem) => (
    <TouchableOpacity key={route} activeOpacity={0.75} onPress={() => handlePress(route)}>
      <Panel style={styles.card}>
        <View style={styles.iconChip}>
          <Icon size={18} color={colors.gold400} />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        <ChevronRight size={18} color={colors.ink500} />
      </Panel>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Reportes"
        subtitle="Financiero y operaciones"
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
      />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.groupTitle}>Financiero</Text>
        <View style={styles.list}>{FINANCIAL_ITEMS.map(renderItem)}</View>

        <Text style={styles.groupTitle}>Operaciones y propiedades</Text>
        <View style={styles.list}>{OPERATIONS_ITEMS.map(renderItem)}</View>
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
  groupTitle: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.ink500,
  },
  list: {
    paddingHorizontal: 20,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  iconChip: {
    height: 36,
    width: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(207,145,34,0.12)',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  cardDescription: {
    marginTop: 2,
    fontSize: 12,
    color: colors.ink400,
  },
})
