import React from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Modal } from '../common/Modal'
import { currency } from '../../lib/format'
import { colors } from '../../theme/colors'
import type { Expense, Vendor } from '../../types'

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    {children}
  </View>
)

type ExpenseDetailModalProps = {
  expense: Expense | null
  vendors: Vendor[]
  onClose: () => void
  // Web separa "ver" (fila -> detalle) de "editar" (botón aparte en la
  // columna de acciones) — acá el botón vive adentro de este mismo modal en
  // vez de en la tarjeta, para no sumarle un segundo touchable chico a cada
  // fila. Navega a EditExpenseScreen (pantalla completa, mismo criterio que
  // Propiedades/Horarios) y cierra este modal.
  onEdit: (expense: Expense) => void
}

export const ExpenseDetailModal = ({ expense, vendors, onClose, onEdit }: ExpenseDetailModalProps) => {
  const vendorName = expense?.vendorId ? vendors.find((v) => v.id === expense.vendorId)?.name : undefined
  return (
    <Modal open={expense !== null} onClose={onClose} title="Detalle del gasto">
      {expense ? (
        <>
          <Field label="Número de factura">
            <Text style={styles.fieldValueText}>{expense.invoiceNumber || '—'}</Text>
          </Field>
          <Field label="Monto">
            <Text style={styles.fieldValueText}>{currency(expense.amount)}</Text>
          </Field>
          <Field label="Fecha">
            <Text style={styles.fieldValueText}>{expense.date || '—'}</Text>
          </Field>
          <Field label="Proveedor">
            <Text style={styles.fieldValueText}>{vendorName || '—'}</Text>
          </Field>
          <Field label="Descripción">
            <Text style={styles.fieldValueText}>{expense.description || '—'}</Text>
          </Field>

          <TouchableOpacity style={styles.editButton} activeOpacity={0.85} onPress={() => onEdit(expense)}>
            <Text style={styles.editButtonText}>Editar gasto</Text>
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
