import { z } from 'zod'

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  location: z.string().optional(),
})

// Profile schemas
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name too long'),
  location: z.string().optional(),
  profilePhoto: z.string().url().optional(),
  isPublic: z.boolean(),
  availability: z.array(z.string()),
})

// Skill schemas
export const skillSchema = z.object({
  name: z.string().min(2, 'Skill name must be at least 2 characters').max(50, 'Skill name too long'),
  category: z.string().optional(),
  description: z.string().optional(),
})

export const userSkillSchema = z.object({
  skillId: z.string().cuid('Invalid skill ID'),
  type: z.enum(['OFFERED', 'WANTED']),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  description: z.string().optional(),
})

// Swap request schemas
export const swapRequestSchema = z.object({
  receiverId: z.string().cuid('Invalid receiver ID'),
  senderSkillId: z.string().cuid('Invalid sender skill ID'),
  receiverSkillId: z.string().cuid('Invalid receiver skill ID'),
  message: z.string().optional(),
})

export const updateSwapRequestSchema = z.object({
  status: z.enum(['PENDING', 'ACCEPTED', 'REJECTED', 'COMPLETED', 'CANCELLED']),
})

// Rating schemas
export const ratingSchema = z.object({
  rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  feedback: z.string().optional(),
})

// Search schemas
export const searchSchema = z.object({
  query: z.string().optional(),
  skillCategory: z.string().optional(),
  location: z.string().optional(),
  skillLevel: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(50).default(10),
})

// Admin schemas
export const adminMessageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  userId: z.string().cuid().optional(),
  isGlobal: z.boolean().default(false),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
export type SkillInput = z.infer<typeof skillSchema>
export type UserSkillInput = z.infer<typeof userSkillSchema>
export type SwapRequestInput = z.infer<typeof swapRequestSchema>
export type UpdateSwapRequestInput = z.infer<typeof updateSwapRequestSchema>
export type RatingInput = z.infer<typeof ratingSchema>
export type SearchInput = z.infer<typeof searchSchema>
export type AdminMessageInput = z.infer<typeof adminMessageSchema>
