import React, { useMemo } from 'react'
import { NavigationContainer, DarkTheme } from '@react-navigation/native'
import type { NavigatorScreenParams } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { useAuth } from '../auth/AuthProvider'
import { ReferenceDataProvider } from '../contexts/ReferenceDataContext'
import { usePushNotifications } from '../lib/pushNotifications'
import type { ThemeColors } from '../theme/colors'
import { useTheme } from '../theme/ThemeContext'
import type { ChargeTemplate, Employee, Expense, ExpenseTemplate, PayrollEntry, Property, Schedule, ServiceType, Vendor } from '../types'
import { AddEmployeeScreen } from '../screens/AddEmployeeScreen'
import { AddExpenseScreen } from '../screens/AddExpenseScreen'
import { AddChargeTemplateScreen } from '../screens/AddChargeTemplateScreen'
import { AddExpenseTemplateScreen } from '../screens/AddExpenseTemplateScreen'
import { AddFixedChargeScreen } from '../screens/AddFixedChargeScreen'
import { AddPayrollEntryScreen } from '../screens/AddPayrollEntryScreen'
import { AddPropertyScreen } from '../screens/AddPropertyScreen'
import { AddScheduleScreen } from '../screens/AddScheduleScreen'
import { AddServiceTypeScreen } from '../screens/AddServiceTypeScreen'
import { AddVendorScreen } from '../screens/AddVendorScreen'
import { EditEmployeeScreen } from '../screens/EditEmployeeScreen'
import { EditChargeTemplateScreen } from '../screens/EditChargeTemplateScreen'
import { EditExpenseScreen } from '../screens/EditExpenseScreen'
import { EditExpenseTemplateScreen } from '../screens/EditExpenseTemplateScreen'
import { EditPayrollEntryScreen } from '../screens/EditPayrollEntryScreen'
import { EditPropertyScreen } from '../screens/EditPropertyScreen'
import { EditScheduleScreen } from '../screens/EditScheduleScreen'
import { EditServiceTypeScreen } from '../screens/EditServiceTypeScreen'
import { EditVendorScreen } from '../screens/EditVendorScreen'
import { LoginScreen } from '../screens/LoginScreen'
import { FinancieroPropiedadScreen } from '../screens/reports/FinancieroPropiedadScreen'
import { ProductividadEmpleadoScreen } from '../screens/reports/ProductividadEmpleadoScreen'
import { PropiedadesActividadScreen } from '../screens/reports/PropiedadesActividadScreen'
import { ReportesCobrosScreen } from '../screens/reports/ReportesCobrosScreen'
import { ReportesFinancieroScreen } from '../screens/reports/ReportesFinancieroScreen'
import { ReportesGastosScreen } from '../screens/reports/ReportesGastosScreen'
import { ReportesPlanillaScreen } from '../screens/reports/ReportesPlanillaScreen'
import { ServiciosPorTipoScreen } from '../screens/reports/ServiciosPorTipoScreen'
import { TrabajosPorEstatusScreen } from '../screens/reports/TrabajosPorEstatusScreen'
import { DrawerNavigator } from './DrawerNavigator'
import type { DrawerParamList } from './DrawerNavigator'
import { navigationRef } from './navigationRef'

export type RootStackParamList = {
  Login: undefined
  Tabs: NavigatorScreenParams<DrawerParamList> | undefined
  AddProperty: undefined
  EditProperty: { property: Property }
  AddSchedule: { defaultDate: string }
  EditSchedule: { schedule: Schedule }
  AddExpense: undefined
  EditExpense: { expense: Expense }
  AddExpenseTemplate: undefined
  EditExpenseTemplate: { template: ExpenseTemplate }
  AddFixedCharge: undefined
  AddChargeTemplate: undefined
  EditChargeTemplate: { template: ChargeTemplate }
  AddPayrollEntry: undefined
  EditPayrollEntry: { entry: PayrollEntry }
  AddEmployee: undefined
  EditEmployee: { employee: Employee }
  AddServiceType: undefined
  EditServiceType: { serviceType: ServiceType }
  AddVendor: undefined
  EditVendor: { vendor: Vendor }
  FinancieroPropiedad: { propertyId?: string } | undefined
  ReportesFinanciero: undefined
  ReportesCobros: undefined
  ReportesGastos: undefined
  ReportesPlanilla: undefined
  ServiciosPorTipo: undefined
  TrabajosPorEstatus: undefined
  ProductividadEmpleado: undefined
  PropiedadesActividad: undefined
}

const Stack = createNativeStackNavigator<RootStackParamList>()

