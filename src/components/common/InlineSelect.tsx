import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, ChevronUp, Search } from 'lucide-react-native'
import { Dropdown } from 'react-native-element-dropdown'
import type { IDropdownRef } from 'react-native-element-dropdown'
import { Dimensions, StyleSheet, TextInput, View } from 'react-native'
import { colors } from '../../theme/colors'

type Option = {
  id: string
  label: string
}

// Alto de la lista de opciones: la librería ignora este prop en mode="modal"
// (arma el panel con otro layout que no lo toma en cuenta) pero igual lo
// forzamos a mano vía containerStyle más abajo — 40% del alto de pantalla,
// para que se vea como una lista de verdad y no una ranurita con 1-2
// opciones visibles.
const DEFAULT_MAX_LIST_HEIGHT = Math.round(Dimensions.get('window').height * 0.4)

type InlineSelectProps = {
  options: Option[]
  value: string
  onChange: (id: string) => void
  // Con allLabel: funciona como filtro, con un renglón "Todas/Todos" que
  // representa value === 'all'. Sin allLabel: select obligatorio de una
  // entidad real, sin ese renglón.
  allLabel?: string
  placeholder?: string
  searchPlaceholder?: string
  maxListHeight?: number
  // Modo controlado: cuando el padre tiene varios InlineSelect (ej. los
  // filtros de Horarios) y quiere que solo uno esté abierto a la vez, pasa
  // `open` + `onOpenChange` y coordina el estado él mismo. Sin estas props
  // el select se maneja solo, como cualquier Dropdown normal.
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

// Select con buscador y panel flotante, usando react-native-element-dropdown
// en vez de una implementación propia. Se probaron dos versiones caseras
// (panel en el flujo normal empujando el layout, después flotando con
// `position: absolute`, después en un Modal propio con la posición medida a
// mano) y las tres tuvieron el mismo problema de fondo: el scroll interno de
// la lista de opciones competía con el ScrollView del formulario/modal que
// lo contiene y no se podía scrollear entre las opciones. Esta librería
// resuelve exactamente ese caso de uso (dropdown con buscador, anidado
// adentro de un ScrollView) con una lista virtualizada (FlatList) que vive
// en su propio Modal — sin depender de trucos de zIndex ni de cálculos de
// alto a mano.
//
// El panel de opciones siempre se abre en mode="modal" de la librería: fijo
// y centrado en pantalla, en vez de flotar pegado al campo que lo abrió.
// Antes ese modo solo se usaba cuando el select vivía dentro de otro Modal
// (prop `insideModal`, ya no existe) para evitar un bug de posición del
// dropdown anidado — David pidió que todos los selects de la app se
// comporten así siempre.
//
// SearchableSelect.tsx sigue siendo el picker de pantalla completa que se
// usaba antes de InlineSelect — ya no se usa en Horarios pero se deja por si
// hace falta en otro lado.
//
// Soporta modo controlado (`open`/`onOpenChange`) para que un padre con
// varios selects coordine que solo uno esté abierto a la vez — ver
// ScheduleFiltersModal, que abre "Propiedad" y automáticamente cierra
// "Empleado" (y viceversa). Sin esas props, el select se abre/cierra solo,
// como cualquier Dropdown normal de la librería.
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
  const dropdownRef = useRef<IDropdownRef>(null)
  const [searchValue, setSearchValue] = useState('')

  const data = useMemo(
    () => (allLabel ? [{ id: 'all', label: allLabel }, ...options] : options),
    [options, allLabel],
  )

  // Sincroniza el estado abierto/cerrado que coordina el padre (openField)
  // con la ref imperativa que expone la librería (open()/close()) — así
  // que otro select del mismo grupo abriéndose cierra este automáticamente.
  useEffect(() => {
    if (openProp === undefined) return
    if (openProp) {
      dropdownRef.current?.open()
    } else {
      dropdownRef.current?.close()
    }
  }, [openProp])

  return (
    <Dropdown
      ref={dropdownRef}
      data={data}
      labelField="label"
      valueField="id"
      value={value}
      onChange={(item) => onChange(item.id)}
      placeholder={placeholder}
      search
      maxHeight={maxListHeight}
      // Alto fijo (no solo un tope) — sin esto, un select con pocas
      // opciones (ej. 2 empleados de prueba) se achicaba al tamaño de su
      // contenido y perdía el buscador visualmente (quedaba muy apretado).
      minHeight={maxListHeight}
      mode="modal"
      onFocus={() => onOpenChange?.(true)}
      onBlur={() => {
        setSearchValue('')
        onOpenChange?.(false)
      }}
      style={styles.field}
      // mode="modal" IGNORA maxHeight/minHeight — arma el panel con otro
      // layout interno que no los toma en cuenta — así que además forzamos
      // el alto acá, en containerStyle.
      containerStyle={[styles.container, { height: maxListHeight }]}
      placeholderStyle={styles.placeholderText}
      selectedTextStyle={styles.fieldText}
      itemTextStyle={styles.optionText}
      itemContainerStyle={styles.option}
      activeColor="rgba(227,167,48,0.08)"
      // Buscador propio en vez de dejar que la librería lo dibuje — su
      // buscador por defecto aplica el mismo `inputSearchStyle` tanto al
      // View que lo envuelve como al TextInput de adentro, así que el
      // borde/fondo que le pusimos terminaba dibujado DOS veces (una caja
      // adentro de otra). Con `renderInputSearch` dibujamos un solo View
      // con un solo borde.
      renderInputSearch={(onSearch) => (
        <View style={styles.searchBox}>
          <Search size={14} color={colors.ink500} />
          <TextInput
            value={searchValue}
            onChangeText={(text) => {
              setSearchValue(text)
              onSearch(text)
            }}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.ink500}
            autoCorrect={false}
            style={styles.searchInputText}
          />
        </View>
      )}
      renderRightIcon={(visible) =>
        visible ? (
          <ChevronUp size={16} color={colors.ink400} />
        ) : (
          <ChevronDown size={16} color={colors.ink400} />
        )
      }
    />
  )
}

const styles = StyleSheet.create({
  field: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
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
  container: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 12,
    marginTop: 12,
    marginBottom: 8,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: colors.ink500,
    backgroundColor: colors.surfaceAlt,
  },
  searchInputText: {
    flex: 1,
    fontSize: 13,
    color: colors.white,
    padding: 0,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  optionText: {
    fontSize: 13,
    color: colors.ink200,
  },
})
