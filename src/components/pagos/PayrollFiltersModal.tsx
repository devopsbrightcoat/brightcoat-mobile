import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { InlineSelect } from '../common/InlineSelect'
import { Modal } from '../common/Modal'
import { QuincenaDateFilter } from '../dashboard/QuincenaDateFilter'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'
import type { Employee } from '../../types'

type PayrollFiltersModalProps = {
  open: boolean
  onClose: () => void
  employees: Employee[]
  employeeId: string
  dateFrom: string
  dateTo: string
  onEmployeeChange: (id: string) => void
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
}

export const PayrollFiltersModal = ({
  open,
  onClose,
  employees,
  employeeId,
  dateFrom,
  dateTo,
  onEmployeeChange,
  onDateFromChange,
  onDateToChange,
}: PayrollFiltersModalProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [openField, setOpenField] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setOpenField(null)
  }, [open])

  const hasFilters = employeeId !== 'all' || Boolean(dateFrom) || Boolean(dateTo)

  const employeeOptions = employees.map((e) => ({ id: e.id, label: e.name }))

  return (
    <Modal open={open} onClose={onClose} title="Filtros" minHeight="65%">
      <InlineSelect
        options={employeeOptions}
        value={employeeId}
        onChange={onEmployeeChange}
        allLabel="Todos los empleados"
        searchPlaceholder="Buscar empleado..."
        open={openField === 'employee'}
        onOpenChange={(next) => setOpenField(next ? 'employee' : null)}
      />

      <QuincenaDateFilter dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={onDateFromChange} onDateToChange={onDateToChange} />

      <TouchableOpacity
        style={[styles.clearButton, !hasFilters && styles.clearButtonDisabled]}
        activeOpacity={0.7}
        disabled={!hasFilters}
        onPress={() => {
          onEmployeeChange('all')
          onDateFromChange('')
          onDateToChange('')
        }}
      >
        <Text style={[styles.clearButtonText, !hasFilters && styles.clearButtonTextDisabled]}>Limpiar filtros</Text>
      </TouchableOpacity>
    </Modal>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
