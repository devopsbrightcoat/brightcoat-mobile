import Config from 'react-native-config'

// URL y anon/publishable key salen de Settings -> API en el Dashboard de
// Supabase — mismas que usa ops-web (ops-web/.env.local, como
// VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY). Acá llegan vía
// react-native-config desde el .env de la raíz del proyecto (no se sube a
// git — ver .env.example para la plantilla).
//
// Importante: react-native-config incrusta estos valores en el binario en
// tiempo de compilación. Después de crear o editar el .env hay que
// reconstruir la app nativa (npx react-native run-android / run-ios) — un
// reload de Metro no alcanza.
const supabaseUrl = Config.SUPABASE_URL
const supabasePublishableKey = Config.SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Faltan SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env en la raíz de ops-mobile y pon los valores reales del proyecto (Dashboard -> Settings -> API), después reconstruí la app nativa.',
  )
}

export const SUPABASE_URL = supabaseUrl
export const SUPABASE_PUBLISHABLE_KEY = supabasePublishableKey
