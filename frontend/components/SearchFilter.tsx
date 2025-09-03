import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography } from '../constants/Design'

interface SearchFilterProps {
  onSearch: (filters: SearchFilters) => void
  onClear: () => void
  categories?: Array<{ id: string; name: string; slug: string }>
}

export interface SearchFilters {
  query: string
  category: string
  minPrice: string
  maxPrice: string
  location: string
  sortBy: 'newest' | 'oldest' | 'price_low' | 'price_high' | 'budget'
}

export default function SearchFilter({ onSearch, onClear, categories = [] }: SearchFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    category: '',
    minPrice: '',
    maxPrice: '',
    location: '',
    sortBy: 'newest'
  })

  const handleSearch = () => {
    onSearch(filters)
    setIsExpanded(false)
  }

  const handleClear = () => {
    const clearedFilters: SearchFilters = {
      query: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      location: '',
      sortBy: 'newest'
    }
    setFilters(clearedFilters)
    onClear()
    setIsExpanded(false)
  }

  const updateFilter = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const hasActiveFilters = filters.query || filters.category || filters.minPrice || filters.maxPrice || filters.location

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={20} color={Colors.text.secondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search tasks..."
          placeholderTextColor={Colors.text.tertiary}
          value={filters.query}
          onChangeText={(text) => updateFilter('query', text)}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Ionicons 
            name="options-outline" 
            size={20} 
            color={hasActiveFilters ? Colors.primary[500] : Colors.text.secondary} 
          />
        </TouchableOpacity>
      </View>

      {/* Expanded Filters */}
      {isExpanded && (
        <View style={styles.filtersContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Category Filter */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                <TouchableOpacity
                  style={[
                    styles.categoryChip,
                    !filters.category && styles.categoryChipActive
                  ]}
                  onPress={() => updateFilter('category', '')}
                >
                  <Text style={[
                    styles.categoryChipText,
                    !filters.category && styles.categoryChipTextActive
                  ]}>
                    All
                  </Text>
                </TouchableOpacity>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      filters.category === category.id && styles.categoryChipActive
                    ]}
                    onPress={() => updateFilter('category', category.id)}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      filters.category === category.id && styles.categoryChipTextActive
                    ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Price Range */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Budget Range</Text>
              <View style={styles.priceRow}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  placeholderTextColor={Colors.text.tertiary}
                  value={filters.minPrice}
                  onChangeText={(text) => updateFilter('minPrice', text)}
                  keyboardType="numeric"
                />
                <Text style={styles.priceSeparator}>to</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  placeholderTextColor={Colors.text.tertiary}
                  value={filters.maxPrice}
                  onChangeText={(text) => updateFilter('maxPrice', text)}
                  keyboardType="numeric"
                />
              </View>
            </View>

            {/* Location */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Location</Text>
              <TextInput
                style={styles.locationInput}
                placeholder="City, State"
                placeholderTextColor={Colors.text.tertiary}
                value={filters.location}
                onChangeText={(text) => updateFilter('location', text)}
              />
            </View>

            {/* Sort By */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={styles.sortOptions}>
                {[
                  { key: 'newest', label: 'Newest' },
                  { key: 'oldest', label: 'Oldest' },
                  { key: 'price_low', label: 'Price: Low to High' },
                  { key: 'price_high', label: 'Price: High to Low' },
                  { key: 'budget', label: 'Budget' }
                ].map((option) => (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.sortOption,
                      filters.sortBy === option.key && styles.sortOptionActive
                    ]}
                    onPress={() => updateFilter('sortBy', option.key)}
                  >
                    <Text style={[
                      styles.sortOptionText,
                      filters.sortBy === option.key && styles.sortOptionTextActive
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.clearButton} onPress={handleClear}>
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                <Ionicons name="search" size={16} color={Colors.text.inverse} />
                <Text style={styles.searchButtonText}>Search</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
    paddingVertical: Spacing.sm,
  },
  filterButton: {
    padding: Spacing.sm,
  },
  filtersContainer: {
    maxHeight: 400,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  filterSection: {
    marginBottom: Spacing.lg,
  },
  filterLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.background.primary,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  categoryChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  categoryChipTextActive: {
    color: Colors.text.inverse,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  priceSeparator: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  locationInput: {
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: Typography.fontSize.md,
    color: Colors.text.primary,
  },
  sortOptions: {
    gap: Spacing.sm,
  },
  sortOption: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.background.primary,
  },
  sortOptionActive: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
  },
  sortOptionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  sortOptionTextActive: {
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.medium,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  clearButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.background.primary,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },
  searchButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.primary[500],
    gap: Spacing.sm,
  },
  searchButtonText: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.inverse,
    fontWeight: Typography.fontWeight.medium,
  },
})
