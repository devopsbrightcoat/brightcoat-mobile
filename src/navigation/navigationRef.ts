import { createNavigationContainerRef } from '@react-navigation/native'
import type { RootStackParamList } from './RootNavigator'

// Ref global de navegación — permite navegar desde fuera de un componente
// React (ej. el handler de una notificación push tocada con la app en
// segundo plano) sin pasar por props/context. Ver src/lib/pushNotifications.ts.
export const navigationRef = createNavigationContainerRef<RootStackParamList>()
