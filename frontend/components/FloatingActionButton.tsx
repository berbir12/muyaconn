import React, { useRef } from 'react'
import { TouchableOpacity, Animated, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Shadows, Animation } from '../constants/Design'

interface FloatingActionButtonProps {
  onPress?: () => void
  icon?: keyof typeof Ionicons.glyphMap
  size?: number
  color?: string
  backgroundColor?: string
}

export default function FloatingActionButton({
  onPress,
  icon = 'add',
  size = 24,
  color = Colors.text.inverse,
  backgroundColor = Colors.primary[500],
}: FloatingActionButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current
  const rotateAnim = useRef(new Animated.Value(0)).current

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.9,
        duration: Animation.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: Animation.duration.normal,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        duration: Animation.duration.fast,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 0,
        duration: Animation.duration.normal,
        useNativeDriver: true,
      }),
    ]).start()
  }

  const handlePress = () => {
    if (onPress) {
      onPress()
    } else {
      router.push('/post-task')
    }
  }

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  })

  return (
    <TouchableOpacity
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.button,
          {
            backgroundColor,
            transform: [
              { scale: scaleAnim },
              { rotate: rotation },
            ],
          },
        ]}
      >
        <Ionicons name={icon} size={size} color={color} />
      </Animated.View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 1000,
  },
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
})
