declare module 'react-native-config' {
  export interface NativeConfig {
    SUPABASE_URL?: string
    SUPABASE_PUBLISHABLE_KEY?: string
  }

  export const Config: NativeConfig
  export default Config
}
