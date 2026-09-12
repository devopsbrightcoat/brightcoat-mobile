import { useEffect, useState } from 'react'
import { fetchNotifications } from './api'

// Mismo criterio que ops-web (NotificationBell.tsx): sin realtime, un poll
// simple alcanza para el tamaño de esta app. `enabled` en false (ej. rol
// staff, que no tiene la pestaña de Alertas) evita hacer requests inútiles.
const POLL_MS = 30000

export const useUnreadNotificationsCount = (enabled: boolean): number => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setCount(0)
      return
    }
    let active = true
    const load = () => {
      fetchNotifications()
        .then((notifications) => {
          if (active) setCount(notifications.filter((n) => !n.readAt).length)
        })
        .catch(() => {})
    }
    load()
    const interval = setInterval(load, POLL_MS)
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [enabled])

  return count
}
