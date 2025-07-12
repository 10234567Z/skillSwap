'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import type { Skill } from '@/types'
import { Button } from '@/components/ui/Button'
import { 
  CheckCircle, 
  XCircle, 
  Award,
  Search,
  Filter,
  Clock
} from 'lucide-react'

interface SkillWithApproval extends Skill {
  isApproved: boolean
  createdAt: string
  userCount?: number
}

interface SkillManagementProps {
  onRefresh?: () => void
}

export function SkillManagement({ onRefresh }: SkillManagementProps) {
  const [skills, setSkills] = useState<SkillWithApproval[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchSkills()
  }, [])

  const fetchSkills = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await apiClient.get<{
        success: boolean
        data: SkillWithApproval[]
      }>('/api/admin/data/skills')
      
      if (response.success && response.data) {
        setSkills(response.data)
      } else {
        throw new Error('Failed to fetch skills')
      }
    } catch (err) {
      console.error('Error fetching skills:', err)
      setError(err instanceof Error ? err.message : 'Failed to load skills')
    } finally {
      setIsLoading(false)
    }
  }

  const handleApproveSkill = async (skillId: string) => {
    try {
      setActionLoading(skillId)
      
      const response = await apiClient.post<{
        success: boolean
        error?: string
      }>('/api/admin/actions/approve-skill', {
        skillId,
        approved: true
      })
      
      if (response.success) {
        // Update skill status in local state immediately
        setSkills(prev => prev.map(skill => 
          skill.id === skillId 
            ? { ...skill, isApproved: true }
            : skill
        ))
        setSuccessMessage('Skill approved successfully')
        setTimeout(() => setSuccessMessage(null), 3000)
        onRefresh?.()
      } else {
        throw new Error(response.error || 'Failed to approve skill')
      }
    } catch (err) {
      console.error('Error approving skill:', err)
      alert(err instanceof Error ? err.message : 'Failed to approve skill')
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectSkill = async (skillId: string) => {
    if (!confirm('Are you sure you want to reject this skill? This will remove it from the platform.')) {
      return
    }

    try {
      setActionLoading(skillId)
      
      const response = await apiClient.post<{
        success: boolean
        error?: string
      }>('/api/admin/actions/approve-skill', {
        skillId,
        approved: false
      })
      
      if (response.success) {
        // Remove skill from local state immediately
        setSkills(prev => prev.filter(skill => skill.id !== skillId))
        setSuccessMessage('Skill rejected and removed successfully')
        setTimeout(() => setSuccessMessage(null), 3000)
        onRefresh?.()
      } else {
        throw new Error(response.error || 'Failed to reject skill')
      }
    } catch (err) {
      console.error('Error rejecting skill:', err)
      alert(err instanceof Error ? err.message : 'Failed to reject skill')
    } finally {
      setActionLoading(null)
    }
  }

  const filteredSkills = skills.filter(skill => {
    const matchesSearch = skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         skill.category?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'pending' && !skill.isApproved) ||
                         (filter === 'approved' && skill.isApproved)
    
    return matchesSearch && matchesFilter
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
          onClick={fetchSkills}
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
      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <p className="text-green-800">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search skills by name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-gray-900"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-gray-900"
          >
            <option value="all">All Skills</option>
            <option value="pending">Pending Approval</option>
            <option value="approved">Approved</option>
          </select>
        </div>
      </div>

      {/* Skill List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Skills ({filteredSkills.length})
          </h3>
        </div>
        
        {filteredSkills.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No skills found matching your criteria.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredSkills.map((skill) => (
              <div key={skill.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <Award className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {skill.name}
                      </p>
                      {skill.isApproved ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </div>
                    {skill.category && (
                      <p className="text-sm text-gray-500">{skill.category}</p>
                    )}
                    {skill.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{skill.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-1">
                      {skill.userCount && (
                        <p className="text-xs text-gray-400">
                          {skill.userCount} users have this skill
                        </p>
                      )}
                      <p className="text-xs text-gray-400">
                        Added: {new Date(skill.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {!skill.isApproved && (
                    <>
                      <Button
                        onClick={() => handleApproveSkill(skill.id)}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === skill.id}
                        className="text-green-600 border-green-300 hover:bg-green-50"
                      >
                        {actionLoading === skill.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleRejectSkill(skill.id)}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading === skill.id}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {actionLoading === skill.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
