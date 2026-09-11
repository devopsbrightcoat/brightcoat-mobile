import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../../theme/colors'

type RankingBarsItem = {
  id: string
  label: string
  value: number
}

type RankingBarsProps = {
  items: RankingBarsItem[]
  formatValue: (value: number) => string
  color: string
  emptyText: string
}

// Réplica de RankingBars.tsx (ops-web) — barras horizontales con el valor
// directamente etiquetado, para los "top N" del Dashboard (Ingresos por
// servicio/propiedad, Productividad de empleados). Mismo criterio que ahí:
// más legible que una gráfica de barras cuando los nombres son largos.
export const RankingBars = ({ items, formatValue, color, emptyText }: RankingBarsProps) => {
  if (items.length === 0) {
    return <Text style={styles.empty}>{emptyText}</Text>
  }

  const max = Math.max(...items.map((i) => i.value), 1)

  return (
    <View style={styles.wrap}>
      {items.map((item) => (
        <View key={item.id} style={styles.row}>
          <View style={styles.labelRow}>
            <Text style={styles.label} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={styles.value}>{formatValue(item.value)}</Text>
          </View>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                { width: `${Math.max((item.value / max) * 100, 2)}%`, backgroundColor: color },
              ]}
            />
          </View>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  empty: {
    paddingVertical: 20,
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink500,
  },
  wrap: {
    gap: 12,
  },
  row: {
    gap: 5,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    flex: 1,
    fontSize: 12,
    color: colors.ink300,
  },
  value: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  track: {
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 999,
  },
})