export const RootNavigator = () => {
  const { loading, session } = useAuth()
  const { colors } = useTheme()
  usePushNotifications(session?.user.id)

  const navigationTheme = useMemo(
    () => ({
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: colors.surface,
        card: colors.surfaceAlt,
        text: colors.white,
        border: colors.tint10,
        primary: colors.gold500,
      },
    }),
    [colors],
  )

  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.surfaceAlt },
      headerTintColor: colors.white,
      headerShadowVisible: false,
      headerBackTitle: 'Atrás',
    }),
    [colors],
  )

  const styles = useMemo(() => createStyles(colors), [colors])

  return (
    <NavigationContainer theme={navigationTheme} ref={navigationRef}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.gold500} size="large" />
        </View>
      ) : !session ? (
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      ) : (
        <ReferenceDataProvider>
        <Stack.Navigator screenOptions={screenOptions}>
          <Stack.Screen name="Tabs" component={DrawerNavigator} options={{ headerShown: false }} />
          <Stack.Screen name="AddProperty" component={AddPropertyScreen} options={{ title: 'Agregar propiedad' }} />
          <Stack.Screen name="EditProperty" component={EditPropertyScreen} options={{ title: 'Editar propiedad' }} />
          <Stack.Screen name="AddSchedule" component={AddScheduleScreen} options={{ title: 'Agregar horario' }} />
          <Stack.Screen name="EditSchedule" component={EditScheduleScreen} options={{ title: 'Editar horario' }} />
          <Stack.Screen name="AddExpense" component={AddExpenseScreen} options={{ title: 'Agregar gasto' }} />
          <Stack.Screen name="EditExpense" component={EditExpenseScreen} options={{ title: 'Editar gasto' }} />
          <Stack.Screen
            name="AddFixedCharge"
            component={AddFixedChargeScreen}
            options={{ title: 'Agregar cobro fijo' }}
          />
          <Stack.Screen
            name="AddChargeTemplate"
            component={AddChargeTemplateScreen}
            options={{ title: 'Agregar cobro fijo' }}
          />
          <Stack.Screen
            name="EditChargeTemplate"
            component={EditChargeTemplateScreen}
            options={{ title: 'Editar cobro fijo' }}
          />
          <Stack.Screen
            name="AddExpenseTemplate"
            component={AddExpenseTemplateScreen}
            options={{ title: 'Agregar gasto fijo' }}
          />
          <Stack.Screen
            name="EditExpenseTemplate"
            component={EditExpenseTemplateScreen}
            options={{ title: 'Editar gasto fijo' }}
          />
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
          <Stack.Screen name="AddEmployee" component={AddEmployeeScreen} options={{ title: 'Agregar empleado' }} />
          <Stack.Screen name="EditEmployee" component={EditEmployeeScreen} options={{ title: 'Editar empleado' }} />
          <Stack.Screen
            name="AddServiceType"
            component={AddServiceTypeScreen}
            options={{ title: 'Agregar servicio' }}
          />
          <Stack.Screen
            name="EditServiceType"
            component={EditServiceTypeScreen}
            options={{ title: 'Editar servicio' }}
          />
          <Stack.Screen name="AddVendor" component={AddVendorScreen} options={{ title: 'Agregar proveedor' }} />
          <Stack.Screen name="EditVendor" component={EditVendorScreen} options={{ title: 'Editar proveedor' }} />
          <Stack.Screen
            name="FinancieroPropiedad"
            component={FinancieroPropiedadScreen}
            options={{ title: 'Historial financiero' }}
          />
          <Stack.Screen
            name="ReportesFinanciero"
            component={ReportesFinancieroScreen}
            options={{ title: 'Financiero' }}
          />
          <Stack.Screen
            name="ReportesCobros"
            component={ReportesCobrosScreen}
            options={{ title: 'Cobros' }}
          />
          <Stack.Screen
            name="ReportesGastos"
            component={ReportesGastosScreen}
            options={{ title: 'Gastos' }}
          />
          <Stack.Screen
            name="ReportesPlanilla"
            component={ReportesPlanillaScreen}
            options={{ title: 'Planilla' }}
          />
          <Stack.Screen
            name="ServiciosPorTipo"
            component={ServiciosPorTipoScreen}
            options={{ title: 'Servicios realizados' }}
          />
          <Stack.Screen
            name="TrabajosPorEstatus"
            component={TrabajosPorEstatusScreen}
            options={{ title: 'Trabajos por estatus' }}
          />
          <Stack.Screen
            name="ProductividadEmpleado"
            component={ProductividadEmpleadoScreen}
            options={{ title: 'Actividad por empleado' }}
          />
          <Stack.Screen
            name="PropiedadesActividad"
            component={PropiedadesActividadScreen}
            options={{ title: 'Actividad por propiedad' }}
          />
        </Stack.Navigator>
        </ReferenceDataProvider>
      )}
    </NavigationContainer>
  )
}

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
  })
