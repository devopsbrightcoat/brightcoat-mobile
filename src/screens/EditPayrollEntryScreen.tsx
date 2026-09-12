import React, { useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { Plus, X } from 'lucide-react-native'
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
import { fetchEmployees, fetchProperties, updatePayrollEntry } from '../lib/api'
import { currency } from '../lib/format'
import { getErrorMessage } from '../lib/errors'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditPayrollEntry'>
type Route = RouteProp<RootStackParamList, 'EditPayrollEntry'>

type ItemLine = { key: number; description: string; amount: string }

const emptyItem = (key: number): ItemLine => ({ key, description: '', amount: '' })

// Mismos campos y misma validación que AddPayrollEntryScreen, como pantalla
// completa — igual que EditExpenseScreen/EditScheduleScreen. La planilla
// llega por parámetro de navegación (snapshot al momento del tap en
// PayrollEntryDetailModal → "Editar planilla"), incluyendo su desglose ya
// cargado en líneas editables.
export const EditPayrollEntryScreen = () => {
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { entry } = params

  const { data: properties, loading: loadingProperties } = useSupabaseQuery(fetchProperties, [])
  const { data: employees, loading: loadingEmployees } = useSupabaseQuery(fetchEmployees, [])

  const [propertyId, setPropertyId] = useState(entry.propertyId)
  const [unitLabel, setUnitLabel] = useState(entry.unitLabel ?? '')
  const [employeeId, setEmployeeId] = useState(entry.employeeId)
  const [serviceName, setServiceName] = useState(entry.serviceName)
  const [amount, setAmount] = useState(entry.amount == null ? '' : String(entry.amount))
  const [date, setDate] = useState(entry.date)
  const [items, setItems] = useState<ItemLine[]>(
    entry.items.length > 0
      ? entry.items.map((item, i) => ({ key: i, description: item.description, amount: String(item.amount) }))
      : [emptyItem(0)],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openField, setOpenField] = useState<string | null>(null)

  const propertyOptions = (properties ?? []).map((p) => ({ id: p.id, label: p.name }))
  const employeeOptions = (employees ?? []).map((e) => ({ id: e.id, label: e.name }))

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
      await updatePayrollEntry(entry.id, {
        propertyId,
        unitLabel: unitLabel.trim(),
        employeeId,
        serviceName: serviceName.trim(),
        amount: amountValue,
        date: date.trim(),
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

            <FormField label="Unidad (ej. L303)" value={unitLabel} onChangeText={setUnitLabel} placeholder="L303" />

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

            <FormField
              label="Servicio"
              value={serviceName}
              onChangeText={setServiceName}
              placeholder="ej. Vacante reparación tape and float"
            />

            <FormField
              label="Pago al empleado (opcional — se puede completar después)"
              value={amount}
              onChangeText={setAmount}
              placeholder="Se define después si aún no se sabe"
              keyboardType="decimal-pad"
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
