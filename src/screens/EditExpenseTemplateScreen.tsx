import React, { useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { FormField } from '../components/common/FormField'
import { updateExpenseTemplate } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditExpenseTemplate'>
type Route = RouteProp<RootStackParamList, 'EditExpenseTemplate'>

// Mismos campos y misma validación que ops-web EditExpenseTemplateModal.tsx.
// La plantilla llega por parámetro de navegación (snapshot al momento del
// tap en el catálogo) — igual que EditServiceTypeScreen.
export const EditExpenseTemplateScreen = () => {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { template } = params

  const [name, setName] = useState(template.name)
  const [amount, setAmount] = useState(template.amount != null ? String(template.amount) : '')
  const [description, setDescription] = useState(template.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    let amountValue: number | null = null
    if (amount.trim()) {
      const parsed = Number(amount)
      if (Number.isNaN(parsed) || parsed < 0) {
        setError('El monto no es un número válido.')
        return
      }
      amountValue = parsed
    }
    setSaving(true)
    setError(null)
    try {
      await updateExpenseTemplate(template.id, { name: name.trim(), amount: amountValue, description })
      navigation.goBack()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el gasto fijo.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <FormField label="Nombre" value={name} onChangeText={setName} placeholder="ej. Renta de bodega" />

        <FormField
          label="Monto"
          value={amount}
          onChangeText={setAmount}
          placeholder="Opcional, si el monto no varía"
          keyboardType="decimal-pad"
        />

        <FormField
          label="Descripción"
          value={description}
          onChangeText={setDescription}
          placeholder="Opcional — se precarga en la descripción del gasto"
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
