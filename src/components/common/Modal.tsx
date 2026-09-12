import React from 'react'
import { X } from 'lucide-react-native'
import {
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import type { DimensionValue } from 'react-native'
import { colors } from '../../theme/colors'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  // Alto mínimo de la hoja (ej. "60%") — por defecto se achica al tamaño
  // del contenido. Útil en modales con contenido corto que igual conviene
  // que ocupen más pantalla (ej. Filtros, para que no se sienta chico).
  minHeight?: DimensionValue
  // Desactiva el scroll de ESTE ScrollView (el del cuerpo del modal) — se
  // usa cuando adentro hay un InlineSelect abierto, ver comentario en
  // ScheduleFiltersModal. Con los dos ScrollView activos a la vez (este y
  // el de la lista de opciones), el gesto de arrastrar lo capturaba el de
  // afuera y la lista interna no scrolleaba.
  scrollEnabled?: boolean
}

// Modal genérico tipo "hoja inferior" para Horarios y los módulos que le
// siguen. Antes usaba `presentationStyle="pageSheet"` de RN, que en Android
// esa prop no hace nada (solo aplica en iOS) — ahí el modal siempre cubre
// toda la pantalla. Con un select anidado adentro (SearchableSelect abre su
// propio modal) terminaba en dos hojas de pantalla completa una encima de
// otra, tapando hasta la "x" de cerrar del panel de abajo. Ahora es una
// hoja propia (`transparent` + fondo oscuro tocable para cerrar) limitada a
// 75% de alto en cualquier plataforma, con esquinas redondeadas — se ve y
// se comporta igual en iOS y Android.
export const Modal = ({ open, onClose, title, children, minHeight, scrollEnabled = true }: ModalProps) => {
  return (
    <RNModal visible={open} transparent animationType="slide" onRequestClose={onClose}>
      {/* behavior 'height' en Android (no undefined): este modal abre su
          propia ventana nativa, separada de la Activity principal, así que
          android:windowSoftInputMode="adjustResize" del manifest no lo
          alcanza — sin esto el teclado tapa los campos de cualquier
          formulario dentro de un modal en Android. */}
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View style={[styles.sheet, minHeight != null && { minHeight }]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <X size={20} color={colors.ink300} />
            </TouchableOpacity>
          </View>
          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
            scrollEnabled={scrollEnabled}
          >
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    maxHeight: '75%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  body: {
    padding: 20,
    paddingTop: 16,
    gap: 18,
  },
})
