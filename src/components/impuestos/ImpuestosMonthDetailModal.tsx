import React, { useMemo, useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Modal } from '../common/Modal'
import { StatusPill } from '../common/StatusPill'
import { computeChargeTax } from '../../lib/tax'
import { updateChargesTaxPaid } from '../../lib/api'
import { getErrorMessage } from '../../lib/errors'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'
import type { Charge } from '../../types'

const currency = (value: number) =>
  value.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 })

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

export const ImpuestosMonthDetailModal = ({ month, propertyMap, onClose, onChanged }: ImpuestosMonthDetailModalProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
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
            const { base, tax, total } = computeChargeTax(charge.amount, charge.taxIncluded)
            return (
              <View key={charge.id} style={styles.row}>
                <View style={styles.rowHeader}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {propertyMap.get(charge.propertyId) ?? '—'}
                    {charge.unitLabel ? ` · ${charge.unitLabel}` : ''}
                  </Text>
                  <StatusPill status={charge.taxPaid ? 'paid' : 'pending'} />
                </View>
                <View style={styles.rowMetaRow}>
                  <Text style={styles.rowMeta}>{charge.generatedDate || '—'}</Text>
                  <View style={[styles.taxModeBadge, charge.taxIncluded && styles.taxModeBadgeIncluded]}>
                    <Text style={styles.taxModeBadgeText}>
                      {charge.taxIncluded ? 'Impuesto incluido' : 'Impuesto aparte'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.breakdownText}>
                  {charge.taxIncluded
                    ? `${currency(total)} − ${currency(tax)} (8.25%) = ${currency(base)} base`
                    : `${currency(base)} + ${currency(tax)} (8.25%) = ${currency(total)} total`}
                </Text>
                <View style={styles.rowFooter}>
                  <Text style={styles.rowAmount}>{currency(total)}</Text>
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
    borderColor: colors.tint10,
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
  rowMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowMeta: {
    fontSize: 11,
    color: colors.ink500,
  },
  taxModeBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: colors.tint05,
  },
  taxModeBadgeIncluded: {
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
  },
  taxModeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.ink400,
  },
  breakdownText: {
    fontSize: 11,
    color: colors.ink400,
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
    borderColor: colors.tint10,
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
    backgroundColor: colors.tint05,
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
