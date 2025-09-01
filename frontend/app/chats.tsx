import React, { useState } from 'react'
import { View, StyleSheet, StatusBar, Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useChat } from '../hooks/useChat'
import ChatList from '../components/ChatList'
import ChatInterface from '../components/ChatInterface'
import Colors from '../constants/Colors'
import { Spacing, Typography } from '../constants/Design'

export default function Chats() {
  const { chats, currentChat, messages, sendMessage, selectChat, isConnected, error } = useChat()
  const [showChatInterface, setShowChatInterface] = useState(false)

  const handleSelectChat = (chat: any) => {
    selectChat(chat)
    setShowChatInterface(true)
  }

  const handleSendMessage = async (message: string) => {
    if (!currentChat) return
    
    await sendMessage({
      chat_id: currentChat.id,
      message,
      message_type: 'text'
    })
  }

  const handleBackToChatList = () => {
    setShowChatInterface(false)
  }

  if (showChatInterface && currentChat) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
        <ChatInterface
          chat={currentChat}
          messages={messages}
          onSendMessage={handleSendMessage}
          onBack={handleBackToChatList}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      
      {/* Connection Status */}
      {!isConnected && (
        <View style={styles.connectionStatus}>
          <Text style={styles.connectionText}>
            🔌 Connecting to chat service...
          </Text>
        </View>
      )}
      
      {/* Error Display */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
        </View>
      )}
      
      <View style={styles.content}>
        <ChatList
          chats={chats}
          onSelectChat={handleSelectChat}
          loading={false}
        />
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
  },
  connectionStatus: {
    backgroundColor: Colors.warning[100],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning[200],
  },
  connectionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.warning[800],
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
  },
  errorContainer: {
    backgroundColor: Colors.error[100],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.error[200],
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.error[800],
    textAlign: 'center',
    fontWeight: Typography.fontWeight.medium,
  },
})
