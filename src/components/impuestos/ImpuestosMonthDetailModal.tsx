import React, { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Modal } from '../common/Modal'
import { StatusPill } from '../common/StatusPill'
import { extractTaxFromTotal } from '../../lib/tax'
import { updateChargesTaxPaid } from '../../lib/api'
import { getErrorMessage } from '../../lib/errors'
import { colors } from '../../theme/colors'
import type { Charge } from '../../types'

// Formato con centavos — a diferencia del resto de la app (montos enteros,
// ver lib/format.ts), acá sí importan los centavos: es el monto real que
// hay que remitir al estado.
const currency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

// Un grupo de cobros de un mismo mes calendario (por generatedDate) — ver
// screens/finanzas/ImpuestosScreen.tsx, que arma esta lista y la pasa tanto
// a la tarjeta principal como a este modal de detalle. Mismo shape que
// ops-web (components/impuestos/ImpuestosMonthDetailModal.tsx).
export type MonthGroup = {
  key: string
  label: string
  charges: Charge[]
  totalBase: number
  totalTax: number
  paidTax: number
  pendingTax: number
  taxStatus: 'paid' | 'pending' | 'partial'
}

type ImpuestosMonthDetailModalProps = {
  month: MonthGroup | null
  propertyMap: Map<string, string>
  onClose: () => void
  onChanged: () => void
}

// Detalle de un mes del resumen de Impuestos — lista cada cobro que compone
// ese mes con su impuesto individual (extraído del monto, ya que el
// impuesto viene incluido) y permite marcar cobros sueltos como
// pagados/pendientes, además del botón "en bloque" de la tarjeta principal.
export const ImpuestosMonthDetailModal = ({ month, propertyMap, onClose, onChanged }: ImpuestosMonthDetailModalProps) => {
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleToggle = async (charge: Charge) => {
    setSavingId(charge.id)
    setError(null)
    try {
      await updateChargesTaxPaid([charge.id], !charge.taxPaid)
      onChanged()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo actualizar el impuesto de este cobro.'))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <Modal
      open={month !== null}
      onClose={onClose}
      title={month ? `Impuestos — ${month.label}` : 'Impuestos'}
      minHeight="70%"
    >
      {month ? (
        <View style={styles.list}>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {month.charges.map((charge) => {
            const tax = extractTaxFromTotal(charge.amount)
            return (
              <View key={charge.id} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {propertyMap.get(charge.propertyId) ?? '—'}
                    {charge.unitLabel ? ` · ${charge.unitLabel}` : ''}
                  </Text>
                  <StatusPill status={charge.taxPaid ? 'paid' : 'pending'} />
                </View>
                <Text style={styles.rowMeta}>{charge.generatedDate || '—'}</Text>
                <View style={styles.rowFooter}>
                  <Text style={styles.rowAmount}>{currency(charge.amount)}</Text>
                  <Text style={styles.rowTax}>Impuesto {currency(tax)}</Text>
                </View>
                <TouchableOpacity
                  style={styles.toggleButton}
                  disabled={savingId === charge.id}
                  onPress={() => handleToggle(charge)}
                >
                  <Text style={styles.toggleButtonText}>
                    {savingId === charge.id ? 'Guardando…' : charge.taxPaid ? 'Marcar pendiente' : 'Marcar pagado'}
                  </Text>
                </TouchableOpacity>
              </View>
            )
          })}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total impuesto del mes</Text>
            <Text style={styles.totalValue}>{currency(month.totalTax)}</Text>
          </View>
        </View>
      ) : null}
    </Modal>
  )
}

const styles = StyleSheet.create({
  list: {
    gap: 12,
  },
  errorText: {
    fontSize: 13,
    color: colors.rose,
  },
  row: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    gap: 6,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: colors.white,
  },
  rowMeta: {
    fontSize: 11,
    color: colors.ink500,
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowAmount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink200,
  },
  rowTax: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gold400,
  },
  toggleButton: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  toggleButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink300,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  totalLabel: {
    fontSize: 13,
    color: colors.ink300,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
})
