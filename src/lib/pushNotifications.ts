
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

const goToAlertas = () => {
  if (navigationRef.isReady()) {
    navigationRef.navigate('Tabs', { screen: 'Alertas' })
  }
}

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

    const unsubscribeOpened = onNotificationOpenedApp(messaging, goToAlertas)

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
