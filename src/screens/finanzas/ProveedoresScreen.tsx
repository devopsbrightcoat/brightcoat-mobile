import React, { useCallback, useState } from 'react'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Trash2 } from 'lucide-react-native'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ConfirmModal } from '../../components/common/ConfirmModal'
import { Panel } from '../../components/common/Panel'
import { deleteVendor, fetchVendors } from '../../lib/api'
import { useSupabaseQuery } from '../../lib/useSupabaseQuery'
import type { RootStackParamList } from '../../navigation/RootNavigator'
import { colors } from '../../theme/colors'
import type { Vendor } from '../../types'

type Nav = NativeStackNavigationProp<RootStackParamList>

// Tab "Proveedores" de FinanzasScreen — catálogo de proveedores (de dónde
// sale cada compra registrada en Gastos, ver AddExpenseScreen/EditExpenseScreen).
// A diferencia de "Gastos fijos" (ConfiguracionScreen, solo precarga el
// formulario, sin vínculo), acá sí hay una relación real: expenses.vendor_id.
// Mismo criterio de lista + trash-icon + ConfirmModal que la pestaña
// "Gastos fijos", pero como tab propio de Finanzas (sin ScreenHeader propio
// — el botón "+" vive en el header de FinanzasScreen, condicionado al tab
// activo) en vez de vivir en Configuración, porque este catálogo se usa al
// registrar gastos, no es una preferencia general de la empresa.
export const ProveedoresScreen = () => {
  const navigation = useNavigation<Nav>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [deletingVendor, setDeletingVendor] = useState<Vendor | null>(null)
  const { data: vendors, loading, error, refreshing, refetch } = useSupabaseQuery(fetchVendors, [refreshKey])

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1)
    }, []),
  )

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={colors.gold400} colors={[colors.gold400]} />
        }
      >
        <Text style={styles.sectionTitle}>Catálogo de proveedores</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.gold400} />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>No se pudo cargar el catálogo: {error}</Text>
        ) : !vendors || vendors.length === 0 ? (
          <Text style={styles.emptyListText}>Todavía no hay proveedores.</Text>
        ) : (
          <View style={styles.list}>
            {vendors.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('EditVendor', { vendor: item })}
              >
                <Panel style={styles.card}>
                  <Text style={styles.cardTitle} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <View style={styles.cardRowActions}>
                    <Text style={styles.cardMeta} numberOfLines={1}>
                      {item.notes || '—'}
                    </Text>
                    <TouchableOpacity
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      onPress={() => setDeletingVendor(item)}
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

      <ConfirmModal
        open={deletingVendor !== null}
        onClose={() => setDeletingVendor(null)}
        title="Eliminar proveedor"
        message={`¿Eliminar "${deletingVendor?.name}"? Los gastos que ya lo tenían asignado se quedan sin proveedor. Esta acción no se puede deshacer.`}
        onConfirm={async () => {
          if (!deletingVendor) return
          await deleteVendor(deletingVendor.id)
          setRefreshKey((k) => k + 1)
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
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
  cardRowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    maxWidth: '55%',
  },
  cardMeta: {
    flexShrink: 1,
    fontSize: 12,
    color: colors.ink400,
  },
})
