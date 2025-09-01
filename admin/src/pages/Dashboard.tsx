import React, { useEffect, useState } from 'react'
import { useSupabase } from '../contexts/SupabaseContext'
import { 
  Users, 
  ClipboardList, 
  UserCheck, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

interface DashboardStats {
  totalUsers: number
  totalTasks: number
  totalTaskers: number
  totalRevenue: number
  tasksThisWeek: number
  tasksThisMonth: number
  completedTasks: number
  pendingTasks: number
}

const Dashboard: React.FC = () => {
  const { supabase } = useSupabase()
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalTasks: 0,
    totalTaskers: 0,
    totalRevenue: 0,
    tasksThisWeek: 0,
    tasksThisMonth: 0,
    completedTasks: 0,
    pendingTasks: 0
  })
  const [loading, setLoading] = useState(true)
  const [weeklyData, setWeeklyData] = useState<any[]>([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      // Fetch total users
      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })

      // Fetch total tasks
      const { count: tasksCount } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })

      // Fetch total taskers
      const { count: taskersCount } = await supabase
        .from('tasker_applications')
        .select('*', { count: 'exact', head: true })

      // Fetch tasks by status
      const { data: tasksByStatus } = await supabase
        .from('tasks')
        .select('status, created_at')

      // Calculate weekly and monthly tasks
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

      const tasksThisWeek = tasksByStatus?.filter(task => 
        new Date(task.created_at) >= weekAgo
      ).length || 0

      const tasksThisMonth = tasksByStatus?.filter(task => 
        new Date(task.created_at) >= monthAgo
      ).length || 0

      const completedTasks = tasksByStatus?.filter(task => 
        task.status === 'completed'
      ).length || 0

      const pendingTasks = tasksByStatus?.filter(task => 
        task.status === 'open'
      ).length || 0

      // Generate weekly chart data
      const weeklyData = Array.from({ length: 7 }, (_, i) => {
        const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000)
        const dayTasks = tasksByStatus?.filter(task => {
          const taskDate = new Date(task.created_at)
          return taskDate.toDateString() === date.toDateString()
        }).length || 0
        
        return {
          day: date.toLocaleDateString('en-US', { weekday: 'short' }),
          tasks: dayTasks
        }
      })

      setStats({
        totalUsers: usersCount || 0,
        totalTasks: tasksCount || 0,
        totalTaskers: taskersCount || 0,
        totalRevenue: 0, // You can calculate this based on your pricing model
        tasksThisWeek,
        tasksThisMonth,
        completedTasks,
        pendingTasks
      })

      setWeeklyData(weeklyData)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const statCards = [
    {
      name: 'Total Users',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive'
    },
    {
      name: 'Total Tasks',
      value: stats.totalTasks,
      icon: ClipboardList,
      color: 'bg-green-500',
      change: '+8%',
      changeType: 'positive'
    },
    {
      name: 'Total Taskers',
      value: stats.totalTaskers,
      icon: UserCheck,
      color: 'bg-purple-500',
      change: '+15%',
      changeType: 'positive'
    },
    {
      name: 'Revenue',
      value: `$${stats.totalRevenue}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      change: '+23%',
      changeType: 'positive'
    }
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your platform's performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} rounded-md p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 px-5 py-3">
              <div className="text-sm">
                <span className={`font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
                <span className="text-gray-500"> from last month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly Tasks Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tasks This Week</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="tasks" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Task Status Chart */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Task Status Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { status: 'Completed', count: stats.completedTasks, color: '#22c55e' },
              { status: 'Pending', count: stats.pendingTasks, color: '#f59e0b' },
              { status: 'In Progress', count: stats.totalTasks - stats.completedTasks - stats.pendingTasks, color: '#3b82f6' }
            ]}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <button className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700">
            <Users className="h-5 w-5 mr-2" />
            View All Users
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700">
            <ClipboardList className="h-5 w-5 mr-2" />
            Manage Tasks
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700">
            <UserCheck className="h-5 w-5 mr-2" />
            Review Taskers
          </button>
          <button className="flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700">
            <TrendingUp className="h-5 w-5 mr-2" />
            View Reports
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
