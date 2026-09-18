import { useEffect, useState } from 'react'
import { fetchNotifications } from './api'

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
