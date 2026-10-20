import React, { useMemo, useState } from 'react'
import { CheckCircle2, RotateCcw, Trash2 } from 'lucide-react-native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Modal } from '../common/Modal'
import { setPayrollEntryFixedCharge } from '../../lib/api'
import { getErrorMessage } from '../../lib/errors'
import { FIXED_CHARGE_LABEL } from '../../lib/payrollStatus'
import { formatFullDate } from '../../lib/scheduleDates'
import { currency } from '../../lib/format'
import { taxOnAmount, SALES_TAX_RATE } from '../../lib/tax'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'
import type { PayrollEntry } from '../../types'

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

type PayrollEntryDetailModalProps = {
  entry: PayrollEntry | null
  propertyMap: Map<string, string>
  employeeMap: Map<string, string>
  onClose: () => void
  onEdit: (entry: PayrollEntry) => void
  onDelete: (entry: PayrollEntry) => void
  // Se llama después de marcar/desmarcar la planilla como cobro fijo, con
  // la planilla ya actualizada.
  onChanged: (entry: PayrollEntry) => void
}

export const PayrollEntryDetailModal = ({
  entry,
  propertyMap,
  employeeMap,
  onClose,
  onEdit,
  onDelete,
  onChanged,
}: PayrollEntryDetailModalProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const [togglingFixed, setTogglingFixed] = useState(false)
  const [toggleError, setToggleError] = useState<string | null>(null)

  const handleToggleFixed = async () => {
    if (!entry) return
    const next = !entry.isFixedCharge
    setTogglingFixed(true)
    setToggleError(null)
    try {
      await setPayrollEntryFixedCharge(entry.id, next)
      onChanged({ ...entry, isFixedCharge: next, amount: next ? null : entry.amount })
    } catch (err) {
      setToggleError(getErrorMessage(err, 'No se pudo actualizar la planilla.'))
    } finally {
      setTogglingFixed(false)
    }
  }
  const sales = entry ? entry.items.reduce((sum, item) => sum + item.amount, 0) : 0
  const profit = entry && entry.amount != null ? entry.amount - sales : null
  const tax = entry && entry.taxable && entry.amount != null ? taxOnAmount(entry.amount) : null

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
              <Text style={styles.summaryLabel}>Ventas</Text>
              <Text
                style={[
                  styles.summaryValue,
                  entry.isFixedCharge ? styles.fixedValue : entry.amount == null ? styles.pendingValue : styles.cobroValue,
                ]}
              >
                {entry.isFixedCharge ? FIXED_CHARGE_LABEL : entry.amount == null ? 'Pendiente' : currency(entry.amount)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Pago</Text>
              <Text style={[styles.summaryValue, styles.salesValue]}>{currency(sales)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Ganancia</Text>
              <Text
                style={[
                  styles.summaryValue,
                  entry.isFixedCharge || profit == null
                    ? styles.pendingValue
                    : profit < 0
                      ? styles.negativeValue
                      : styles.profitValue,
                ]}
              >
                {entry.isFixedCharge ? '—' : profit == null ? 'Pendiente' : currency(profit)}
              </Text>
            </View>
            {entry.taxable && !entry.isFixedCharge && (
              <View style={styles.summaryItem}>
                <Text style={styles.summaryLabel}>Impuesto ({(SALES_TAX_RATE * 100).toFixed(2)}%)</Text>
                <Text style={[styles.summaryValue, styles.profitValue]}>
                  {tax == null ? 'Pendiente' : currency(tax)}
                </Text>
              </View>
            )}
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

          {/* Solo para planillas sin Cobro: las de cobro fijo (ej. limpieza de
              oficina) nunca van a tener un cobro propio. */}
          {entry.isFixedCharge || entry.amount == null ? (
            <TouchableOpacity
              style={[
                entry.isFixedCharge ? styles.unfixButton : styles.fixButton,
                togglingFixed && styles.buttonDisabled,
              ]}
              activeOpacity={0.85}
              disabled={togglingFixed}
              onPress={handleToggleFixed}
            >
              {entry.isFixedCharge ? (
                <RotateCcw size={15} color={colors.ink300} />
              ) : (
                <CheckCircle2 size={15} color={colors.brand900} />
              )}
              <Text style={entry.isFixedCharge ? styles.unfixButtonText : styles.fixButtonText}>
                {togglingFixed
                  ? 'Guardando…'
                  : entry.isFixedCharge
                    ? 'Quitar cobro fijo'
                    : 'Marcar como cobro fijo (finalizada)'}
              </Text>
            </TouchableOpacity>
          ) : null}
          {toggleError ? <Text style={styles.toggleError}>{toggleError}</Text> : null}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.editButton, styles.actionButtonFlex]}
              activeOpacity={0.85}
              onPress={() => onEdit(entry)}
            >
              <Text style={styles.editButtonText}>Editar planilla</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.deleteButton, styles.actionButtonFlex]}
              activeOpacity={0.85}
              onPress={() => onDelete(entry)}
            >
              <Trash2 size={15} color={colors.rose} />
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
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
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.tint10,
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
  cobroValue: {
    color: colors.blue,
  },
  fixedValue: {
    color: colors.sky,
  },
  fixButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    backgroundColor: colors.gold500,
    paddingVertical: 12,
    marginTop: 16,
  },
  fixButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand900,
  },
  unfixButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    paddingVertical: 12,
    marginTop: 16,
  },
  unfixButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink300,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  toggleError: {
    marginTop: 8,
    fontSize: 13,
    color: colors.rose,
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
    backgroundColor: colors.tint05,
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
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButtonFlex: {
    flex: 1,
  },
  editButton: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    paddingVertical: 12,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gold400,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.3)',
    paddingVertical: 12,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.rose,
  },
})
