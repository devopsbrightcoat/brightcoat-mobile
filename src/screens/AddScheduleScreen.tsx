import React, { useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { Plus, X } from 'lucide-react-native'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { DatePicker } from '../components/common/DatePicker'
import { FormField } from '../components/common/FormField'
import { InlineSelect } from '../components/common/InlineSelect'
import { createSchedules, fetchEmployees, fetchProperties, fetchServiceTypes } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddSchedule'>
type Route = RouteProp<RootStackParamList, 'AddSchedule'>

type Line = {
  key: number
  unitLabel: string
  serviceTypeId: string
}

const emptyLine = (key: number): Line => ({ key, unitLabel: '', serviceTypeId: '' })

// Mismos campos y misma validación que ops-web AddScheduleModal.tsx, como
// pantalla completa (no modal) — igual que AddPropertyScreen. Fecha es un
// campo de texto simple (AAAA-MM-DD) en vez de un date picker nativo:
// decisión explícita para el MVP de campo, evita sumar
// @react-native-community/datetimepicker (otra dependencia nativa y otro
// rebuild) — ops-web usa <input type="date"> porque el navegador ya trae
// ese picker gratis, acá no hay equivalente sin instalar algo nuevo. Ya no
// se captura hora — David pidió quitarla, se agenda solo por día.
//
// Los selects de Propiedad/Empleado/Servicio usan InlineSelect
// (react-native-element-dropdown por debajo) en vez de SearchableSelect
// (que abría un modal de pantalla completa arriba de esta pantalla) —
// mismo criterio que se aplicó a ScheduleFiltersModal. `openField` coordina
// que solo uno esté abierto a la vez, incluyendo el de cada unidad (llave
// `service-<key>`).
export const AddScheduleScreen = () => {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<Route>()

  const { data: properties, loading: loadingProperties } = useSupabaseQuery(fetchProperties, [])
  const { data: serviceTypes, loading: loadingServiceTypes } = useSupabaseQuery(fetchServiceTypes, [])
  const { data: employees, loading: loadingEmployees } = useSupabaseQuery(fetchEmployees, [])

  const [propertyId, setPropertyId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [date, setDate] = useState(params.defaultDate)
  const [lines, setLines] = useState<Line[]>([emptyLine(0)])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openField, setOpenField] = useState<string | null>(null)

  const propertyOptions = (properties ?? []).map((p) => ({ id: p.id, label: p.name }))
  const employeeOptions = (employees ?? []).map((e) => ({ id: e.id, label: e.name }))
  const serviceTypeOptions = (serviceTypes ?? []).map((t) => ({ id: t.id, label: t.name }))

  const updateLine = (key: number, patch: Partial<Line>) =>
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, ...patch } : line)))
  const addLine = () => setLines((prev) => [...prev, emptyLine((prev.at(-1)?.key ?? 0) + 1)])
  const removeLine = (key: number) =>
    setLines((prev) => (prev.length > 1 ? prev.filter((line) => line.key !== key) : prev))

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
    for (const line of lines) {
      if (!line.serviceTypeId) {
        setError('Cada unidad necesita un tipo de servicio.')
        return
      }
    }

    setSaving(true)
    setError(null)
    try {
      await createSchedules(
        lines.map((line) => ({
          propertyId,
          employeeId,
          scheduledDate: date.trim(),
          unitLabel: line.unitLabel,
          serviceTypeId: line.serviceTypeId,
        })),
      )
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
        {loadingLookups ? (
          <ActivityIndicator color={colors.gold400} />
        ) : (
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

            <View style={styles.linesSection}>
              <View style={styles.linesHeader}>
                <Text style={styles.label}>Unidades y servicios</Text>
                <TouchableOpacity style={styles.addLineButton} activeOpacity={0.7} onPress={addLine}>
                  <Plus size={14} color={colors.ink300} />
                  <Text style={styles.addLineText}>Agregar unidad</Text>
                </TouchableOpacity>
              </View>

              {lines.map((line, i) => (
                <View key={line.key} style={styles.lineCard}>
                  <View style={styles.lineHeader}>
                    <Text style={styles.lineIndex}>Unidad {i + 1}</Text>
                    {lines.length > 1 ? (
                      <TouchableOpacity onPress={() => removeLine(line.key)} hitSlop={8}>
                        <X size={14} color={colors.ink500} />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  <FormField
                    label="Unidad (ej. L303)"
                    value={line.unitLabel}
                    onChangeText={(text) => updateLine(line.key, { unitLabel: text })}
                    placeholder="L303"
                  />

                  <View style={styles.field}>
                    <Text style={styles.label}>Servicio</Text>
                    <InlineSelect
                      options={serviceTypeOptions}
                      value={line.serviceTypeId}
                      onChange={(id) => updateLine(line.key, { serviceTypeId: id })}
                      searchPlaceholder="Buscar servicio..."
                      open={openField === `service-${line.key}`}
                      onOpenChange={(next) => setOpenField(next ? `service-${line.key}` : null)}
                    />
                  </View>

                </View>
              ))}
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, saving && styles.buttonDisabled]}
              activeOpacity={0.85}
              disabled={saving}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>{saving ? 'Guardando…' : 'Guardar horario'}</Text>
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
  linesSection: {
    gap: 12,
  },
  linesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addLineButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addLineText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink300,
  },
  lineCard: {
    gap: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    padding: 14,
  },
  lineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lineIndex: {
    fontSize: 11,
    fontWeight: '600',
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
