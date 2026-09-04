import React from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { colors } from '../theme/colors'

export const MockBanner = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚗</Text>
      <Text style={styles.text}>Vista con datos de ejemplo — todavía no conectada a Supabase.</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(207,145,34,0.3)',
    backgroundColor: 'rgba(207,145,34,0.1)',
  },
  icon: {
    color: colors.gold300,
    marginRight: 8,
    fontSize: 14,
  },
  text: {
    flex: 1,
    color: colors.gold300,
    fontSize: 12,
  },
})
