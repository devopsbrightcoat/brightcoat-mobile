import React from 'react'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import {
  ClipboardList,
  LayoutDashboard,
  LineChart,
  MoreHorizontal,
  Wallet,
} from 'lucide-react-native'
import { colors } from '../theme/colors'
import { DashboardScreen } from '../screens/DashboardScreen'
import { FinanzasScreen } from '../screens/FinanzasScreen'
import { MasScreen } from '../screens/MasScreen'
import { ReportesScreen } from '../screens/ReportesScreen'
import { TrabajosScreen } from '../screens/TrabajosScreen'

export type TabParamList = {
  Dashboard: undefined
  Reportes: undefined
  Trabajos: undefined
  Finanzas: undefined
  Mas: undefined
}

const Tab = createBottomTabNavigator<TabParamList>()

export const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold400,
        tabBarInactiveTintColor: colors.ink500,
        tabBarStyle: {
          backgroundColor: colors.brand900,
          borderTopColor: 'rgba(255,255,255,0.08)',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Reportes"
        component={ReportesScreen}
        options={{ tabBarIcon: ({ color, size }) => <LineChart color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Trabajos"
        component={TrabajosScreen}
        options={{ tabBarIcon: ({ color, size }) => <ClipboardList color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Finanzas"
        component={FinanzasScreen}
        options={{ tabBarIcon: ({ color, size }) => <Wallet color={color} size={size} /> }}
      />
      <Tab.Screen
        name="Mas"
        component={MasScreen}
        options={{ title: 'Más', tabBarIcon: ({ color, size }) => <MoreHorizontal color={color} size={size} /> }}
      />
    </Tab.Navigator>
  )
}
