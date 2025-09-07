import React, { useEffect, useRef } from 'react'
import { View, Animated, StyleSheet } from 'react-native'
import { Spacing, BorderRadius } from '../constants/Design'
import Colors from '../constants/Colors'

interface SkeletonProps {
  width?: number | string
  height?: number
  borderRadius?: number
  style?: any
}

export function SkeletonLine({ width = '100%', height = 16, borderRadius = 4, style }: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    )
    shimmer.start()
    return () => shimmer.stop()
  }, [])

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  })

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  )
}

export function TaskCardSkeleton() {
  return (
    <View style={styles.cardSkeleton}>
      <View style={styles.headerSkeleton}>
        <SkeletonLine width="70%" height={20} borderRadius={6} />
        <SkeletonLine width={60} height={16} borderRadius={4} />
      </View>
      
      <SkeletonLine width="100%" height={16} borderRadius={4} style={{ marginBottom: Spacing.sm }} />
      <SkeletonLine width="85%" height={16} borderRadius={4} style={{ marginBottom: Spacing.md }} />
      
      <View style={styles.detailsSkeleton}>
        <SkeletonLine width={80} height={14} borderRadius={4} />
        <SkeletonLine width={100} height={14} borderRadius={4} />
        <SkeletonLine width={60} height={14} borderRadius={4} />
      </View>
      
      <View style={styles.footerSkeleton}>
        <SkeletonLine width={120} height={14} borderRadius={4} />
        <SkeletonLine width={80} height={32} borderRadius={16} />
      </View>
    </View>
  )
}

export function TaskListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <TaskCardSkeleton key={index} />
      ))}
    </>
  )
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.neutral[200],
  },
  cardSkeleton: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  detailsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  footerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
})
