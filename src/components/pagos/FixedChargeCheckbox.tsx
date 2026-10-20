import React, { useMemo } from 'react'
import { Check } from 'lucide-react-native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'

type FixedChargeCheckboxProps = {
  checked: boolean
  onChange: (checked: boolean) => void
}

// Marca la planilla como de un servicio de cobro fijo (ej. limpieza de
// oficina que se cobra una vez al mes en Cobros): no lleva Cobro propio y
// no cuenta como pendiente de cobro.
export const FixedChargeCheckbox = ({ checked, onChange }: FixedChargeCheckboxProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <TouchableOpacity style={styles.container} activeOpacity={0.75} onPress={() => onChange(!checked)}>
      <View style={styles.row}>
        <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
          {checked ? <Check size={13} color={colors.brand900} strokeWidth={3} /> : null}
        </View>
        <Text style={styles.label}>Servicio de cobro fijo (finalizada)</Text>
      </View>
      <Text style={styles.hint}>
        Ya se cobra en el cobro fijo mensual — no lleva Cobro propio ni queda como pendiente de cobro.
      </Text>
    </TouchableOpacity>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    gap: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
    height: 20,
    width: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.tint25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.gold500,
    borderColor: colors.gold500,
  },
  label: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink200,
  },
  hint: {
    paddingLeft: 30,
    fontSize: 12,
    color: colors.ink500,
  },
})
