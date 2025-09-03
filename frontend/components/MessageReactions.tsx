import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface Reaction {
  id: string
  emoji: string
  count: number
  users: string[]
}

interface MessageReactionsProps {
  messageId: string
  reactions: Reaction[]
  onAddReaction: (messageId: string, emoji: string) => void
  onRemoveReaction: (messageId: string, emoji: string) => void
  currentUserId: string
}

const AVAILABLE_REACTIONS = [
  { emoji: '👍', name: 'thumbs-up' },
  { emoji: '👎', name: 'thumbs-down' },
  { emoji: '❤️', name: 'heart' },
  { emoji: '😂', name: 'laughing' },
  { emoji: '😮', name: 'surprised' },
  { emoji: '😢', name: 'sad' },
  { emoji: '😡', name: 'angry' },
  { emoji: '🔥', name: 'fire' },
]

export default function MessageReactions({
  messageId,
  reactions,
  onAddReaction,
  onRemoveReaction,
  currentUserId,
}: MessageReactionsProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false)

  const handleReactionPress = (emoji: string) => {
    const existingReaction = reactions.find(r => r.emoji === emoji)
    
    if (existingReaction) {
      if (existingReaction.users.includes(currentUserId)) {
        // User already reacted, remove their reaction
        onRemoveReaction(messageId, emoji)
      } else {
        // User hasn't reacted, add their reaction
        onAddReaction(messageId, emoji)
      }
    } else {
      // New reaction
      onAddReaction(messageId, emoji)
    }
    
    setShowReactionPicker(false)
  }

  const renderReaction = (reaction: Reaction) => {
    const hasUserReacted = reaction.users.includes(currentUserId)
    
    return (
      <TouchableOpacity
        key={reaction.emoji}
        style={[
          styles.reactionButton,
          hasUserReacted && styles.reactionButtonActive
        ]}
        onPress={() => handleReactionPress(reaction.emoji)}
      >
        <Text style={styles.reactionEmoji}>{reaction.emoji}</Text>
        <Text style={[
          styles.reactionCount,
          hasUserReacted && styles.reactionCountActive
        ]}>
          {reaction.count}
        </Text>
      </TouchableOpacity>
    )
  }

  const renderReactionPicker = () => (
    <Modal
      visible={showReactionPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowReactionPicker(false)}
    >
      <TouchableOpacity
        style={styles.pickerOverlay}
        activeOpacity={1}
        onPress={() => setShowReactionPicker(false)}
      >
        <View style={styles.pickerContainer}>
          <Text style={styles.pickerTitle}>Add Reaction</Text>
          <View style={styles.reactionsGrid}>
            {AVAILABLE_REACTIONS.map((reaction) => (
              <TouchableOpacity
                key={reaction.emoji}
                style={styles.pickerReaction}
                onPress={() => handleReactionPress(reaction.emoji)}
              >
                <Text style={styles.pickerEmoji}>{reaction.emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  )

  if (reactions.length === 0) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.addReactionButton}
          onPress={() => setShowReactionPicker(true)}
        >
          <Ionicons name="add" size={16} color={Colors.text.tertiary} />
        </TouchableOpacity>
        {renderReactionPicker()}
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.reactionsContainer}>
        {reactions.map(renderReaction)}
        <TouchableOpacity
          style={styles.addReactionButton}
          onPress={() => setShowReactionPicker(true)}
        >
          <Ionicons name="add" size={16} color={Colors.text.tertiary} />
        </TouchableOpacity>
      </View>
      {renderReactionPicker()}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xs,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  reactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  reactionButtonActive: {
    backgroundColor: Colors.primary[100],
    borderColor: Colors.primary[300],
  },
  reactionEmoji: {
    fontSize: Typography.fontSize.sm,
    marginRight: Spacing.xs,
  },
  reactionCount: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  reactionCountActive: {
    color: Colors.primary[600],
  },
  addReactionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background.secondary,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: '80%',
    maxWidth: 300,
  },
  pickerTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  reactionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  pickerReaction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerEmoji: {
    fontSize: Typography.fontSize.lg,
  },
})
