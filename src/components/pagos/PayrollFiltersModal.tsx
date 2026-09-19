import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { InlineSelect } from '../common/InlineSelect'
import { Modal } from '../common/Modal'
import { QuincenaDateFilter } from '../dashboard/QuincenaDateFilter'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'
import type { Employee, Property } from '../../types'

type PayrollFiltersModalProps = {
  open: boolean
  onClose: () => void
  properties: Property[]
  employees: Employee[]
  propertyId: string
  employeeId: string
  dateFrom: string
  dateTo: string
  onPropertyChange: (id: string) => void
  onEmployeeChange: (id: string) => void
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
}

export const PayrollFiltersModal = ({
  open,
  onClose,
  properties,
  employees,
  propertyId,
  employeeId,
  dateFrom,
  dateTo,
  onPropertyChange,
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

  const hasFilters = propertyId !== 'all' || employeeId !== 'all' || Boolean(dateFrom) || Boolean(dateTo)

  const propertyOptions = properties.map((p) => ({ id: p.id, label: p.name }))
  const employeeOptions = employees.map((e) => ({ id: e.id, label: e.name }))

  return (
    <Modal open={open} onClose={onClose} title="Filtros" minHeight="65%">
      <InlineSelect
        options={propertyOptions}
        value={propertyId}
        onChange={onPropertyChange}
        allLabel="Todas las propiedades"
        searchPlaceholder="Buscar propiedad..."
        open={openField === 'property'}
        onOpenChange={(next) => setOpenField(next ? 'property' : null)}
      />

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
          onPropertyChange('all')
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
