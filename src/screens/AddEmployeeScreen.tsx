import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { FormField } from '../components/common/FormField'
import { SegmentedField } from '../components/common/SegmentedField'
import { createEmployee } from '../lib/api'
import { EMPLOYEE_STATUS_OPTIONS, W2_STATUS_OPTIONS } from '../lib/employeeOptions'
import { getErrorMessage } from '../lib/errors'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'
import type { Employee } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddEmployee'>

// Mismos campos y misma validación que ops-web AddEmployeeModal.tsx, como
// pantalla completa — igual que AddPropertyScreen. Solo el nombre es
// obligatorio; la tarifa por hora es opcional pero, si se llena, debe ser
// un número válido (mismo criterio que el resto de montos en la app).
export const AddEmployeeScreen = () => {
  const navigation = useNavigation<Nav>()
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [contactNumber, setContactNumber] = useState('')
  const [address, setAddress] = useState('')
  const [hourlyRate, setHourlyRate] = useState('')
  const [status, setStatus] = useState<Employee['status']>('active')
  const [w2Status, setW2Status] = useState<Employee['w2Status']>('pending')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) {
      setError('El nombre del empleado es obligatorio.')
      return
    }
    let hourlyRateValue: number | null = null
    if (hourlyRate.trim()) {
      const parsed = Number(hourlyRate)
      if (Number.isNaN(parsed) || parsed < 0) {
        setError('La tarifa por hora no es un número válido.')
        return
      }
      hourlyRateValue = parsed
    }

    setSaving(true)
    setError(null)
    try {
      await createEmployee({
        name: name.trim(),
        role,
        contactNumber,
        address,
        status,
        w2Status,
        hourlyRate: hourlyRateValue,
      })
      navigation.goBack()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear el empleado.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <FormField label="Nombre" value={name} onChangeText={setName} placeholder="ej. Carlos Mejía" />
        <FormField label="Rol / puesto" value={role} onChangeText={setRole} placeholder="ej. Pintor" />

        <View style={styles.row}>
          <View style={styles.half}>
            <FormField
              label="Número de contacto"
              value={contactNumber}
              onChangeText={setContactNumber}
              placeholder="Opcional"
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.half}>
            <FormField
              label="Tarifa por hora"
              value={hourlyRate}
              onChangeText={setHourlyRate}
              placeholder="ej. 25"
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        <FormField label="Dirección" value={address} onChangeText={setAddress} placeholder="Opcional" />

        <SegmentedField label="Estado" options={EMPLOYEE_STATUS_OPTIONS} value={status} onChange={setStatus} />
        <SegmentedField label="W2" options={W2_STATUS_OPTIONS} value={w2Status} onChange={setW2Status} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          activeOpacity={0.85}
          disabled={saving}
          onPress={handleSave}
        >
          <Text style={styles.buttonText}>{saving ? 'Guardando…' : 'Agregar empleado'}</Text>
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  half: {
    flex: 1,
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
