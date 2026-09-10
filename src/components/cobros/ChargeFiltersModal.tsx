import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { InlineSelect } from '../common/InlineSelect'
import { Modal } from '../common/Modal'
import { SegmentedField } from '../common/SegmentedField'
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
  onPropertyChange: (id: string) => void
  onStatusChange: (status: StatusFilter) => void
  onServiceTypeChange: (id: string) => void
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
  onPropertyChange,
  onStatusChange,
  onServiceTypeChange,
}: ChargeFiltersModalProps) => {
  const [openField, setOpenField] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setOpenField(null)
  }, [open])

  const hasFilters = propertyId !== 'all' || status !== 'all' || serviceTypeId !== 'all'

  const propertyOptions = properties.map((p) => ({ id: p.id, label: p.name }))
  const serviceTypeOptions = serviceTypes.map((t) => ({ id: t.id, label: t.name }))

  return (
    <Modal open={open} onClose={onClose} title="Filtros" minHeight="60%">
      <SegmentedField
        label="Estatus"
        value={status}
        onChange={onStatusChange}
        options={[
          { value: 'all', label: 'Todos' },
          { value: 'paid', label: 'Subidos a OPS' },
          { value: 'pending', label: 'Pendientes' },
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
        insideModal
      />

      <InlineSelect
        options={serviceTypeOptions}
        value={serviceTypeId}
        onChange={onServiceTypeChange}
        allLabel="Todos los servicios"
        searchPlaceholder="Buscar servicio..."
        open={openField === 'serviceType'}
        onOpenChange={(next) => setOpenField(next ? 'serviceType' : null)}
        insideModal
      />

      <TouchableOpacity
        style={[styles.clearButton, !hasFilters && styles.clearButtonDisabled]}
        activeOpacity={0.7}
        disabled={!hasFilters}
        onPress={() => {
          onPropertyChange('all')
          onStatusChange('all')
          onServiceTypeChange('all')
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
