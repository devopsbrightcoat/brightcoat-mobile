import React, { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { formatQuincenaRangeParts, getQuincenaForDate, type QuincenaKey } from '../../lib/quincena'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'

type QuincenaPickerProps = {
  value: QuincenaKey
  onChange: (key: QuincenaKey) => void
}

export const QuincenaPicker = ({ value, onChange }: QuincenaPickerProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const isCurrent = value.index === getQuincenaForDate().index
  const { label, year } = formatQuincenaRangeParts(value)

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <TouchableOpacity
          onPress={() => onChange({ index: value.index - 1 })}
          disabled={value.index <= 0}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={[styles.arrowButton, value.index <= 0 && styles.arrowButtonDisabled]}
        >
          <ChevronLeft size={18} color={colors.ink300} />
        </TouchableOpacity>
        <Text style={styles.indexLabel}>
          Quincena {label} <Text style={styles.yearLabel}>{year}</Text>
        </Text>
        <TouchableOpacity
          onPress={() => onChange({ index: value.index + 1 })}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.arrowButton}
        >
          <ChevronRight size={18} color={colors.ink300} />
        </TouchableOpacity>
      </View>

      {!isCurrent && (
        <TouchableOpacity onPress={() => onChange(getQuincenaForDate())} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.todayLink}>Ir a la quincena actual</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  wrap: {
    gap: 8,
    alignItems: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surface,
  },
  arrowButton: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  arrowButtonDisabled: {
    opacity: 0.3,
  },
  indexLabel: {
    paddingHorizontal: 4,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  yearLabel: {
    color: colors.gold400,
  },
  todayLink: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold400,
  },
})
