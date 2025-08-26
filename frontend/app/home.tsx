import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  ScrollView,
  Alert,
  RefreshControl,
  StyleSheet,
  Animated,
  Pressable,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../contexts/AuthContext'
import { useTasks } from '../hooks/useTasks'
import { useCategories } from '../hooks/useCategories'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import TaskCard from '../components/TaskCard'
import Colors from '../constants/Colors'
import { Spacing, BorderRadius, Typography, Shadows, CommonStyles } from '../constants/Design'

export default function Home() {
  const { profile, signOut } = useAuth()
  const { tasks, loading: tasksLoading, refetch: refetchTasks } = useTasks()
  const { categories, loading: categoriesLoading } = useCategories()
  const [greeting, setGreeting] = useState('')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting('Good morning')
    else if (hour < 18) setGreeting('Good afternoon')
    else setGreeting('Good evening')
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await refetchTasks()
    setRefreshing(false)
  }

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut()
            router.replace('/auth')
          }
        },
      ]
    )
  }

  const navigateToCategory = (category: any) => {
    if (profile?.role === 'customer') {
      router.push(`/post-task?category=${category.id}`)
    } else {
      router.push(`/browse-tasks?category=${category.id}`)
    }
  }

  // Calculate stats
  const completedTasks = tasks.filter(task => task.status === 'completed').length
  const activeTasks = tasks.filter(task => ['posted', 'assigned', 'in_progress'].includes(task.status)).length
  const totalEarnings = tasks
    .filter(task => task.status === 'completed' && task.final_price)
    .reduce((sum, task) => sum + (task.final_price || 0), 0)

  // Render Customer Dashboard
  if (profile?.role === 'customer') {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header with gradient */}
        <LinearGradient
          colors={[Colors.primary[500], Colors.primary[600]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.greetingSection}>
              <Text style={styles.greeting}>{greeting}!</Text>
              <Text style={styles.userName}>{profile?.full_name}</Text>
              <Text style={styles.roleText}>Ready to get things done?</Text>
            </View>
            <Pressable onPress={() => router.push('/profile')} style={styles.profileButton}>
              <View style={styles.profileAvatar}>
                <Ionicons name="person" size={24} color={Colors.primary[500]} />
              </View>
            </Pressable>
          </View>
        </LinearGradient>

        <ScrollView 
          style={styles.scrollView} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Quick Action Cards */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <Card 
                variant="elevated" 
                onPress={() => router.push('/post-task')}
                style={styles.actionCard}
              >
                <LinearGradient
                  colors={Colors.gradients.primary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.actionGradient}
                >
                  <Ionicons name="add-circle" size={32} color={Colors.text.inverse} />
                  <Text style={styles.actionTitle}>Post a Task</Text>
                  <Text style={styles.actionSubtitle}>Get help with anything</Text>
                </LinearGradient>
              </Card>

              <Card 
                variant="elevated" 
                onPress={() => router.push('/my-tasks')}
                style={styles.actionCard}
              >
                <View style={styles.actionContent}>
                  <Ionicons name="list-circle" size={32} color={Colors.success[500]} />
                  <Text style={[styles.actionTitle, { color: Colors.text.primary }]}>My Tasks</Text>
                  <Text style={[styles.actionSubtitle, { color: Colors.text.secondary }]}>
                    {activeTasks} active
                  </Text>
                </View>
              </Card>
            </View>
          </View>

          {/* Popular Categories */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Popular Services</Text>
              <Pressable onPress={() => router.push('/categories')}>
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>
            
            {categoriesLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading categories...</Text>
              </View>
            ) : (
              <View style={styles.categoriesGrid}>
                {categories.slice(0, 6).map((category, index) => (
                  <Pressable
                    key={category.id}
                    style={[
                      styles.categoryCard,
                      { backgroundColor: `${category.color}15` }
                    ]}
                    onPress={() => navigateToCategory(category)}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                      <Ionicons name={category.icon as any} size={24} color={Colors.text.inverse} />
                    </View>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryDesc} numberOfLines={2}>
                      {category.description}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Recent Tasks */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Tasks</Text>
              <Pressable onPress={() => router.push('/my-tasks')}>
                <Text style={styles.viewAllText}>View All</Text>
              </Pressable>
            </View>
            
            {tasksLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading tasks...</Text>
              </View>
            ) : tasks.length > 0 ? (
              <View style={styles.tasksContainer}>
                {tasks.slice(0, 3).map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </View>
            ) : (
              <Card style={styles.emptyState}>
                <View style={styles.emptyStateContent}>
                  <View style={styles.emptyStateIcon}>
                    <Ionicons name="time-outline" size={48} color={Colors.neutral[400]} />
                  </View>
                  <Text style={styles.emptyStateText}>No tasks yet</Text>
                  <Text style={styles.emptyStateSubtext}>
                    Post your first task to get started
                  </Text>
                  <Button
                    title="Post a Task"
                    onPress={() => router.push('/post-task')}
                    variant="primary"
                    gradient
                    style={{ marginTop: Spacing.lg }}
                  />
                </View>
              </Card>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  // Render Tasker Dashboard
  return (
    <SafeAreaView style={styles.container}>
      {/* Header with gradient */}
      <LinearGradient
        colors={[Colors.success[500], Colors.success[600]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.greetingSection}>
            <Text style={styles.greeting}>{greeting}!</Text>
            <Text style={styles.userName}>{profile?.full_name}</Text>
            <View style={styles.statusContainer}>
              <View style={[
                styles.statusDot, 
                { backgroundColor: profile?.available ? Colors.success[400] : Colors.error[400] }
              ]} />
              <Text style={styles.statusText}>
                {profile?.available ? 'Available for tasks' : 'Not available'}
              </Text>
            </View>
          </View>
          <Pressable onPress={() => router.push('/profile')} style={styles.profileButton}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={24} color={Colors.success[500]} />
            </View>
          </Pressable>
        </View>
      </LinearGradient>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Performance</Text>
          <View style={styles.statsGrid}>
            <Card variant="gradient" gradient={Colors.gradients.ocean} style={styles.statCard}>
              <Text style={styles.statValue}>{completedTasks}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </Card>
            <Card variant="gradient" gradient={Colors.gradients.emerald} style={styles.statCard}>
              <Text style={styles.statValue}>${totalEarnings.toFixed(0)}</Text>
              <Text style={styles.statLabel}>Earned</Text>
            </Card>
            <Card variant="gradient" gradient={Colors.gradients.sunset} style={styles.statCard}>
              <Text style={styles.statValue}>{profile?.average_rating?.toFixed(1) || '0.0'}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </Card>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Find Work</Text>
          <View style={styles.quickActionsGrid}>
            <Card 
              variant="elevated" 
              onPress={() => router.push('/browse-tasks')}
              style={styles.actionCard}
            >
              <LinearGradient
                colors={Colors.gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGradient}
              >
                <Ionicons name="search" size={32} color={Colors.text.inverse} />
                <Text style={styles.actionTitle}>Browse Tasks</Text>
                <Text style={styles.actionSubtitle}>Find new opportunities</Text>
              </LinearGradient>
            </Card>

            <Card 
              variant="elevated" 
              onPress={() => router.push('/my-tasks')}
              style={styles.actionCard}
            >
              <View style={styles.actionContent}>
                <Ionicons name="calendar" size={32} color={Colors.primary[500]} />
                <Text style={[styles.actionTitle, { color: Colors.text.primary }]}>My Schedule</Text>
                <Text style={[styles.actionSubtitle, { color: Colors.text.secondary }]}>
                  {activeTasks} active tasks
                </Text>
              </View>
            </Card>
          </View>
        </View>

        {/* Available Categories */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Task Categories</Text>
          </View>
          
          {categoriesLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading categories...</Text>
            </View>
          ) : (
            <View style={styles.categoriesGrid}>
              {categories.slice(0, 4).map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryCard,
                    { backgroundColor: `${category.color}15` }
                  ]}
                  onPress={() => navigateToCategory(category)}
                >
                  <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                    <Ionicons name={category.icon as any} size={24} color={Colors.text.inverse} />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryDesc} numberOfLines={2}>
                    {category.description}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          
          {tasksLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading activity...</Text>
            </View>
          ) : tasks.length > 0 ? (
            <View style={styles.tasksContainer}>
              {tasks.slice(0, 3).map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
            </View>
          ) : (
            <Card style={styles.emptyState}>
              <View style={styles.emptyStateContent}>
                <View style={styles.emptyStateIcon}>
                  <Ionicons name="briefcase-outline" size={48} color={Colors.neutral[400]} />
                </View>
                <Text style={styles.emptyStateText}>No activity yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start browsing tasks to build your reputation
                </Text>
                <Button
                  title="Browse Tasks"
                  onPress={() => router.push('/browse-tasks')}
                  variant="primary"
                  gradient
                  style={{ marginTop: Spacing.lg }}
                />
              </View>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  headerGradient: {
    paddingBottom: Spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  greetingSection: {
    flex: 1,
  },
  greeting: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  userName: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginTop: 2,
  },
  roleText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.inverse,
    opacity: 0.8,
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  statusText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.inverse,
    opacity: 0.9,
  },
  profileButton: {
    padding: 4,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.text.inverse,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: Colors.background.secondary,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...CommonStyles.heading2,
    color: Colors.text.primary,
  },
  viewAllText: {
    fontSize: Typography.fontSize.md,
    color: Colors.primary[500],
    fontWeight: Typography.fontWeight.semibold,
  },
  quickActionsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionCard: {
    flex: 1,
    height: 120,
    padding: 0,
    overflow: 'hidden',
  },
  actionGradient: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background.primary,
  },
  actionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.inverse,
    marginTop: Spacing.xs,
    textAlign: 'center',
    opacity: 0.9,
  },
  statsSection: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    height: 80,
    padding: Spacing.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.inverse,
  },
  statLabel: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.inverse,
    marginTop: Spacing.xs,
    opacity: 0.9,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  categoryCard: {
    width: '48%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minHeight: 100,
    ...Shadows.sm,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  categoryName: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  categoryDesc: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  loadingContainer: {
    padding: Spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    color: Colors.text.secondary,
    fontSize: Typography.fontSize.md,
  },
  tasksContainer: {
    marginHorizontal: -Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    padding: Spacing.xxxl,
  },
  emptyStateContent: {
    alignItems: 'center',
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyStateText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: Typography.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
})