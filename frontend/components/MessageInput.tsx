import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography, Shadows } from '../constants/Design'

interface MessageInputProps {
  onSendMessage: (message: string) => void
  placeholder?: string
  disabled?: boolean
  loading?: boolean
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  placeholder = "Type a message...",
  disabled = false,
  loading = false,
}) => {
  const [message, setMessage] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const animatedBorderColor = new Animated.Value(0)
  const animatedSendButton = new Animated.Value(0)

  React.useEffect(() => {
    Animated.timing(animatedBorderColor, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start()
  }, [isFocused])

  React.useEffect(() => {
    Animated.timing(animatedSendButton, {
      toValue: message.trim().length > 0 ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start()
  }, [message])

  const handleSendMessage = () => {
    const trimmedMessage = message.trim()
    if (trimmedMessage && !loading) {
      onSendMessage(trimmedMessage)
      setMessage('')
    }
  }

  const borderColor = animatedBorderColor.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border.light, Colors.primary[500]],
  })

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <View style={styles.container}>
        <View style={styles.inputSection}>
          {/* Input Container */}
          <Animated.View style={[styles.inputContainer, { borderColor }]}>
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder={placeholder}
              placeholderTextColor={Colors.text.tertiary}
              multiline
              maxLength={1000}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              editable={!disabled && !loading}
              textAlignVertical="center"
            />

            {/* Attachment Button */}
            <TouchableOpacity
              style={styles.attachButton}
              onPress={() => {
                // TODO: Implement attachment functionality
                console.log('Attachment pressed')
              }}
            >
              <Ionicons name="attach" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          </Animated.View>

          {/* Send Button */}
          <Animated.View
            style={[
              styles.sendButtonContainer,
              {
                transform: [{ scale: animatedSendButton }],
                opacity: animatedSendButton,
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: message.trim().length > 0
                    ? Colors.primary[500]
                    : Colors.neutral[300],
                },
              ]}
              onPress={handleSendMessage}
              disabled={!message.trim() || loading || disabled}
              activeOpacity={0.8}
            >
              {loading ? (
                <Animated.View style={styles.loadingIndicator}>
                  <Text style={styles.loadingText}>•••</Text>
                </Animated.View>
              ) : (
                <Ionicons
                  name="send"
                  size={18}
                  color={message.trim().length > 0 ? Colors.text.inverse : Colors.text.secondary}
                />
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Character Counter */}
        {message.length > 800 && (
          <Text style={styles.characterCounter}>
            {message.length}/1000
          </Text>
        )}

        {/* Quick Reply Suggestions */}
        {!message && !isFocused && (
          <View style={styles.quickReplies}>
            {['👍', 'Thanks!', 'On my way', 'Almost done'].map((reply, index) => (
              <TouchableOpacity
                key={index}
                style={styles.quickReplyButton}
                onPress={() => onSendMessage(reply)}
              >
                <Text style={styles.quickReplyText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  keyboardView: {
    backgroundColor: Colors.background.primary,
  },
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  inputSection: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.neutral[50],
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    minHeight: 44,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    lineHeight: Typography.lineHeight.md,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.regular,
    maxHeight: 100,
  },
  attachButton: {
    padding: Spacing.sm,
    marginLeft: Spacing.sm,
  },
  sendButtonContainer: {
    width: 44,
    height: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  loadingIndicator: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  characterCounter: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    textAlign: 'right',
    marginTop: Spacing.xs,
  },
  quickReplies: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  quickReplyButton: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[200],
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  quickReplyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[600],
    fontWeight: Typography.fontWeight.medium,
  },
})

export default MessageInput