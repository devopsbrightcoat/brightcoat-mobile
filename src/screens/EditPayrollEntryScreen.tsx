import React, { useMemo, useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { Check, Plus, X } from 'lucide-react-native'
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
import { useReferenceData } from '../contexts/ReferenceDataContext'
import { updatePayrollEntry } from '../lib/api'
import { currency } from '../lib/format'
import { getErrorMessage } from '../lib/errors'
import { SALES_TAX_RATE } from '../lib/tax'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { useTheme } from '../theme/ThemeContext'
import type { ThemeColors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditPayrollEntry'>
type Route = RouteProp<RootStackParamList, 'EditPayrollEntry'>

type ItemLine = { key: number; description: string; amount: string }

const emptyItem = (key: number): ItemLine => ({ key, description: '', amount: '' })

export const EditPayrollEntryScreen = () => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { entry } = params

  const { properties, loadingProperties, employees, loadingEmployees } = useReferenceData()

  const [propertyId, setPropertyId] = useState(entry.propertyId)
  const [unitLabel, setUnitLabel] = useState(entry.unitLabel ?? '')
  const [employeeId, setEmployeeId] = useState(entry.employeeId)
  const [serviceName, setServiceName] = useState(entry.serviceName)
  const [amount, setAmount] = useState(entry.amount == null ? '' : String(entry.amount))
  const [taxable, setTaxable] = useState(entry.taxable)
  const [date, setDate] = useState(entry.date)
  const [notes, setNotes] = useState(entry.notes ?? '')
  const [items, setItems] = useState<ItemLine[]>(
    entry.items.length > 0
      ? entry.items.map((item, i) => ({ key: i, description: item.description, amount: String(item.amount) }))
      : [emptyItem(0)],
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openField, setOpenField] = useState<string | null>(null)

  const propertyOptions = (properties ?? []).map((p) => ({ id: p.id, label: p.name }))
  const employeeOptions = (employees ?? [])
    .filter((e) => !e.hidden || e.id === employeeId)
    .map((e) => ({ id: e.id, label: e.name }))

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
        setError('El cobro no es un número válido.')
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
        notes: notes.trim(),
        taxable,
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
              label="Cobro total del trabajo (opcional — se puede completar después)"
              value={amount}
              onChangeText={setAmount}
              placeholder="Se define después si aún no se sabe"
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={styles.taxableRow}
              activeOpacity={0.75}
              onPress={() => setTaxable((prev) => !prev)}
            >
              <View style={[styles.checkbox, taxable && styles.checkboxChecked]}>
                {taxable ? <Check size={13} color={colors.brand900} strokeWidth={3} /> : null}
              </View>
              <Text style={styles.taxableLabel}>
                Este servicio lleva impuesto de ventas ({(SALES_TAX_RATE * 100).toFixed(2)}%)
              </Text>
            </TouchableOpacity>

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
                Pago del desglose: <Text style={styles.salesHintValue}>{currency(salesTotal)}</Text>
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
  taxableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkbox: {
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
  taxableLabel: {
    flex: 1,
    fontSize: 13,
    color: colors.ink300,
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
    borderColor: colors.tint10,
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
    borderColor: colors.tint10,
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
