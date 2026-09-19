import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { colors as darkColors, lightColors } from './colors'
import type { ThemeColors, ThemeScheme } from './colors'

export type ThemePreference = 'system' | 'light' | 'dark'

const STORAGE_KEY = 'brightcoat-ops-theme'

type ThemeContextValue = {
  colors: ThemeColors
  scheme: ThemeScheme
  preference: ThemePreference
  setPreference: (preference: ThemePreference) => void
  cyclePreference: () => void
}

const ORDER: ThemePreference[] = ['system', 'light', 'dark']

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const ThemeProvider = ({ children }: PropsWithChildren<unknown>) => {
  const systemScheme = useColorScheme()
  // Arranca en 'system' — no hay parpadeo porque useColorScheme ya trae el
  // valor real del sistema desde el primer render. Solo una preferencia
  // manual guardada (light/dark) tarda el instante de leer AsyncStorage en
  // aplicarse.
  const [preference, setPreferenceState] = useState<ThemePreference>('system')

  useEffect(() => {
    let cancelled = false
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!cancelled && (stored === 'light' || stored === 'dark' || stored === 'system')) {
          setPreferenceState(stored)
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {})
  }, [])

  const cyclePreference = useCallback(() => {
    setPreferenceState((current) => {
      const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length]
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {})
      return next
    })
  }, [])

  const scheme: ThemeScheme = preference === 'system' ? (systemScheme === 'light' ? 'light' : 'dark') : preference

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: scheme === 'light' ? lightColors : darkColors,
      scheme,
      preference,
      setPreference,
      cyclePreference,
    }),
    [scheme, preference, setPreference, cyclePreference],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme debe usarse dentro de <ThemeProvider>')
  return ctx
}

// Atajo para el caso más común: componentes que solo necesitan la paleta
// activa (no el estado del toggle en sí).
export const useThemeColors = (): ThemeColors => useTheme().colors
