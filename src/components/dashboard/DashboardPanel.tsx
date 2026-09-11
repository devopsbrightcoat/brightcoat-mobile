import React from 'react'
import type { PropsWithChildren, ReactNode } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { Panel } from '../common/Panel'
import { colors } from '../../theme/colors'

type DashboardPanelProps = PropsWithChildren<{
  title: string
  subtitle?: string
  action?: ReactNode
}>

// Réplica de DashboardPanel.tsx (ops-web) — misma tarjeta genérica para las
// gráficas y bloques del Dashboard, con título/subtítulo y un slot de
// acción a la derecha (ej. el ícono de calendario en "Trabajos de hoy").
export const DashboardPanel = ({ title, subtitle, action, children }: DashboardPanelProps) => {
  return (
    <Panel style={styles.panel}>
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {action}
      </View>
      <View style={styles.body}>{children}</View>
    </Panel>
  )
}

const styles = StyleSheet.create({
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
