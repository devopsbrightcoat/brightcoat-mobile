import React from 'react'
import type { LucideIcon } from 'lucide-react-native'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

type Tone = 'default' | 'good' | 'warn'

type StatCardProps = {
  label: string
  value: string
  icon: LucideIcon
  tone?: Tone
  hint?: string
}

const toneStyles: Record<Tone, { bg: string; icon: string }> = {
  default: { bg: 'rgba(255,255,255,0.05)', icon: colors.ink300 },
  good: { bg: 'rgba(52,211,153,0.1)', icon: colors.emerald },
  warn: { bg: 'rgba(251,191,36,0.1)', icon: colors.amber },
}

export const StatCard = ({ label, value, icon: Icon, tone = 'default', hint }: StatCardProps) => {
  const toneStyle = toneStyles[tone]

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.label}>{label}</Text>
        <View style={[styles.iconChip, { backgroundColor: toneStyle.bg }]}>
          <Icon size={16} color={toneStyle.icon} />
        </View>
      </View>
      <Text style={styles.value}>{value}</Text>
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
  iconChip: {
    height: 30,
    width: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  hint: {
    marginTop: 2,
    fontSize: 11,
    color: colors.ink500,
  },
})
