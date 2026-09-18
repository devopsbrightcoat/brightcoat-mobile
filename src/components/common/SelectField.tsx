import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { InlineSelect } from './InlineSelect'
import { colors } from '../../theme/colors'

type Option = {
  id: string
  label: string
}

type SelectFieldProps = {
  label: string
  options: Option[]
  value: string
  onChange: (id: string) => void
  allLabel?: string
  placeholder?: string
  searchPlaceholder?: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// InlineSelect con su propio label arriba — pensado para filtros de una
// sola opción obligatoria (sin fila "Todas/Todos") donde el valor elegido
// por sí solo no explica de qué filtro se trata (ej. "Preset" o "Mes
// actual" sueltos). Reemplaza los SegmentedField de 3+ opciones o con
// etiquetas largas (Período, Estatus, Tipo de filtro) que se envolvían en
// varias líneas de chips y quedaban siempre visibles — con esto colapsan a
// un solo campo compacto, mismo estilo que ya usan Propiedad/Servicio en
// los filtros (InlineSelect). Los toggles cortos de 2 opciones que no se
// envuelven (ej. "1ra/2da quincena" en QuincenaPicker) se quedan como
// SegmentedField — no eran el problema.
export const SelectField = ({ label, ...selectProps }: SelectFieldProps) => (
  <View style={styles.wrap}>
    <Text style={styles.label}>{label}</Text>
    <InlineSelect {...selectProps} />
  </View>
)

const styles = StyleSheet.create({
  wrap: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
  },
})
