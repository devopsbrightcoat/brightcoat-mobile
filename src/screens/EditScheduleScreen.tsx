import React, { useMemo, useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { Check } from 'lucide-react-native'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { DatePicker } from '../components/common/DatePicker'
import { FormField } from '../components/common/FormField'
import { InlineSelect } from '../components/common/InlineSelect'
import { useReferenceData } from '../contexts/ReferenceDataContext'
import { updateSchedule } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { useTheme } from '../theme/ThemeContext'
import type { ThemeColors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditSchedule'>
type Route = RouteProp<RootStackParamList, 'EditSchedule'>

export const EditScheduleScreen = () => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { schedule } = params

  const { properties, loadingProperties, serviceTypes, loadingServiceTypes, employees, loadingEmployees } = useReferenceData()

  const [propertyId, setPropertyId] = useState(schedule.propertyId)
  const [employeeId, setEmployeeId] = useState(schedule.employeeId)
  const [date, setDate] = useState(schedule.scheduledDate)
  const [unitLabel, setUnitLabel] = useState(schedule.unitLabel ?? '')
  const [serviceTypeId, setServiceTypeId] = useState(schedule.serviceTypeId)
  const [isFixedCharge, setIsFixedCharge] = useState(schedule.isFixedCharge)
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

    setSaving(true)
    setError(null)
    try {
      await updateSchedule(schedule.id, {
        propertyId,
        employeeId,
        scheduledDate: date.trim(),
        unitLabel,
        serviceTypeId,
        isFixedCharge,
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
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

            <DatePicker label="Fecha" value={date} onChange={setDate} />

            <TouchableOpacity
              style={styles.checkboxRow}
              activeOpacity={0.75}
              onPress={() => {
                setIsFixedCharge((prev) => {
                  const next = !prev
                  setUnitLabel(next ? 'N/A' : '')
                  return next
                })
              }}
            >
              <View style={[styles.checkbox, isFixedCharge && styles.checkboxChecked]}>
                {isFixedCharge ? <Check size={13} color={colors.brand900} strokeWidth={3} /> : null}
              </View>
              <View style={styles.checkboxTextGroup}>
                <Text style={styles.checkboxLabel}>Servicio de cobro fijo</Text>
                <Text style={styles.checkboxHint}>
                  Se cobra por un monto fijo recurrente (ej. limpieza de oficina mensual)∂. No lleva unidad — se guarda como "N/A".
                </Text>
              </View>
            </TouchableOpacity>

            {!isFixedCharge ? (
              <FormField label="Unidad (ej. L303)" value={unitLabel} onChangeText={setUnitLabel} placeholder="L303" />
            ) : null}

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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
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
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkbox: {
    marginTop: 1,
    height: 20,
    width: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.tint25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.gold500,
    borderColor: colors.gold500,
  },
  checkboxTextGroup: {
    flex: 1,
    gap: 2,
  },
  checkboxLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
  },
  checkboxHint: {
    fontSize: 11,
    color: colors.ink500,
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
