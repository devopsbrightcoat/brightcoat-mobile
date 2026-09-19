import React from 'react'
import { Monitor, Moon, Sun } from 'lucide-react-native'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { colors } from '../../theme/colors'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemePreference } from '../../theme/ThemeContext'

// Vive en el drawer (navigation/DrawerContent.tsx), que se queda siempre
// oscuro como el sidebar de la web — por eso usa la paleta oscura fija
// (`colors`), no la paleta reactiva del tema.

const ICONS: Record<ThemePreference, typeof Sun> = { system: Monitor, light: Sun, dark: Moon }
const LABELS: Record<ThemePreference, string> = {
  system: 'Como el sistema',
  light: 'Claro',
  dark: 'Oscuro',
}

export const ThemeToggle = () => {
  const { preference, cyclePreference } = useTheme()
  const Icon = ICONS[preference]

  return (
    <TouchableOpacity style={styles.button} activeOpacity={0.7} onPress={cyclePreference} hitSlop={8}>
      <Icon size={16} color={colors.ink300} />
      <Text style={styles.label}>Tema: {LABELS[preference]}</Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink300,
  },
})
