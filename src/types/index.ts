// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// User Types
export interface User {
  id: string
  name: string
  email: string
  location?: string
  profilePhoto?: string
  availability: string[]
  isPublic: boolean
  role: 'USER' | 'ADMIN'
  isBanned: boolean
  createdAt: string
  updatedAt: string
}

export interface PublicUser {
  id: string
  name: string
  location?: string
  profilePhoto?: string
  availability: string[]
  skillsOffered: UserSkill[]
  skillsWanted: UserSkill[]
  averageRating: number
  totalRatings: number
}

// Skill Types
export interface Skill {
  id: string
  name: string
  category?: string
  description?: string
}

export interface UserSkill {
  id: string
  name: string
  category?: string
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'
}

// Swap Request Types
export interface SwapRequest {
  id: string
  senderId: string
  receiverId: string
  senderSkillId: string
  receiverSkillId: string
  message?: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED'
  createdAt: string
  updatedAt: string
  completedAt?: string
}

// Search & Filter Types
export interface SearchFilters {
  search?: string
  skillCategory?: string
  location?: string
  skillLevel?: string
  availability?: string
  page: number
  limit: number
}

export interface PaginationInfo {
  currentPage: number
  totalPages: number
  totalCount: number
  hasNext: boolean
  hasPrev: boolean
}

export interface UsersResponse {
  users: PublicUser[]
  pagination: PaginationInfo
  filters: Partial<SearchFilters>
}

// Auth Types
export interface AuthUser {
  id: string
  email: string
  name: string
  role: string
  profilePhoto?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
  location?: string
  availability?: string[]
}

// Component Props Types
export interface UserCardProps {
  user: PublicUser
  isLoggedIn: boolean
  onRequestClick: (userId: string) => void
}

export interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export interface SearchBarProps {
  filters: Partial<SearchFilters>
  onSearch: (filters: Partial<SearchFilters>) => void
  categories: readonly string[]
  availabilityOptions: readonly string[]
}

export interface NavbarProps {
  user?: AuthUser | null
  onLogout?: () => void
}
