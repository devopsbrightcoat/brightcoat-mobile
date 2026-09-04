import React from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Building2, ChevronRight, Settings, Users } from 'lucide-react-native'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ScreenHeader } from '../components/ScreenHeader'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList>

const items = [
  { key: 'Propiedades' as const, label: 'Propiedades', icon: Building2 },
  { key: 'Empleados' as const, label: 'Empleados', icon: Users },
  { key: 'Configuracion' as const, label: 'Configuración', icon: Settings },
]

export const MasScreen = () => {
  const navigation = useNavigation<Nav>()

  return (
    <View style={styles.container}>
      <ScreenHeader title="Más" subtitle="Propiedades, empleados y configuración" showLogo />
      <ScrollView contentContainerStyle={styles.list}>
        {items.map(({ key, label, icon: Icon }) => (
          <TouchableOpacity
            key={key}
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(key)}
          >
            <View style={styles.rowLeft}>
              <Icon size={18} color={colors.ink300} />
              <Text style={styles.rowLabel}>{label}</Text>
            </View>
            <ChevronRight size={18} color={colors.ink500} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  list: {
    padding: 20,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.white,
  },
})
