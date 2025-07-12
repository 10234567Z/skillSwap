'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import type { SwapRequest } from '@/types'
import { Button } from '@/components/ui/Button'
import { 
  ArrowRightLeft, 
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Eye,
  Star
} from 'lucide-react'

interface SwapWithDetails extends SwapRequest {
  requesterName: string
  recipientName: string
  skillOfferedName: string
  skillWantedName: string
  rating?: number
}

interface SwapMonitoringProps {
  onRefresh?: () => void
}

export function SwapMonitoring({ onRefresh }: SwapMonitoringProps) {
  const [swaps, setSwaps] = useState<SwapWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED'>('all')
  const [selectedSwap, setSelectedSwap] = useState<SwapWithDetails | null>(null)

  useEffect(() => {
    fetchSwaps()
  }, [])

  const fetchSwaps = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await apiClient.get<{
        success: boolean
        data: SwapWithDetails[]
      }>('/api/admin/data/swaps')
      
      if (response.success && response.data) {
        setSwaps(response.data)
      } else {
        throw new Error('Failed to fetch swaps')
      }
    } catch (err) {
      console.error('Error fetching swaps:', err)
      setError(err instanceof Error ? err.message : 'Failed to load swaps')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-3 w-3 mr-1" />
      case 'ACCEPTED':
        return <ArrowRightLeft className="h-3 w-3 mr-1" />
      case 'COMPLETED':
        return <CheckCircle className="h-3 w-3 mr-1" />
      case 'REJECTED':
        return <XCircle className="h-3 w-3 mr-1" />
      default:
        return <AlertTriangle className="h-3 w-3 mr-1" />
    }
  }

  const filteredSwaps = swaps.filter(swap => {
    const matchesSearch = swap.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         swap.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         swap.skillOfferedName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         swap.skillWantedName.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || swap.status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <Button 
          onClick={fetchSwaps}
          variant="outline"
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by users or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-gray-900"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-gray-900"
          >
            <option value="all">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Swap List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Skill Swaps ({filteredSwaps.length})
          </h3>
        </div>
        
        {filteredSwaps.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <ArrowRightLeft className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No swaps found matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSwaps.map((swap) => (
              <div key={swap.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                        <ArrowRightLeft className="h-6 w-6 text-orange-600" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {swap.requesterName} ↔ {swap.recipientName}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(swap.status)}`}>
                          {getStatusIcon(swap.status)}
                          {swap.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                        <span>Offering: {swap.skillOfferedName}</span>
                        <span>Wants: {swap.skillWantedName}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-400 mt-1">
                        <span>Created: {new Date(swap.createdAt).toLocaleDateString()}</span>
                        {swap.updatedAt !== swap.createdAt && (
                          <span>Updated: {new Date(swap.updatedAt).toLocaleDateString()}</span>
                        )}
                        {swap.status === 'COMPLETED' && swap.rating && (
                          <div className="flex items-center">
                            <Star className="h-3 w-3 text-yellow-400 mr-1" />
                            <span>Rated: {swap.rating}/5</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      onClick={() => setSelectedSwap(swap)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </div>
                
                {swap.message && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Message:</span> {swap.message}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Swap Details Modal */}
      {selectedSwap && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Swap Details</h3>
                <button
                  onClick={() => setSelectedSwap(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <div className="px-6 py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Requester</h4>
                  <p className="text-gray-700">{selectedSwap.requesterName}</p>
                  <p className="text-sm text-gray-500">Offering: {selectedSwap.skillOfferedName}</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Recipient</h4>
                  <p className="text-gray-700">{selectedSwap.recipientName}</p>
                  <p className="text-sm text-gray-500">Requested skill: {selectedSwap.skillWantedName}</p>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Status</h4>
                <span className={`inline-flex items-center px-3 py-1 rounded text-sm font-medium ${getStatusColor(selectedSwap.status)}`}>
                  {getStatusIcon(selectedSwap.status)}
                  {selectedSwap.status}
                </span>
              </div>
              
              {selectedSwap.message && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Message</h4>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{selectedSwap.message}</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Created:</span> {new Date(selectedSwap.createdAt).toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span> {new Date(selectedSwap.updatedAt).toLocaleString()}
                </div>
              </div>
              
              {selectedSwap.status === 'COMPLETED' && selectedSwap.rating && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Rating</h4>
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-5 w-5 ${
                          star <= selectedSwap.rating! ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill={star <= selectedSwap.rating! ? 'currentColor' : 'none'}
                      />
                    ))}
                    <span className="ml-2 text-gray-600">{selectedSwap.rating}/5</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
