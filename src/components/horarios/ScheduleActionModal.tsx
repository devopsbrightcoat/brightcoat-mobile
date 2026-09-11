import React, { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react-native'
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { Modal } from '../common/Modal'
import { createScheduleCharge, updateScheduleStatus } from '../../lib/api'
import { getErrorMessage } from '../../lib/errors'
import { colors, statusColors, statusLabels } from '../../theme/colors'
import type { Schedule, ScheduleStatus } from '../../types'

const STATUS_OPTIONS: ScheduleStatus[] = ['pending', 'in_progress', 'delivered', 'cancelled']

type ExtraLine = { key: number; description: string; amount: string }

const emptyExtra = (key: number): ExtraLine => ({ key, description: '', amount: '' })

type ScheduleActionModalProps = {
  schedule: Schedule | null
  onClose: () => void
  onSaved: () => void
}

// Cambia el estatus de un horario. Elegir "Entregado / Finalizado" no
// guarda de una vez — pasa a un segundo paso para capturar el cobro (costo
// + notas + extras), igual que ops-web ScheduleActionModal.tsx: un horario
// entregado siempre necesita su cobro asociado en `charges`.
export const ScheduleActionModal = ({ schedule, onClose, onSaved }: ScheduleActionModalProps) => {
  const [step, setStep] = useState<'status' | 'charge'>('status')
  const [totalCost, setTotalCost] = useState('')
  const [notes, setNotes] = useState('')
  const [extras, setExtras] = useState<ExtraLine[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setStep('status')
    setTotalCost('')
    setNotes('')
    setExtras([])
    setError(null)
  }, [schedule])

  const handlePickStatus = async (status: ScheduleStatus) => {
    if (!schedule) return
    if (status === 'delivered') {
      setStep('charge')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await updateScheduleStatus(schedule.id, status)
      onSaved()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo cambiar el estatus.'))
    } finally {
      setSaving(false)
    }
  }

  const addExtra = () => setExtras((prev) => [...prev, emptyExtra((prev.at(-1)?.key ?? 0) + 1)])
  const updateExtra = (key: number, patch: Partial<ExtraLine>) =>
    setExtras((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)))
  const removeExtra = (key: number) => setExtras((prev) => prev.filter((e) => e.key !== key))

  const handleSaveCharge = async () => {
    if (!schedule) return

    const totalCostValue = Number(totalCost.replace(/[^0-9.-]/g, ''))
    if (!totalCost || Number.isNaN(totalCostValue) || totalCostValue < 0) {
      setError('El costo de servicio total no es un número válido.')
      return
    }

    const filledExtras = extras.filter((e) => e.description.trim() || e.amount.trim())
    const parsedExtras: { description: string; amount: number }[] = []
    for (const extra of filledExtras) {
      const amountValue = Number(extra.amount.replace(/[^0-9.-]/g, ''))
      if (!extra.description.trim()) {
        setError('Cada extra necesita una descripción.')
        return
      }
      if (!extra.amount || Number.isNaN(amountValue) || amountValue < 0) {
        setError(`El costo del extra "${extra.description}" no es un número válido.`)
        return
      }
      parsedExtras.push({ description: extra.description.trim(), amount: amountValue })
    }

    setSaving(true)
    setError(null)
    try {
      await createScheduleCharge(schedule.id, { totalCost: totalCostValue, notes, extras: parsedExtras })
      onSaved()
      onClose()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el cobro.'))
    } finally {
      setSaving(false)
    }
  }

  if (step === 'charge') {
    return (
      <Modal open={schedule !== null} onClose={onClose} title="Cobro del servicio">
        <View style={styles.field}>
          <Text style={styles.label}>Costo de servicio total</Text>
          <TextInput
            value={totalCost}
            onChangeText={setTotalCost}
            placeholder="0.00"
            placeholderTextColor={colors.ink500}
            keyboardType="decimal-pad"
            style={styles.input}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Notas</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Opcional"
            placeholderTextColor={colors.ink500}
            multiline
            numberOfLines={3}
            style={[styles.input, styles.textArea]}
          />
        </View>

        <View style={styles.field}>
          <View style={styles.extrasHeader}>
            <Text style={styles.label}>Extras</Text>
            <TouchableOpacity style={styles.addExtraButton} activeOpacity={0.7} onPress={addExtra}>
              <Plus size={14} color={colors.ink300} />
              <Text style={styles.addExtraText}>Agregar extra</Text>
            </TouchableOpacity>
          </View>

          {extras.length === 0 ? (
            <Text style={styles.emptyExtras}>
              Sin extras — usa "Agregar extra" si quieres desglosar en qué se compone el costo total (no se suma aparte).
            </Text>
          ) : (
            <View style={styles.extrasList}>
              {extras.map((extra) => (
                <View key={extra.key} style={styles.extraRow}>
                  <TextInput
                    value={extra.description}
                    onChangeText={(text) => updateExtra(extra.key, { description: text })}
                    placeholder="Descripción"
                    placeholderTextColor={colors.ink500}
                    style={[styles.input, styles.extraDescInput]}
                  />
                  <TextInput
                    value={extra.amount}
                    onChangeText={(text) => updateExtra(extra.key, { amount: text })}
                    placeholder="Costo"
                    placeholderTextColor={colors.ink500}
                    keyboardType="decimal-pad"
                    style={[styles.input, styles.extraAmountInput]}
                  />
                  <TouchableOpacity onPress={() => removeExtra(extra.key)} hitSlop={8} style={styles.removeExtraButton}>
                    <X size={16} color={colors.ink500} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7} onPress={() => setStep('status')}>
            <Text style={styles.secondaryButtonText}>Atrás</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, saving && styles.buttonDisabled]}
            activeOpacity={0.85}
            disabled={saving}
            onPress={handleSaveCharge}
          >
            <Text style={styles.primaryButtonText}>{saving ? 'Guardando…' : 'Confirmar entrega y cobro'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    )
  }

  return (
    <Modal open={schedule !== null} onClose={onClose} title="Cambiar estatus">
      <View style={styles.statusList}>
        {STATUS_OPTIONS.map((status) => {
          const style = statusColors[status]
          const isCurrent = schedule?.status === status
          return (
            <TouchableOpacity
              key={status}
              style={[styles.statusOption, { backgroundColor: style.bg }]}
              activeOpacity={0.75}
              disabled={saving}
              onPress={() => handlePickStatus(status)}
            >
              <Text style={[styles.statusOptionText, { color: style.text }]}>{statusLabels[status]}</Text>
              {isCurrent ? <Text style={[styles.statusOptionCurrent, { color: style.text }]}>Actual</Text> : null}
            </TouchableOpacity>
          )
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}
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
  textArea: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  extrasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addExtraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addExtraText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink300,
  },
  emptyExtras: {
    marginTop: 10,
    fontSize: 12,
    color: colors.ink500,
  },
  extrasList: {
    marginTop: 10,
    gap: 8,
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extraDescInput: {
    flex: 1,
  },
  extraAmountInput: {
    width: 90,
  },
  removeExtraButton: {
    padding: 4,
  },
  error: {
    fontSize: 13,
    color: colors.rose,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingTop: 4,
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.ink300,
  },
  primaryButton: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.gold500,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand900,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  statusList: {
    gap: 10,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statusOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusOptionCurrent: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.8,
  },
})
