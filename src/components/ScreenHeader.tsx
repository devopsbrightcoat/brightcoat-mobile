import React from 'react'
import { Menu } from 'lucide-react-native'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'

type ScreenHeaderProps = {
  title: string
  subtitle?: string
  showLogo?: boolean
  // Si se pasa, muestra el botón de hamburguesa a la izquierda que abre el
  // sidebar — normalmente navigation.dispatch(DrawerActions.openDrawer()).
  onMenuPress?: () => void
  // Slot a la derecha del header para una acción propia de la pantalla
  // (por ejemplo el "+" de agregar en Propiedades).
  right?: React.ReactNode
}

export const ScreenHeader = ({ title, subtitle, showLogo = false, onMenuPress, right }: ScreenHeaderProps) => {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        {onMenuPress ? (
          <TouchableOpacity
            onPress={onMenuPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.menuButton}
          >
            <Menu size={22} color={colors.white} />
          </TouchableOpacity>
        ) : null}
        {showLogo ? (
          <Image source={require('../assets/brightcoat-icon.png')} style={styles.logo} resizeMode="contain" />
        ) : null}
        <View style={styles.textGroup}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.surfaceAlt,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  menuButton: {
    paddingRight: 2,
  },
  logo: {
    height: 28,
    width: 28,
  },
  textGroup: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.white,
  },
  subtitle: {
    marginTop: 2,
    fontSize: 13,
    color: colors.ink400,
  },
})
