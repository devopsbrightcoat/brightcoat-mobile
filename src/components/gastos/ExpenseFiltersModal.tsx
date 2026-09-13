import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { DatePicker } from '../common/DatePicker'
import { FormField } from '../common/FormField'
import { InlineSelect } from '../common/InlineSelect'
import { Modal } from '../common/Modal'
import { colors } from '../../theme/colors'
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

// Filtros de Gastos — rango de fecha y rango de monto, mismos campos que
// ExpenseFiltersModal.tsx en ops-web. Sin selects (Gastos no está ligado a
// propiedad/empleado/servicio), así que son puros FormField de texto — las
// fechas son "AAAA-MM-DD" a mano, mismo criterio que Horarios (sin
// date-picker nativo, ver comentario en AddScheduleScreen). El searchbar
// (factura/descripción) vive aparte, en GastosScreen.
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
  const hasFilters = Boolean(dateFrom || dateTo || amountMin || amountMax || vendorId)
  const vendorOptions = vendors.map((v) => ({ id: v.id, label: v.name }))

  return (
    <Modal open={open} onClose={onClose} title="Filtros" minHeight="55%">
      <View style={styles.row}>
        <View style={styles.half}>
          <DatePicker label="Fecha desde" value={dateFrom} onChange={onDateFromChange} placeholder="Sin mínimo" />
        </View>
        <View style={styles.half}>
          <DatePicker label="Fecha hasta" value={dateTo} onChange={onDateToChange} placeholder="Sin máximo" />
        </View>
      </View>

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

const styles = StyleSheet.create({
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
    borderColor: 'rgba(255,255,255,0.1)',
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
