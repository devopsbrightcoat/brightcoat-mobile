import React, { useCallback, useMemo, useState } from 'react'
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native'
import type { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Eye, EyeOff, Plus, Search, Trash2 } from 'lucide-react-native'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { ConfirmModal } from '../components/common/ConfirmModal'
import { Panel } from '../components/common/Panel'
import { ScreenHeader } from '../components/common/ScreenHeader'
import { StatusPill } from '../components/common/StatusPill'
import { useAuth } from '../auth/AuthProvider'
import { useReferenceData } from '../contexts/ReferenceDataContext'
import { deleteEmployee, updateEmployeeHidden } from '../lib/api'
import { getErrorMessage } from '../lib/errors'
import type { RootStackParamList } from '../navigation/RootNavigator'
import { useTheme } from '../theme/ThemeContext'
import type { ThemeColors } from '../theme/colors'
import type { Employee } from '../types'

type Nav = NativeStackNavigationProp<RootStackParamList>

export const EmpleadosScreen = () => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
  const navigation = useNavigation<Nav>()
  const { profile } = useAuth()
  const canManageHidden = profile?.role === 'owner' || profile?.role === 'admin'
  const [searchText, setSearchText] = useState('')
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null)
  const [showHidden, setShowHidden] = useState(false)
  const [hidingId, setHidingId] = useState<string | null>(null)
  const [hideError, setHideError] = useState<string | null>(null)

  const {
    employees,
    loadingEmployees: loading,
    errorEmployees: error,
    refreshingEmployees: refreshing,
    refetchEmployees: refetch,
  } = useReferenceData()

  useFocusEffect(
    useCallback(() => {
      refetch()
    }, [refetch]),
  )

  // Solo owner/admin puede ver y alternar la vista de ocultos — el resto
  // siempre ve la lista normal (sin empleados ocultos).
  const scoped = useMemo(() => {
    const base = employees ?? []
    if (canManageHidden && showHidden) return base.filter((e) => e.hidden)
    return base.filter((e) => !e.hidden)
  }, [employees, canManageHidden, showHidden])

  const filtered = useMemo(() => {
    const q = searchText.trim().toLowerCase()
    if (!q) return scoped
    return scoped.filter((e) => e.name.toLowerCase().includes(q))
  }, [scoped, searchText])

  const handleToggleHidden = async (employee: Employee) => {
    setHidingId(employee.id)
    setHideError(null)
    try {
      await updateEmployeeHidden(employee.id, !employee.hidden)
      refetch()
    } catch (err) {
      setHideError(getErrorMessage(err, 'No se pudo actualizar el empleado.'))
    } finally {
      setHidingId(null)
    }
  }

  const renderItem = ({ item }: { item: Employee }) => (
    <TouchableOpacity activeOpacity={0.75} onPress={() => navigation.navigate('EditEmployee', { employee: item })}>
      <Panel style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderText}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.cardSubtitle} numberOfLines={1}>
              {item.role}
            </Text>
          </View>
          <View style={styles.headerActions}>
            <StatusPill status={item.status} />
            {canManageHidden && (
              <TouchableOpacity
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                disabled={hidingId === item.id}
                onPress={() => handleToggleHidden(item)}
              >
                {item.hidden ? (
                  <Eye size={15} color={colors.ink300} />
                ) : (
                  <EyeOff size={15} color={colors.ink300} />
                )}
              </TouchableOpacity>
            )}
            <TouchableOpacity
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              onPress={() => setDeletingEmployee(item)}
            >
              <Trash2 size={15} color={colors.rose} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {item.contactNumber || 'Sin número de contacto'}
          </Text>
          <Text style={styles.cardMeta} numberOfLines={1}>
            {item.address || 'Sin dirección'}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.w2Row}>
            <Text style={styles.w2Label}>W2</Text>
            <StatusPill status={item.w2Status} />
          </View>
        </View>
      </Panel>
    </TouchableOpacity>
  )

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Empleados"
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        right={
          <TouchableOpacity
            onPress={() => navigation.navigate('AddEmployee')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.addButton}
          >
            <Plus size={22} color={colors.gold500} />
          </TouchableOpacity>
        }
      />
      <View style={styles.searchRow}>
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

        {canManageHidden && (
          <TouchableOpacity
            style={[styles.toggleButton, showHidden && styles.toggleButtonActive]}
            activeOpacity={0.7}
            onPress={() => setShowHidden((prev) => !prev)}
          >
            {showHidden ? (
              <Eye size={14} color={colors.brand900} />
            ) : (
              <EyeOff size={14} color={colors.ink300} />
            )}
            <Text style={[styles.toggleButtonText, showHidden && styles.toggleButtonTextActive]}>Ocultos</Text>
          </TouchableOpacity>
        )}
      </View>

      {hideError ? <Text style={styles.errorText}>{hideError}</Text> : null}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold400} />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>No se pudieron cargar los empleados: {error}</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={colors.gold400} colors={[colors.gold400]} />
          }
          ListHeaderComponent={
            <Text style={styles.count}>
              {showHidden ? `${scoped.length} empleados ocultos` : `${scoped.length} empleados registrados`}
            </Text>
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {searchText
                ? `Ningún empleado coincide con "${searchText}".`
                : showHidden
                  ? 'No hay empleados ocultos.'
                  : 'Todavía no hay empleados registrados.'}
            </Text>
          }
        />
      )}

      <ConfirmModal
        open={deletingEmployee !== null}
        onClose={() => setDeletingEmployee(null)}
        title="Eliminar empleado"
        message={`¿Eliminar a "${deletingEmployee?.name}"? Esta acción no se puede deshacer.`}
        onConfirm={async () => {
          if (!deletingEmployee) return
          await deleteEmployee(deletingEmployee.id)
          refetch()
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 14,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.tint10,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  toggleButtonActive: {
    borderColor: colors.gold500,
    backgroundColor: colors.gold500,
  },
  toggleButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.ink300,
  },
  toggleButtonTextActive: {
    color: colors.brand900,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: colors.ink400,
  },
  cardBody: {
    marginTop: 10,
    gap: 2,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.ink400,
  },
  cardFooter: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: colors.tint05,
    paddingTop: 8,
  },
  w2Row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  w2Label: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.ink500,
  },
  emptyText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 13,
    color: colors.ink500,
  },
})
