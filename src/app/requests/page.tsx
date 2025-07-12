'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Pagination } from '@/components/ui/Pagination'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { RatingForm } from '@/components/features/RatingForm'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api-client'
import type { SwapRequestWithDetails, PaginationInfo } from '@/types'
import { Loader2, AlertCircle, ArrowUpDown, Calendar, MessageSquare, Star, MapPin, Trash2 } from 'lucide-react'
import Image from 'next/image'

export default function RequestsPage() {
  const { user, logout, isLoggedIn } = useAuth()
  const [requests, setRequests] = useState<SwapRequestWithDetails[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNext: false,
    hasPrev: false,
  })
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')
  const [direction, setDirection] = useState<'all' | 'sent' | 'received'>('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [showRatingForm, setShowRatingForm] = useState<string | null>(null) // requestId

  const fetchRequests = useCallback(async (page: number = 1) => {
    if (!isLoggedIn || !user) return

    try {
      setIsLoading(true)
      setError(null)
      
      const params = {
        page,
        limit: 10,
        status: filter === 'all' ? undefined : filter.toUpperCase(),
        direction: direction === 'all' ? undefined : direction
      }
      
      const response = await apiClient.get<{
        success: boolean
        data: {
          requests: SwapRequestWithDetails[]
          pagination: PaginationInfo
        }
      }>('/api/requests', params)
      
      if (response.success && response.data) {
        setRequests(response.data.requests)
        setPagination(response.data.pagination)
      } else {
        throw new Error('Failed to fetch requests')
      }
    } catch (err) {
      console.error('Error fetching requests:', err)
      setError(err instanceof Error ? err.message : 'An error occurred while fetching requests')
    } finally {
      setIsLoading(false)
    }
  }, [user, isLoggedIn, filter, direction])

  useEffect(() => {
    fetchRequests(1)
  }, [fetchRequests])

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(event.target.value as typeof filter)
  }

  const handleDirectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setDirection(event.target.value as typeof direction)
  }

  const handlePageChange = (page: number) => {
    fetchRequests(page)
  }

  const handleRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      setActionLoading(requestId)
      
      // Map frontend actions to API actions
      const apiAction = action === 'accept' ? 'ACCEPTED' : 'REJECTED'
      
      const response = await apiClient.put(`/api/requests/${requestId}`, { action: apiAction })
      
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        // Update the request status in local state immediately
        setRequests(prevRequests => 
          prevRequests.map(request => 
            request.id === requestId 
              ? { 
                  ...request, 
                  status: apiAction,
                  updatedAt: new Date().toISOString(),
                  ...(apiAction === 'ACCEPTED' ? { completedAt: new Date().toISOString() } : {})
                }
              : request
          )
        )
        
        // Show success message
        setError(null)
        setSuccessMessage(`Request ${action}ed successfully!`)
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null)
        }, 3000)
      } else {
        throw new Error(`Failed to ${action} request`)
      }
    } catch (err) {
      console.error(`Error ${action}ing request:`, err)
      setError(err instanceof Error ? err.message : `Failed to ${action} request`)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    try {
      setActionLoading(requestId)
      
      const response = await apiClient.delete(`/api/requests/${requestId}`)
      
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        // Remove the request from local state immediately
        setRequests(prevRequests => 
          prevRequests.filter(request => request.id !== requestId)
        )
        
        // Update pagination count
        setPagination(prev => ({
          ...prev,
          totalCount: prev.totalCount - 1
        }))
        
        // Show success message
        setError(null)
        setSuccessMessage('Request deleted successfully!')
        
        // Auto-hide success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage(null)
        }, 3000)
      } else {
        throw new Error('Failed to delete request')
      }
    } catch (err) {
      console.error('Error deleting request:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete request')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'accepted': return 'text-green-600 bg-green-50 border-green-200'
      case 'rejected': return 'text-red-600 bg-red-50 border-red-200'
      case 'completed': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleShowRatingForm = (requestId: string) => {
    setShowRatingForm(requestId)
  }

  const handleRatingSuccess = () => {
    setShowRatingForm(null)
    setSuccessMessage('Rating submitted successfully!')
    
    // Auto-hide success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null)
    }, 3000)
    
    // Refresh requests to show updated data
    fetchRequests(pagination.currentPage)
  }

  const handleRatingCancel = () => {
    setShowRatingForm(null)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={logout} />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Login Required</h3>
            <p className="text-gray-600 mb-4">
              You need to be logged in to view your swap requests.
            </p>
            <a
              href="/auth/login"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700"
            >
              Login
            </a>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={logout} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Swap Requests</h1>
          <p className="text-gray-600">
            Manage your skill exchange requests - both sent and received.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                id="status-filter"
                value={filter}
                onChange={handleFilterChange}
                options={[
                  { value: 'all', label: 'All Statuses' },
                  { value: 'pending', label: 'Pending' },
                  { value: 'accepted', label: 'Accepted' },
                  { value: 'rejected', label: 'Rejected' },
                ]}
              />
            </div>
            <div className="flex-1">
              <label htmlFor="direction-filter" className="block text-sm font-medium text-gray-700 mb-2">
                Direction
              </label>
              <Select
                id="direction-filter"
                value={direction}
                onChange={handleDirectionChange}
                options={[
                  { value: 'all', label: 'All Requests' },
                  { value: 'sent', label: 'Sent by Me' },
                  { value: 'received', label: 'Received by Me' },
                ]}
              />
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="flex">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success State */}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Success</h3>
                <p className="text-sm text-green-700 mt-1">{successMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <span className="ml-3 text-gray-600">Loading requests...</span>
          </div>
        ) : (
          <>
            {/* Requests List */}
            {requests.length > 0 ? (
              <div className="space-y-4 mb-8">
                {requests.map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    currentUserId={user?.id || ''}
                    onAction={handleRequestAction}
                    onDelete={handleDeleteRequest}
                    actionLoading={actionLoading}
                    getStatusColor={getStatusColor}
                    formatDate={formatDate}
                    onShowRatingForm={handleShowRatingForm}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ArrowUpDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No requests found</h3>
                <p className="text-gray-600">
                  {filter === 'all' && direction === 'all' 
                    ? "You haven't sent or received any swap requests yet."
                    : "No requests match your current filters."
                  }
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

        {/* Rating Form - Conditionally Rendered */}
        {showRatingForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {(() => {
                const request = requests.find(r => r.id === showRatingForm)
                if (!request) return null
                
                const isReceived = request.receiverId === user?.id
                const otherUser = isReceived ? request.sender : request.receiver
                
                return (
                  <RatingForm 
                    swapRequestId={showRatingForm}
                    otherUserName={otherUser.name}
                    onSuccess={handleRatingSuccess}
                    onCancel={handleRatingCancel}
                  />
                )
              })()}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

interface RequestCardProps {
  request: SwapRequestWithDetails
  currentUserId: string
  onAction: (requestId: string, action: 'accept' | 'reject') => void
  onDelete: (requestId: string) => void
  actionLoading: string | null
  getStatusColor: (status: string) => string
  formatDate: (date: string) => string
  onShowRatingForm: (requestId: string) => void
}

function RequestCard({ 
  request, 
  currentUserId, 
  onAction, 
  onDelete,
  actionLoading, 
  getStatusColor, 
  formatDate,
  onShowRatingForm
}: RequestCardProps) {
  const [isStatusChanged, setIsStatusChanged] = useState(false)
  const isReceived = request.receiverId === currentUserId
  const otherUser = isReceived ? request.sender : request.receiver
  const mySkill = isReceived ? request.receiverSkill : request.senderSkill
  const theirSkill = isReceived ? request.senderSkill : request.receiverSkill

  // Add flash effect when status changes
  useEffect(() => {
    if (request.status !== 'PENDING') {
      setIsStatusChanged(true)
      const timer = setTimeout(() => {
        setIsStatusChanged(false)
      }, 2000) // Flash for 2 seconds
      
      return () => clearTimeout(timer)
    }
  }, [request.status])

  const handleAction = (action: 'accept' | 'reject') => {
    setIsStatusChanged(true)
    onAction(request.id, action)
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 ${
      isStatusChanged ? 'ring-2 ring-green-300 bg-green-50' : ''
    }`}>
      <div className="flex flex-col lg:flex-row gap-6">
        {/* User Info */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link href={`/profile/${otherUser.id}`} className="block">
            {otherUser.profilePhoto ? (
              <Image
                src={otherUser.profilePhoto}
                alt={otherUser.name}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover hover:ring-2 hover:ring-teal-500 transition-all cursor-pointer"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center hover:ring-2 hover:ring-teal-500 transition-all cursor-pointer">
                <span className="text-xl font-semibold text-gray-600">
                  {otherUser.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{otherUser.name}</h3>
            {otherUser.location && (
              <div className="flex items-center text-sm text-gray-600 mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                {otherUser.location}
              </div>
            )}
            <div className="flex items-center text-sm text-gray-600 mt-1">
              <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
              {otherUser.averageRating > 0 ? `${otherUser.averageRating}/5` : 'No rating'}
            </div>
          </div>
        </div>

        {/* Request Details */}
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-2 mb-2 sm:mb-0">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(request.status)}`}>
                {request.status}
              </span>
              <span className="text-sm text-gray-500">
                {isReceived ? '← Received' : '→ Sent'}
              </span>
            </div>
            
            <div className="flex items-center text-sm text-gray-500">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(request.createdAt)}
            </div>
          </div>

          {/* Skills Exchange */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {isReceived ? 'You teach:' : 'You want to learn:'}
                </p>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
                  {mySkill.name}
                </span>
              </div>
              
              <div className="flex-shrink-0">
                <ArrowUpDown className="h-5 w-5 text-gray-400" />
              </div>
              
              <div className="flex-1 text-center sm:text-right">
                <p className="text-sm font-medium text-gray-700 mb-1">
                  {isReceived ? 'You learn:' : 'You teach:'}
                </p>
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
                  {theirSkill.name}
                </span>
              </div>
            </div>
          </div>

          {/* Message */}
          {request.message && (
            <div className="mb-4">
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 italic">&ldquo;{request.message}&rdquo;</p>
              </div>
            </div>
          )}

          {/* Actions */}
          {isReceived && request.status === 'PENDING' && (
            <div className="flex gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleAction('accept')}
                disabled={actionLoading === request.id}
                className="flex-1 sm:flex-none"
              >
                {actionLoading === request.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Accept
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleAction('reject')}
                disabled={actionLoading === request.id}
                className="flex-1 sm:flex-none"
              >
                Reject
              </Button>
            </div>
          )}

          {/* Delete Button for Outgoing Pending Requests */}
          {!isReceived && request.status === 'PENDING' && (
            <div className="mt-4">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(request.id)}
                disabled={actionLoading === request.id}
                className="w-full sm:w-auto"
              >
                {actionLoading === request.id ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete Request
              </Button>
            </div>
          )}

          {/* Rating Button for Accepted/Completed Requests */}
          {(request.status === 'ACCEPTED' || request.status === 'COMPLETED') && !request.rating && (
            <div className="mt-4">
              <Button
                variant="primary"
                size="sm"
                onClick={() => onShowRatingForm(request.id)}
                className="w-full sm:w-auto"
              >
                <Star className="h-4 w-4 mr-2" />
                Rate Experience
              </Button>
            </div>
          )}

          {/* Show Rating if Already Submitted */}
          {request.rating && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                <span className="text-sm font-medium text-gray-900">
                  Rating: {request.rating.rating}/5
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(request.rating.createdAt)}
                </span>
              </div>
              {request.rating.feedback && (
                <p className="text-sm text-gray-700 italic">
                  "{request.rating.feedback}"
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
