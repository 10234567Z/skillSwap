'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Navbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { RequestPopup } from '@/components/features/RequestPopup'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api-client'
import type { PublicUser } from '@/types'
import { 
  Loader2, 
  AlertCircle, 
  MapPin, 
  Star, 
  Clock, 
  ArrowLeft,
  User as UserIcon,
  Award,
  Calendar
} from 'lucide-react'

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const { user: currentUser, logout, isLoggedIn } = useAuth()
  
  const [user, setUser] = useState<PublicUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRequestPopup, setShowRequestPopup] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return

      try {
        setIsLoading(true)
        setError(null)
        
        const response = await apiClient.get<{
          success: boolean
          data: PublicUser
        }>(`/api/users/${userId}`)
        
        if (response.success && response.data) {
          setUser(response.data)
        } else {
          throw new Error('User not found')
        }
      } catch (err) {
        console.error('Error fetching user:', err)
        setError(err instanceof Error ? err.message : 'Failed to load user profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [userId])

  const handleRequestClick = () => {
    if (!isLoggedIn) {
      // Redirect to login if not authenticated
      window.location.href = '/auth/login'
      return
    }
    
    setShowRequestPopup(true)
  }

  const getSkillLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'intermediate': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'advanced': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'expert': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={currentUser} onLogout={logout} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
            <span className="ml-3 text-gray-600">Loading profile...</span>
          </div>
        </main>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={currentUser} onLogout={logout} />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
            <p className="text-gray-600 mb-4">
              {error || 'The user profile you are looking for could not be found.'}
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </main>
      </div>
    )
  }

  const isOwnProfile = currentUser?.id === userId

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={currentUser} onLogout={logout} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Users
          </Link>
        </div>

        {/* Profile Header */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Profile Photo */}
            <div className="flex-shrink-0">
              {user.profilePhoto ? (
                <Image
                  src={user.profilePhoto}
                  alt={user.name}
                  width={120}
                  height={120}
                  className="w-24 h-24 sm:w-30 sm:h-30 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 sm:w-30 sm:h-30 rounded-full bg-gray-300 flex items-center justify-center">
                  <UserIcon className="h-12 w-12 text-gray-600" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                {user.name}
              </h1>
              
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
                {user.location && (
                  <div className="flex items-center justify-center sm:justify-start text-gray-600">
                    <MapPin className="h-5 w-5 mr-2" />
                    <span>{user.location}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-center sm:justify-start text-gray-600">
                  <Star className="h-5 w-5 text-yellow-400 fill-current mr-2" />
                  <span className="font-medium">
                    {user.averageRating > 0 ? `${user.averageRating}/5` : 'No rating'}
                  </span>
                  {user.totalRatings > 0 && (
                    <span className="text-sm text-gray-500 ml-1">
                      ({user.totalRatings} reviews)
                    </span>
                  )}
                </div>
              </div>

              {/* Availability */}
              {user.availability.length > 0 && (
                <div className="flex items-center justify-center sm:justify-start text-gray-600 mb-4">
                  <Clock className="h-5 w-5 mr-2" />
                  <span>Available: {user.availability.join(', ')}</span>
                </div>
              )}

              {/* Action Button */}
              {!isOwnProfile && isLoggedIn && (
                <div className="flex justify-center sm:justify-start">
                  <Button
                    variant="primary"
                    onClick={handleRequestClick}
                    className="px-6"
                  >
                    Request Skill Exchange
                  </Button>
                </div>
              )}
              
              {isOwnProfile && (
                <div className="flex justify-center sm:justify-start">
                  <Link href="/profile">
                    <Button variant="secondary" className="px-6">
                      Edit Profile
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Skills Offered */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Award className="h-6 w-6 text-green-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Skills Offered</h2>
            </div>
            
            {user.skillsOffered.length > 0 ? (
              <div className="space-y-3">
                {user.skillsOffered.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <h3 className="font-medium text-green-900">{skill.name}</h3>
                      {skill.category && (
                        <p className="text-sm text-green-700">{skill.category}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSkillLevelColor(skill.level)}`}>
                      {skill.level}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Award className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No skills offered yet</p>
              </div>
            )}
          </div>

          {/* Skills Wanted */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-6 w-6 text-blue-600 mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Skills Wanted</h2>
            </div>
            
            {user.skillsWanted.length > 0 ? (
              <div className="space-y-3">
                {user.skillsWanted.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <h3 className="font-medium text-blue-900">{skill.name}</h3>
                      {skill.category && (
                        <p className="text-sm text-blue-700">{skill.category}</p>
                      )}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSkillLevelColor(skill.level)}`}>
                      {skill.level}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No skills wanted yet</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Request Popup */}
      {showRequestPopup && user && currentUser && (
        <RequestPopup
          isOpen={showRequestPopup}
          targetUser={user}
          currentUserId={currentUser.id}
          onClose={() => setShowRequestPopup(false)}
        />
      )}
    </div>
  )
}
