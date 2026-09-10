import React from 'react'
import type { PropsWithChildren } from 'react'
import { StyleSheet, View } from 'react-native'
import type { ViewStyle } from 'react-native'
import { colors } from '../../theme/colors'

type PanelProps = PropsWithChildren<{
  style?: ViewStyle
}>

export const Panel = ({ children, style }: PanelProps) => {
  return <View style={[styles.panel, style]}>{children}</View>
}

const styles = StyleSheet.create({
  panel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
  },
})
