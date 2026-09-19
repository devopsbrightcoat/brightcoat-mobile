import React, { useMemo, useState } from 'react'
import { DrawerActions, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Plus } from 'lucide-react-native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ScreenHeader } from '../components/common/ScreenHeader'
import { CobrosScreen } from './finanzas/CobrosScreen'
import { GastosScreen } from './finanzas/GastosScreen'
import { ImpuestosScreen } from './finanzas/ImpuestosScreen'
import { ProveedoresScreen } from './finanzas/ProveedoresScreen'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { useTheme } from '../theme/ThemeContext'
import type { ThemeColors } from '../theme/colors'

type TabKey = 'cobros' | 'gastos' | 'impuestos' | 'proveedores'
type Nav = NativeStackNavigationProp<RootStackParamList>

const TABS: { key: TabKey; label: string }[] = [
  { key: 'cobros', label: 'Cobros' },
  { key: 'gastos', label: 'Gastos' },
  { key: 'impuestos', label: 'Impuestos' },
  { key: 'proveedores', label: 'Proveedores' },
]

export const FinanzasScreen = () => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const navigation = useNavigation<Nav>()
  const [tab, setTab] = useState<TabKey>('cobros')

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Finanzas"
        subtitle="Cobros, gastos e impuestos"
        showLogo
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        right={
          tab === 'cobros' ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddFixedCharge')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.addButton}
            >
              <Plus size={22} color={colors.gold500} />
            </TouchableOpacity>
          ) : tab === 'gastos' ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddExpense')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.addButton}
            >
              <Plus size={22} color={colors.gold500} />
            </TouchableOpacity>
          ) : tab === 'proveedores' ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddVendor')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.addButton}
            >
              <Plus size={22} color={colors.gold500} />
            </TouchableOpacity>
          ) : null
        }
      />

      <View style={styles.tabRow}>
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            activeOpacity={0.7}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'cobros' ? (
        <CobrosScreen />
      ) : tab === 'gastos' ? (
        <GastosScreen />
      ) : tab === 'impuestos' ? (
        <ImpuestosScreen />
      ) : (
        <ProveedoresScreen />
      )}
    </View>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  addButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
  },
  tabActive: {
    backgroundColor: colors.gold500,
    borderColor: colors.gold500,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink300,
  },
  tabTextActive: {
    color: colors.brand900,
  },
})
