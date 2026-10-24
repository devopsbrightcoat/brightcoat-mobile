import React, { useMemo } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Panel } from '../common/Panel'
import { currency } from '../../lib/format'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'

export type ProfitRow = {
  id: string
  name: string
  jobCount: number
  sold: number
  paid: number
  profit: number
}

type ProfitRowCardProps = {
  row: ProfitRow
}

export const ProfitRowCard = ({ row }: ProfitRowCardProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const margin = row.sold > 0 ? (row.profit / row.sold) * 100 : null

  return (
    <Panel style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {row.name}
        </Text>
        <Text style={row.profit < 0 ? styles.profitNegative : styles.profit}>{currency(row.profit)}</Text>
      </View>
      <View style={styles.footer}>
        <Text style={styles.meta} numberOfLines={1}>
          {row.jobCount} trabajo{row.jobCount === 1 ? '' : 's'} · Vendido {currency(row.sold)} · Pagado{' '}
          {currency(row.paid)}
        </Text>
        <Text style={styles.margin}>{margin == null ? '—' : `${margin.toFixed(1)}%`}</Text>
      </View>
    </Panel>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    padding: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  profit: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gold400,
  },
  profitNegative: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.rose,
  },
  footer: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: colors.tint05,
    paddingTop: 8,
  },
  meta: {
    flex: 1,
    fontSize: 11,
    color: colors.ink500,
  },
  margin: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink400,
  },
})
