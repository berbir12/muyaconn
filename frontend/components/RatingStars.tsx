import React from 'react'
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../constants/Colors'

interface RatingStarsProps {
  rating: number
  maxRating?: number
  size?: number
  color?: string
  emptyColor?: string
  onRatingChange?: (rating: number) => void
  interactive?: boolean
  showRating?: boolean
  style?: any
}

export default function RatingStars({
  rating,
  maxRating = 5,
  size = 20,
  color = Colors.primary[500],
  emptyColor = Colors.neutral[300],
  onRatingChange,
  interactive = false,
  showRating = false,
  style
}: RatingStarsProps) {
  const handleStarPress = (starRating: number) => {
    if (interactive && onRatingChange) {
      onRatingChange(starRating)
    }
  }

  const renderStar = (index: number) => {
    const starRating = index + 1
    const isFilled = starRating <= rating
    const isHalfFilled = starRating === Math.ceil(rating) && rating % 1 !== 0

    return (
      <TouchableOpacity
        key={index}
        onPress={() => handleStarPress(starRating)}
        disabled={!interactive}
        style={styles.starContainer}
        activeOpacity={interactive ? 0.7 : 1}
      >
        <Ionicons
          name={isFilled ? 'star' : 'star-outline'}
          size={size}
          color={isFilled ? color : emptyColor}
        />
        {isHalfFilled && (
          <View style={[styles.halfStar, { width: size / 2 }]}>
            <Ionicons
              name="star"
              size={size}
              color={color}
            />
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, style]}>
      <View style={styles.starsContainer}>
        {Array.from({ length: maxRating }, (_, index) => renderStar(index))}
      </View>
      {showRating && (
        <View style={styles.ratingContainer}>
          <Text style={[styles.ratingText, { fontSize: size * 0.7 }]}>
            {rating.toFixed(1)}
          </Text>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starContainer: {
    position: 'relative',
    marginHorizontal: 1,
  },
  halfStar: {
    position: 'absolute',
    top: 0,
    left: 0,
    overflow: 'hidden',
  },
  ratingContainer: {
    marginLeft: 8,
  },
  ratingText: {
    fontWeight: '600',
    color: Colors.text.primary,
  },
})
