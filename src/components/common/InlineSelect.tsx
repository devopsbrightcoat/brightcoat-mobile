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

const DEFAULT_MAX_LIST_HEIGHT = Math.round(Dimensions.get('window').height * 0.4)

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
  const dropdownRef = useRef<IDropdownRef>(null)
  const [searchValue, setSearchValue] = useState('')

  const data = useMemo(
    () => (allLabel ? [{ id: 'all', label: allLabel }, ...options] : options),
    [options, allLabel],
  )

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
      minHeight={maxListHeight}
      mode="modal"
      onFocus={() => onOpenChange?.(true)}
      onBlur={() => {
        setSearchValue('')
        onOpenChange?.(false)
      }}
      style={styles.field}
      containerStyle={[styles.container, { height: maxListHeight }]}
      placeholderStyle={styles.placeholderText}
      selectedTextStyle={styles.fieldText}
      itemTextStyle={styles.optionText}
      itemContainerStyle={styles.option}
      activeColor="rgba(227,167,48,0.08)"
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
