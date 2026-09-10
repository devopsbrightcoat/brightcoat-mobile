import React from 'react'
import { NavigationContainer, DarkTheme } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useAuth } from '../auth/AuthProvider'
import { colors } from '../theme/colors'
import type { Expense, PayrollEntry, Property, Schedule } from '../types'
import { AddExpenseScreen } from '../screens/AddExpenseScreen'
import { AddPayrollEntryScreen } from '../screens/AddPayrollEntryScreen'
import { AddPropertyScreen } from '../screens/AddPropertyScreen'
import { AddScheduleScreen } from '../screens/AddScheduleScreen'
import { EditExpenseScreen } from '../screens/EditExpenseScreen'
import { EditPayrollEntryScreen } from '../screens/EditPayrollEntryScreen'
import { EditPropertyScreen } from '../screens/EditPropertyScreen'
import { EditScheduleScreen } from '../screens/EditScheduleScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { CobrosPendientesScreen } from '../screens/reports/CobrosPendientesScreen'
import { FinancieroPropiedadScreen } from '../screens/reports/FinancieroPropiedadScreen'
import { GastosCategoriaScreen } from '../screens/reports/GastosCategoriaScreen'
import { ProductividadEmpleadoScreen } from '../screens/reports/ProductividadEmpleadoScreen'
import { PropiedadesActividadScreen } from '../screens/reports/PropiedadesActividadScreen'
import { ServiciosPorTipoScreen } from '../screens/reports/ServiciosPorTipoScreen'
import { TrabajosAtrasadosScreen } from '../screens/reports/TrabajosAtrasadosScreen'
import { DrawerNavigator } from './DrawerNavigator'

export type RootStackParamList = {
  Login: undefined
  Tabs: undefined
  AddProperty: undefined
  EditProperty: { property: Property }
  AddSchedule: { defaultDate: string }
  EditSchedule: { schedule: Schedule }
  AddExpense: undefined
  EditExpense: { expense: Expense }
  AddPayrollEntry: undefined
  EditPayrollEntry: { entry: PayrollEntry }
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

const screenOptions = {
  headerStyle: { backgroundColor: colors.surfaceAlt },
  headerTintColor: colors.white,
  headerShadowVisible: false,
  headerBackTitle: 'Atrás',
}

// Gate de autenticación: mientras se resuelve la sesión guardada se muestra
// un spinner, sin sesión solo se registra Login, y con sesión se registra
// el stack completo de la app. Mismo patrón que ops-web (App.tsx redirige
// según AuthProvider), adaptado a react-navigation en vez de react-router.
export const RootNavigator = () => {
  const { loading, session } = useAuth()

  return (
    <NavigationContainer theme={navigationTheme}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.gold500} size="large" />
        </View>
      ) : !session ? (
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Tabs" component={DrawerNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="AddProperty" component={AddPropertyScreen} options={{ title: 'Agregar propiedad' }} />
          <Stack.Screen name="EditProperty" component={EditPropertyScreen} options={{ title: 'Editar propiedad' }} />
          <Stack.Screen name="AddSchedule" component={AddScheduleScreen} options={{ title: 'Agregar horario' }} />
          <Stack.Screen name="EditSchedule" component={EditScheduleScreen} options={{ title: 'Editar horario' }} />
          <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Agregar gasto' }} />
          <Stack.Screen name="EditExpense" component={EditExpenseScreen} options={{ title: 'Editar gasto' }} />
          <Stack.Screen
            name="AddPayrollEntry"
            component={AddPayrollEntryScreen}
            options={{ title: 'Agregar planilla' }}
          />
          <Stack.Screen
            name="EditPayrollEntry"
            component={EditPayrollEntryScreen}
            options={{ title: 'Editar planilla' }}
          />
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
      )}
    </NavigationContainer>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
})
