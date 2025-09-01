import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../../constants/Colors'
import { Spacing, BorderRadius, Typography, Shadows } from '../../constants/Design'

interface Message {
  id: string
  content: string
  sender_id: string
  created_at: string
  message_type: 'text' | 'image' | 'file' | 'system'
  read_at?: string
}

interface ChatBubbleProps {
  message: Message
  isCurrentUser: boolean
  isFirstInGroup?: boolean
  isLastInGroup?: boolean
  showAvatar?: boolean
}

const ChatBubble: React.FC<ChatBubbleProps> = ({
  message,
  isCurrentUser,
  isFirstInGroup = false,
  isLastInGroup = false,
  showAvatar = true,
}) => {
  const animatedOpacity = new Animated.Value(0)
  const animatedTranslateY = new Animated.Value(20)

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(animatedOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(animatedTranslateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  const getBubbleStyle = () => {
    const baseStyle = {
      maxWidth: '80%' as const,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.md,
      marginVertical: Spacing.xs,
      borderRadius: BorderRadius.lg,
    }

    if (isCurrentUser) {
      return {
        ...baseStyle,
        backgroundColor: Colors.primary[500],
        alignSelf: 'flex-end' as const,
        marginLeft: 80, // Use number instead of string
        borderBottomRightRadius: isLastInGroup ? BorderRadius.xs : BorderRadius.lg,
      }
    } else {
      return {
        ...baseStyle,
        backgroundColor: Colors.neutral[100],
        alignSelf: 'flex-start' as const,
        marginRight: 80,
        borderBottomLeftRadius: isLastInGroup ? BorderRadius.xs : BorderRadius.lg,
        ...Shadows.sm,
      }
    }
  }

  const getTextColor = () => {
    return isCurrentUser ? Colors.text.inverse : Colors.text.primary
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: animatedOpacity,
          transform: [{ translateY: animatedTranslateY }],
        },
      ]}
    >
      {/* Avatar placeholder for other user */}
      {!isCurrentUser && showAvatar && isLastInGroup && (
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={16} color={Colors.text.secondary} />
          </View>
        </View>
      )}

      {/* Message Bubble */}
      <View style={getBubbleStyle()}>
        <Text style={[styles.messageText, { color: getTextColor() }]}>
          {message.content}
        </Text>
        
        {/* Message metadata */}
        <View style={styles.metadataContainer}>
          <Text style={[styles.timestamp, { color: getTextColor(), opacity: 0.7 }]}>
            {formatTime(message.created_at)}
          </Text>
          
          {/* Read indicator for current user */}
          {isCurrentUser && (
            <View style={styles.readIndicator}>
              <Ionicons
                name={message.read_at ? "checkmark-done" : "checkmark"}
                size={14}
                color={message.read_at ? Colors.success[400] : Colors.neutral[300]}
              />
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    marginVertical: Spacing.xs,
  },
  avatarContainer: {
    marginRight: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.neutral[200],
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageText: {
    fontSize: Typography.fontSize.md,
    lineHeight: Typography.lineHeight.md,
    fontWeight: Typography.fontWeight.regular,
  },
  metadataContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  timestamp: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.regular,
  },
  readIndicator: {
    marginLeft: Spacing.sm,
  },
})

export default ChatBubble