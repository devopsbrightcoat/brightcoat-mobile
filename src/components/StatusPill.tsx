import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { statusColors, statusLabels } from '../theme/colors'

type StatusPillProps = {
  status: string
}

export const StatusPill = ({ status }: StatusPillProps) => {
  const style = statusColors[status] ?? statusColors.inactive
  const label = statusLabels[status] ?? status

  return (
    <View style={[styles.pill, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
  },
})
