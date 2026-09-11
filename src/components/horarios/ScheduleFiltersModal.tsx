import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { InlineSelect } from '../common/InlineSelect'
import { Modal } from '../common/Modal'
import { colors } from '../../theme/colors'
import type { Employee, Property } from '../../types'

type ScheduleFiltersModalProps = {
  open: boolean
  onClose: () => void
  properties: Property[]
  employees: Employee[]
  propertyId: string
  employeeId: string
  onPropertyChange: (id: string) => void
  onEmployeeChange: (id: string) => void
}

// Filtros de la agenda del día en HorariosScreen — por propiedad y por
// empleado. Los selects aplican de inmediato (mismo criterio que los
// filtros de Gastos), igual que ScheduleFiltersModal.tsx en ops-web. Usa
// InlineSelect (react-native-element-dropdown por debajo, panel siempre
// centrado en pantalla — ver InlineSelect.tsx).
//
// `openField` coordina que solo un select esté abierto a la vez: cada uno
// se controla pasándole `open`/`onOpenChange` con su propia "llave" — abrir
// uno pone su llave acá, lo que automáticamente cierra cualquier otro (su
// `open` deja de coincidir con `openField`). Agregar un filtro más el día
// de mañana es solo sumarle su llave a este mismo estado.
export const ScheduleFiltersModal = ({
  open,
  onClose,
  properties,
  employees,
  propertyId,
  employeeId,
  onPropertyChange,
  onEmployeeChange,
}: ScheduleFiltersModalProps) => {
  const [openField, setOpenField] = useState<string | null>(null)

  useEffect(() => {
    if (!open) setOpenField(null)
  }, [open])

  const hasFilters = propertyId !== 'all' || employeeId !== 'all'

  const propertyOptions = properties.map((p) => ({ id: p.id, label: p.name }))
  const employeeOptions = employees.map((e) => ({ id: e.id, label: e.name }))

  return (
    <Modal open={open} onClose={onClose} title="Filtros" minHeight="60%">
      <View style={styles.field}>
        <Text style={styles.label}>Propiedad</Text>
        <InlineSelect
          options={propertyOptions}
          value={propertyId}
          onChange={onPropertyChange}
          allLabel="Todas las propiedades"
          searchPlaceholder="Buscar propiedad..."
          open={openField === 'property'}
          onOpenChange={(next) => setOpenField(next ? 'property' : null)}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Empleado</Text>
        <InlineSelect
          options={employeeOptions}
          value={employeeId}
          onChange={onEmployeeChange}
          allLabel="Todos los empleados"
          searchPlaceholder="Buscar empleado..."
          open={openField === 'employee'}
          onOpenChange={(next) => setOpenField(next ? 'employee' : null)}
        />
      </View>

      <TouchableOpacity
        style={[styles.clearButton, !hasFilters && styles.clearButtonDisabled]}
        activeOpacity={0.7}
        disabled={!hasFilters}
        onPress={() => {
          onPropertyChange('all')
          onEmployeeChange('all')
        }}
      >
        <Text style={[styles.clearButtonText, !hasFilters && styles.clearButtonTextDisabled]}>Limpiar filtros</Text>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
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
