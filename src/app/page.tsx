'use client'

import { useState, useEffect, useCallback } from 'react'
import { Navbar } from '@/components/layout/Navbar'
import { SearchBar } from '@/components/features/SearchBar'
import { UserCard } from '@/components/features/UserCard'
import { Pagination } from '@/components/ui/Pagination'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api-client'
import { SKILL_CATEGORIES, AVAILABILITY_OPTIONS } from '@/lib/constants'
import type { UsersResponse, SearchFilters, PublicUser } from '@/types'
import { Loader2, AlertCircle, Users } from 'lucide-react'

export default function HomePage() {
  const { user, logout, isLoggedIn } = useAuth()
  const [users, setUsers] = useState<PublicUser[]>([])
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [filters, setFilters] = useState<Partial<SearchFilters>>({
    page: 1,
    limit: 10,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // Fetch users data
  const fetchUsers = useCallback(async (searchFilters: Partial<SearchFilters>) => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await apiClient.get<{ success: boolean; data: UsersResponse }>('/api/users', searchFilters)
      
      if (response.success && response.data) {
        // Filter users for complete profiles and exclude current user
        const currentUserId = user?.id
        
        const filteredUsers = response.data.users.filter(userData => {
          // Check if profile is complete
          const hasCompleteProfile = 
            userData.name &&
            userData.location &&
            userData.availability && userData.availability.length > 0 &&
            userData.skillsOffered && userData.skillsOffered.length > 0 &&
            userData.skillsWanted && userData.skillsWanted.length > 0
          
          // Exclude current user (if logged in)
          const isNotCurrentUser = !currentUserId || userData.id !== currentUserId
          
          return hasCompleteProfile && isNotCurrentUser
        })
        
        setUsers(filteredUsers)
        setPagination(response.data.pagination)
      } else {
        throw new Error('Failed to fetch users')
      }
    } catch (err) {
      console.error('Error fetching users:', err)
      // Don't show error for unauthorized - this endpoint should be public
      if (err instanceof Error && err.message.toLowerCase().includes('unauthorized')) {
        // Just show empty state instead of error
        setUsers([])
        setPagination({
          currentPage: 1,
          totalPages: 1,
          totalCount: 0,
          hasNext: false,
          hasPrev: false,
        })
      } else {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching users')
      }
    } finally {
      setIsLoading(false)
    }
  }, [user]) // Add user as dependency so filtering works after context loads

  // Initial load
  useEffect(() => {
    fetchUsers(filters)
  }, [fetchUsers, filters])

  // Polling for real-time updates every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchUsers(filters)
      }
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [fetchUsers, filters, isLoading])

  // Handle search
  const handleSearch = useCallback((newFilters: Partial<SearchFilters>) => {
    // Check if this is an explicit clear (all undefined values)
    const isClearOperation = Object.values(newFilters).every(value => 
      value === undefined || value === 1 // page is always 1
    )
    
    if (isClearOperation) {
      setFilters({ page: 1, limit: 10 })
      return
    }
    
    // Clean up undefined values before setting filters
    const cleanedFilters = Object.fromEntries(
      Object.entries(newFilters).filter(([, value]) => value !== undefined && value !== '')
    )
    
    const updatedFilters = { ...filters, ...cleanedFilters }
    setFilters(updatedFilters)
  }, [filters])

  // Handle pagination
  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Handle request click
  const handleRequestClick = useCallback((userId: string) => {
    if (!isLoggedIn) {
      setShowLoginModal(true)
      return
    }
    
    // TODO: Navigate to request swap page
    console.log('Request swap for user:', userId)
  }, [isLoggedIn])

  // Handle login modal close
  const handleCloseLoginModal = () => {
    setShowLoginModal(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <Navbar user={user} onLogout={logout} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search & Filters */}
        <SearchBar 
          filters={filters}
          onSearch={handleSearch}
          categories={SKILL_CATEGORIES}
          availabilityOptions={AVAILABILITY_OPTIONS}
        />

        {/* Results Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              Discover Skills & Connect
            </h1>
            {!isLoading && (
              <div className="flex items-center text-sm text-gray-600">
                <Users className="h-4 w-4 mr-1" />
                <span>{pagination.totalCount} users found</span>
              </div>
            )}
          </div>
          <p className="text-gray-600 mt-1">
            Find people with the skills you need and share your expertise
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <span className="ml-2 text-gray-600">Loading...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Users List */}
        {!isLoading && !error && (
          <>
            {users.length > 0 ? (
              <div className="space-y-4 mb-8">
                {users.map((userData) => (
                  <UserCard
                    key={userData.id}
                    user={userData}
                    isLoggedIn={isLoggedIn}
                    onRequestClick={handleRequestClick}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">
                  Try adjusting your search filters or check back later for new members.
                </p>
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.currentPage}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                className="mt-8"
              />
            )}
          </>
        )}
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Login Required</h3>
            <p className="text-gray-600 mb-6">
              You need to be logged in to request skill swaps. Please login or create an account to continue.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleCloseLoginModal}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <a
                href="/auth/login"
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 transition-colors text-center"
              >
                Login
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
