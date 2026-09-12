// ---------------------------------------------------------------------------
// Registro de push notifications nativas (Android, vía Firebase Cloud
// Messaging) — ver ops-web/supabase/functions/send-push y
// 20260927000000_add_device_tokens.sql.
//
// Requiere que ya se haya corrido `npm install @react-native-firebase/app
// @react-native-firebase/messaging`, colocado google-services.json en
// android/app/, y reconstruido la app — sin eso este import falla. iOS
// queda sin configurar por ahora (solo Android, por decisión explícita).
//
// NOTA: @react-native-firebase/messaging v22+ (instalamos 26.x) eliminó la
// API vieja basada en `messaging()` encadenado — ahora es una API "modular"
// con funciones sueltas que reciben la instancia de Messaging como primer
// argumento (igual patrón que Firebase Web v9). Este archivo ya usa esa
// API nueva.
//
// Limitación conocida v1: con la app ABIERTA (foreground) no se muestra un
// banner nativo — solo se refresca el badge de alertas. Android/iOS ya
// muestran el banner nativo solo cuando la app está en segundo plano o
// cerrada. Si más adelante se quiere un banner también en foreground, hay
// que agregar una librería de notificaciones locales (ej. notifee).
// ---------------------------------------------------------------------------

import { useEffect } from 'react'
import { PermissionsAndroid, Platform } from 'react-native'
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  hasPermission,
  onNotificationOpenedApp,
  onTokenRefresh,
} from '@react-native-firebase/messaging'
import { deleteDeviceToken, registerDeviceToken } from './api'
import { navigationRef } from '../navigation/navigationRef'

const requestAndroidPermission = async () => {
  if (Platform.OS !== 'android' || Platform.Version < 33) return
  await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)
}

// Si el usuario toca una notificación (app en segundo plano o cerrada), lo
// llevamos directo a la pantalla de Alertas en vez de dejarlo en el
// Dashboard. `as never` porque Alertas vive en el Drawer, no en el Stack
// raíz — patrón estándar de react-navigation para navegación anidada
// desde un ref tipado con el stack de arriba.
const goToAlertas = () => {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Tabs', { screen: 'Alertas' })
  }
}

// Hook que registra (y mantiene al día) el token FCM de este dispositivo
// mientras haya sesión — se llama una sola vez, en RootNavigator. Al
// cerrar sesión (profileId pasa a undefined) borra el token para que no
// le sigan llegando alertas de esta cuenta si otro usuario entra después
// en el mismo teléfono.
export const usePushNotifications = (profileId: string | undefined) => {
  useEffect(() => {
    if (!profileId || Platform.OS !== 'android') return
    let active = true
    let currentToken: string | null = null
    const messaging = getMessaging()

    const setup = async () => {
      try {
        await requestAndroidPermission()
        const authStatus = await hasPermission(messaging)
        const enabled =
          authStatus === AuthorizationStatus.AUTHORIZED || authStatus === AuthorizationStatus.PROVISIONAL
        if (!enabled || !active) return

        const token = await getToken(messaging)
        if (!active) return
        currentToken = token
        await registerDeviceToken(profileId, token, 'android')
      } catch (err) {
        console.error('No se pudo registrar el token de notificaciones:', err)
      }
    }

    setup()

    const unsubscribeRefresh = onTokenRefresh(messaging, async (token) => {
      currentToken = token
      try {
        await registerDeviceToken(profileId, token, 'android')
      } catch (err) {
        console.error('No se pudo actualizar el token de notificaciones:', err)
      }
    })

    // App en segundo plano -> el usuario toca la notificación del sistema.
    const unsubscribeOpened = onNotificationOpenedApp(messaging, goToAlertas)

    // App cerrada del todo -> se abrió tocando una notificación.
    getInitialNotification(messaging).then((remoteMessage) => {
      if (remoteMessage) goToAlertas()
    })

    return () => {
      active = false
      unsubscribeRefresh()
      unsubscribeOpened()
      if (currentToken) deleteDeviceToken(currentToken).catch(() => {})
    }
  }, [profileId])
}
