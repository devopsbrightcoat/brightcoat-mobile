import React, { useMemo, useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { FormField } from '../components/common/FormField'
import { SegmentedField } from '../components/common/SegmentedField'
import { updateEmployee } from '../lib/api'
import { EMPLOYEE_STATUS_OPTIONS, W2_STATUS_OPTIONS } from '../lib/employeeOptions'
import { getErrorMessage } from '../lib/errors'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { useTheme } from '../theme/ThemeContext'
import type { ThemeColors } from '../theme/colors'
import type { Employee } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditEmployee'>
type Route = RouteProp<RootStackParamList, 'EditEmployee'>

export const EditEmployeeScreen = () => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { employee } = params

  const [name, setName] = useState(employee.name)
  const [role, setRole] = useState(employee.role === '—' ? '' : employee.role)
  const [contactNumber, setContactNumber] = useState(employee.contactNumber ?? '')
  const [address, setAddress] = useState(employee.address ?? '')
  const [ssn, setSsn] = useState(employee.ssn ?? '')
  const [itin, setItin] = useState(employee.itin ?? '')
  const [status, setStatus] = useState<Employee['status']>(employee.status)
  const [w2Status, setW2Status] = useState<Employee['w2Status']>(employee.w2Status)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!name.trim()) {
      setError('El nombre del empleado es obligatorio.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await updateEmployee(employee.id, {
        name: name.trim(),
        role,
        contactNumber,
        address,
        status,
        w2Status,
        ssn: ssn.trim(),
        itin: itin.trim(),
      })
      navigation.goBack()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el empleado.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <FormField label="Nombre" value={name} onChangeText={setName} placeholder="ej. Carlos Mejía" />
        <FormField label="Rol / puesto" value={role} onChangeText={setRole} placeholder="ej. Pintor" />

        <FormField
          label="Número de contacto"
          value={contactNumber}
          onChangeText={setContactNumber}
          placeholder="Opcional"
          keyboardType="phone-pad"
        />

        <FormField label="Dirección" value={address} onChangeText={setAddress} placeholder="Opcional" />

        <View style={styles.row}>
          <View style={styles.half}>
            <FormField label="SSN" value={ssn} onChangeText={setSsn} placeholder="ej. 123-45-6789" />
          </View>
          <View style={styles.half}>
            <FormField label="ITIN" value={itin} onChangeText={setItin} placeholder="ej. 9XX-XX-XXXX" />
          </View>
        </View>

        <SegmentedField label="Estado" options={EMPLOYEE_STATUS_OPTIONS} value={status} onChange={setStatus} />
        <SegmentedField label="W2" options={W2_STATUS_OPTIONS} value={w2Status} onChange={setW2Status} />

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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
