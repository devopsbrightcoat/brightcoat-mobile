import React from 'react'
import { NavigationContainer, DarkTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { colors } from '../theme/colors'
import { ConfiguracionScreen } from '../screens/ConfiguracionScreen'
import { EmpleadosScreen } from '../screens/EmpleadosScreen'
import { PropiedadesScreen } from '../screens/PropiedadesScreen'
import { CobrosPendientesScreen } from '../screens/reports/CobrosPendientesScreen'
import { FinancieroPropiedadScreen } from '../screens/reports/FinancieroPropiedadScreen'
import { GastosCategoriaScreen } from '../screens/reports/GastosCategoriaScreen'
import { ProductividadEmpleadoScreen } from '../screens/reports/ProductividadEmpleadoScreen'
import { PropiedadesActividadScreen } from '../screens/reports/PropiedadesActividadScreen'
import { ServiciosPorTipoScreen } from '../screens/reports/ServiciosPorTipoScreen'
import { TrabajosAtrasadosScreen } from '../screens/reports/TrabajosAtrasadosScreen'
import { TabNavigator } from './TabNavigator'

export type RootStackParamList = {
  Tabs: undefined
  Propiedades: undefined
  Empleados: undefined
  Configuracion: undefined
  FinancieroPropiedad: undefined
  GastosCategoria: undefined
  CobrosPendientes: undefined
  ServiciosPorTipo: undefined
  TrabajosAtrasados: undefined
  ProductividadEmpleado: undefined
  PropiedadesActividad: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.surface,
    card: colors.surfaceAlt,
    text: colors.white,
    border: 'rgba(255,255,255,0.1)',
    primary: colors.gold500,
  },
}

export const RootNavigator = () => {
  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surfaceAlt },
          headerTintColor: colors.white,
          headerShadowVisible: false,
          headerBackTitle: 'Atrás',
        }}
      >
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Propiedades" component={PropiedadesScreen} />
        <Stack.Screen name="Empleados" component={EmpleadosScreen} />
        <Stack.Screen name="Configuracion" component={ConfiguracionScreen} options={{ title: 'Configuración' }} />
        <Stack.Screen
          name="FinancieroPropiedad"
          component={FinancieroPropiedadScreen}
          options={{ title: 'Financiero por propiedad' }}
        />
        <Stack.Screen
          name="GastosCategoria"
          component={GastosCategoriaScreen}
          options={{ title: 'Gastos por categoría' }}
        />
        <Stack.Screen
          name="CobrosPendientes"
          component={CobrosPendientesScreen}
          options={{ title: 'Cobros pendientes' }}
        />
        <Stack.Screen
          name="ServiciosPorTipo"
          component={ServiciosPorTipoScreen}
          options={{ title: 'Servicios por tipo' }}
        />
        <Stack.Screen
          name="TrabajosAtrasados"
          component={TrabajosAtrasadosScreen}
          options={{ title: 'Trabajos atrasados' }}
        />
        <Stack.Screen
          name="ProductividadEmpleado"
          component={ProductividadEmpleadoScreen}
          options={{ title: 'Productividad' }}
        />
        <Stack.Screen
          name="PropiedadesActividad"
          component={PropiedadesActividadScreen}
          options={{ title: 'Más actividad' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
