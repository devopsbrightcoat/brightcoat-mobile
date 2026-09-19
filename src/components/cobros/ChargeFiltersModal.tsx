import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { InlineSelect } from '../common/InlineSelect'
import { Modal } from '../common/Modal'
import { SelectField } from '../common/SelectField'
import { QuincenaDateFilter } from '../dashboard/QuincenaDateFilter'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'
import type { PaymentStatus, Property, ServiceType } from '../../types'

type StatusFilter = 'all' | PaymentStatus

type ChargeFiltersModalProps = {
  open: boolean
  onClose: () => void
  properties: Property[]
  serviceTypes: ServiceType[]
  propertyId: string
  status: StatusFilter
  serviceTypeId: string
  dateFrom: string
  dateTo: string
  onPropertyChange: (id: string) => void
  onStatusChange: (status: StatusFilter) => void
  onServiceTypeChange: (id: string) => void
  onDateFromChange: (value: string) => void
  onDateToChange: (value: string) => void
}

export const ChargeFiltersModal = ({
  open,
  onClose,
  properties,
  serviceTypes,
  propertyId,
  status,
  serviceTypeId,
  dateFrom,
  dateTo,
  onPropertyChange,
  onStatusChange,
  onServiceTypeChange,
  onDateFromChange,
  onDateToChange,
}: ChargeFiltersModalProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [openField, setOpenField] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setOpenField(null)
  }, [open])

  const hasFilters = propertyId !== 'all' || status !== 'all' || serviceTypeId !== 'all' || Boolean(dateFrom) || Boolean(dateTo)

  const propertyOptions = properties.map((p) => ({ id: p.id, label: p.name }))
  const serviceTypeOptions = serviceTypes.map((t) => ({ id: t.id, label: t.name }))

  return (
    <Modal open={open} onClose={onClose} title="Filtros" minHeight="60%">
      <SelectField
        label="Estatus"
        value={status}
        onChange={(next) => onStatusChange(next as StatusFilter)}
        allLabel="Todos"
        options={[
          { id: 'paid', label: 'Subidos a OPS' },
          { id: 'pending', label: 'Pendientes' },
        ]}
      />

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
        options={serviceTypeOptions}
        value={serviceTypeId}
        onChange={onServiceTypeChange}
        allLabel="Todos los servicios"
        searchPlaceholder="Buscar servicio..."
        open={openField === 'serviceType'}
        onOpenChange={(next) => setOpenField(next ? 'serviceType' : null)}
      />

      <QuincenaDateFilter dateFrom={dateFrom} dateTo={dateTo} onDateFromChange={onDateFromChange} onDateToChange={onDateToChange} />

      <TouchableOpacity
        style={[styles.clearButton, !hasFilters && styles.clearButtonDisabled]}
        activeOpacity={0.7}
        disabled={!hasFilters}
        onPress={() => {
          onPropertyChange('all')
          onStatusChange('all')
          onServiceTypeChange('all')
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
