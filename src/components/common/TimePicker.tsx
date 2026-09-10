import React, { useMemo } from 'react'
import WheelPicker from '@quidone/react-native-wheel-picker'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

type TimePickerProps = {
  label: string
  // Mismo formato "HH:MM" 24hr que se guardaba antes a mano en el
  // TextInput — el resto del formulario (validación, guardado) no cambia,
  // solo la UI muestra hora 12hr con AM/PM.
  value: string
  onChange: (value: string) => void
}

// Rueda chica a propósito — la versión anterior (34px x 3 filas) todavía se
// veía grande al lado de los demás campos del formulario (que rondan los
// 45px de alto en total, no por fila). 26px x 3 filas sigue dejando ver la
// fila de arriba/abajo (necesario para que se entienda que es una rueda
// deslizable) sin dominar el formulario.
const ITEM_HEIGHT = 26
const VISIBLE_ITEM_COUNT = 3

const pad2 = (n: number) => String(n).padStart(2, '0')

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1).map((h) => ({ value: h, label: pad2(h) }))
const MINUTES = Array.from({ length: 60 }, (_, m) => ({ value: m, label: pad2(m) }))
const PERIODS = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
] as const

type Period = (typeof PERIODS)[number]['value']

// Convierte el string guardado "HH:MM" (24hr) a hora 12hr + AM/PM para
// mostrar en las ruedas.
const to12h = (hour24: number): { hour12: number; period: Period } => {
  const period: Period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  return { hour12, period }
}

// Convierte hora 12hr + AM/PM de vuelta a 24hr para seguir guardando el
// mismo formato "HH:MM" que usa el resto del formulario/validación.
const to24h = (hour12: number, period: Period): number => {
  if (period === 'AM') return hour12 === 12 ? 0 : hour12
  return hour12 === 12 ? 12 : hour12 + 12
}

const parseTime = (value: string) => {
  const match = /^(\d{1,2}):(\d{1,2})$/.exec(value.trim())
  const hour24 = match ? Math.min(23, Math.max(0, parseInt(match[1], 10) || 0)) : 9
  const minute = match ? Math.min(59, Math.max(0, parseInt(match[2], 10) || 0)) : 0
  const { hour12, period } = to12h(hour24)
  return { hour12, minute, period }
}

// Selector de hora con tres ruedas (hora 12hr / minuto / AM-PM), usando
// @quidone/react-native-wheel-picker — reemplaza el campo de texto libre
// "Hora (HH:MM)" que había antes en Agregar/Editar horario. Se eligió esta
// librería en particular porque es 100% JS (no depende de módulos nativos
// como @react-native-community/datetimepicker), así que no hace falta pod
// install ni rebuild nativo para instalarla — mismo criterio que se usó
// para el select de Propiedad/Empleado/Servicio (ver InlineSelect.tsx).
//
// Sigue guardando y devolviendo el mismo string "HH:MM" (24hr) que antes,
// así que no cambia nada del lado de la validación ni del guardado en
// AddScheduleScreen/EditScheduleScreen — la conversión a/desde 12hr+AM/PM
// es solo de presentación (to12h/to24h arriba).
export const TimePicker = ({ label, value, onChange }: TimePickerProps) => {
  const { hour12, minute, period } = useMemo(() => parseTime(value), [value])

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerRow}>
        <WheelPicker
          data={HOURS_12}
          value={hour12}
          onValueChanged={({ item }) => onChange(`${pad2(to24h(item.value, period))}:${pad2(minute)}`)}
          width="32%"
          itemHeight={ITEM_HEIGHT}
          visibleItemCount={VISIBLE_ITEM_COUNT}
          itemTextStyle={styles.itemText}
          overlayItemStyle={styles.overlayItem}
        />
        <Text style={styles.colon}>:</Text>
        <WheelPicker
          data={MINUTES}
          value={minute}
          onValueChanged={({ item }) => onChange(`${pad2(to24h(hour12, period))}:${pad2(item.value)}`)}
          width="32%"
          itemHeight={ITEM_HEIGHT}
          visibleItemCount={VISIBLE_ITEM_COUNT}
          itemTextStyle={styles.itemText}
          overlayItemStyle={styles.overlayItem}
        />
        <WheelPicker
          data={PERIODS as unknown as { value: Period; label: string }[]}
          value={period}
          onValueChanged={({ item }) => onChange(`${pad2(to24h(hour12, item.value))}:${pad2(minute)}`)}
          width="30%"
          itemHeight={ITEM_HEIGHT}
          visibleItemCount={VISIBLE_ITEM_COUNT}
          itemTextStyle={styles.itemText}
          overlayItemStyle={styles.overlayItem}
        />
      </View>
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
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surface,
    paddingVertical: 2,
  },
  itemText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.white,
  },
  overlayItem: {
    backgroundColor: 'rgba(227,167,48,0.1)',
    borderRadius: 6,
  },
  colon: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.ink300,
  },
})
