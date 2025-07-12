// App Configuration - No hardcoded values
export const APP_CONFIG = {
  name: 'Skill Swap Platform',
  pagination: {
    defaultLimit: 10,
    maxLimit: 50,
  },
  skills: {
    levels: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] as const,
    categories: ['Programming', 'Design', 'Office', 'Language', 'Creative', 'Business'] as const,
  },
  availability: {
    options: ['weekdays', 'weekends', 'evenings', 'mornings', 'afternoons', 'flexible'] as const,
  },
  rating: {
    min: 1,
    max: 5,
  },
  validation: {
    name: { min: 2, max: 50 },
    password: { min: 6 },
    skill: { min: 2, max: 50 },
  },
  colors: {
    primary: 'teal',
    secondary: 'blue',
    success: 'green',
    warning: 'yellow',
    error: 'red',
  },
  routes: {
    home: '/',
    login: '/auth/login',
    register: '/auth/register',
    profile: '/profile',
    swapRequests: '/requests',
    userProfile: (id: string) => `/profile/${id}`,
  }
} as const

export const SKILL_CATEGORIES = APP_CONFIG.skills.categories
export const SKILL_LEVELS = APP_CONFIG.skills.levels
export const AVAILABILITY_OPTIONS = APP_CONFIG.availability.options
