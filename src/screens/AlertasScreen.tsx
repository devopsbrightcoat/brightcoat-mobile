import React, { useCallback, useEffect, useState } from 'react'
import { DrawerActions, useFocusEffect, useNavigation } from '@react-navigation/native'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { ScreenHeader } from '../components/common/ScreenHeader'
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from '../lib/api'
import { useSupabaseQuery } from '../lib/useSupabaseQuery'
import { colors } from '../theme/colors'
import type { AppNotification } from '../types'

const timeAgo = (iso: string): string => {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours} h`
  return `hace ${Math.floor(hours / 24)} d`
}

// Pantalla dedicada a la lista de alertas — equivalente móvil del dropdown
// de la campanita en ops-web (NotificationBell.tsx). Se abre desde el
// drawer y también al tocar una notificación push (ver
// src/lib/pushNotifications.ts).
export const AlertasScreen = () => {
  const navigation = useNavigation()
  const [refreshKey, setRefreshKey] = useState(0)
  const [items, setItems] = useState<AppNotification[] | null>(null)
  const { data, loading, error, refreshing, refetch } = useSupabaseQuery(fetchNotifications, [refreshKey])

  useFocusEffect(
    useCallback(() => {
      setRefreshKey((k) => k + 1)
    }, []),
  )

  useEffect(() => {
    if (data) setItems(data)
  }, [data])

  const list = items ?? data ?? []
  // Todas las alertas mostradas acá están, por definición, sin leer — leer
  // una la borra (ver api.ts), así que nunca se acumulan.
  const unreadCount = list.length

  const handlePress = (n: AppNotification) => {
    setItems((list ?? []).filter((x) => x.id !== n.id))
    markNotificationRead(n.id).catch(() => setRefreshKey((k) => k + 1))
  }

  const handleMarkAll = () => {
    if (list.length === 0) return
    setItems([])
    markAllNotificationsRead().catch(() => setRefreshKey((k) => k + 1))
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Alertas"
        onMenuPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        right={
          unreadCount > 0 ? (
            <TouchableOpacity onPress={handleMarkAll} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={styles.markAllText}>Borrar todas</Text>
            </TouchableOpacity>
          ) : null
        }
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refetch}
            tintColor={colors.gold400}
            colors={[colors.gold400]}
          />
        }
      >
        {loading && !items ? (
          <ActivityIndicator style={styles.centered} color={colors.gold400} />
        ) : error ? (
          <Text style={styles.errorText}>No se pudieron cargar las alertas: {error}</Text>
        ) : list.length === 0 ? (
          <Text style={styles.emptyText}>No tienes alertas.</Text>
        ) : (
          <View style={styles.list}>
            {list.map((n) => (
              <TouchableOpacity key={n.id} activeOpacity={0.75} onPress={() => handlePress(n)}>
                <View style={[styles.card, !n.readAt && styles.cardUnread]}>
                  <View style={styles.cardRow}>
                    {!n.readAt ? <View style={styles.dot} /> : null}
                    <View style={styles.cardTextGroup}>
                      <Text style={[styles.cardMessage, !n.readAt && styles.cardMessageUnread]}>{n.message}</Text>
                      <Text style={styles.cardTime}>{timeAgo(n.createdAt)}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  markAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.gold400,
  },
  scroll: {
    paddingBottom: 40,
  },
  centered: {
    paddingTop: 24,
  },
  errorText: {
    marginHorizontal: 20,
    marginTop: 20,
    fontSize: 13,
    color: colors.rose,
  },
  emptyText: {
    marginHorizontal: 20,
    marginTop: 20,
    fontSize: 13,
    color: colors.ink500,
  },
  list: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 10,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    padding: 14,
  },
  cardUnread: {
    borderColor: colors.gold500,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dot: {
    marginTop: 5,
    height: 7,
    width: 7,
    borderRadius: 4,
    backgroundColor: colors.gold500,
  },
  cardTextGroup: {
    flex: 1,
    gap: 4,
  },
  cardMessage: {
    fontSize: 13,
    color: colors.ink300,
  },
  cardMessageUnread: {
    color: colors.white,
    fontWeight: '600',
  },
  cardTime: {
    fontSize: 11,
    color: colors.ink500,
  },
})
