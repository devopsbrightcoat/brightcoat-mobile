import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Modal } from '../common/Modal'
import { formatFullDate } from '../../lib/scheduleDates'
import { currency } from '../../lib/format'
import { colors } from '../../theme/colors'
import type { PayrollEntry } from '../../types'

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
)

type PayrollEntryDetailModalProps = {
  entry: PayrollEntry | null
  propertyMap: Map<string, string>
  employeeMap: Map<string, string>
  onClose: () => void
  onEdit: (entry: PayrollEntry) => void
}

// Vista de solo lectura de una planilla, con el desglose del servicio y los
// cálculos de Venta (suma del desglose) y Ganancia (Venta - Pago) — mismos
// campos que PayrollEntryDetailModal.tsx en ops-web. El botón "Editar" vive
// adentro de este modal (mismo criterio que ExpenseDetailModal) y navega a
// EditPayrollEntryScreen.
export const PayrollEntryDetailModal = ({ entry, propertyMap, employeeMap, onClose, onEdit }: PayrollEntryDetailModalProps) => {
  const sales = entry ? entry.items.reduce((sum, item) => sum + item.amount, 0) : 0
  const profit = entry && entry.amount != null ? sales - entry.amount : null

  return (
    <Modal open={entry !== null} onClose={onClose} title="Detalle de la planilla">
      {entry ? (
        <>
          <Field label="Fecha">
            <Text style={styles.fieldValueText}>{formatFullDate(entry.date)}</Text>
          </Field>
          <Field label="Servicio">
            <Text style={styles.fieldValueText}>{entry.serviceName}</Text>
          </Field>
          <Field label="Propiedad">
            <Text style={styles.fieldValueText}>{propertyMap.get(entry.propertyId) ?? '—'}</Text>
          </Field>
          <Field label="Unidad">
            <Text style={styles.fieldValueText}>{entry.unitLabel || '—'}</Text>
          </Field>
          <Field label="Empleado">
            <Text style={styles.fieldValueText}>{employeeMap.get(entry.employeeId) ?? '—'}</Text>
          </Field>

          <View style={styles.summaryBox}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pago</Text>
              <Text style={styles.summaryValue}>{entry.amount == null ? 'Pendiente' : currency(entry.amount)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Venta</Text>
              <Text style={[styles.summaryValue, styles.salesValue]}>{currency(sales)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Ganancia</Text>
              <Text
                style={[
                  styles.summaryValue,
                  profit == null ? styles.pendingValue : profit < 0 ? styles.negativeValue : styles.profitValue,
                ]}
              >
                {profit == null ? 'Pendiente' : currency(profit)}
              </Text>
            </View>
          </View>

          {entry.notes ? (
            <Field label="Notas">
              <Text style={styles.fieldValueText}>{entry.notes}</Text>
            </Field>
          ) : null}

          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Desglose del servicio</Text>
            {entry.items.length === 0 ? (
              <Text style={styles.emptyItems}>Sin desglose.</Text>
            ) : (
              <View style={styles.itemsList}>
                {entry.items.map((item) => (
                  <View key={item.id} style={styles.itemRow}>
                    <Text style={styles.itemDesc} numberOfLines={1}>
                      {item.description}
                    </Text>
                    <Text style={styles.itemAmount}>{currency(item.amount)}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.editButton} activeOpacity={0.85} onPress={() => onEdit(entry)}>
            <Text style={styles.editButtonText}>Editar planilla</Text>
          </TouchableOpacity>
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
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    padding: 14,
  },
  summaryItem: {
    gap: 4,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.ink500,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  salesValue: {
    color: colors.emerald,
  },
  profitValue: {
    color: colors.gold400,
  },
  negativeValue: {
    color: colors.rose,
  },
  pendingValue: {
    color: colors.ink500,
    fontWeight: '500',
  },
  emptyItems: {
    fontSize: 13,
    color: colors.ink500,
  },
  itemsList: {
    gap: 6,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  itemDesc: {
    flex: 1,
    fontSize: 13,
    color: colors.ink200,
  },
  itemAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  editButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold400,
  },
})
