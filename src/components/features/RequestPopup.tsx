'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { apiClient } from '@/lib/api-client'
import type { PublicUser, UserSkill } from '@/types'
import { X, ArrowRightLeft, User, MessageSquare, Send } from 'lucide-react'

interface RequestPopupProps {
  isOpen: boolean
  onClose: () => void
  targetUser: PublicUser
  currentUserId: string
}

export function RequestPopup({ isOpen, onClose, targetUser, currentUserId }: RequestPopupProps) {
  const [currentUserSkills, setCurrentUserSkills] = useState<UserSkill[]>([])
  const [selectedSenderSkill, setSelectedSenderSkill] = useState<string>('')
  const [selectedReceiverSkill, setSelectedReceiverSkill] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSkills, setIsLoadingSkills] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Fetch current user's skills when popup opens
  useEffect(() => {
    if (isOpen && currentUserId) {
      fetchCurrentUserSkills()
    }
  }, [isOpen, currentUserId])

  // Reset form when popup opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedSenderSkill('')
      setSelectedReceiverSkill('')
      setMessage('')
      setError(null)
      setSuccess(false)
    }
  }, [isOpen])

  const fetchCurrentUserSkills = async () => {
    try {
      setIsLoadingSkills(true)
      setError(null)
      
      const response = await apiClient.get<{
        success: boolean
        data: PublicUser
      }>(`/api/users/${currentUserId}`)
      
      if (response.success && response.data) {
        setCurrentUserSkills(response.data.skillsOffered)
      } else {
        throw new Error('Failed to fetch your skills')
      }
    } catch (err) {
      console.error('Error fetching current user skills:', err)
      setError(err instanceof Error ? err.message : 'Failed to load your skills')
    } finally {
      setIsLoadingSkills(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSenderSkill || !selectedReceiverSkill) {
      setError('Please select both skills for the exchange')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const requestData = {
        receiverId: targetUser.id,
        senderSkillId: selectedSenderSkill,
        receiverSkillId: selectedReceiverSkill,
        message: message.trim() || undefined
      }
      
      const response = await apiClient.post('/api/requests', requestData)
      
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        setSuccess(true)
        // Auto-close after 2 seconds
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        throw new Error('Failed to send request')
      }
    } catch (err) {
      console.error('Error sending request:', err)
      setError(err instanceof Error ? err.message : 'Failed to send swap request')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 backdrop-blur-sm bg-white/20 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Request Skill Exchange</h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Send className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Request Sent!</h3>
              <p className="text-gray-600">
                Your skill exchange request has been sent to {targetUser.name}.
              </p>
            </div>
          ) : (
            <>
              {/* Target User Info */}
              <div className="flex items-center gap-3 mb-6 p-3 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{targetUser.name}</p>
                  <p className="text-sm text-gray-500">
                    {targetUser.location && `${targetUser.location} • `}
                    {targetUser.skillsOffered.length} skills offered
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Skills Exchange */}
                <div className="space-y-4">
                  <div className="text-center">
                    <ArrowRightLeft className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-700">Select skills to exchange</p>
                  </div>

                  {/* Your Skill */}
                  <div>
                    <label htmlFor="sender-skill" className="block text-sm font-medium text-gray-700 mb-2">
                      Your skill to offer
                    </label>
                    {isLoadingSkills ? (
                      <div className="h-10 bg-gray-100 rounded-md animate-pulse"></div>
                    ) : currentUserSkills.length > 0 ? (
                      <Select
                        id="sender-skill"
                        value={selectedSenderSkill}
                        onChange={(e) => setSelectedSenderSkill(e.target.value)}
                        options={[
                          { value: '', label: 'Select a skill you offer...' },
                          ...currentUserSkills.map(skill => ({
                            value: skill.id,
                            label: `${skill.name} (${skill.level})`
                          }))
                        ]}
                        required
                      />
                    ) : (
                      <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-md">
                        You need to add skills to your profile first.
                      </div>
                    )}
                  </div>

                  {/* Their Skill */}
                  <div>
                    <label htmlFor="receiver-skill" className="block text-sm font-medium text-gray-700 mb-2">
                      Skill you want to learn
                    </label>
                    {targetUser.skillsOffered.length > 0 ? (
                      <Select
                        id="receiver-skill"
                        value={selectedReceiverSkill}
                        onChange={(e) => setSelectedReceiverSkill(e.target.value)}
                        options={[
                          { value: '', label: 'Select a skill to learn...' },
                          ...targetUser.skillsOffered.map(skill => ({
                            value: skill.id,
                            label: `${skill.name} (${skill.level})`
                          }))
                        ]}
                        required
                      />
                    ) : (
                      <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded-md">
                        This user hasn&apos;t added any skills yet.
                      </div>
                    )}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    <MessageSquare className="h-4 w-4 inline mr-1" />
                    Message (optional)
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Introduce yourself and explain why you'd like to exchange skills..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-500 mt-1">{message.length}/500 characters</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isLoading || isLoadingSkills || currentUserSkills.length === 0 || targetUser.skillsOffered.length === 0}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Request
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
