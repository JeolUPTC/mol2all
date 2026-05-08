export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN'

export interface User {
  id: string
  email: string
  username: string
  role: Role
  isActive: boolean
  createdAt: string
  profile?: Profile
}

export interface Profile {
  id: string
  userId: string
  displayName: string | null
  avatarId: string
  grade: string | null
  institution: string | null
  totalXp: number
  totalCoins: number
}

export interface AuthTokens {
  accessToken: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RegisterPayload {
  email: string
  username: string
  password: string
  role?: Role
}
