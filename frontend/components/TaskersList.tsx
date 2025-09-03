import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import TaskerCard from './TaskerCard'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'
import { useTaskers, useTaskerSearch } from '../hooks/useTaskers'
import { Tasker, TaskerFilters } from '../services/TaskerService'

interface TaskersListProps {
  filters?: TaskerFilters
  limit?: number
  showSearch?: boolean
  onTaskerPress?: (tasker: Tasker) => void
  onTaskerContact?: (tasker: Tasker) => void
  style?: any
}

export default function TaskersList({
  filters = {},
  limit = 20,
  showSearch = true,
  onTaskerPress,
  onTaskerContact,
  style
}: TaskersListProps) {
  const { 
    taskers, 
    loading, 
    error, 
    hasMore, 
    refreshTaskers, 
    loadMoreTaskers 
  } = useTaskers(filters, limit)
  
  const { searchTaskers, loading: searchLoading } = useTaskerSearch()
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Tasker[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    await refreshTaskers()
    setRefreshing(false)
  }

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadMoreTaskers()
    }
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    
    if (query.trim().length === 0) {
      setSearchResults([])
      setIsSearching(false)
      return
    }

    try {
      setIsSearching(true)
      const results = await searchTaskers(query.trim())
      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  const handleTaskerPress = (tasker: Tasker) => {
    if (onTaskerPress) {
      onTaskerPress(tasker)
    }
  }

  const handleTaskerContact = (tasker: Tasker) => {
    if (onTaskerContact) {
      onTaskerContact(tasker)
    }
  }

  const renderTasker = ({ item }: { item: Tasker }) => (
    <TaskerCard
      tasker={item}
      onPress={() => handleTaskerPress(item)}
      onContact={() => handleTaskerContact(item)}
    />
  )

  const renderFooter = () => {
    if (!loading || !hasMore) return null
    
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={Colors.primary} />
        <Text style={styles.footerText}>Loading more taskers...</Text>
      </View>
    )
  }

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={48} color={Colors.text.secondary} />
      <Text style={styles.emptyTitle}>No Taskers Found</Text>
      <Text style={styles.emptyText}>
        {searchQuery ? 
          'No taskers match your search criteria.' : 
          'No taskers are available at the moment.'
        }
      </Text>
    </View>
  )

  const renderError = () => (
    <View style={styles.errorContainer}>
      <Ionicons name="alert-circle" size={48} color={Colors.error} />
      <Text style={styles.errorTitle}>Error Loading Taskers</Text>
      <Text style={styles.errorText}>
        {error || 'Something went wrong while loading taskers.'}
      </Text>
      <TouchableOpacity style={styles.retryButton} onPress={refreshTaskers}>
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  )

  const currentData = isSearching ? searchResults : taskers
  const currentLoading = isSearching ? searchLoading : loading

  if (error && taskers.length === 0) {
    return (
      <View style={[styles.container, style]}>
        {renderError()}
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={Colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search taskers by name, skills, or location..."
              value={searchQuery}
              onChangeText={handleSearch}
              placeholderTextColor={Colors.text.secondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => handleSearch('')}>
                <Ionicons name="close-circle" size={20} color={Colors.text.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      <View style={styles.header}>
        <Text style={styles.title}>
          {isSearching ? 'Search Results' : 'Available Taskers'}
        </Text>
        <Text style={styles.count}>
          {currentData.length} tasker{currentData.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <FlatList
        data={currentData}
        renderItem={renderTasker}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        onEndReached={!isSearching ? handleLoadMore : undefined}
        onEndReachedThreshold={0.1}
        ListFooterComponent={!isSearching ? renderFooter : null}
        ListEmptyComponent={!currentLoading ? renderEmpty : null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    marginBottom: Spacing.md,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
  },
  count: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  listContent: {
    paddingBottom: Spacing.lg,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginLeft: Spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  errorTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    color: Colors.error[500],
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: Colors.text.inverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
})
