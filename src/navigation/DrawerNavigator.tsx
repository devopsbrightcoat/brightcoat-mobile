import React from 'react'
import { createDrawerNavigator } from '@react-navigation/drawer'
import { AlertasScreen } from '../screens/AlertasScreen'
import { ConfiguracionScreen } from '../screens/ConfiguracionScreen'
import { DashboardScreen } from '../screens/DashboardScreen'
import { EmpleadosScreen } from '../screens/EmpleadosScreen'
import { FinanzasScreen } from '../screens/FinanzasScreen'
import { HorariosScreen } from '../screens/HorariosScreen'
import { PropiedadesScreen } from '../screens/PropiedadesScreen'
import { ReportesScreen } from '../screens/ReportesScreen'
import { DrawerContent } from './DrawerContent'

export type DrawerParamList = {
  Dashboard: undefined
  Horarios: undefined
  Finanzas: undefined
  Alertas: undefined
  Reportes: undefined
  Propiedades: undefined
  Empleados: undefined
  Configuracion: undefined
}

const Drawer = createDrawerNavigator<DrawerParamList>()

// Reemplaza la barra de tabs de abajo: el sidebar se abre con el botón de
// hamburguesa que cada pantalla trae en su propio ScreenHeader — por eso
// headerShown queda en false acá también, igual que tenía el TabNavigator.
export const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        overlayColor: 'rgba(0,0,0,0.5)',
        drawerStyle: { width: 280 },
        swipeEdgeWidth: 40,
      }}
      drawerContent={(props) => <DrawerContent {...props} />}
    >
      <Drawer.Screen name="Dashboard" component={DashboardScreen} />
      <Drawer.Screen name="Horarios" component={HorariosScreen} />
      <Drawer.Screen name="Finanzas" component={FinanzasScreen} />
      <Drawer.Screen name="Alertas" component={AlertasScreen} />
      <Drawer.Screen name="Reportes" component={ReportesScreen} />
      <Drawer.Screen name="Propiedades" component={PropiedadesScreen} />
      <Drawer.Screen name="Empleados" component={EmpleadosScreen} />
      <Drawer.Screen name="Configuracion" component={ConfiguracionScreen} />
    </Drawer.Navigator>
  )
}
