import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { InlineSelect } from '../common/InlineSelect'
import { Modal } from '../common/Modal'
import { SelectField } from '../common/SelectField'
import { QuincenaDateFilter } from '../dashboard/QuincenaDateFilter'
import { colors } from '../../theme/colors'
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

// Filtros de Cobros — por propiedad, estatus y tipo de servicio. Aplican de
// inmediato, mismo criterio que ScheduleFiltersModal. El searchbar
// (propiedad/apartamento/descripción/invoice #) vive aparte, en
// CobrosScreen — igual que en ops-web (Cobros.tsx tiene el buscador afuera
// de ChargeFiltersModal).
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

const styles = StyleSheet.create({
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
