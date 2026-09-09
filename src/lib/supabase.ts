import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppState } from 'react-native'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from './config'

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// Pausa el refresh automático del token cuando la app pasa a segundo plano —
// recomendación oficial de Supabase para React Native (si no, el timer de
// refresh sigue corriendo con la app cerrada y puede fallar).
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh()
  } else {
    supabase.auth.stopAutoRefresh()
  }
})

// El login de la app es por username, pero Supabase Auth exige un
// identificador tipo correo por debajo. Mismo patrón que ops-web: cada
// cuenta se crea con un correo sintético que el usuario nunca ve.
export const usernameToSyntheticEmail = (username: string) =>
  `${username.trim().toLowerCase()}@users.brightcoat.local`
