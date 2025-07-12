'use client'

import { useState, useEffect } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { UserManagement } from '@/components/admin/UserManagement'
import { SkillManagement } from '@/components/admin/SkillManagement'
import { SwapMonitoring } from '@/components/admin/SwapMonitoring'
import { GlobalMessaging } from '@/components/admin/GlobalMessaging'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api-client'
import type { AdminStats } from '@/types'
import { 
  Users, 
  ArrowRightLeft, 
  Award, 
  Shield, 
  TrendingUp,
  Download,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function AdminPanelPage() {
  const { user, logout, isLoggedIn } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'skills' | 'swaps' | 'messages'>('dashboard')

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/auth/login')
      return
    }

    if (user && user.role !== 'ADMIN') {
      router.push('/')
      return
    }

    fetchStats()
  }, [isLoggedIn, user, router])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await apiClient.get<{
        success: boolean
        data: AdminStats
      }>('/api/admin/stats')
      
      if (response.success && response.data) {
        setStats(response.data)
      } else {
        throw new Error('Failed to fetch admin stats')
      }
    } catch (err) {
      console.error('Error fetching admin stats:', err)
      setError(err instanceof Error ? err.message : 'Failed to load admin dashboard')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoggedIn || !user || user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={logout} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Shield className="h-8 w-8 text-orange-600 mr-3" />
            Admin Panel
          </h1>
          <p className="text-gray-600 mt-2">Manage users, skills, and monitor platform activity</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
              { id: 'users', label: 'Users', icon: Users },
              { id: 'skills', label: 'Skills', icon: Award },
              { id: 'swaps', label: 'Swaps', icon: ArrowRightLeft },
              { id: 'messages', label: 'Messages', icon: MessageSquare }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Content */}
        {activeTab === 'dashboard' && (
          <div>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            ) : stats ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Active Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <ArrowRightLeft className="h-8 w-8 text-purple-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Swaps</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalSwaps}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <Award className="h-8 w-8 text-yellow-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Total Skills</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalSkills}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completed Swaps</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.completedSwaps}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <AlertTriangle className="h-8 w-8 text-orange-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Swaps</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingSwaps}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <XCircle className="h-8 w-8 text-red-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Pending Skills</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.pendingSkills}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-indigo-600" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Completion Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats.totalSwaps > 0 ? Math.round((stats.completedSwaps / stats.totalSwaps) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Other tabs content will be added in next steps */}
        {activeTab === 'users' && <UserManagement onRefresh={fetchStats} />}
        {activeTab === 'skills' && <SkillManagement onRefresh={fetchStats} />}
        {activeTab === 'swaps' && <SwapMonitoring onRefresh={fetchStats} />}
        {activeTab === 'messages' && <GlobalMessaging onRefresh={fetchStats} />}
      </div>
    </div>
  )
}
