import React, { useEffect, useState } from 'react'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Modal } from '../common/Modal'
import { updateChargeStatus } from '../../lib/api'
import { getErrorMessage } from '../../lib/errors'
import { colors } from '../../theme/colors'
import type { Charge } from '../../types'

type ChargeInvoiceModalProps = {
  charge: Charge | null
  onClose: () => void
  onSaved: () => void
}

// Se abre al tocar el estatus de un cobro en CobrosScreen. Si el cobro está
// pendiente, pide el invoice number y lo marca como pagado ("subido a OPS")
// en un solo paso. Si ya está pagado, permite corregir el invoice number sin
// cambiar el estatus — mismo comportamiento que ChargeInvoiceModal.tsx en
// ops-web.
export const ChargeInvoiceModal = ({ charge, onClose, onSaved }: ChargeInvoiceModalProps) => {
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setInvoiceNumber(charge?.invoiceNumber ?? '')
    setError(null)
  }, [charge])

  const isPaid = charge?.status === 'paid'

  const handleSave = async () => {
    if (!charge) return
    if (!invoiceNumber.trim()) {
      setError('El invoice number es obligatorio.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updateChargeStatus(charge.id, { status: 'paid', invoiceNumber: invoiceNumber.trim() })
      onSaved()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el invoice number.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={charge !== null} onClose={onClose} title={isPaid ? 'Invoice number' : 'Subir cobro a OPS'}>
      {!isPaid ? (
        <Text style={styles.hint}>Ingresa el invoice number para marcar este cobro como pagado/subido a OPS.</Text>
      ) : null}

      <View style={styles.field}>
        <Text style={styles.label}>Invoice number</Text>
        <TextInput
          value={invoiceNumber}
          onChangeText={setInvoiceNumber}
          placeholder="INV-0001"
          placeholderTextColor={colors.ink500}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          autoFocus
        />
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity
        style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        activeOpacity={0.85}
        disabled={saving}
        onPress={handleSave}
      >
        <Text style={styles.saveButtonText}>{saving ? 'Guardando…' : isPaid ? 'Guardar' : 'Subir a OPS'}</Text>
      </TouchableOpacity>
    </Modal>
  )
}

const styles = StyleSheet.create({
  hint: {
    fontSize: 13,
    color: colors.ink400,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.white,
  },
  error: {
    fontSize: 13,
    color: colors.rose,
  },
  saveButton: {
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.gold500,
    paddingVertical: 12,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand900,
  },
})
