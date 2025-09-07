import React, { useRef, useEffect } from 'react'
import { Animated, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native'
import { Animation } from '../constants/Design'

interface AnimatedCardProps {
  children: React.ReactNode
  onPress?: () => void
  style?: ViewStyle
  delay?: number
  disabled?: boolean
}

export default function AnimatedCard({ 
  children, 
  onPress, 
  style, 
  delay = 0,
  disabled = false 
}: AnimatedCardProps) {
  const scaleAnim = useRef(new Animated.Value(0.95)).current
  const opacityAnim = useRef(new Animated.Value(0)).current
  const pressAnim = useRef(new Animated.Value(1)).current

  useEffect(() => {
    // Entrance animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: Animation.duration.normal,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: Animation.duration.normal,
        delay,
        useNativeDriver: true,
      }),
    ]).start()
  }, [delay])

  const handlePressIn = () => {
    if (!disabled) {
      Animated.spring(pressAnim, {
        toValue: 0.95,
        duration: Animation.duration.fast,
        useNativeDriver: true,
      }).start()
    }
  }

  const handlePressOut = () => {
    if (!disabled) {
      Animated.spring(pressAnim, {
        toValue: 1,
        duration: Animation.duration.fast,
        useNativeDriver: true,
      }).start()
    }
  }

  const animatedStyle = {
    transform: [
      { scale: Animated.multiply(scaleAnim, pressAnim) }
    ],
    opacity: opacityAnim,
  }

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.container, animatedStyle, style]}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    )
  }

  return (
    <Animated.View style={[styles.container, animatedStyle, style]}>
      {children}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    // Base card styles will be applied via style prop
  },
})
