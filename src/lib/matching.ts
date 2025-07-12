import type { PublicUser } from '@/types'

export interface MatchScore {
  userId: string
  score: number
  matchedSkills: Array<{
    userOffered: string
    otherWanted: string
    levelDifference: number
  }>
}

/**
 * Calculate skill match score between users
 * Algorithm considers:
 * - Mutual skill exchange potential (user A offers what user B wants, vice versa)
 * - Skill level compatibility (closer levels = higher score)
 * - Location proximity (same location = bonus)
 * - Availability overlap (shared availability = bonus)
 */
export function calculateMatchScore(
  currentUser: PublicUser,
  otherUser: PublicUser
): MatchScore {
  let score = 0
  const matchedSkills: MatchScore['matchedSkills'] = []

  // Skill level weights
  const levelValues = { BEGINNER: 1, INTERMEDIATE: 2, ADVANCED: 3, EXPERT: 4 }

  // 1. Find mutual skill exchange opportunities (70% of score)
  currentUser.skillsOffered.forEach(offeredSkill => {
    const matchingWanted = otherUser.skillsWanted.find(
      wantedSkill => wantedSkill.name === offeredSkill.name
    )
    
    if (matchingWanted) {
      const levelDiff = Math.abs(
        levelValues[offeredSkill.level] - levelValues[matchingWanted.level]
      )
      
      // Higher score for closer skill levels
      const skillScore = Math.max(0, 25 - (levelDiff * 5))
      score += skillScore
      
      matchedSkills.push({
        userOffered: offeredSkill.name,
        otherWanted: matchingWanted.name,
        levelDifference: levelDiff
      })
    }
  })

  // 2. Reverse direction - what other user offers that current user wants
  otherUser.skillsOffered.forEach(offeredSkill => {
    const matchingWanted = currentUser.skillsWanted.find(
      wantedSkill => wantedSkill.name === offeredSkill.name
    )
    
    if (matchingWanted) {
      const levelDiff = Math.abs(
        levelValues[offeredSkill.level] - levelValues[matchingWanted.level]
      )
      
      const skillScore = Math.max(0, 25 - (levelDiff * 5))
      score += skillScore
    }
  })

  // 3. Location bonus (15% of score)
  if (currentUser.location && otherUser.location) {
    const currentCity = currentUser.location.split(',')[0].trim().toLowerCase()
    const otherCity = otherUser.location.split(',')[0].trim().toLowerCase()
    
    if (currentCity === otherCity) {
      score += 15 // Same city bonus
    }
  }

  // 4. Availability overlap bonus (15% of score)
  const availabilityOverlap = currentUser.availability.filter(
    slot => otherUser.availability.includes(slot)
  ).length
  
  score += Math.min(15, availabilityOverlap * 5) // Max 15 points

  return {
    userId: otherUser.id,
    score: Math.round(score),
    matchedSkills
  }
}

/**
 * Sort users by match compatibility
 */
export function sortUsersByMatch(
  currentUser: PublicUser,
  users: PublicUser[]
): { user: PublicUser; matchScore: MatchScore }[] {
  return users
    .map(user => ({
      user,
      matchScore: calculateMatchScore(currentUser, user)
    }))
    .sort((a, b) => b.matchScore.score - a.matchScore.score)
}
