'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/Navbar'
import { Breadcrumb } from '@/components/ui/Breadcrumb'
import { useAuth } from '@/contexts/AuthContext'
import { apiClient } from '@/lib/api-client'
import { AVAILABILITY_OPTIONS } from '@/lib/constants'
import { User, Save, Loader2, Plus, X } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  location: string
  profilePhoto?: string
  isPublic: boolean
  availability: string[]
  skillsOffered: Array<{
    id: string
    skillId: string
    skillName: string
    level: string
  }>
  skillsWanted: Array<{
    id: string
    skillId: string
    skillName: string
    level: string
  }>
}

interface Skill {
  id: string
  name: string
  category: string
}

export default function ProfilePage() {
  const { user, logout, isLoggedIn } = useAuth()
  const router = useRouter()
  const [skills, setSkills] = useState<Skill[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    profilePhoto: '',
    isPublic: true,
    availability: [] as string[]
  })

  // Skills state
  const [skillsOffered, setSkillsOffered] = useState<Array<{
    id: string
    skillId: string
    skillName: string
    level: string
  }>>([])
  
  const [skillsWanted, setSkillsWanted] = useState<Array<{
    id: string
    skillId: string
    skillName: string
    level: string
  }>>([])

  const [newSkillType, setNewSkillType] = useState<'OFFERED' | 'WANTED'>('OFFERED')
  const [newSkillId, setNewSkillId] = useState('')
  const [newSkillLevel, setNewSkillLevel] = useState('BEGINNER')

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/auth/login')
      return
    }
  }, [isLoggedIn, router])

  // Fetch profile and skills
  useEffect(() => {
    if (!user) return

    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch user profile and skills in parallel
        const [profileResponse, skillsResponse] = await Promise.all([
          apiClient.get(`/api/profile`),
          apiClient.get('/api/skills')
        ])

        if (profileResponse && typeof profileResponse === 'object' && 'success' in profileResponse && profileResponse.success && 'data' in profileResponse && profileResponse.data) {
          const profileData = profileResponse.data as UserProfile
          setSkillsOffered(profileData.skillsOffered || [])
          setSkillsWanted(profileData.skillsWanted || [])
          setFormData({
            name: profileData.name || '',
            location: profileData.location || '',
            profilePhoto: profileData.profilePhoto || '',
            isPublic: profileData.isPublic ?? true,
            availability: profileData.availability || []
          })
        }

        if (skillsResponse && typeof skillsResponse === 'object' && 'success' in skillsResponse && skillsResponse.success && 'data' in skillsResponse && skillsResponse.data) {
          setSkills(skillsResponse.data as Skill[])
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load profile data')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user])

  const handleInputChange = (field: string, value: string | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAvailabilityChange = (option: string) => {
    setFormData(prev => ({
      ...prev,
      availability: prev.availability.includes(option)
        ? prev.availability.filter(a => a !== option)
        : [...prev.availability, option]
    }))
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccess(null)

      const response = await apiClient.put('/api/profile', formData)

      if (response && typeof response === 'object' && 'success' in response && response.success) {
        setSuccess('Profile updated successfully!')
        // Profile data is updated via formData state
      } else {
        throw new Error('Failed to update profile')
      }
    } catch (err) {
      console.error('Error saving profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setIsSaving(false)
    }
  }

  const addSkill = async () => {
    if (!newSkillId) return

    try {
      const response = await apiClient.post('/api/profile/skills', {
        skillId: newSkillId,
        type: newSkillType,
        level: newSkillLevel
      })

      if (response && typeof response === 'object' && 'success' in response && response.success && 'data' in response) {
        const newSkill = response.data as { id: string; skillId: string; skillName: string; level: string }
        if (newSkillType === 'OFFERED') {
          setSkillsOffered(prev => [...prev, newSkill])
        } else {
          setSkillsWanted(prev => [...prev, newSkill])
        }
        
        // Reset form
        setNewSkillId('')
        setNewSkillLevel('BEGINNER')
        setSuccess(`Skill added successfully!`)
      }
    } catch (err) {
      console.error('Error adding skill:', err)
      setError('Failed to add skill')
    }
  }

  const removeSkill = async (userSkillId: string, type: 'OFFERED' | 'WANTED') => {
    try {
      const response = await apiClient.delete(`/api/profile/skills/${userSkillId}`)

      if (response && typeof response === 'object' && 'success' in response && response.success) {
        if (type === 'OFFERED') {
          setSkillsOffered(prev => prev.filter(s => s.id !== userSkillId))
        } else {
          setSkillsWanted(prev => prev.filter(s => s.id !== userSkillId))
        }
        setSuccess('Skill removed successfully!')
      }
    } catch (err) {
      console.error('Error removing skill:', err)
      setError('Failed to remove skill')
    }
  }

  if (!isLoggedIn) {
    return null // Will redirect
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar user={user} onLogout={logout} />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
          <span className="ml-2 text-gray-600">Loading profile...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar user={user} onLogout={logout} />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[{ label: 'Profile' }]} />
        
        <div className="bg-white rounded-lg shadow-md p-6">
          {/* Header */}
          <div className="flex items-center mb-6">
            <User className="h-6 w-6 text-teal-600 mr-2" />
            <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-800">{error}</p>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-green-800">{success}</p>
            </div>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                  placeholder="City, State/Country"
                />
              </div>
            </div>

            {/* Profile Photo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Profile Photo URL
              </label>
              <input
                type="url"
                value={formData.profilePhoto}
                onChange={(e) => handleInputChange('profilePhoto', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900"
                placeholder="https://example.com/your-photo.jpg"
              />
            </div>

            {/* Public Profile Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => handleInputChange('isPublic', e.target.checked)}
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
              />
              <label htmlFor="isPublic" className="ml-2 text-sm text-gray-700">
                Make my profile public (visible to other users)
              </label>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Availability
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {AVAILABILITY_OPTIONS.map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.availability.includes(option)}
                      onChange={() => handleAvailabilityChange(option)}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700 capitalize">
                      {option}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Skills Management */}
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Manage Your Skills</h3>
              
              {/* Add New Skill */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Skill</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <select
                      value={newSkillType}
                      onChange={(e) => setNewSkillType(e.target.value as 'OFFERED' | 'WANTED')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900"
                    >
                      <option value="OFFERED">I Offer</option>
                      <option value="WANTED">I Want</option>
                    </select>
                  </div>
                  <div>
                    <select
                      value={newSkillId}
                      onChange={(e) => setNewSkillId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900"
                    >
                      <option value="">Select Skill</option>
                      {skills.map((skill: Skill) => (
                        <option key={skill.id} value={skill.id}>
                          {skill.name} ({skill.category})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <select
                      value={newSkillLevel}
                      onChange={(e) => setNewSkillLevel(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900"
                    >
                      <option value="BEGINNER">Beginner</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                      <option value="EXPERT">Expert</option>
                    </select>
                  </div>
                  <button
                    onClick={addSkill}
                    disabled={!newSkillId}
                    className="flex items-center justify-center px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </button>
                </div>
              </div>

              {/* Skills Offered */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Skills You Offer</h4>
                {skillsOffered.length > 0 ? (
                  <div className="space-y-2">
                    {skillsOffered.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
                      >
                        <div>
                          <span className="font-medium text-green-800">{skill.skillName}</span>
                          <span className="ml-2 text-sm text-green-600">({skill.level})</span>
                        </div>
                        <button
                          onClick={() => removeSkill(skill.id, 'OFFERED')}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No skills offered yet. Add some above!</p>
                )}
              </div>

              {/* Skills Wanted */}
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3">Skills You Want to Learn</h4>
                {skillsWanted.length > 0 ? (
                  <div className="space-y-2">
                    {skillsWanted.map((skill) => (
                      <div
                        key={skill.id}
                        className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg"
                      >
                        <div>
                          <span className="font-medium text-blue-800">{skill.skillName}</span>
                          <span className="ml-2 text-sm text-blue-600">({skill.level})</span>
                        </div>
                        <button
                          onClick={() => removeSkill(skill.id, 'WANTED')}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No skills wanted yet. Add some above!</p>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-6">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center px-6 py-2 bg-teal-600 text-white font-medium rounded-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
