import React from 'react'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import {
  Banknote,
  Building2,
  ClipboardList,
  LayoutDashboard,
  LineChart,
  LogOut,
  Settings,
  Users,
} from 'lucide-react-native'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../auth/AuthProvider'
import { colors } from '../theme/colors'
import type { DrawerParamList } from './DrawerNavigator'

const items: { key: keyof DrawerParamList; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'Trabajos', label: 'Trabajos', icon: ClipboardList },
  { key: 'Finanzas', label: 'Finanzas', icon: Banknote },
  { key: 'Reportes', label: 'Reportes', icon: LineChart },
  { key: 'Propiedades', label: 'Propiedades', icon: Building2 },
  { key: 'Empleados', label: 'Empleados', icon: Users },
  { key: 'Configuracion', label: 'Configuración', icon: Settings },
]

// Contenido del sidebar que se abre con el botón de hamburguesa. Reemplaza
// tanto la barra de tabs de abajo como la pantalla "Más" — junta todas las
// secciones en un solo menú, más el botón de cerrar sesión al final.
export const DrawerContent = (props: DrawerContentComponentProps) => {
  const { signOut } = useAuth()
  const activeRoute = props.state.routeNames[props.state.index]

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.brand}>
        <Image source={require('../assets/brightcoat-icon.png')} style={styles.logo} resizeMode="contain" />
        <View>
          <Text style={styles.brandTitle}>BrightCoat Ops</Text>
          <Text style={styles.brandSubtitle}>Panel interno</Text>
        </View>
      </View>

      <View style={styles.items}>
        {items.map(({ key, label, icon: Icon }) => {
          const active = activeRoute === key
          return (
            <TouchableOpacity
              key={key}
              style={[styles.item, active && styles.itemActive]}
              activeOpacity={0.7}
              onPress={() => props.navigation.navigate(key)}
            >
              <Icon size={18} color={active ? colors.gold400 : colors.ink300} />
              <Text style={[styles.itemLabel, active && styles.itemLabelActive]}>{label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.signOutRow} activeOpacity={0.7} onPress={() => signOut()}>
          <LogOut size={18} color={colors.rose} />
          <Text style={styles.signOutLabel}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.brand900,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  logo: {
    height: 32,
    width: 32,
  },
  brandTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  brandSubtitle: {
    marginTop: 1,
    fontSize: 12,
    color: colors.ink400,
  },
  items: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 4,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  itemActive: {
    backgroundColor: 'rgba(207,145,34,0.14)',
  },
  itemLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink300,
  },
  itemLabelActive: {
    color: colors.gold400,
    fontWeight: '700',
  },
  footer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  signOutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  signOutLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.rose,
  },
})
