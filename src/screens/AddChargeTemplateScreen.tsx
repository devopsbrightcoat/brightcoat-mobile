import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { FormField } from '../components/common/FormField'
import { InlineSelect } from '../components/common/InlineSelect'
import { createChargeTemplate, fetchProperties } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddChargeTemplate'>

// Mismos campos y misma validación que ops-web AddChargeTemplateModal.tsx,
// como pantalla completa — igual que el resto de Add/Edit de la app.
export const AddChargeTemplateScreen = () => {
  const navigation = useNavigation<Nav>()
  const [propertyId, setPropertyId] = useState('')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: properties } = useSupabaseQuery(fetchProperties, [])
  const propertyOptions = (properties ?? []).map((p) => ({ id: p.id, label: p.name }))

  const handleSave = async () => {
    if (!propertyId) {
      setError('Selecciona una propiedad.')
      return
    }
    if (!name.trim()) {
      setError('El nombre es obligatorio.')
      return
    }
    const amountValue = Number(amount)
    if (!amount.trim() || Number.isNaN(amountValue) || amountValue < 0) {
      setError('El monto no es un número válido.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createChargeTemplate({ propertyId, name: name.trim(), amount: amountValue })
      navigation.goBack()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear el cobro fijo.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Propiedad</Text>
          <InlineSelect
            options={propertyOptions}
            value={propertyId}
            onChange={setPropertyId}
            placeholder="Seleccionar propiedad…"
            searchPlaceholder="Buscar…"
          />
        </View>

        <FormField label="Servicio" value={name} onChangeText={setName} placeholder="ej. Cuota de administración" />

        <FormField label="Monto" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          activeOpacity={0.85}
          disabled={saving}
          onPress={handleSave}
        >
          <Text style={styles.buttonText}>{saving ? 'Guardando…' : 'Agregar cobro fijo'}</Text>
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
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
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
