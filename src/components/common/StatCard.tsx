import React from 'react'
import type { LucideIcon } from 'lucide-react-native'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

type Tone = 'default' | 'good' | 'warn'
type Size = 'default' | 'compact'

type StatCardProps = {
  label: string
  value: string
  icon: LucideIcon
  tone?: Tone
  hint?: string
  // 'compact' reduce padding/tamaños para usarse como tira de resumen
  // arriba de una lista (ej. CobrosScreen) — ahí la lista es lo importante
  // y las tarjetas de resumen no deberían competirle protagonismo. El
  // tamaño 'default' (Dashboard) no cambia.
  size?: Size
}

const toneStyles: Record<Tone, { bg: string; icon: string }> = {
  default: { bg: 'rgba(255,255,255,0.05)', icon: colors.ink300 },
  good: { bg: 'rgba(52,211,153,0.1)', icon: colors.emerald },
  warn: { bg: 'rgba(251,191,36,0.1)', icon: colors.amber },
}

export const StatCard = ({ label, value, icon: Icon, tone = 'default', hint, size = 'default' }: StatCardProps) => {
  const toneStyle = toneStyles[tone]
  const compact = size === 'compact'

  return (
    <View style={[styles.card, compact && styles.cardCompact]}>
      <View style={styles.headerRow}>
        <Text style={[styles.label, compact && styles.labelCompact]} numberOfLines={1}>
          {label}
        </Text>
        <View style={[styles.iconChip, compact && styles.iconChipCompact, { backgroundColor: toneStyle.bg }]}>
          <Icon size={compact ? 13 : 16} color={toneStyle.icon} />
        </View>
      </View>
      <Text style={[styles.value, compact && styles.valueCompact]} numberOfLines={1}>
        {value}
      </Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '46%',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    padding: 16,
  },
  cardCompact: {
    minWidth: 0,
    borderRadius: 10,
    padding: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    color: colors.ink500,
  },
  labelCompact: {
    fontSize: 9,
  },
  iconChip: {
    height: 30,
    width: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconChipCompact: {
    height: 22,
    width: 22,
    borderRadius: 6,
  },
  value: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  valueCompact: {
    marginTop: 4,
    fontSize: 15,
  },
  hint: {
    marginTop: 2,
    fontSize: 11,
    color: colors.ink500,
  },
})
