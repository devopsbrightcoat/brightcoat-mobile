import React, { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'

type PaginationProps = {
  page: number
  totalPages: number
  onChange: (page: number) => void
}

export const Pagination = ({ page, totalPages, onChange }: PaginationProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])

  if (totalPages <= 1) return null

  return (
    <View style={styles.row}>
      <TouchableOpacity
        disabled={page <= 1}
        onPress={() => onChange(page - 1)}
        style={[styles.button, page <= 1 && styles.buttonDisabled]}
      >
        <ChevronLeft size={14} color={colors.ink400} />
        <Text style={styles.buttonText}>Anterior</Text>
      </TouchableOpacity>
      <Text style={styles.label}>
        Página {page} de {totalPages}
      </Text>
      <TouchableOpacity
        disabled={page >= totalPages}
        onPress={() => onChange(page + 1)}
        style={[styles.button, page >= totalPages && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>Siguiente</Text>
        <ChevronRight size={14} color={colors.ink400} />
      </TouchableOpacity>
    </View>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: colors.tint05,
    marginTop: 12,
    paddingTop: 12,
    gap: 8,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.tint10,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 12,
    color: colors.ink400,
  },
  label: {
    fontSize: 12,
    color: colors.ink500,
  },
})
