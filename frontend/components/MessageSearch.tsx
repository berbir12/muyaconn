import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ChatMessage } from '../types/chat'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface MessageSearchProps {
  messages: ChatMessage[]
  onMessageSelect: (message: ChatMessage) => void
  onClose: () => void
  visible: boolean
}

interface SearchResult {
  message: ChatMessage
  index: number
  highlightedText: string
}

export default function MessageSearch({
  messages,
  onMessageSelect,
  onClose,
  visible,
}: MessageSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (searchQuery.trim()) {
      const results: SearchResult[] = []
      const query = searchQuery.toLowerCase()

      messages.forEach((message, index) => {
        // Extract the actual message text
        const messageText = (() => {
          if (typeof message.message === 'string') {
            return message.message
          } else if (typeof message.message === 'object' && message.message !== null) {
            if ('message' in message.message && typeof message.message.message === 'string') {
              return message.message.message
            }
            return JSON.stringify(message.message)
          }
          return String(message.message)
        })()

        if (messageText && messageText.toLowerCase().includes(query)) {
          const startIndex = messageText.toLowerCase().indexOf(query)
          const endIndex = startIndex + query.length
          
          const highlightedText = messageText.substring(0, startIndex) +
            '**' + messageText.substring(startIndex, endIndex) + '**' +
            messageText.substring(endIndex)

          results.push({
            message,
            index,
            highlightedText
          })
        }
      })

      setSearchResults(results)
      setSelectedIndex(0)
    } else {
      setSearchResults([])
      setSelectedIndex(0)
    }
  }, [searchQuery, messages])

  const handlePrevious = () => {
    if (searchResults.length > 0) {
      setSelectedIndex(prev => 
        prev > 0 ? prev - 1 : searchResults.length - 1
      )
    }
  }

  const handleNext = () => {
    if (searchResults.length > 0) {
      setSelectedIndex(prev => 
        prev < searchResults.length - 1 ? prev + 1 : 0
      )
    }
  }

  const handleResultPress = (result: SearchResult) => {
    onMessageSelect(result.message)
    onClose()
  }

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const renderSearchResult = ({ item, index }: { item: SearchResult; index: number }) => {
    const isSelected = index === selectedIndex
    
    return (
      <TouchableOpacity
        style={[
          styles.resultItem,
          isSelected && styles.resultItemSelected
        ]}
        onPress={() => handleResultPress(item)}
      >
        <View style={styles.resultHeader}>
          <Text style={styles.resultTime}>
            {formatMessageTime(item.message.created_at)}
          </Text>
          <Text style={styles.resultIndex}>
            {index + 1} of {searchResults.length}
          </Text>
        </View>
        <Text style={styles.resultText} numberOfLines={3}>
          {(() => {
            if (typeof item.message.message === 'string') {
              return item.message.message
            } else if (typeof item.message.message === 'object' && item.message.message !== null) {
              if ('message' in item.message.message && typeof item.message.message.message === 'string') {
                return item.message.message.message
              }
              return JSON.stringify(item.message.message)
            }
            return String(item.message.message)
          })()}
        </Text>
      </TouchableOpacity>
    )
  }

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="search" size={48} color={Colors.neutral[300]} />
      <Text style={styles.emptyStateText}>
        {searchQuery.trim() ? 'No messages found' : 'Search messages...'}
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {searchQuery.trim() 
          ? 'Try a different search term'
          : 'Type to search through your conversation'
        }
      </Text>
    </View>
  )

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Search Messages</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Colors.text.secondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search messages..."
            placeholderTextColor={Colors.text.tertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.trim() && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Search Controls */}
        {searchResults.length > 0 && (
          <View style={styles.controlsContainer}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handlePrevious}
            >
              <Ionicons name="chevron-up" size={20} color={Colors.primary[500]} />
              <Text style={styles.controlButtonText}>Previous</Text>
            </TouchableOpacity>
            
            <Text style={styles.resultsCount}>
              {selectedIndex + 1} of {searchResults.length}
            </Text>
            
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handleNext}
            >
              <Text style={styles.controlButtonText}>Next</Text>
              <Ionicons name="chevron-down" size={20} color={Colors.primary[500]} />
            </TouchableOpacity>
          </View>
        )}

        {/* Search Results */}
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.message.id}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  closeButton: {
    padding: Spacing.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  controlButtonText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.medium,
  },
  resultsCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  resultsList: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  resultItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.background.secondary,
  },
  resultItemSelected: {
    backgroundColor: Colors.primary[50],
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  resultTime: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.tertiary,
  },
  resultIndex: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.medium,
  },
  resultText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.lg,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.tertiary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
})
