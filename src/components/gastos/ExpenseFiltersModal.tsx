import React, { useMemo } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { FormField } from '../common/FormField'
import { InlineSelect } from '../common/InlineSelect'
import { Modal } from '../common/Modal'
import { QuincenaDateFilter } from '../dashboard/QuincenaDateFilter'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'
import type { Vendor } from '../../types'

type ExpenseFiltersModalProps = {
  open: boolean
  onClose: () => void
  dateFrom: string
  dateTo: string
  amountMin: string
  amountMax: string
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
  onAmountMinChange: (value: string) => void
  onAmountMaxChange: (value: string) => void
  vendorId: string
  vendors: Vendor[]
  onVendorIdChange: (value: string) => void
}

export const ExpenseFiltersModal = ({
  open,
  onClose,
  dateFrom,
  dateTo,
  amountMin,
  amountMax,
  onDateFromChange,
  onDateToChange,
  onAmountMinChange,
  onAmountMaxChange,
  vendorId,
  vendors,
  onVendorIdChange,
}: ExpenseFiltersModalProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const hasFilters = Boolean(dateFrom || dateTo || amountMin || amountMax || vendorId)
  const vendorOptions = vendors.map((v) => ({ id: v.id, label: v.name }))

  return (
    <Modal open={open} onClose={onClose} title="Filtros" minHeight="55%">
      <QuincenaDateFilter dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={onDateFromChange} onDateToChange={onDateToChange} />

      <View style={styles.row}>
        <View style={styles.half}>
          <FormField
            label="Monto mínimo"
            value={amountMin}
            onChangeText={onAmountMinChange}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>
        <View style={styles.half}>
          <FormField
            label="Monto máximo"
            value={amountMax}
            onChangeText={onAmountMaxChange}
            placeholder="0.00"
            keyboardType="decimal-pad"
          />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Proveedor</Text>
        <InlineSelect
          options={vendorOptions}
          value={vendorId}
          onChange={onVendorIdChange}
          placeholder="Todos"
          searchPlaceholder="Buscar…"
        />
      </View>

      <TouchableOpacity
        style={[styles.clearButton, !hasFilters && styles.clearButtonDisabled]}
        activeOpacity={0.7}
        disabled={!hasFilters}
        onPress={() => {
          onDateFromChange('')
          onDateToChange('')
          onAmountMinChange('')
          onAmountMaxChange('')
          onVendorIdChange('')
        }}
      >
        <Text style={[styles.clearButtonText, !hasFilters && styles.clearButtonTextDisabled]}>Limpiar filtros</Text>
      </TouchableOpacity>
    </Modal>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
  },
  field: {
    gap: 6,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
  },
  clearButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    paddingVertical: 12,
  },
  clearButtonDisabled: {
    opacity: 0.4,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink300,
  },
  clearButtonTextDisabled: {
    color: colors.ink500,
  },
})
