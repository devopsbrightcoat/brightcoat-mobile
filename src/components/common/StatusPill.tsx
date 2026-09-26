import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { getStatusColors, statusLabels } from '../../theme/colors'
import { useTheme } from '../../theme/ThemeContext'

type StatusPillProps = {
  status: string
  // Sobreescribe el texto sin tocar el color (que sigue por `status`) —
  // para cuando la misma clave necesita decir algo distinto según la
  // pantalla (ej. charges.status "paid" es "Subido a OPS" en Cobros, pero
  // sigue siendo "Pagado" en Impuestos, que usa la misma clave para el
  // estado del impuesto).
  label?: string
}

export const StatusPill = ({ status, label: labelOverride }: StatusPillProps) => {
  const { scheme } = useTheme()
  const statusColors = getStatusColors(scheme)
  const style = statusColors[status] ?? statusColors.inactive
  const label = labelOverride ?? statusLabels[status] ?? status

  return (
    <View style={[styles.pill, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
})
