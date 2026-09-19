import React, { useMemo } from 'react'
import type { PropsWithChildren, ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Panel } from '../common/Panel'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'

type DashboardPanelProps = PropsWithChildren<{
  title: string
  subtitle?: string
  action?: ReactNode
  titleTone?: 'default' | 'danger'
}>

export const DashboardPanel = ({ title, subtitle, action, children, titleTone = 'default' }: DashboardPanelProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  return (
    <Panel style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={[styles.title, titleTone === 'danger' && { color: colors.rose }]}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {action}
      </View>
      <View style={styles.body}>{children}</View>
    </Panel>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  panel: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.ink500,
  },
  body: {
    marginTop: 12,
  },
})
