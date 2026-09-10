import React, { useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { DatePicker } from '../components/common/DatePicker'
import { FormField } from '../components/common/FormField'
import { updateExpense } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditExpense'>
type Route = RouteProp<RootStackParamList, 'EditExpense'>

// Mismos campos y misma validación que ops-web EditExpenseModal.tsx, como
// pantalla completa — igual que EditPropertyScreen/EditScheduleScreen. El
// gasto llega por parámetro de navegación (snapshot al momento del tap en
// ExpenseDetailModal → "Editar gasto").
export const EditExpenseScreen = () => {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { expense } = params

  const [invoiceNumber, setInvoiceNumber] = useState(expense.invoiceNumber ?? '')
  const [amount, setAmount] = useState(String(expense.amount))
  const [date, setDate] = useState(expense.date)
  const [description, setDescription] = useState(expense.description ?? '')
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
      await updateExpense(expense.id, { invoiceNumber, amount: amountNum, date: date.trim(), description })
      navigation.goBack()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el gasto.'))
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
          <Text style={styles.buttonText}>{saving ? 'Guardando…' : 'Guardar cambios'}</Text>
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
