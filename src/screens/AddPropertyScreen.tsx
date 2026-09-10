import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native'
import { FormField } from '../components/common/FormField'
import { SegmentedField } from '../components/common/SegmentedField'
import { createProperty } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import { CLIENT_TYPE_OPTIONS, PROPERTY_STATUS_OPTIONS } from '../lib/propertyOptions'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'
import type { ClientType, PropertyStatus } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddProperty'>

// Mismos campos y misma validación que ops-web AddPropertyModal.tsx: solo
// el nombre es obligatorio.
export const AddPropertyScreen = () => {
  const navigation = useNavigation<Nav>()
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [clientType, setClientType] = useState<ClientType>('residential')
  const [managerContact, setManagerContact] = useState('')
  const [status, setStatus] = useState<PropertyStatus>('active')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) {
      setError('El nombre de la propiedad es obligatorio.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await createProperty({ name: name.trim(), address, clientType, managerContact, status })
      navigation.goBack()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear la propiedad.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <FormField label="Nombre" value={name} onChangeText={setName} placeholder="ej. Riverside Apartments" />
        <FormField label="Dirección" value={address} onChangeText={setAddress} placeholder="Dirección completa" />
        <SegmentedField label="Tipo de cliente" options={CLIENT_TYPE_OPTIONS} value={clientType} onChange={setClientType} />
        <FormField
          label="Contacto del manager"
          value={managerContact}
          onChangeText={setManagerContact}
          placeholder="Nombre del contacto"
        />
        <SegmentedField label="Estado" options={PROPERTY_STATUS_OPTIONS} value={status} onChange={setStatus} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          activeOpacity={0.85}
          disabled={saving}
          onPress={handleSave}
        >
          <Text style={styles.buttonText}>{saving ? 'Guardando…' : 'Agregar propiedad'}</Text>
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
