import React, { useMemo, useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import type { RouteProp } from '@react-navigation/native'
import { Check, Plus, X } from 'lucide-react-native'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { DatePicker } from '../components/common/DatePicker'
import { FormField } from '../components/common/FormField'
import { InlineSelect } from '../components/common/InlineSelect'
import { useReferenceData } from '../contexts/ReferenceDataContext'
import { updateCharge } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { useTheme } from '../theme/ThemeContext'
import type { ThemeColors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditCharge'>
type Route = RouteProp<RootStackParamList, 'EditCharge'>

type ExtraLine = { key: number; description: string; amount: string }

const emptyExtra = (key: number): ExtraLine => ({ key, description: '', amount: '' })

export const EditChargeScreen = () => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const navigation = useNavigation<Nav>()
  const { params } = useRoute<Route>()
  const { charge } = params

  const { properties, serviceTypes } = useReferenceData()
  const propertyOptions = (properties ?? []).map((p) => ({ id: p.id, label: p.name }))
  const serviceTypeOptions = (serviceTypes ?? []).map((t) => ({ id: t.id, label: t.name }))

  const [propertyId, setPropertyId] = useState(charge.propertyId)
  const [unitLabel, setUnitLabel] = useState(charge.unitLabel ?? '')
  const [serviceTypeId, setServiceTypeId] = useState(charge.serviceTypeId ?? '')
  const [date, setDate] = useState(charge.generatedDate ?? '')
  const [amount, setAmount] = useState(String(charge.amount))
  const [taxIncluded, setTaxIncluded] = useState(charge.taxIncluded)
  const [responsible, setResponsible] = useState(charge.responsible ?? '')
  const [payrollPeriod, setPayrollPeriod] = useState(charge.payrollPeriod ?? '')
  const [description, setDescription] = useState(charge.description ?? '')
  const [notes, setNotes] = useState(charge.notes ?? '')
  const [extras, setExtras] = useState<ExtraLine[]>(
    charge.extras.map((e, i) => ({ key: i + 1, description: e.description, amount: String(e.amount) })),
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addExtra = () => setExtras((prev) => [...prev, emptyExtra((prev.at(-1)?.key ?? 0) + 1)])
  const updateExtra = (key: number, patch: Partial<ExtraLine>) =>
    setExtras((prev) => prev.map((e) => (e.key === key ? { ...e, ...patch } : e)))
  const removeExtra = (key: number) => setExtras((prev) => prev.filter((e) => e.key !== key))

  const handleSave = async () => {
    if (!propertyId) {
      setError('Selecciona una propiedad.')
      return
    }

    const amountValue = Number(amount.replace(/[^0-9.-]/g, ''))
    if (!amount || Number.isNaN(amountValue) || amountValue < 0) {
      setError('El monto no es un número válido.')
      return
    }

    const filledExtras = extras.filter((e) => e.description.trim() || e.amount.trim())
    const parsedExtras: { description: string; amount: number }[] = []
    for (const extra of filledExtras) {
      const extraAmount = Number(extra.amount.replace(/[^0-9.-]/g, ''))
      if (!extra.description.trim()) {
        setError('Cada extra necesita una descripción.')
        return
      }
      if (!extra.amount || Number.isNaN(extraAmount) || extraAmount < 0) {
        setError(`El costo del extra "${extra.description}" no es un número válido.`)
        return
      }
      parsedExtras.push({ description: extra.description.trim(), amount: extraAmount })
    }

    setSaving(true)
    setError(null)
    try {
      await updateCharge(charge.id, {
        propertyId,
        unitLabel: unitLabel.trim() || undefined,
        serviceTypeId: serviceTypeId || undefined,
        generatedDate: date || undefined,
        description: description.trim() || undefined,
        amount: amountValue,
        responsible: responsible.trim() || undefined,
        payrollPeriod: payrollPeriod.trim() || undefined,
        notes: notes.trim() || undefined,
        extras: parsedExtras,
        taxIncluded,
      })
      navigation.goBack()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo guardar el cobro.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Propiedad</Text>
          <InlineSelect
            options={propertyOptions}
            value={propertyId}
            onChange={setPropertyId}
            placeholder="Seleccionar propiedad…"
            searchPlaceholder="Buscar…"
          />
        </View>

        <FormField
          label="Apartamento"
          value={charge.isFixed ? '' : unitLabel}
          onChangeText={setUnitLabel}
          placeholder={charge.isFixed ? 'N/A' : 'Unidad (ej. L303)'}
          editable={!charge.isFixed}
          style={charge.isFixed ? styles.inputDisabled : undefined}
        />

        <View style={styles.field}>
          <Text style={styles.label}>Servicio</Text>
          <InlineSelect
            options={serviceTypeOptions}
            value={serviceTypeId}
            onChange={setServiceTypeId}
            placeholder="Sin servicio"
            searchPlaceholder="Buscar…"
          />
        </View>

        <DatePicker label="Fecha" value={date} onChange={setDate} />

        <Text style={styles.hint}>
          Si este cobro corresponde a un horario ya entregado, cambiar propiedad, apartamento, servicio o fecha
          también actualiza ese horario para que quede igual.
        </Text>

        <FormField label="Monto" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />

        <TouchableOpacity style={styles.checkboxRow} activeOpacity={0.75} onPress={() => setTaxIncluded(!taxIncluded)}>
          <View style={[styles.checkbox, taxIncluded && styles.checkboxChecked]}>
            {taxIncluded ? <Check size={13} color={colors.brand900} strokeWidth={3} /> : null}
          </View>
          <View style={styles.checkboxTextGroup}>
            <Text style={styles.checkboxLabel}>Impuesto incluido en el cobro</Text>
            <Text style={styles.checkboxHint}>
              Márcalo si el monto ya trae el 8.25% de impuesto de ventas incluido. En Impuestos se desglosará hacia
              atrás en vez de sumarse aparte.
            </Text>
          </View>
        </TouchableOpacity>

        <FormField label="Responsable" value={responsible} onChangeText={setResponsible} placeholder="Opcional" />

        <FormField
          label="Periodo de planilla"
          value={payrollPeriod}
          onChangeText={setPayrollPeriod}
          placeholder="Opcional"
        />

        <FormField label="Descripción" value={description} onChangeText={setDescription} placeholder="Opcional" />

        <FormField
          label="Notas"
          value={notes}
          onChangeText={setNotes}
          placeholder="Opcional"
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        <View style={styles.field}>
          <View style={styles.extrasHeader}>
            <Text style={styles.label}>Extras</Text>
            <TouchableOpacity style={styles.addExtraButton} activeOpacity={0.7} onPress={addExtra}>
              <Plus size={14} color={colors.ink300} />
              <Text style={styles.addExtraText}>Agregar extra</Text>
            </TouchableOpacity>
          </View>

          {extras.length === 0 ? (
            <Text style={styles.emptyExtras}>Sin extras.</Text>
          ) : (
            <View style={styles.extrasList}>
              {extras.map((extra) => (
                <View key={extra.key} style={styles.extraRow}>
                  <TextInput
                    value={extra.description}
                    onChangeText={(text) => updateExtra(extra.key, { description: text })}
                    placeholder="Descripción"
                    placeholderTextColor={colors.ink500}
                    style={[styles.extraInput, styles.extraDescInput]}
                  />
                  <TextInput
                    value={extra.amount}
                    onChangeText={(text) => updateExtra(extra.key, { amount: text })}
                    placeholder="Costo"
                    placeholderTextColor={colors.ink500}
                    keyboardType="decimal-pad"
                    style={[styles.extraInput, styles.extraAmountInput]}
                  />
                  <TouchableOpacity onPress={() => removeExtra(extra.key)} hitSlop={8} style={styles.removeExtraButton}>
                    <X size={16} color={colors.ink500} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
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
  inputDisabled: {
    opacity: 0.5,
  },
  hint: {
    marginTop: -8,
    fontSize: 12,
    color: colors.ink500,
    lineHeight: 17,
  },
  textArea: {
    minHeight: 76,
    textAlignVertical: 'top',
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
    lineHeight: 15,
  },
  extrasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addExtraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.tint10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addExtraText: {
    fontSize: 12,
    fontWeight: '500',
    color: colors.ink300,
  },
  emptyExtras: {
    fontSize: 12,
    color: colors.ink500,
  },
  extrasList: {
    gap: 8,
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extraInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.white,
  },
  extraDescInput: {
    flex: 1,
  },
  extraAmountInput: {
    width: 90,
  },
  removeExtraButton: {
    padding: 4,
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
