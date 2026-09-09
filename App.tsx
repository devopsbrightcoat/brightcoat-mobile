/**
 * BrightCoat Ops — mobile app
 * @format
 */

import React from 'react'
import { StatusBar } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './src/auth/AuthProvider'
import { RootNavigator } from './src/navigation/RootNavigator'

const App = () => {
  return (
    // El drawer/sidebar de navegación (react-native-gesture-handler) necesita
    // que toda la app quede envuelta en esto para que los gestos funcionen.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <AuthProvider>
          <RootNavigator />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

export default App
