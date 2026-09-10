import React, { useState } from 'react'
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { Calendar } from 'lucide-react-native'
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Modal } from './Modal'
import { colors } from '../../theme/colors'

type DatePickerProps = {
  label: string
  // Mismo formato "AAAA-MM-DD" que se guardaba antes a mano en el
  // FormField de texto — el resto del formulario/validación no cambia.
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const pad2 = (n: number) => String(n).padStart(2, '0')

const toIso = (date: Date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`

const parseIso = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(value.trim())
  if (!match) return null
  const [, y, m, d] = match
  const date = new Date(Number(y), Number(m) - 1, Number(d))
  return Number.isNaN(date.getTime()) ? null : date
}

const formatDisplay = (value: string) => {
  const date = parseIso(value)
  return date ? date.toLocaleDateString('es-HN', { day: '2-digit', month: 'short', year: 'numeric' }) : value
}

// Selector de fecha con el picker nativo del sistema
// (@react-native-community/datetimepicker) — reemplaza los campos de texto
// libre "Fecha (AAAA-MM-DD)" que había antes en Horarios y Gastos. A
// diferencia de InlineSelect/TimePicker (100% JS), esta librería SÍ es un
// módulo nativo — hace falta `pod install` + rebuild nativo para instalarla,
// no alcanza con `npm install` + reiniciar Metro.
//
// Android y iOS se comportan muy distinto acá, así que el componente toma
// caminos separados:
// - Android: `DateTimePickerAndroid.open(...)` abre el diálogo nativo del
//   sistema de forma imperativa (sin necesidad de montar/desmontar nada) —
//   es la forma recomendada por la librería en vez de renderizar
//   <DateTimePicker> condicionalmente.
// - iOS: no hay diálogo nativo separado — el picker (`display="spinner"`)
//   se dibuja embebido, así que lo mostramos dentro de nuestro propio Modal
//   (la hoja inferior que ya usa el resto de la app) con un botón "Listo"
//   para confirmar, porque el spinner dispara onChange en cada scroll, no
//   solo al confirmar.
//
// Sigue guardando y devolviendo el mismo string "AAAA-MM-DD" que antes, así
// que no cambia nada del lado de la validación ni del guardado.
export const DatePicker = ({ label, value, onChange, placeholder = 'Selecciona una fecha' }: DatePickerProps) => {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Date>(() => parseIso(value) ?? new Date())

  const openPicker = () => {
    const initial = parseIso(value) ?? new Date()

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: initial,
        mode: 'date',
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) onChange(toIso(selected))
        },
      })
      return
    }

    setDraft(initial)
    setOpen(true)
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity style={styles.field} activeOpacity={0.75} onPress={openPicker}>
        <Text style={value ? styles.fieldText : styles.placeholderText}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
        <Calendar size={16} color={colors.ink400} />
      </TouchableOpacity>

      {Platform.OS === 'ios' ? (
        <Modal open={open} onClose={() => setOpen(false)} title={label}>
          <DateTimePicker
            value={draft}
            mode="date"
            display="spinner"
            textColor={colors.white}
            onChange={(_, selected) => {
              if (selected) setDraft(selected)
            }}
          />
          <TouchableOpacity
            style={styles.confirmButton}
            activeOpacity={0.85}
            onPress={() => {
              onChange(toIso(draft))
              setOpen(false)
            }}
          >
            <Text style={styles.confirmButtonText}>Listo</Text>
          </TouchableOpacity>
        </Modal>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldText: {
    fontSize: 15,
    color: colors.white,
  },
  placeholderText: {
    fontSize: 15,
    color: colors.ink500,
  },
  confirmButton: {
    marginTop: 4,
    alignItems: 'center',
    borderRadius: 10,
    backgroundColor: colors.gold500,
    paddingVertical: 12,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.brand900,
  },
})
