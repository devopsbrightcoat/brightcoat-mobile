import React from 'react'
import type { DrawerContentComponentProps } from '@react-navigation/drawer'
import {
  Banknote,
  Bell,
  Building2,
  Calendar,
  LayoutDashboard,
  LineChart,
  LogOut,
  Settings,
  Users,
} from 'lucide-react-native'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../auth/AuthProvider'
import type { ProfileRole } from '../auth/AuthProvider'
import { useUnreadNotificationsCount } from '../lib/useUnreadNotificationsCount'
import { colors } from '../theme/colors'
import type { DrawerParamList } from './DrawerNavigator'

const roleLabel: Record<ProfileRole, string> = {
  owner: 'Dueño',
  admin: 'Administrador',
  staff: 'Staff',
  finance: 'Finanzas',
}

const items: { key: keyof DrawerParamList; label: string; icon: typeof LayoutDashboard; hiddenForStaff?: boolean }[] = [
  { key: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'Horarios', label: 'Horarios', icon: Calendar },
  { key: 'Finanzas', label: 'Finanzas', icon: Banknote },
  // Sin esta pantalla para staff — ver ConfiguracionScreen.tsx (misma
  // regla que la pestaña "Alertas" de Configuración).
  { key: 'Alertas', label: 'Alertas', icon: Bell, hiddenForStaff: true },
  { key: 'Reportes', label: 'Reportes', icon: LineChart },
  { key: 'Propiedades', label: 'Propiedades', icon: Building2 },
  { key: 'Empleados', label: 'Empleados', icon: Users },
  { key: 'Configuracion', label: 'Configuración', icon: Settings },
]

// Contenido del sidebar que se abre con el botón de hamburguesa. Reemplaza
// tanto la barra de tabs de abajo como la pantalla "Más" — junta todas las
// secciones en un solo menú, más el botón de cerrar sesión al final.
export const DrawerContent = (props: DrawerContentComponentProps) => {
  const { profile, signOut } = useAuth()
  const activeRoute = props.state.routeNames[props.state.index]
  const isStaff = profile?.role === 'staff'
  const unreadCount = useUnreadNotificationsCount(!isStaff)
  const visibleItems = items.filter((item) => !item.hiddenForStaff || !isStaff)

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
        {visibleItems.map(({ key, label, icon: Icon }) => {
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
              {key === 'Alertas' && unreadCount > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                </View>
              ) : null}
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.footer}>
        <View style={styles.userRow}>
          <View style={styles.userTextGroup}>
            <Text style={styles.userName} numberOfLines={1}>
              {profile?.fullName || profile?.username || 'Usuario'}
            </Text>
            <Text style={styles.userRole} numberOfLines={1}>
              {profile ? roleLabel[profile.role] ?? profile.role : ''}
            </Text>
          </View>
          <TouchableOpacity onPress={() => signOut()} hitSlop={8} style={styles.signOutButton}>
            <LogOut size={18} color={colors.rose} />
          </TouchableOpacity>
        </View>
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
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: colors.ink300,
  },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: colors.gold500,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.brand900,
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
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  userTextGroup: {
    flex: 1,
    minWidth: 0,
  },
  userName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  userRole: {
    marginTop: 1,
    fontSize: 11,
    color: colors.ink400,
  },
  signOutButton: {
    padding: 6,
  },
})
