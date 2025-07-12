'use client'

import { useState, useEffect } from 'react'
import { apiClient } from '@/lib/api-client'
import { 
  AlertCircle,
  Info,
  CheckCircle,
  X
} from 'lucide-react'

interface AdminMessage {
  id: string
  title: string
  content: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR'
  isActive: boolean
  createdAt: string
}

export function GlobalMessageBanner() {
  const [messages, setMessages] = useState<AdminMessage[]>([])
  const [dismissedMessages, setDismissedMessages] = useState<string[]>([])

  useEffect(() => {
    fetchActiveMessages()
    
    // Load dismissed messages from localStorage
    const dismissed = localStorage.getItem('dismissedMessages')
    if (dismissed) {
      setDismissedMessages(JSON.parse(dismissed))
    }
  }, [])

  const fetchActiveMessages = async () => {
    try {
      const response = await apiClient.get<{
        success: boolean
        data: AdminMessage[]
      }>('/api/global-messages')
      
      if (response.success && response.data) {
        setMessages(response.data.filter(msg => msg.isActive))
      }
    } catch (err) {
      console.error('Error fetching global messages:', err)
    }
  }

  const dismissMessage = (messageId: string) => {
    const newDismissed = [...dismissedMessages, messageId]
    setDismissedMessages(newDismissed)
    localStorage.setItem('dismissedMessages', JSON.stringify(newDismissed))
  }

  const getMessageStyles = (type: string) => {
    switch (type) {
      case 'INFO':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-800',
          icon: <Info className="h-5 w-5 text-blue-600" />
        }
      case 'WARNING':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-800',
          icon: <AlertCircle className="h-5 w-5 text-yellow-600" />
        }
      case 'SUCCESS':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-800',
          icon: <CheckCircle className="h-5 w-5 text-green-600" />
        }
      case 'ERROR':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-800',
          icon: <AlertCircle className="h-5 w-5 text-red-600" />
        }
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-800',
          icon: <Info className="h-5 w-5 text-gray-600" />
        }
    }
  }

  const visibleMessages = messages.filter(msg => !dismissedMessages.includes(msg.id))

  if (visibleMessages.length === 0) {
    return null
  }

  return (
    <div className="space-y-2">
      {visibleMessages.map((message) => {
        const styles = getMessageStyles(message.type)
        return (
          <div
            key={message.id}
            className={`${styles.bg} ${styles.border} border rounded-lg p-4`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {styles.icon}
              </div>
              <div className="ml-3 flex-1">
                <h3 className={`text-sm font-medium ${styles.text}`}>
                  {message.title}
                </h3>
                <p className={`mt-1 text-sm ${styles.text}`}>
                  {message.content}
                </p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => dismissMessage(message.id)}
                    className={`inline-flex rounded-md p-1.5 ${styles.text} hover:bg-opacity-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-transparent`}
                  >
                    <span className="sr-only">Dismiss</span>
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
