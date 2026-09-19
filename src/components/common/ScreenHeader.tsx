import React, { useMemo } from 'react'
import { Menu } from 'lucide-react-native'
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useTheme } from '../../theme/ThemeContext'
import type { ThemeColors } from '../../theme/colors'

type ScreenHeaderProps = {
  title: string
  subtitle?: string
  showLogo?: boolean
  onMenuPress?: () => void
  right?: React.ReactNode
}

export const ScreenHeader = ({ title, subtitle, showLogo = false, onMenuPress, right }: ScreenHeaderProps) => {
  const { colors } = useTheme()
  const styles = useMemo(() => createStyles(colors), [colors])
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
          <Image source={require('../../assets/brightcoat-icon.png')} style={styles.logo} resizeMode="contain" />
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

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  safeArea: {
    backgroundColor: colors.surfaceAlt,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.tint10,
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
