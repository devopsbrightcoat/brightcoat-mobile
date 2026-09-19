import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { InlineSelect } from './InlineSelect'
import type { ThemeColors } from '../../theme/colors'
import { useTheme } from '../../theme/ThemeContext'

type Option = {
  id: string
  label: string
}

type SelectFieldProps = {
  label: string
  options: Option[]
  value: string
  onChange: (id: string) => void
  allLabel?: string
  placeholder?: string
  searchPlaceholder?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const SelectField = ({ label, ...selectProps }: SelectFieldProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <InlineSelect {...selectProps} />
    </View>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
  },
})
