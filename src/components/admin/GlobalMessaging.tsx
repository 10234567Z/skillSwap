'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  MessageSquare, 
  Send,
  AlertCircle,
  Info,
  CheckCircle,
  Trash2,
  Eye,
  EyeOff
} from 'lucide-react'

interface AdminMessage {
  id: string
  title: string
  content: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface GlobalMessagingProps {
  onRefresh?: () => void
}

export function GlobalMessaging({ onRefresh }: GlobalMessagingProps) {
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    type: 'INFO' as 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'
  })

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await apiClient.get<{
        success: boolean
        data: AdminMessage[]
      }>('/api/admin/data/messages')
      
      if (response.success && response.data) {
        setMessages(response.data)
      } else {
        throw new Error('Failed to fetch messages')
      }
    } catch (err) {
      console.error('Error fetching messages:', err)
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('Please fill in all fields')
      return
    }

    try {
      setActionLoading('create')
      
      const response = await apiClient.post<{
        success: boolean
        error?: string
      }>('/api/admin/actions/global-message', {
        title: formData.title.trim(),
        content: formData.content.trim(),
        type: formData.type
      })
      
      if (response.success) {
        setFormData({ title: '', content: '', type: 'INFO' })
        setShowForm(false)
        setSuccessMessage('Global message created successfully')
        setTimeout(() => setSuccessMessage(null), 3000)
        await fetchMessages()
        onRefresh?.()
      } else {
        throw new Error(response.error || 'Failed to create message')
      }
    } catch (err) {
      console.error('Error creating message:', err)
      alert(err instanceof Error ? err.message : 'Failed to create message')
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleMessage = async (messageId: string, isActive: boolean) => {
    try {
      setActionLoading(messageId)
      
      const response = await apiClient.post<{
        success: boolean
        error?: string
      }>(`/api/admin/actions/toggle-message`, {
        messageId,
        isActive: !isActive
      })
      
      if (response.success) {
        // Update message status in local state immediately
        setMessages(prev => prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, isActive: !isActive }
            : msg
        ))
        setSuccessMessage(`Message ${!isActive ? 'activated' : 'deactivated'} successfully`)
        setTimeout(() => setSuccessMessage(null), 3000)
        onRefresh?.()
      } else {
        throw new Error(response.error || 'Failed to toggle message')
      }
    } catch (err) {
      console.error('Error toggling message:', err)
      alert(err instanceof Error ? err.message : 'Failed to toggle message')
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message? This action cannot be undone.')) {
      return
    }

    try {
      setActionLoading(messageId)
      
      const response = await apiClient.delete<{
        success: boolean
        error?: string
      }>(`/api/admin/actions/delete-message/${messageId}`)
      
      if (response.success) {
        // Remove message from local state immediately
        setMessages(prev => prev.filter(msg => msg.id !== messageId))
        setSuccessMessage('Message deleted successfully')
        setTimeout(() => setSuccessMessage(null), 3000)
        onRefresh?.()
      } else {
        throw new Error(response.error || 'Failed to delete message')
      }
    } catch (err) {
      console.error('Error deleting message:', err)
      alert(err instanceof Error ? err.message : 'Failed to delete message')
    } finally {
      setActionLoading(null)
    }
  }

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'INFO':
        return <Info className="h-5 w-5 text-blue-600" />
      case 'WARNING':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'ERROR':
        return <AlertCircle className="h-5 w-5 text-red-600" />
      default:
        return <Info className="h-5 w-5 text-gray-600" />
    }
  }

  const getMessageBorderColor = (type: string) => {
    switch (type) {
      case 'INFO':
        return 'border-l-blue-500'
      case 'WARNING':
        return 'border-l-yellow-500'
      case 'SUCCESS':
        return 'border-l-green-500'
      case 'ERROR':
        return 'border-l-red-500'
      default:
        return 'border-l-gray-500'
    }
  }

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
          onClick={fetchMessages}
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

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Global Messages</h3>
          <p className="text-sm text-gray-600">Create and manage platform-wide announcements</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-orange-600 hover:bg-orange-700"
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          New Message
        </Button>
      </div>

      {/* Create Message Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Create Global Message</h4>
          <form onSubmit={handleCreateMessage} className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Title
              </label>
              <Input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter message title..."
                required
                className="text-gray-900"
              />
            </div>
            
            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-gray-900"
              >
                <option value="INFO">Info</option>
                <option value="WARNING">Warning</option>
                <option value="SUCCESS">Success</option>
                <option value="ERROR">Error</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Content
              </label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter message content..."
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-orange-500 focus:border-orange-500 text-gray-900"
                required
              />
            </div>
            
            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={actionLoading === 'create'}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {actionLoading === 'create' ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Create Message
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Messages List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Messages ({messages.length})
          </h3>
        </div>
        
        {messages.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No global messages created yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {messages.map((message) => (
              <div key={message.id} className={`p-6 border-l-4 ${getMessageBorderColor(message.type)}`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="flex-shrink-0 mt-1">
                      {getMessageIcon(message.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-lg font-medium text-gray-900">{message.title}</h4>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          message.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {message.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {message.type}
                        </span>
                      </div>
                      <p className="text-gray-700 mt-2">{message.content}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        Created: {new Date(message.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      onClick={() => handleToggleMessage(message.id, message.isActive)}
                      variant="outline"
                      size="sm"
                      disabled={actionLoading === message.id}
                    >
                      {actionLoading === message.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                      ) : message.isActive ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => handleDeleteMessage(message.id)}
                      variant="outline"
                      size="sm"
                      disabled={actionLoading === message.id}
                      className="text-red-600 border-red-300 hover:bg-red-50"
                    >
                      {actionLoading === message.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
