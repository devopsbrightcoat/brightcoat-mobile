import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react-native'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { DatePicker } from '../components/common/DatePicker'
import { FormField } from '../components/common/FormField'
import { InlineSelect } from '../components/common/InlineSelect'
import {
  createPayrollEntry,
  fetchEmployees,
  fetchProperties,
  fetchSchedulesForEmployee,
  fetchServiceTypes,
} from '../lib/api'
import { currency } from '../lib/format'
import { getErrorMessage } from '../lib/errors'
import { formatFullDate } from '../lib/scheduleDates'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import type { RootStackParamList } from '../navigation/RootNavigator'
import type { Schedule } from '../types'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddPayrollEntry'>

type ItemLine = { key: number; description: string; amount: string }

const emptyItem = (key: number): ItemLine => ({ key, description: '', amount: '' })

const SCHEDULE_STATUS_LABELS: Record<Schedule['status'], string> = {
  pending: 'Pendiente',
  in_progress: 'En proceso',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
  rescheduled: 'Reagendado',
}

// Mismos campos, misma validación y mismo orden/secciones que ops-web
// AddPayrollEntryModal.tsx, como pantalla completa (no modal) — igual que
// AddScheduleScreen. Tres secciones, igual que web: 1) Empleado (con el
// buscador de horarios relacionados, colapsable, justo debajo) 2) Propiedad
// — propiedad/unidad/fecha/servicio y 3) Pago — pago/notas/desglose. El
// pago al empleado es opcional (se puede completar después, ver comentario
// en types.ts sobre `amount` en PayrollEntry) y el desglose del servicio
// (descripción + costo por línea) usa el mismo patrón de líneas dinámicas
// que las "Extras" de ScheduleActionModal.
export const AddPayrollEntryScreen = () => {
  const navigation = useNavigation<Nav>()

  const { data: properties, loading: loadingProperties } = useSupabaseQuery(fetchProperties, [])
  const { data: employees, loading: loadingEmployees } = useSupabaseQuery(fetchEmployees, [])

  const [propertyId, setPropertyId] = useState('')
  const [unitLabel, setUnitLabel] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [serviceName, setServiceName] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<ItemLine[]>([emptyItem(0)])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openField, setOpenField] = useState<string | null>(null)
  const [scheduleOpen, setScheduleOpen] = useState(true)
  const [scheduleFrom, setScheduleFrom] = useState('')
  const [scheduleTo, setScheduleTo] = useState('')
  const [selectedScheduleId, setSelectedScheduleId] = useState('')

  const propertyOptions = (properties ?? []).map((p) => ({ id: p.id, label: p.name }))
  const employeeOptions = (employees ?? []).map((e) => ({ id: e.id, label: e.name }))

  // Igual que ops-web AddPayrollEntryModal.tsx: sin rango de fechas no se
  // pide nada al servidor, y fetchSchedulesForEmployee ya excluye del lado
  // del servidor los horarios que ya se usaron en otra planilla.
  const { data: schedules, loading: schedulesLoading } = useSupabaseQuery(
    () =>
      employeeId && scheduleFrom && scheduleTo
        ? fetchSchedulesForEmployee(employeeId, scheduleFrom, scheduleTo)
        : Promise.resolve([]),
    [employeeId, scheduleFrom, scheduleTo],
  )
  const { data: serviceTypes } = useSupabaseQuery(fetchServiceTypes, [])
  const employeeSchedules = schedules ?? []

  const handleEmployeeChange = (id: string) => {
    setEmployeeId(id)
    setSelectedScheduleId('')
    setScheduleOpen(true)
  }

  const handleScheduleSelect = (id: string) => {
    setSelectedScheduleId(id)
    const schedule = employeeSchedules.find((s) => s.id === id)
    if (!schedule) return
    setPropertyId(schedule.propertyId)
    setUnitLabel(schedule.unitLabel ?? '')
    setDate(schedule.scheduledDate)
    const serviceType = (serviceTypes ?? []).find((st) => st.id === schedule.serviceTypeId)
    if (serviceType) setServiceName(serviceType.name)
  }

  const updateItem = (key: number, patch: Partial<ItemLine>) =>
    setItems((prev) => prev.map((item) => (item.key === key ? { ...item, ...patch } : item)))
  const addItem = () => setItems((prev) => [...prev, emptyItem((prev.at(-1)?.key ?? 0) + 1)])
  const removeItem = (key: number) =>
    setItems((prev) => (prev.length > 1 ? prev.filter((item) => item.key !== key) : prev))

  const filledItems = items.filter((item) => item.description.trim() || item.amount.trim())
  const salesTotal = filledItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)

  const handleSave = async () => {
    if (!propertyId) {
      setError('Selecciona una propiedad.')
      return
    }
    if (!unitLabel.trim()) {
      setError('La unidad es obligatoria.')
      return
    }
    if (!employeeId) {
      setError('Selecciona un empleado.')
      return
    }
    if (!serviceName.trim()) {
      setError('El nombre del servicio es obligatorio.')
      return
    }
    let amountValue: number | null = null
    if (amount.trim()) {
      amountValue = Number(amount)
      if (Number.isNaN(amountValue) || amountValue < 0) {
        setError('El pago no es un número válido.')
        return
      }
    }
    if (!date.trim()) {
      setError('La fecha es obligatoria.')
      return
    }

    const parsedItems: { description: string; amount: number }[] = []
    for (const item of filledItems) {
      const itemAmount = Number(item.amount)
      if (!item.description.trim()) {
        setError('Cada línea del desglose necesita una descripción.')
        return
      }
      if (!item.amount || Number.isNaN(itemAmount) || itemAmount < 0) {
        setError(`El costo de "${item.description}" no es un número válido.`)
        return
      }
      parsedItems.push({ description: item.description.trim(), amount: itemAmount })
    }

    setSaving(true)
    setError(null)
    try {
      await createPayrollEntry({
        propertyId,
        unitLabel: unitLabel.trim(),
        employeeId,
        serviceName: serviceName.trim(),
        amount: amountValue,
        date: date.trim(),
        notes: notes.trim(),
        scheduleId: selectedScheduleId || undefined,
        items: parsedItems,
      })
      navigation.goBack()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar la planilla.'))
    } finally {
      setSaving(false)
    }
  }

  const loadingLookups = loadingProperties || loadingEmployees

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        {loadingLookups ? null : (
          <>
            <View style={styles.field}>
              <Text style={styles.label}>Empleado</Text>
              <InlineSelect
                options={employeeOptions}
                value={employeeId}
                onChange={handleEmployeeChange}
                searchPlaceholder="Buscar empleado..."
                open={openField === 'employee'}
                onOpenChange={(next) => setOpenField(next ? 'employee' : null)}
              />
            </View>

            {employeeId && (
              <View style={styles.scheduleBox}>
                <TouchableOpacity
                  style={styles.scheduleHeader}
                  activeOpacity={0.7}
                  onPress={() => setScheduleOpen((prev) => !prev)}
                >
                  <Text style={styles.scheduleHeaderText}>Horario relacionado (opcional)</Text>
                  {scheduleOpen ? (
                    <ChevronUp size={16} color={colors.ink400} />
                  ) : (
                    <ChevronDown size={16} color={colors.ink400} />
                  )}
                </TouchableOpacity>

                {scheduleOpen && (
                  <View style={styles.scheduleBody}>
                    <View style={styles.scheduleRow}>
                      <View style={styles.scheduleRangeField}>
                        <DatePicker label="Desde" value={scheduleFrom} onChange={setScheduleFrom} />
                      </View>
                      <View style={styles.scheduleRangeField}>
                        <DatePicker label="Hasta" value={scheduleTo} onChange={setScheduleTo} />
                      </View>
                    </View>

                    {!scheduleFrom || !scheduleTo ? (
                      <Text style={styles.scheduleHint}>
                        Elige un rango de fechas (Desde y Hasta) para buscar los horarios de este empleado.
                      </Text>
                    ) : schedulesLoading ? (
                      <Text style={styles.scheduleHint}>Buscando horarios…</Text>
                    ) : (
                      <>
                        <InlineSelect
                          options={employeeSchedules.map((s) => {
                            const scheduleProperty =
                              (properties ?? []).find((p) => p.id === s.propertyId)?.name ?? '—'
                            const scheduleService =
                              (serviceTypes ?? []).find((st) => st.id === s.serviceTypeId)?.name ?? '—'
                            return {
                              id: s.id,
                              label: `${formatFullDate(s.scheduledDate)} · ${scheduleProperty}${
                                s.unitLabel ? ` · ${s.unitLabel}` : ''
                              } · ${scheduleService} (${SCHEDULE_STATUS_LABELS[s.status]})`,
                            }
                          })}
                          value={selectedScheduleId}
                          onChange={handleScheduleSelect}
                          placeholder={
                            employeeSchedules.length === 0
                              ? 'Sin horarios disponibles en ese rango'
                              : 'Seleccionar horario…'
                          }
                          searchPlaceholder="Buscar horario..."
                          open={openField === 'schedule'}
                          onOpenChange={(next) => setOpenField(next ? 'schedule' : null)}
                        />
                        <Text style={styles.scheduleHint}>
                          Al elegir un horario se llenan Propiedad, Unidad, Fecha y Servicio — puedes
                          editarlos después.
                        </Text>
                      </>
                    )}
                  </View>
                )}
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Propiedad</Text>

              <View style={styles.row}>
                <View style={[styles.field, styles.rowItem]}>
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
                <View style={styles.rowItem}>
                  <FormField label="Unidad" value={unitLabel} onChangeText={setUnitLabel} placeholder="ej. L303" />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.rowItem}>
                  <DatePicker label="Fecha" value={date} onChange={setDate} />
                </View>
                <View style={styles.rowItem}>
                  <FormField
                    label="Servicio"
                    value={serviceName}
                    onChangeText={setServiceName}
                    placeholder="ej. Vacante reparación"
                  />
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Pago</Text>

              <FormField
                label="Pago al empleado (opcional — se puede completar después)"
                value={amount}
                onChangeText={setAmount}
                placeholder="Se define después si aún no se sabe"
                keyboardType="decimal-pad"
              />

              <FormField
                label="Notas (opcional)"
                value={notes}
                onChangeText={setNotes}
                placeholder="Opcional"
                multiline
                numberOfLines={3}
                style={styles.textArea}
              />

              <View style={styles.itemsSection}>
                <View style={styles.itemsHeader}>
                  <Text style={styles.label}>Desglose del servicio</Text>
                  <TouchableOpacity style={styles.addItemButton} activeOpacity={0.7} onPress={addItem}>
                    <Plus size={14} color={colors.ink300} />
                    <Text style={styles.addItemText}>Agregar línea</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.itemsList}>
                  {items.map((item) => (
                    <View key={item.key} style={styles.itemRow}>
                      <TextInput
                        value={item.description}
                        onChangeText={(text) => updateItem(item.key, { description: text })}
                        placeholder="Descripción (ej. 5X1 en cocina)"
                        placeholderTextColor={colors.ink500}
                        style={[styles.input, styles.itemDescInput]}
                      />
                      <TextInput
                        value={item.amount}
                        onChangeText={(text) => updateItem(item.key, { amount: text })}
                        placeholder="Costo"
                        placeholderTextColor={colors.ink500}
                        keyboardType="decimal-pad"
                        style={[styles.input, styles.itemAmountInput]}
                      />
                      <TouchableOpacity
                        onPress={() => removeItem(item.key)}
                        disabled={items.length === 1}
                        hitSlop={8}
                        style={styles.removeItemButton}
                      >
                        <X size={16} color={items.length === 1 ? 'rgba(100,116,139,0.4)' : colors.ink500} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>

                <Text style={styles.salesHint}>
                  Venta del desglose: <Text style={styles.salesHintValue}>{currency(salesTotal)}</Text>
                </Text>
              </View>
            </View>

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.button, saving && styles.buttonDisabled]}
              activeOpacity={0.85}
              disabled={saving}
              onPress={handleSave}
            >
              <Text style={styles.buttonText}>{saving ? 'Guardando…' : 'Guardar planilla'}</Text>
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
  section: {
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: colors.ink500,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  scheduleBox: {
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surface,
    padding: 12,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleHeaderText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
  },
  scheduleBody: {
    gap: 10,
  },
  scheduleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  scheduleRangeField: {
    flex: 1,
  },
  scheduleHint: {
    fontSize: 12,
    color: colors.ink500,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  itemsSection: {
    gap: 10,
  },
  itemsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addItemButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addItemText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink300,
  },
  itemsList: {
    gap: 8,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.white,
  },
  itemDescInput: {
    flex: 1,
  },
  itemAmountInput: {
    width: 90,
  },
  removeItemButton: {
    padding: 4,
  },
  salesHint: {
    fontSize: 12,
    color: colors.ink500,
  },
  salesHintValue: {
    color: colors.ink300,
    fontWeight: '600',
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
