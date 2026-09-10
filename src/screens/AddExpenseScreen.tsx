import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { DatePicker } from '../components/common/DatePicker'
import { FormField } from '../components/common/FormField'
import { createExpense } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddExpense'>

// Mismos campos y misma validación que ops-web AddExpenseModal.tsx, como
// pantalla completa (no modal) — igual que AddPropertyScreen/AddScheduleScreen.
// Gastos es un módulo independiente (sin propiedad/empleado/servicio), así
// que el formulario es más corto que el de Horarios. Sin "Cargar Excel"
// (eso se queda solo en la web — ver ImportExpensesModal.tsx ahí).
export const AddExpenseScreen = () => {
  const navigation = useNavigation<Nav>()

  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    const amountNum = Number(amount)
    if (!amount.trim() || Number.isNaN(amountNum) || amountNum < 0) {
      setError('El monto no es válido.')
      return
    }
    if (!date.trim()) {
      setError('La fecha es obligatoria.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await createExpense({ invoiceNumber, amount: amountNum, date: date.trim(), description })
      navigation.goBack()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear el gasto.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <FormField
          label="Número de factura"
          value={invoiceNumber}
          onChangeText={setInvoiceNumber}
          placeholder="INV-0001"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <FormField label="Monto" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />

        <DatePicker label="Fecha" value={date} onChange={setDate} />

        <FormField
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          placeholder="Opcional"
          multiline
          numberOfLines={4}
          style={styles.textArea}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          activeOpacity={0.85}
          disabled={saving}
          onPress={handleSave}
        >
          <Text style={styles.buttonText}>{saving ? 'Guardando…' : 'Agregar gasto'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  form: {
    padding: 20,
    gap: 18,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: 13,
    color: colors.rose,
  },
  button: {
    marginTop: 4,
    borderRadius: 10,
    backgroundColor: colors.gold500,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.brand900,
  },
})
