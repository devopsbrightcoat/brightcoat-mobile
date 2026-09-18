import React, { useEffect, useMemo, useRef } from 'react'
import type { NativeScrollEvent, NativeSyntheticEvent, ViewStyle } from 'react-native'
import { Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { colors } from '../../theme/colors'

type Option<T extends string> = {
  value: T
  label: string
}

type FilterCarouselProps<T extends string> = {
  label: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  itemWidth?: number
  style?: ViewStyle
}

const ITEM_GAP = 14
const screenWidth = Dimensions.get('window').width

export function FilterCarousel<T extends string>({
  label,
  options,
  value,
  onChange,
  itemWidth = 176,
  style,
}: FilterCarouselProps<T>) {
  const slotWidth = itemWidth + ITEM_GAP
  const listPadding = Math.max(0, (screenWidth - slotWidth) / 2)
  const listRef = useRef<FlatList<Option<T>>>(null)

  const selectedIndex = useMemo(() => options.findIndex((o) => o.value === value), [options, value])

  useEffect(() => {
    if (selectedIndex < 0) return
    listRef.current?.scrollToOffset({ offset: selectedIndex * slotWidth, animated: true })
  }, [selectedIndex, slotWidth])

  const handleSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / slotWidth)
    const clamped = Math.max(0, Math.min(options.length - 1, index))
    const option = options[clamped]
    if (option && option.value !== value) {
      onChange(option.value)
    }
  }

  return (
    <View style={style}>
      <Text style={styles.label}>{label}</Text>
      <FlatList
        ref={listRef}
        data={options}
        keyExtractor={(option) => option.value}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={slotWidth}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={{ paddingHorizontal: listPadding }}
        getItemLayout={(_, index) => ({ length: slotWidth, offset: slotWidth * index, index })}
        onMomentumScrollEnd={handleSettle}
        renderItem={({ item: option }) => {
          const selected = option.value === value
          return (
            <View style={[styles.slot, { width: slotWidth }]}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => onChange(option.value)}
                style={[styles.chip, { width: itemWidth }, selected && styles.chipSelected]}
              >
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{option.label}</Text>
              </TouchableOpacity>
            </View>
          )
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  label: {
    marginHorizontal: 20,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink200,
  },
  slot: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  chipSelected: {
    borderColor: colors.gold500,
    backgroundColor: colors.gold500,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.ink300,
    textAlign: 'center',
  },
  chipTextSelected: {
    color: colors.brand900,
    fontWeight: '700',
  },
})
