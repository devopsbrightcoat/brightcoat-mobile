import React from 'react'
import { Building2, ClipboardList, TrendingDown, TrendingUp } from 'lucide-react-native'
import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native'
import { LineChart } from 'react-native-chart-kit'
import { MockBanner } from '../components/MockBanner'
import { Panel } from '../components/Panel'
import { ScreenHeader } from '../components/ScreenHeader'
import { StatCard } from '../components/StatCard'
import { StatusPill } from '../components/StatusPill'
import {
  currency,
  employees,
  monthlyFinancials,
  properties,
  serviceTypes,
  services,
} from '../mocks/data'
import { colors } from '../theme/colors'

const screenWidth = Dimensions.get('window').width

export const DashboardScreen = () => {
  const activeProperties = properties.filter((p) => p.status === 'active').length
  const pendingServices = services.filter((s) => s.status !== 'completed').length
  const lastMonth = monthlyFinancials[monthlyFinancials.length - 1]

  const propertyName = (id: string) => properties.find((p) => p.id === id)?.name ?? '—'
  const serviceTypeName = (id: string) => serviceTypes.find((s) => s.id === id)?.name ?? '—'
  const employeeName = (id?: string) => employees.find((e) => e.id === id)?.name ?? 'Sin asignar'

  const upcoming = services
    .filter((s) => s.status !== 'completed')
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))
    .slice(0, 5)

  const chartData = {
    labels: monthlyFinancials.map((m) => m.month),
    datasets: [
      { data: monthlyFinancials.map((m) => m.income), color: () => colors.gold500, strokeWidth: 2 },
      { data: monthlyFinancials.map((m) => m.expenses), color: () => colors.rose, strokeWidth: 2 },
    ],
    legend: ['Ingresos', 'Gastos'],
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Dashboard" subtitle="Resumen general del negocio" showLogo />
      <ScrollView contentContainerStyle={styles.scroll}>
        <MockBanner />

        <View style={styles.statsGrid}>
          <StatCard label="Propiedades activas" value={String(activeProperties)} icon={Building2} />
          <StatCard label="Trabajos pendientes" value={String(pendingServices)} icon={ClipboardList} tone="warn" />
          <StatCard label="Ingresos — Ago" value={currency(lastMonth.income)} icon={TrendingUp} tone="good" />
          <StatCard label="Gastos — Ago" value={currency(lastMonth.expenses)} icon={TrendingDown} />
        </View>

        <Panel style={styles.chartPanel}>
          <Text style={styles.panelTitle}>Ingresos vs. gastos</Text>
          <Text style={styles.panelSubtitle}>Últimos 6 meses</Text>
          <LineChart
            data={chartData}
            width={screenWidth - 64}
            height={200}
            withInnerLines={false}
            withOuterLines={false}
            withShadow={false}
            bezier
            chartConfig={{
              backgroundGradientFrom: colors.surfaceAlt,
              backgroundGradientTo: colors.surfaceAlt,
              decimalPlaces: 0,
              color: () => colors.ink400,
              labelColor: () => colors.ink400,
              propsForDots: { r: '0' },
            }}
            style={styles.chart}
          />
        </Panel>

        <Panel style={styles.listPanel}>
          <Text style={styles.panelTitle}>Próximos trabajos</Text>
          <Text style={styles.panelSubtitle}>Pendientes y en proceso</Text>
          {upcoming.map((s, index) => (
            <View key={s.id} style={[styles.jobRow, index === upcoming.length - 1 && styles.jobRowLast]}>
              <View style={styles.jobInfo}>
                <Text style={styles.jobTitle} numberOfLines={1}>{propertyName(s.propertyId)}</Text>
                <Text style={styles.jobSubtitle} numberOfLines={1}>
                  {serviceTypeName(s.serviceTypeId)} · {employeeName(s.employeeId)}
                </Text>
              </View>
              <StatusPill status={s.status} />
            </View>
          ))}
        </Panel>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  scroll: {
    paddingBottom: 32,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  chartPanel: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
  },
  listPanel: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 16,
  },
  panelTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  panelSubtitle: {
    fontSize: 12,
    color: colors.ink500,
    marginTop: 2,
  },
  chart: {
    marginTop: 8,
    marginLeft: -16,
    borderRadius: 8,
  },
  jobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 10,
    marginTop: 8,
    gap: 8,
  },
  jobRowLast: {
    borderBottomWidth: 0,
    marginBottom: -2,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.white,
  },
  jobSubtitle: {
    fontSize: 11,
    color: colors.ink500,
    marginTop: 2,
  },
})
