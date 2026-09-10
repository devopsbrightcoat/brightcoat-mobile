import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { FormField } from '../components/common/FormField'
import { SegmentedField } from '../components/common/SegmentedField'
import { createServiceType } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import { SERVICE_CATEGORY_OPTIONS } from '../lib/serviceTypeOptions'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'
import type { ServiceCategory } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddServiceType'>

// Mismos campos y misma validación que ops-web AddServiceTypeModal.tsx,
// como pantalla completa — igual que el resto de Add/Edit de la app.
export const AddServiceTypeScreen = () => {
  const navigation = useNavigation<Nav>()
  const [name, setName] = useState('')
  const [category, setCategory] = useState<ServiceCategory>('painting')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) {
      setError('El nombre del servicio es obligatorio.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createServiceType({ name: name.trim(), category })
      navigation.goBack()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear el servicio.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <FormField label="Nombre del servicio" value={name} onChangeText={setName} placeholder="ej. Interior Painting" />
        <SegmentedField label="Categoría" options={SERVICE_CATEGORY_OPTIONS} value={category} onChange={setCategory} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          activeOpacity={0.85}
          disabled={saving}
          onPress={handleSave}
        >
          <Text style={styles.buttonText}>{saving ? 'Guardando…' : 'Agregar servicio'}</Text>
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
