import React, { useCallback, useMemo, useState } from 'react'
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Plus, Trash2 } from 'lucide-react-native'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ConfirmModal } from '../components/common/ConfirmModal'
import { Panel } from '../components/common/Panel'
import { ScreenHeader } from '../components/common/ScreenHeader'
import { EmpleadosScreen } from './EmpleadosScreen'
import { PropiedadesScreen } from './PropiedadesScreen'
import { ProveedoresScreen } from './finanzas/ProveedoresScreen'
import { useReferenceData } from '../contexts/ReferenceDataContext'
import { deleteChargeTemplate, deleteExpenseTemplate, deleteServiceType, fetchChargeTemplates, fetchExpenseTemplates } from '../lib/api'
import { currency } from '../lib/format'
import { serviceCategoryLabels } from '../lib/serviceTypeOptions'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { useTheme } from '../theme/ThemeContext'
import type { ThemeColors } from '../theme/colors'
import type { ChargeTemplate, ExpenseTemplate, ServiceType } from '../types'

type TabKey = 'propiedades' | 'servicios' | 'gastos_fijos' | 'cobros_fijos' | 'empleados' | 'proveedores'
type Nav = NativeStackNavigationProp<RootStackParamList>

const TABS: { key: TabKey; label: string }[] = [
  { key: 'propiedades', label: 'Propiedades' },
  { key: 'servicios', label: 'Servicios' },
  { key: 'gastos_fijos', label: 'Gastos fijos' },
  { key: 'cobros_fijos', label: 'Cobros fijos' },
  { key: 'empleados', label: 'Empleados' },
  { key: 'proveedores', label: 'Proveedores' },
]

