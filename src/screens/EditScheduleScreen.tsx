import React, { useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { FormField } from '../components/common/FormField'
import { InlineSelect } from '../components/common/InlineSelect'
import { TimePicker } from '../components/common/TimePicker'
import { fetchEmployees, fetchProperties, fetchServiceTypes, updateSchedule } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditSchedule'>
type Route = RouteProp<RootStackParamList, 'EditSchedule'>

// Mismos campos y misma validación que ops-web EditScheduleModal.tsx. El
// horario llega por parámetro de navegación (snapshot al momento del tap
// en la agenda) — igual que EditPropertyScreen recibe `property`. Si el
// horario ya fue entregado, updateSchedule (lib/api.ts) rechaza el guardado
// a nivel de base de datos ("ya fue entregado y cobrado"); el botón de
// editar en HorariosScreen ya viene deshabilitado para ese caso, esto es
// solo un respaldo.
//
// Los selects usan InlineSelect (react-native-element-dropdown por debajo)
// en vez de SearchableSelect (que abría un modal de pantalla completa
// arriba de esta pantalla) — mismo criterio que ScheduleFiltersModal y
// AddScheduleScreen. `openField` coordina que solo uno esté abierto a la
// vez.
export const EditScheduleScreen = () => {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { schedule } = params

  const { data: properties, loading: loadingProperties } = useSupabaseQuery(fetchProperties, [])
  const { data: serviceTypes, loading: loadingServiceTypes } = useSupabaseQuery(fetchServiceTypes, [])
  const { data: employees, loading: loadingEmployees } = useSupabaseQuery(fetchEmployees, [])

  const [propertyId, setPropertyId] = useState(schedule.propertyId)
  const [employeeId, setEmployeeId] = useState(schedule.employeeId)
  const [date, setDate] = useState(schedule.scheduledDate)
  const [unitLabel, setUnitLabel] = useState(schedule.unitLabel ?? '')
  const [serviceTypeId, setServiceTypeId] = useState(schedule.serviceTypeId)
  const [scheduledTime, setScheduledTime] = useState(schedule.scheduledTime)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openField, setOpenField] = useState<string | null>(null)

  const propertyOptions = (properties ?? []).map((p) => ({ id: p.id, label: p.name }))
  const employeeOptions = (employees ?? []).map((e) => ({ id: e.id, label: e.name }))
  const serviceTypeOptions = (serviceTypes ?? []).map((t) => ({ id: t.id, label: t.name }))

  const handleSave = async () => {
    if (!propertyId) {
      setError('Selecciona una propiedad.')
      return
    }
    if (!employeeId) {
      setError('Selecciona un empleado.')
      return
    }
    if (!date.trim()) {
      setError('Escribe la fecha (AAAA-MM-DD).')
      return
    }
    if (!serviceTypeId) {
      setError('Selecciona un tipo de servicio.')
      return
    }
    if (!scheduledTime.trim()) {
      setError('Escribe la hora (HH:MM).')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await updateSchedule(schedule.id, {
        propertyId,
        employeeId,
        scheduledDate: date.trim(),
        unitLabel,
        serviceTypeId,
        scheduledTime: scheduledTime.trim(),
      })
      navigation.goBack()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el horario.'))
    } finally {
      setSaving(false)
    }
  }

  const loadingLookups = loadingProperties || loadingServiceTypes || loadingEmployees

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {loadingLookups ? null : (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Propiedad</Text>
              <InlineSelect
                options={propertyOptions}
                value={propertyId}
                onChange={setPropertyId}
                searchPlaceholder="Buscar propiedad..."
                open={openField === 'property'}
                onOpenChange={(next) => setOpenField(next ? 'property' : null)}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Empleado</Text>
              <InlineSelect
                options={employeeOptions}
                value={employeeId}
                onChange={setEmployeeId}
                searchPlaceholder="Buscar empleado..."
                open={openField === 'employee'}
                onOpenChange={(next) => setOpenField(next ? 'employee' : null)}
              />
            </View>

            <FormField
              label="Fecha (AAAA-MM-DD)"
              value={date}
              onChangeText={setDate}
              placeholder="2026-08-28"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <FormField label="Unidad (ej. L303)" value={unitLabel} onChangeText={setUnitLabel} placeholder="L303" />

            <View style={styles.field}>
              <Text style={styles.label}>Servicio</Text>
              <InlineSelect
                options={serviceTypeOptions}
                value={serviceTypeId}
                onChange={setServiceTypeId}
                searchPlaceholder="Buscar servicio..."
                open={openField === 'service'}
                onOpenChange={(next) => setOpenField(next ? 'service' : null)}
              />
            </View>

            <TimePicker label="Hora" value={scheduledTime} onChange={setScheduledTime} />

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, saving && styles.buttonDisabled]}
              activeOpacity={0.85}
              disabled={saving}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>{saving ? 'Guardando…' : 'Guardar cambios'}</Text>
            </TouchableOpacity>
          </>
        )}
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
