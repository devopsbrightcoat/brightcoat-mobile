import React, { useEffect, useMemo, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Modal } from '../common/Modal'
import { StatusPill } from '../common/StatusPill'
import { fetchChargeByScheduleId } from '../../lib/api'
import { currency } from '../../lib/format'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'
import type { Charge, Schedule } from '../../types'

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  )
}

type ScheduleDetailModalProps = {
  schedule: Schedule | null
  propertyMap: Map<string, string>
  serviceTypeMap: Map<string, string>
  employeeMap: Map<string, string>
  allSchedules: Schedule[]
  onClose: () => void
}

export const ScheduleDetailModal = ({
  schedule,
  propertyMap,
  serviceTypeMap,
  employeeMap,
  allSchedules,
  onClose,
}: ScheduleDetailModalProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const rescheduledTo = schedule?.rescheduledToId
    ? allSchedules.find((s) => s.id === schedule.rescheduledToId)
    : undefined
  const rescheduledFrom = schedule ? allSchedules.find((s) => s.rescheduledToId === schedule.id) : undefined

  const [charge, setCharge] = useState<Charge | null>(null)

  useEffect(() => {
    if (!schedule || schedule.status !== 'delivered' || schedule.isFixedCharge) {
      setCharge(null)
      return
    }
    let cancelled = false
    fetchChargeByScheduleId(schedule.id)
      .then((c) => {
        if (!cancelled) setCharge(c)
      })
      .catch(() => {
        if (!cancelled) setCharge(null)
      })
    return () => {
      cancelled = true
    }
  }, [schedule])

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
            <View style={styles.serviceRow}>
              <Text style={styles.fieldValueText}>{serviceTypeMap.get(schedule.serviceTypeId) ?? '—'}</Text>
              {schedule.isFixedCharge ? (
                <View style={styles.fixedBadge}>
                  <Text style={styles.fixedBadgeText}>Cobro fijo</Text>
                </View>
              ) : null}
            </View>
          </Field>
          <Field label="Empleado">
            <Text style={styles.fieldValueText}>{employeeMap.get(schedule.employeeId) ?? '—'}</Text>
          </Field>
          <Field label="Fecha">
            <Text style={styles.fieldValueText}>{schedule.scheduledDate}</Text>
          </Field>
          <Field label="Estatus">
            <StatusPill status={schedule.status} />
          </Field>
          {charge ? (
            <Field label="Total cobrado">
              <Text style={styles.fieldValueText}>{currency(charge.amount)}</Text>
            </Field>
          ) : null}
          {rescheduledTo ? (
            <Field label="Reagendado para">
              <Text style={styles.fieldValueText}>{rescheduledTo.scheduledDate}</Text>
            </Field>
          ) : null}
          {rescheduledFrom ? (
            <Field label="Reagendado desde">
              <Text style={styles.fieldValueText}>{rescheduledFrom.scheduledDate}</Text>
            </Field>
          ) : null}
        </>
      ) : null}
    </Modal>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  serviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fixedBadge: {
    borderRadius: 999,
    backgroundColor: `${colors.gold500}1a`,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  fixedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: colors.gold300,
  },
})
