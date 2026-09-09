import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors } from '../theme/colors'

type Option<T extends string> = {
  value: T
  label: string
}

type SegmentedFieldProps<T extends string> = {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

// Selector de una lista corta de opciones (tipo de cliente, estado) como
// chips tocables — no hay <select> nativo en RN y agregar un picker es otra
// dependencia nativa que no hace falta para 2-3 opciones. Genérico en T para
// reusarse con cualquier union de strings.
export function SegmentedField<T extends string>({ label, options, value, onChange }: SegmentedFieldProps<T>) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        {options.map((opt) => {
          const selected = opt.value === value
          return (
            <TouchableOpacity
              key={opt.value}
              activeOpacity={0.75}
              onPress={() => onChange(opt.value)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{opt.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  chipSelected: {
    borderColor: colors.gold500,
    backgroundColor: 'rgba(207,145,34,0.16)',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink300,
  },
  chipTextSelected: {
    color: colors.gold400,
    fontWeight: '700',
  },
})
