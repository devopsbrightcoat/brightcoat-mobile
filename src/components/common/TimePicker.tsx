import React, { useMemo } from 'react'
import WheelPicker from '@quidone/react-native-wheel-picker'
import { StyleSheet, Text, View } from 'react-native'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'

type TimePickerProps = {
  label: string
  value: string
  onChange: (value: string) => void
}

const ITEM_HEIGHT = 26
const VISIBLE_ITEM_COUNT = 3

const pad2 = (n: number) => String(n).padStart(2, '0')

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1).map((h) => ({ value: h, label: pad2(h) }))
const MINUTES = Array.from({ length: 60 }, (_, m) => ({ value: m, label: pad2(m) }))
const PERIODS = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
] as const

type Period = (typeof PERIODS)[number]['value']

const to12h = (hour24: number): { hour12: number; period: Period } => {
  const period: Period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return { hour12, period }
}

const to24h = (hour12: number, period: Period): number => {
  if (period === 'AM') return hour12 === 12 ? 0 : hour12
  return hour12 === 12 ? 12 : hour12 + 12
}

const parseTime = (value: string) => {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value.trim())
  const hour24 = match ? Math.min(23, Math.max(0, parseInt(match[1], 10) || 0)) : 9
  const minute = match ? Math.min(59, Math.max(0, parseInt(match[2], 10) || 0)) : 0
  const { hour12, period } = to12h(hour24)
  return { hour12, minute, period }
}

export const TimePicker = ({ label, value, onChange }: TimePickerProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const { hour12, minute, period } = useMemo(() => parseTime(value), [value])

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerRow}>
        <WheelPicker
          data={HOURS_12}
          value={hour12}
          onValueChanged={({ item }) => onChange(`${pad2(to24h(item.value, period))}:${pad2(minute)}`)}
          width="32%"
          itemHeight={ITEM_HEIGHT}
          visibleItemCount={VISIBLE_ITEM_COUNT}
          itemTextStyle={styles.itemText}
          overlayItemStyle={styles.overlayItem}
        />
        <Text style={styles.colon}>:</Text>
        <WheelPicker
          data={MINUTES}
          value={minute}
          onValueChanged={({ item }) => onChange(`${pad2(to24h(hour12, period))}:${pad2(item.value)}`)}
          width="32%"
          itemHeight={ITEM_HEIGHT}
          visibleItemCount={VISIBLE_ITEM_COUNT}
          itemTextStyle={styles.itemText}
          overlayItemStyle={styles.overlayItem}
        />
        <WheelPicker
          data={PERIODS as unknown as { value: Period; label: string }[]}
          value={period}
          onValueChanged={({ item }) => onChange(`${pad2(to24h(hour12, item.value))}:${pad2(minute)}`)}
          width="30%"
          itemHeight={ITEM_HEIGHT}
          visibleItemCount={VISIBLE_ITEM_COUNT}
          itemTextStyle={styles.itemText}
          overlayItemStyle={styles.overlayItem}
        />
      </View>
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
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surface,
    paddingVertical: 2,
  },
  itemText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  overlayItem: {
    backgroundColor: 'rgba(227,167,48,0.1)',
    borderRadius: 6,
  },
  colon: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink300,
  },
})