export const CatalogosScreen = () => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const navigation = useNavigation<Nav>()
  const [tab, setTab] = useState<TabKey>('servicios')
  const [refreshKey, setRefreshKey] = useState(0)
  const [deletingServiceType, setDeletingServiceType] = useState<ServiceType | null>(null)
  const [deletingExpenseTemplate, setDeletingExpenseTemplate] = useState<ExpenseTemplate | null>(null)
  const [deletingChargeTemplate, setDeletingChargeTemplate] = useState<ChargeTemplate | null>(null)

  const {
    serviceTypes,
    loadingServiceTypes,
    errorServiceTypes,
    refreshingServiceTypes,
    refetchServiceTypes,
    properties: chargeTemplateProperties,
  } = useReferenceData()

  const {
    data: expenseTemplates,
    loading: loadingExpenseTemplates,
    error: errorExpenseTemplates,
    refreshing: refreshingExpenseTemplates,
    refetch: refetchExpenseTemplates,
  } = useSupabaseQuery(fetchExpenseTemplates, [refreshKey])

  const {
    data: chargeTemplates,
    loading: loadingChargeTemplates,
    error: errorChargeTemplates,
    refreshing: refreshingChargeTemplates,
    refetch: refetchChargeTemplates,
  } = useSupabaseQuery(fetchChargeTemplates, [refreshKey])

  const chargeTemplatePropertyNameById = useMemo(
    () => new Map((chargeTemplateProperties ?? []).map((p) => [p.id, p.name])),
    [chargeTemplateProperties],
  )

  const chargeTemplateServiceTypeNameById = useMemo(
    () => new Map((serviceTypes ?? []).map((t) => [t.id, t.name])),
    [serviceTypes],
  )

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1)
      refetchServiceTypes()
    }, [refetchServiceTypes]),
  )

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Catálogos"
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        right={
          tab === 'propiedades' ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddProperty')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.addButton}
            >
              <Plus size={22} color={colors.gold500} />
            </TouchableOpacity>
          ) : tab === 'servicios' ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddServiceType')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.addButton}
            >
              <Plus size={22} color={colors.gold500} />
            </TouchableOpacity>
          ) : tab === 'gastos_fijos' ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddExpenseTemplate')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.addButton}
            >
              <Plus size={22} color={colors.gold500} />
            </TouchableOpacity>
          ) : tab === 'cobros_fijos' ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddChargeTemplate')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.addButton}
            >
              <Plus size={22} color={colors.gold500} />
            </TouchableOpacity>
          ) : tab === 'empleados' ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddEmployee')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.addButton}
            >
              <Plus size={22} color={colors.gold500} />
            </TouchableOpacity>
          ) : tab === 'proveedores' ? (
            <TouchableOpacity
              onPress={() => navigation.navigate('AddVendor')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.addButton}
            >
              <Plus size={22} color={colors.gold500} />
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, tab === key && styles.tabActive]}
            activeOpacity={0.7}
            onPress={() => setTab(key)}
          >
            <Text style={[styles.tabText, tab === key && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {tab === 'propiedades' ? (
        <PropiedadesScreen />
      ) : tab === 'servicios' ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshingServiceTypes}
              onRefresh={refetchServiceTypes}
              tintColor={colors.gold400}
              colors={[colors.gold400]}
            />
          }
        >
          <Text style={styles.sectionTitle}>Catálogo de tipos de servicio</Text>

          {loadingServiceTypes ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.gold400} />
            </View>
          ) : errorServiceTypes ? (
            <Text style={styles.errorText}>No se pudo cargar el catálogo: {errorServiceTypes}</Text>
          ) : !serviceTypes || serviceTypes.length === 0 ? (
            <Text style={styles.emptyListText}>Todavía no hay tipos de servicio.</Text>
          ) : (
            <View style={styles.list}>
              {serviceTypes.map((item: ServiceType) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('EditServiceType', { serviceType: item })}
                >
                  <Panel style={styles.card}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.serviceRowActions}>
                      <Text style={styles.cardMeta}>{serviceCategoryLabels[item.category]}</Text>
                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => setDeletingServiceType(item)}
                      >
                        <Trash2 size={15} color={colors.rose} />
                      </TouchableOpacity>
                    </View>
                  </Panel>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      ) : tab === 'gastos_fijos' ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshingExpenseTemplates}
              onRefresh={refetchExpenseTemplates}
              tintColor={colors.gold400}
              colors={[colors.gold400]}
            />
          }
        >
          <Text style={styles.sectionTitle}>Catálogo de gastos fijos</Text>

          {loadingExpenseTemplates ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.gold400} />
            </View>
          ) : errorExpenseTemplates ? (
            <Text style={styles.errorText}>No se pudo cargar el catálogo: {errorExpenseTemplates}</Text>
          ) : !expenseTemplates || expenseTemplates.length === 0 ? (
            <Text style={styles.emptyListText}>Todavía no hay gastos fijos.</Text>
          ) : (
            <View style={styles.list}>
              {expenseTemplates.map((item: ExpenseTemplate) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('EditExpenseTemplate', { template: item })}
                >
                  <Panel style={styles.card}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <View style={styles.serviceRowActions}>
                      <Text style={styles.cardMeta}>{item.amount != null ? currency(item.amount) : '—'}</Text>
                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => setDeletingExpenseTemplate(item)}
                      >
                        <Trash2 size={15} color={colors.rose} />
                      </TouchableOpacity>
                    </View>
                  </Panel>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      ) : tab === 'cobros_fijos' ? (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshingChargeTemplates}
              onRefresh={refetchChargeTemplates}
              tintColor={colors.gold400}
              colors={[colors.gold400]}
            />
          }
        >
          <Text style={styles.sectionTitle}>Catálogo de cobros fijos</Text>

          {loadingChargeTemplates ? (
            <View style={styles.centered}>
              <ActivityIndicator color={colors.gold400} />
            </View>
          ) : errorChargeTemplates ? (
            <Text style={styles.errorText}>No se pudo cargar el catálogo: {errorChargeTemplates}</Text>
          ) : !chargeTemplates || chargeTemplates.length === 0 ? (
            <Text style={styles.emptyListText}>Todavía no hay cobros fijos.</Text>
          ) : (
            <View style={styles.list}>
              {chargeTemplates.map((item: ChargeTemplate) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('EditChargeTemplate', { template: item })}
                >
                  <Panel style={styles.card}>
                    <Text style={styles.cardTitle} numberOfLines={1}>
                      {item.name}
                    </Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {chargeTemplatePropertyNameById.get(item.propertyId) ?? '—'}
                    </Text>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {item.serviceTypeId ? chargeTemplateServiceTypeNameById.get(item.serviceTypeId) ?? '—' : '—'}
                    </Text>
                    <View style={styles.serviceRowActions}>
                      <Text style={styles.cardMeta}>{currency(item.amount)}</Text>
                      <TouchableOpacity
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        onPress={() => setDeletingChargeTemplate(item)}
                      >
                        <Trash2 size={15} color={colors.rose} />
                      </TouchableOpacity>
                    </View>
                  </Panel>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      ) : tab === 'empleados' ? (
        <EmpleadosScreen />
      ) : (
        <ProveedoresScreen />
      )}

      <ConfirmModal
        open={deletingServiceType !== null}
        onClose={() => setDeletingServiceType(null)}
        title="Eliminar tipo de servicio"
        message={`¿Eliminar "${deletingServiceType?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={async () => {
          if (!deletingServiceType) return
          await deleteServiceType(deletingServiceType.id)
          refetchServiceTypes()
        }}
      />

      <ConfirmModal
        open={deletingExpenseTemplate !== null}
        onClose={() => setDeletingExpenseTemplate(null)}
        title="Eliminar gasto fijo"
        message={`¿Eliminar "${deletingExpenseTemplate?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={async () => {
          if (!deletingExpenseTemplate) return
          await deleteExpenseTemplate(deletingExpenseTemplate.id)
          refetchExpenseTemplates()
        }}
      />

      <ConfirmModal
        open={deletingChargeTemplate !== null}
        onClose={() => setDeletingChargeTemplate(null)}
        title="Eliminar cobro fijo"
        message={`¿Eliminar "${deletingChargeTemplate?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={async () => {
          if (!deletingChargeTemplate) return
          await deleteChargeTemplate(deletingChargeTemplate.id)
          refetchChargeTemplates()
        }}
      />
    </View>
  )
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  addButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tabActive: {
    backgroundColor: colors.gold500,
    borderColor: colors.gold500,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.ink300,
  },
  tabTextActive: {
    color: colors.brand900,
  },
  scroll: {
    paddingBottom: 40,
  },
  sectionTitle: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 10,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: colors.ink500,
  },
  centered: {
    paddingTop: 24,
    alignItems: 'center',
  },
  errorText: {
    marginHorizontal: 20,
    fontSize: 13,
    color: colors.rose,
  },
  emptyListText: {
    marginHorizontal: 20,
    fontSize: 13,
    color: colors.ink500,
  },
  list: {
    paddingHorizontal: 20,
    gap: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  cardTitle: {
    flex: 1,
    fontSize: 13,
    color: colors.ink200,
  },
  serviceRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.ink400,
  },
})
