import React, { useCallback, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Check, ChevronDown, ChevronUp, X } from 'lucide-react-native'
import DropDownPicker from 'react-native-dropdown-picker'
import { Dimensions, StyleSheet } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'
import { colors } from '../../theme/colors'

type Option = {
  id: string
  label: string
}

// Altura máxima del listado interno — el resto de la hoja (buscador + fondo)
// se ajusta al contenido, igual que components/common/Modal.tsx (maxHeight
// 75%). Con listas largas, el listado scrollea dentro de este límite en vez
// de crecer sin control.
const DEFAULT_MAX_LIST_HEIGHT = Math.round(Dimensions.get('window').height * 0.55)

// Íconos definidos fuera del componente — si se declaran inline en cada
// render, React los trata como un tipo de componente nuevo en cada render
// (ver react/no-unstable-nested-components) y además desmonta/remonta la UI.
const ArrowDownIcon = ({ style }: { style: StyleProp<ViewStyle> }) => (
  <ChevronDown size={16} color={colors.ink400} style={style} />
)
const ArrowUpIcon = ({ style }: { style: StyleProp<ViewStyle> }) => (
  <ChevronUp size={16} color={colors.ink400} style={style} />
)
const TickIcon = ({ style }: { style: StyleProp<ViewStyle> }) => (
  <Check size={16} color={colors.gold400} style={style} />
)
const CloseIcon = ({ style }: { style: StyleProp<ViewStyle> }) => <X size={20} color={colors.ink300} style={style} />

type InlineSelectProps = {
  options: Option[]
  value: string
  onChange: (id: string) => void
  allLabel?: string
  placeholder?: string
  searchPlaceholder?: string
  maxListHeight?: number
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const InlineSelect = ({
  options,
  value,
  onChange,
  allLabel,
  placeholder = 'Selecciona…',
  searchPlaceholder = 'Buscar...',
  maxListHeight = DEFAULT_MAX_LIST_HEIGHT,
  open: openProp,
  onOpenChange,
}: InlineSelectProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = openProp !== undefined
  const open = isControlled ? (openProp as boolean) : uncontrolledOpen

  const items = useMemo(
    () =>
      allLabel
        ? [{ label: allLabel, value: 'all' }, ...options.map((o) => ({ label: o.label, value: o.id }))]
        : options.map((o) => ({ label: o.label, value: o.id })),
    [options, allLabel],
  )

  const handleSetOpen = useCallback<Dispatch<SetStateAction<boolean>>>(
    (updater) => {
      const next = typeof updater === 'function' ? (updater as (prev: boolean) => boolean)(open) : updater
      if (!isControlled) setUncontrolledOpen(next)
      onOpenChange?.(next)
    },
    [open, isControlled, onOpenChange],
  )

  const handleSetValue = useCallback<Dispatch<SetStateAction<string | null>>>(
    (updater) => {
      const current = value || null
      const next = typeof updater === 'function' ? (updater as (prev: string | null) => string | null)(current) : updater
      onChange(next ?? '')
    },
    [value, onChange],
  )

  return (
    <DropDownPicker
      items={items}
      open={open}
      setOpen={handleSetOpen}
      value={value || null}
      setValue={handleSetValue}
      listMode="MODAL"
      theme="DARK"
      modalAnimationType="slide"
      modalProps={{ transparent: true, statusBarTranslucent: true }}
      searchable
      searchPlaceholder={searchPlaceholder}
      placeholder={placeholder}
      style={styles.field}
      textStyle={styles.fieldText}
      placeholderStyle={styles.placeholderText}
      modalContentContainerStyle={styles.modalContent}
      searchContainerStyle={styles.searchContainer}
      searchTextInputStyle={styles.searchInput}
      searchPlaceholderTextColor={colors.ink500}
      listItemContainerStyle={styles.listItem}
      listItemLabelStyle={styles.listItemLabel}
      selectedItemLabelStyle={styles.selectedLabel}
      flatListProps={{
        style: { maxHeight: maxListHeight, flexGrow: 0, backgroundColor: colors.surface },
        contentContainerStyle: styles.listContent,
      }}
      ArrowDownIconComponent={ArrowDownIcon}
      ArrowUpIconComponent={ArrowUpIcon}
      TickIconComponent={TickIcon}
      CloseIconComponent={CloseIcon}
    />
  )
}

const styles = StyleSheet.create({
  field: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    minHeight: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.white,
  },
  placeholderText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink500,
  },
  // El SafeAreaView interno de la librería hace de backdrop: ocupa toda la
  // pantalla y empuja el buscador + el listado (que ya no crecen con flex)
  // hacia abajo — se ve como una hoja anclada al fondo, igual que
  // components/common/Modal.tsx, en vez de pantalla completa.
  modalContent: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  // Esta fila hace de "header" de la hoja (la librería no permite un título
  // separado cuando searchable=true) — de ahí el radio arriba.
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: colors.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  listItem: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    height: undefined,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  listItemLabel: {
    fontSize: 14,
    color: colors.ink200,
  },
  selectedLabel: {
    color: colors.gold400,
    fontWeight: '600',
  },
  listContent: {
    // flexGrow: 1 para que "Sin resultados" se siga centrando dentro del área
    // capada — no afecta el scroll cuando SÍ hay más ítems de los que caben.
    flexGrow: 1,
    paddingBottom: 8,
  },
})
