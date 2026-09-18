import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { InlineSelect } from '../common/InlineSelect'
import { SegmentedField } from '../common/SegmentedField'
import { formatMonthLabel } from '../../lib/scheduleDates'
import { formatQuincenaRangeLabel, listRecentMonths, type QuincenaHalf, type QuincenaKey } from '../../lib/quincena'
import { colors } from '../../theme/colors'

type QuincenaPickerProps = {
  value: QuincenaKey
  onChange: (key: QuincenaKey) => void
  monthsBack?: number
}

export const QuincenaPicker = ({ value, onChange, monthsBack = 24 }: QuincenaPickerProps) => {
  const months = listRecentMonths(monthsBack)
  const monthOptions = months.map((m) => ({ id: `${m.year}-${m.month}`, label: formatMonthLabel(m.year, m.month - 1) }))
  const monthKey = `${value.year}-${value.month}`

  const handleMonthChange = (id: string) => {
    const [year, month] = id.split('-').map(Number)
    onChange({ year, month, half: value.half })
  }

  return (
    <View style={styles.wrap}>
      <InlineSelect
        options={monthOptions}
        value={monthKey}
        onChange={handleMonthChange}
        placeholder="Seleccionar mes…"
        searchPlaceholder="Buscar…"
      />
      <SegmentedField<`${QuincenaHalf}`>
        label="Quincena"
        options={[
          { value: '1', label: '1ra quincena' },
          { value: '2', label: '2da quincena' },
        ]}
        value={String(value.half) as `${QuincenaHalf}`}
        onChange={(v) => onChange({ ...value, half: Number(v) as QuincenaHalf })}
      />
      <Text style={styles.rangeLabel}>{formatQuincenaRangeLabel(value)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  rangeLabel: {
    fontSize: 11,
    color: colors.ink500,
  },
})
