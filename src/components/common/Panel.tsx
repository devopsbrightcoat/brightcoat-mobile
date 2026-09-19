import React, { useMemo } from 'react'
import type { PropsWithChildren } from 'react'
import { StyleSheet, View } from 'react-native'
import type { ViewStyle } from 'react-native'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'

type PanelProps = PropsWithChildren<{
  style?: ViewStyle
}>

export const Panel = ({ children, style }: PanelProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return <View style={[styles.panel, style]}>{children}</View>
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  panel: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surfaceAlt,
  },
})
