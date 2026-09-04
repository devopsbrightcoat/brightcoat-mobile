import React, { useMemo, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react-native'
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { colors } from '../theme/colors'

type Option = {
  id: string
  label: string
}

type SearchableSelectProps = {
  title: string
  options: Option[]
  value: string
  onChange: (id: string) => void
  allLabel: string
  searchPlaceholder?: string
}

export const SearchableSelect = ({
  title,
  options,
  value,
  onChange,
  allLabel,
  searchPlaceholder = 'Buscar...',
}: SearchableSelectProps) => {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const selectedLabel = value === 'all' ? allLabel : options.find((o) => o.id === value)?.label ?? allLabel

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return [{ id: 'all', label: allLabel }, ...options]
    return options.filter((o) => o.label.toLowerCase().includes(query))
  }, [options, search, allLabel])

  const close = () => {
    setOpen(false)
    setSearch('')
  }

  return (
    <>
      <TouchableOpacity style={styles.field} activeOpacity={0.7} onPress={() => setOpen(true)}>
        <Text style={styles.fieldText} numberOfLines={1}>
          {selectedLabel}
        </Text>
        <ChevronDown size={16} color={colors.ink400} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={close} hitSlop={8}>
              <X size={20} color={colors.ink300} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchBox}>
            <Search size={16} color={colors.ink500} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={searchPlaceholder}
              placeholderTextColor={colors.ink500}
              style={styles.searchInput}
              autoFocus
              autoCorrect={false}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const selected = item.id === value
              return (
                <TouchableOpacity
                  style={styles.option}
                  activeOpacity={0.7}
                  onPress={() => {
                    onChange(item.id)
                    close()
                  }}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]} numberOfLines={1}>
                    {item.label}
                  </Text>
                  {selected ? <Check size={16} color={colors.gold400} /> : null}
                </TouchableOpacity>
              )
            }}
            ListEmptyComponent={<Text style={styles.emptyText}>Sin resultados.</Text>}
          />
        </View>
      </Modal>
    </>
  )
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  fieldText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: colors.white,
    marginRight: 8,
  },
  modal: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
    padding: 0,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  optionText: {
    flex: 1,
    fontSize: 14,
    color: colors.ink200,
    marginRight: 8,
  },
  optionTextSelected: {
    color: colors.gold400,
    fontWeight: '600',
  },
  emptyText: {
    paddingTop: 24,
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink500,
  },
})
