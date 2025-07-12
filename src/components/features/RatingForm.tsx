'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { apiClient } from '@/lib/api-client'
import type { RatingFormData } from '@/types'
import { Star, MessageSquare, Send } from 'lucide-react'

interface RatingFormProps {
  swapRequestId: string
  otherUserName: string
  onSuccess: () => void
  onCancel: () => void
}

export function RatingForm({ swapRequestId, otherUserName, onSuccess, onCancel }: RatingFormProps) {
  const [rating, setRating] = useState<number>(0)
  const [hoverRating, setHoverRating] = useState<number>(0)
  const [feedback, setFeedback] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (rating === 0) {
      setError('Please select a rating')
      return
    }

    try {
      setIsLoading(true)
      setError(null)
      
      const ratingData: RatingFormData = {
        rating,
        feedback: feedback.trim() || undefined
      }
      
      const response = await apiClient.post('/api/ratings', {
        swapRequestId,
        ...ratingData
      })
      
      if (response && typeof response === 'object' && 'success' in response && response.success) {
        onSuccess()
      } else {
        throw new Error('Failed to submit rating')
      }
    } catch (err) {
      console.error('Error submitting rating:', err)
      setError(err instanceof Error ? err.message : 'Failed to submit rating')
    } finally {
      setIsLoading(false)
    }
  }

  const renderStars = () => {
    return Array.from({ length: 5 }, (_, index) => {
      const starValue = index + 1
      const isActive = starValue <= (hoverRating || rating)
      
      return (
        <button
          key={index}
          type="button"
          onClick={() => setRating(starValue)}
          onMouseEnter={() => setHoverRating(starValue)}
          onMouseLeave={() => setHoverRating(0)}
          className={`p-1 transition-colors ${
            isActive 
              ? 'text-yellow-400' 
              : 'text-gray-300 hover:text-yellow-300'
          }`}
          disabled={isLoading}
        >
          <Star 
            className={`h-8 w-8 ${isActive ? 'fill-current' : ''}`} 
          />
        </button>
      )
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Rate your experience with {otherUserName}
        </h3>
        <p className="text-sm text-gray-600">
          Help other users by sharing your experience with this skill exchange.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Star Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Rating *
          </label>
          <div className="flex items-center gap-1">
            {renderStars()}
            {rating > 0 && (
              <span className="ml-3 text-sm text-gray-600">
                {rating} out of 5 stars
              </span>
            )}
          </div>
        </div>

        {/* Feedback */}
        <div>
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="h-4 w-4 inline mr-1" />
            Feedback (optional)
          </label>
          <textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Share details about your experience, communication, teaching quality, etc..."
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-500"
            maxLength={1000}
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 mt-1">{feedback.length}/1000 characters</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || rating === 0}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Rating
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
