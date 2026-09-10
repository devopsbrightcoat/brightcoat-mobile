import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Modal } from '../common/Modal'
import { StatusPill } from '../common/StatusPill'
import { currency } from '../../lib/format'
import { colors } from '../../theme/colors'
import type { Charge } from '../../types'

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
)

type ChargeDetailModalProps = {
  charge: Charge | null
  propertyMap: Map<string, string>
  serviceTypeMap: Map<string, string>
  onClose: () => void
}

// Vista de solo lectura de un cobro — se abre al tocar cualquier parte de
// una tarjeta en CobrosScreen (el estatus, adentro de la misma tarjeta, abre
// en cambio ChargeInvoiceModal — su propio TouchableOpacity no dispara este
// modal, mismo criterio que ScheduleDetailModal/HorariosScreen). Mismos
// campos que ChargeDetailModal.tsx en ops-web.
export const ChargeDetailModal = ({ charge, propertyMap, serviceTypeMap, onClose }: ChargeDetailModalProps) => {
  return (
    <Modal open={charge !== null} onClose={onClose} title="Detalle del cobro">
      {charge ? (
        <>
          <Field label="Propiedad">
            <Text style={styles.fieldValueText}>{propertyMap.get(charge.propertyId) ?? '—'}</Text>
          </Field>
          <Field label="Apartamento">
            <Text style={styles.fieldValueText}>{charge.unitLabel || '—'}</Text>
          </Field>
          <Field label="Servicio">
            <Text style={styles.fieldValueText}>
              {charge.serviceTypeId ? serviceTypeMap.get(charge.serviceTypeId) ?? '—' : '—'}
            </Text>
          </Field>
          <Field label="Fecha">
            <Text style={styles.fieldValueText}>{charge.generatedDate || '—'}</Text>
          </Field>
          <Field label="Estatus">
            <StatusPill status={charge.status} />
          </Field>
          <Field label="Invoice #">
            <Text style={styles.fieldValueText}>{charge.invoiceNumber || '—'}</Text>
          </Field>
          <Field label="Monto">
            <Text style={styles.fieldValueText}>{currency(charge.amount)}</Text>
          </Field>
          <Field label="Responsable">
            <Text style={styles.fieldValueText}>{charge.responsible || '—'}</Text>
          </Field>
          <Field label="Periodo de planilla">
            <Text style={styles.fieldValueText}>{charge.payrollPeriod || '—'}</Text>
          </Field>
          <Field label="Descripción">
            <Text style={styles.fieldValueText}>{charge.description || '—'}</Text>
          </Field>
          <Field label="Notas">
            <Text style={styles.fieldValueText}>{charge.notes || '—'}</Text>
          </Field>

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Extras</Text>
            {charge.extras.length === 0 ? (
              <Text style={styles.emptyExtras}>Sin extras.</Text>
            ) : (
              <View style={styles.extrasList}>
                {charge.extras.map((extra, i) => (
                  <View key={i} style={styles.extraRow}>
                    <Text style={styles.extraDesc} numberOfLines={1}>
                      {extra.description}
                    </Text>
                    <Text style={styles.extraAmount}>{currency(extra.amount)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
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
  emptyExtras: {
    fontSize: 13,
    color: colors.ink500,
  },
  extrasList: {
    gap: 6,
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  extraDesc: {
    flex: 1,
    fontSize: 13,
    color: colors.ink200,
  },
  extraAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
})
