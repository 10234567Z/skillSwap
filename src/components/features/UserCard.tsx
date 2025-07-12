'use client'

import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Star, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import type { UserCardProps } from '@/types'

const userColors = [
  'text-green-600',
  'text-blue-600', 
  'text-purple-600',
  'text-orange-600',
  'text-pink-600',
  'text-indigo-600',
  'text-yellow-600',
  'text-red-600',
]

export function UserCard({ user, isLoggedIn, onRequestClick }: UserCardProps) {
  // Generate consistent color based on user ID
  const colorIndex = user.id.charCodeAt(0) % userColors.length
  const nameColor = userColors[colorIndex]

  const handleRequestClick = () => {
    onRequestClick(user.id)
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        {/* Profile Photo */}
        <div className="flex-shrink-0 self-center sm:self-start">
          <Link href={`/profile/${user.id}`} className="block">
            {user.profilePhoto ? (
              <Image
                src={user.profilePhoto}
                alt={user.name}
                width={80}
                height={80}
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover hover:ring-2 hover:ring-teal-500 transition-all cursor-pointer"
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-300 flex items-center justify-center hover:ring-2 hover:ring-teal-500 transition-all cursor-pointer">
                <span className="text-xl sm:text-2xl font-semibold text-gray-600">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* User Info & Skills */}
        <div className="flex-1 min-w-0 w-full">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-3">
            <div className="flex-1">
              <h3 className={`text-lg sm:text-xl font-semibold ${nameColor} text-center sm:text-left`}>
                {user.name}
              </h3>
              
              {user.location && (
                <div className="flex items-center justify-center sm:justify-start text-sm text-gray-600 mt-1">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="truncate">{user.location}</span>
                </div>
              )}
            </div>

            {/* Rating & Request Button */}
            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 flex-shrink-0">
              <div className="text-center sm:text-right">
                <div className="flex items-center justify-center sm:justify-end mb-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                  <span className="text-sm font-medium text-gray-700">
                    {user.averageRating > 0 ? `${user.averageRating}/5` : 'No rating'}
                  </span>
                </div>
                {user.totalRatings > 0 && (
                  <span className="text-xs text-gray-500">
                    ({user.totalRatings} reviews)
                  </span>
                )}
              </div>
              
              <Button
                variant="primary"
                size="sm"
                onClick={handleRequestClick}
                disabled={!isLoggedIn}
                className="px-4 sm:px-6 w-full sm:w-auto"
              >
                {isLoggedIn ? 'Request' : 'Login to Request'}
              </Button>
            </div>
          </div>

          {/* Skills Row */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-start sm:items-center">
            {/* Skills Offered */}
            {user.skillsOffered.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <span className="text-sm font-medium text-green-700 whitespace-nowrap">Skills Offered →</span>
                <div className="flex flex-wrap gap-1">
                  {user.skillsOffered.slice(0, 3).map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                    >
                      {skill.name}
                    </span>
                  ))}
                  {user.skillsOffered.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      +{user.skillsOffered.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Skills Wanted */}
            {user.skillsWanted.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                <span className="text-sm font-medium text-blue-700 whitespace-nowrap">Skills Wanted →</span>
                <div className="flex flex-wrap gap-1">
                  {user.skillsWanted.slice(0, 3).map((skill) => (
                    <span
                      key={skill.id}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200"
                    >
                      {skill.name}
                    </span>
                  ))}
                  {user.skillsWanted.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      +{user.skillsWanted.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Availability */}
          {user.availability.length > 0 && (
            <div className="flex items-center justify-center sm:justify-start text-sm text-gray-600 mt-2">
              <Clock className="h-4 w-4 mr-1" />
              <span className="text-center sm:text-left">Available: {user.availability.join(', ')}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
