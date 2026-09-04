import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { colors } from '../theme/colors'

type ScreenHeaderProps = {
  title: string
  subtitle?: string
  showLogo?: boolean
}

export const ScreenHeader = ({ title, subtitle, showLogo = false }: ScreenHeaderProps) => {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.container}>
        {showLogo ? (
          <Image source={require('../assets/brightcoat-icon.png')} style={styles.logo} resizeMode="contain" />
        ) : null}
        <View style={styles.textGroup}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
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
