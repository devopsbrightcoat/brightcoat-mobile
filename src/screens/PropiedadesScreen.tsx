import React, { useCallback, useMemo, useState } from 'react'
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Plus, Search, Trash2 } from 'lucide-react-native'
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { ConfirmModal } from '../components/common/ConfirmModal'
import { Panel } from '../components/common/Panel'
import { ScreenHeader } from '../components/common/ScreenHeader'
import { StatusPill } from '../components/common/StatusPill'
import { deleteProperty, fetchProperties } from '../lib/api'
import { clientTypeLabels } from '../lib/propertyOptions'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { colors } from '../theme/colors'
import type { Property } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList>

// Mismo módulo que ops-web/src/pages/Propiedades.tsx: lista + búsqueda por
// nombre, agregar y editar. La tabla ordenable de la web se vuelve una
// lista de tarjetas tocables en móvil — más natural para tocar con el dedo
// que una tabla con columnas.
export const PropiedadesScreen = () => {
  const navigation = useNavigation<Nav>()
  const [refreshKey, setRefreshKey] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [deletingProperty, setDeletingProperty] = useState<Property | null>(null)

  const { data: properties, loading, error } = useSupabaseQuery(fetchProperties, [refreshKey])

  // Al volver de Agregar/Editar propiedad, refresca la lista — mismo efecto
  // que el `onSaved={() => setRefreshKey((k) => k + 1)}` de la web, pero
  // disparado por el foco de la pantalla en vez de un callback de modal.
  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1)
    }, []),
  )

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return properties ?? []
    return (properties ?? []).filter((p) => p.name.toLowerCase().includes(q))
  }, [properties, searchText])

  const renderItem = ({ item }: { item: Property }) => (
    <TouchableOpacity activeOpacity={0.75} onPress={() => navigation.navigate('EditProperty', { property: item })}>
      <Panel style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <View style={styles.headerActions}>
            <StatusPill status={item.status} />
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setDeletingProperty(item)}
            >
              <Trash2 size={15} color={colors.rose} />
            </TouchableOpacity>
          </View>
        </View>
        {item.address ? <Text style={styles.cardSubtitle}>{item.address}</Text> : null}
        <View style={styles.cardFooter}>
          <Text style={styles.cardMeta}>{clientTypeLabels[item.clientType]}</Text>
          {item.managerContact ? <Text style={styles.cardMeta}>{item.managerContact}</Text> : null}
        </View>
      </Panel>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Propiedades"
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        right={
          <TouchableOpacity
            onPress={() => navigation.navigate('AddProperty')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.addButton}
          >
            <Plus size={22} color={colors.gold500} />
          </TouchableOpacity>
        }
      />
      <View style={styles.searchBox}>
        <Search size={16} color={colors.ink500} />
        <TextInput
          value={searchText}
          onChangeText={setSearchText}
          placeholder="Buscar por nombre…"
          placeholderTextColor={colors.ink500}
          style={styles.searchInput}
          autoCorrect={false}
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold400} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>No se pudieron cargar las propiedades: {error}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.count}>
              {properties?.length ?? 0} propiedades registradas
            </Text>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchText ? `Ninguna propiedad coincide con "${searchText}".` : 'Todavía no hay propiedades registradas.'}
            </Text>
          }
        />
      )}

      <ConfirmModal
        open={deletingProperty !== null}
        onClose={() => setDeletingProperty(null)}
        title="Eliminar propiedad"
        message={`¿Eliminar "${deletingProperty?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={async () => {
          if (!deletingProperty) return
          await deleteProperty(deletingProperty.id)
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
  addButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.white,
    padding: 0,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorText: {
    fontSize: 13,
    color: colors.rose,
    textAlign: 'center',
  },
  count: {
    marginBottom: 10,
    fontSize: 12,
    color: colors.ink500,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 32,
    gap: 10,
  },
  card: {
    padding: 14,
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  cardSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: colors.ink400,
  },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 8,
  },
  cardMeta: {
    fontSize: 11,
    color: colors.ink500,
  },
  emptyText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink500,
  },
})
