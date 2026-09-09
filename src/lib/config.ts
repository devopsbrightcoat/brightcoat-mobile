// ---------------------------------------------------------------------------
// Mismas credenciales públicas del proyecto de Supabase que usa ops-web
// (Dashboard -> Settings -> API, o ops-web/.env.local). La publishable/anon
// key es segura para el cliente — el acceso real lo controla RLS, no este
// valor. No hay tooling de variables de entorno en este proyecto todavía
// (no usamos react-native-config para no meter otra dependencia nativa de
// entrada) — si más adelante hace falta separar dev/prod, se agrega ahí.
// ---------------------------------------------------------------------------

export const SUPABASE_URL = 'https://spubixsplkekfhqcygbx.supabase.co'
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Q_261BtDUTuPS1Nnhsqj0A_AtPh0QTL'
