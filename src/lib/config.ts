import Config from 'react-native-config'

const supabaseUrl = Config.SUPABASE_URL
const supabasePublishableKey = Config.SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Faltan SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY. Copia .env.example a .env en la raíz de ops-mobile y pon los valores reales del proyecto (Dashboard -> Settings -> API), después reconstruí la app nativa.',
  )
}

export const SUPABASE_URL = supabaseUrl
export const SUPABASE_PUBLISHABLE_KEY = supabasePublishableKey
