import { useState } from 'react'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Modal } from './Modal'
import { getErrorMessage } from '../../lib/errors'
import { colors } from '../../theme/colors'

// ---------------------------------------------------------------------------
// Modal de confirmación genérico para acciones destructivas (eliminar).
// Deshabilita los botones mientras la eliminación está en curso y muestra
// el error real de la base de datos si falla (ej. restricción de llave
// foránea), traducido a un mensaje claro por cada `delete*` de
// src/lib/api.ts. Mismo componente que ops-web/src/components/common/ConfirmModal.tsx.
// ---------------------------------------------------------------------------

type ConfirmModalProps = {
  open: boolean
  onClose: () => void
  title: string
  message: string
  confirmLabel?: string
  onConfirm: () => Promise<void>
}

export const ConfirmModal = ({
  open,
  onClose,
  title,
  message,
  confirmLabel = 'Eliminar',
  onConfirm,
}: ConfirmModalProps) => {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClose = () => {
    if (deleting) return
    setError(null)
    onClose()
  }

  const handleConfirm = async () => {
    setDeleting(true)
    setError(null)
    try {
      await onConfirm()
      setDeleting(false)
      onClose()
    } catch (err) {
      setDeleting(false)
      setError(getErrorMessage(err, 'No se pudo eliminar. Intenta de nuevo.'))
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title={title}>
      <View style={styles.body}>
        <Text style={styles.message}>{message}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7} disabled={deleting} onPress={handleClose}>
            <Text style={styles.secondaryButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, deleting && styles.buttonDisabled]}
            activeOpacity={0.85}
            disabled={deleting}
            onPress={handleConfirm}
          >
            <Text style={styles.primaryButtonText}>{deleting ? 'Eliminando…' : confirmLabel}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  body: {
    gap: 14,
  },
  message: {
    fontSize: 14,
    color: colors.ink300,
    lineHeight: 20,
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
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.rose,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
})
