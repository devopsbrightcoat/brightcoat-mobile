import React from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import type { TextInputProps } from 'react-native'
import { colors } from '../theme/colors'

type FormFieldProps = TextInputProps & {
  label: string
}

// Campo de texto reutilizable para los formularios de agregar/editar
// (Propiedades por ahora, el resto de módulos lo va a reusar en las
// siguientes fases). Mismo estilo visual que el resto de la app —
// StyleSheet plano, sin librería de estilos.
export const FormField = ({ label, style, ...inputProps }: FormFieldProps) => {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.ink500} style={[styles.input, style]} {...inputProps} />
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
  input: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.white,
  },
})
