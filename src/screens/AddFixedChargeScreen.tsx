import React, { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { DatePicker } from '../components/common/DatePicker'
import { FormField } from '../components/common/FormField'
import { InlineSelect } from '../components/common/InlineSelect'
import { createFixedCharge, fetchChargeTemplates, fetchProperties } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'

type Nav = NativeStackNavigationProp<RootStackParamList, 'AddFixedCharge'>

// Único formulario que permite crear un cobro a mano desde Cobros — y solo
// crea cobros FIJOS (ver createFixedCharge en lib/api.ts), siempre a
// partir de un cobro fijo del catálogo (Configuración › Cobros fijos):
// elegirlo es obligatorio y precarga propiedad (ya no se pide por
// separado — Javier: "el cobro fijo jalaria la propiedad, no necesito
// agregarla en el formulario") y monto (queda editable por si ese mes
// varía) — su nombre pasa a la descripción del cobro creado. Mismos
// campos que ops-web/src/components/cobros/AddFixedChargeModal.tsx, como
// pantalla completa (no modal) — igual que AddExpenseScreen/AddPropertyScreen.
// Sin campo de unidad ni de servicio: un cobro fijo no va amarrado a un
// apartamento ni a un trabajo puntual — Cobros le muestra "N/A" en esa
// columna. Los cobros "regulares" se siguen generando solo desde Horarios
// o importándolos de Excel (eso se queda solo en la web).
export const AddFixedChargeScreen = () => {
  const navigation = useNavigation<Nav>()

  const [templateId, setTemplateId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: properties } = useSupabaseQuery(fetchProperties, [])
  const { data: templates } = useSupabaseQuery(fetchChargeTemplates, [])
  const templateOptions = (templates ?? []).map((t) => ({ id: t.id, label: t.name }))

  const selectedTemplate = (templates ?? []).find((t) => t.id === templateId)
  const selectedPropertyName = selectedTemplate
    ? (properties ?? []).find((p) => p.id === selectedTemplate.propertyId)?.name ?? '—'
    : null

  // Elegir un cobro fijo precarga propiedad y monto — el monto queda
  // editable por si ese mes varía (mismo criterio que "Gasto fijo" en
  // AddExpenseScreen). El nombre de la plantilla no se guarda en ningún
  // campo del formulario: se manda directo como description al crear el
  // cobro (ver handleSave), y la propiedad se toma directo de la
  // plantilla, sin campo propio en esta pantalla.
  const handleTemplateChange = (id: string) => {
    setTemplateId(id)
    const template = (templates ?? []).find((t) => t.id === id)
    if (template) setAmount(String(template.amount))
  }

  const handleSave = async () => {
    const template = (templates ?? []).find((t) => t.id === templateId)
    if (!template) {
      setError('Selecciona un cobro fijo.')
      return
    }
    const amountNum = Number(amount)
    if (!amount.trim() || Number.isNaN(amountNum) || amountNum < 0) {
      setError('El monto no es válido.')
      return
    }
    if (!date.trim()) {
      setError('La fecha de cobro es obligatoria.')
      return
    }

    setSaving(true)
    setError(null)
    try {
      await createFixedCharge({
        propertyId: template.propertyId,
        amount: amountNum,
        generatedDate: date.trim(),
        description: template.name,
      })
      navigation.goBack()
    } catch (err) {
      setError(getErrorMessage(err, 'No se pudo crear el cobro fijo.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>Cobro fijo</Text>
          <InlineSelect
            options={templateOptions}
            value={templateId}
            onChange={handleTemplateChange}
            placeholder="Seleccionar cobro fijo…"
            searchPlaceholder="Buscar…"
          />
          {templates && templates.length === 0 ? (
            <Text style={styles.hint}>
              Todavía no hay cobros fijos en el catálogo — agrega uno en Configuración › Cobros fijos primero.
            </Text>
          ) : null}
          {selectedPropertyName ? <Text style={styles.hint}>Propiedad: {selectedPropertyName}</Text> : null}
        </View>

        <FormField label="Monto" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />

        <DatePicker label="Fecha de cobro" value={date} onChange={setDate} />

        <Text style={styles.hint}>
          Un cobro fijo no lleva apartamento ni tipo de servicio — queda ligado solo a la propiedad. Cobros lo
          muestra con &quot;N/A&quot; en Apartamento.
        </Text>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          activeOpacity={0.85}
          disabled={saving}
          onPress={handleSave}
        >
          <Text style={styles.buttonText}>{saving ? 'Guardando…' : 'Agregar cobro fijo'}</Text>
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
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
  },
  hint: {
    fontSize: 12,
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
