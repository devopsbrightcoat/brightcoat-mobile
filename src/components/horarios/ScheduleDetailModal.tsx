import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Modal } from '../common/Modal'
import { StatusPill } from '../common/StatusPill'
import { formatTime } from '../../lib/scheduleDates'
import { colors } from '../../theme/colors'
import type { Schedule } from '../../types'

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
)

type ScheduleDetailModalProps = {
  schedule: Schedule | null
  propertyMap: Map<string, string>
  serviceTypeMap: Map<string, string>
  employeeMap: Map<string, string>
  onClose: () => void
}

// Vista de solo lectura del detalle de un horario — se abre al tocar
// cualquier parte de una fila en HorariosScreen. Los botones de Estatus y
// Editar dentro de la fila son TouchableOpacity independientes (el sistema
// de responders de RN ya evita que su toque también dispare el de la fila),
// igual que ScheduleDetailModal.tsx en ops-web evita el modal con
// stopPropagation en el click.
export const ScheduleDetailModal = ({
  schedule,
  propertyMap,
  serviceTypeMap,
  employeeMap,
  onClose,
}: ScheduleDetailModalProps) => {
  return (
    <Modal open={schedule !== null} onClose={onClose} title="Detalle del horario">
      {schedule ? (
        <>
          <Field label="Propiedad">
            <Text style={styles.fieldValueText}>{propertyMap.get(schedule.propertyId) ?? '—'}</Text>
          </Field>
          <Field label="Unidad">
            <Text style={styles.fieldValueText}>{schedule.unitLabel || '—'}</Text>
          </Field>
          <Field label="Servicio">
            <Text style={styles.fieldValueText}>{serviceTypeMap.get(schedule.serviceTypeId) ?? '—'}</Text>
          </Field>
          <Field label="Empleado">
            <Text style={styles.fieldValueText}>{employeeMap.get(schedule.employeeId) ?? '—'}</Text>
          </Field>
          <Field label="Fecha">
            <Text style={styles.fieldValueText}>{schedule.scheduledDate}</Text>
          </Field>
          <Field label="Horario">
            <Text style={styles.fieldValueText}>{formatTime(schedule.scheduledTime)}</Text>
          </Field>
          <Field label="Estatus">
            <StatusPill status={schedule.status} />
          </Field>
        </>
      ) : null}
    </Modal>
  )
}

const styles = StyleSheet.create({
  field: {
    gap: 4,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.ink500,
  },
  fieldValueText: {
    fontSize: 14,
    color: colors.white,
  },
})
