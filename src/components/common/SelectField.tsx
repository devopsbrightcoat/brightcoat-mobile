import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { InlineSelect } from './InlineSelect'
import { colors } from '../../theme/colors'

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

export const SelectField = ({ label, ...selectProps }: SelectFieldProps) => (
  <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    <InlineSelect {...selectProps} />
  </View>
)

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
  },
})
