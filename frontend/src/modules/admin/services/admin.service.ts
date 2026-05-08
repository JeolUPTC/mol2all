import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'
import type { ApiResponse } from '@core/types/api.types'

export interface AdminUser {
  id: string
  email: string
  username: string
  role: 'STUDENT' | 'TEACHER' | 'ADMIN'
  isActive: boolean
  createdAt: string
  profile: { displayName: string | null; totalXp: number } | null
  group: { id: string; name: string } | null
  teacherGroups: { id: string; name: string }[]
  _count: { progress: number }
}

export interface AdminTeacher {
  id: string
  username: string
  profile: { displayName: string | null } | null
  teacherGroups: { id: string; name: string }[]
}

export interface AdminGroup {
  id: string
  name: string
  description: string | null
  teacherId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  teacher: { id: string; username: string; profile: { displayName: string | null } | null } | null
  _count: { students: number }
}

export interface AdminLevel {
  id: string
  order: number
  name: string
  description: string | null
  topic: string
  difficulty: number
  xpReward: number
  coinsReward: number
  isActive: boolean
  _count: { progress: number }
}

export type PendingQuestionStatus = 'PENDING' | 'REJECTED'

export interface PendingQuestion {
  id: string
  type: 'MULTIPLE_CHOICE' | 'NUMERIC_INPUT' | 'EQUATION_BALANCE'
  topic: string
  stem: string
  options: { id: string; text: string }[] | null
  correctAnswer: { id: string } | { value: number; tolerance: number }
  explanation: string | null
  difficulty: number
  status: PendingQuestionStatus
  reviewNote: string | null
  createdAt: string
  author: { username: string; profile: { displayName: string | null } | null } | null
}

export interface ApprovedQuestion {
  id: string
  type: string
  topic: string
  stem: string
  options: { id: string; text: string }[] | null
  correctAnswer: { id: string } | { value: number; tolerance: number }
  explanation: string | null
  difficulty: number
  isActive: boolean
  createdAt: string
  author: { username: string; profile: { displayName: string | null } | null } | null
}

export interface GroupStudent {
  id: string
  email: string
  username: string
  isActive: boolean
  createdAt: string
  profile: { displayName: string | null; totalXp: number; totalCoins: number } | null
  _count: { progress: number }
}

export interface AdminUnassignedStudent {
  id: string
  username: string
  profile: { displayName: string | null } | null
}

export interface AdminAnalytics {
  kpis: {
    totalStudents: number
    totalTeachers: number
    totalGroups: number
    completedLevels: number
    activeStudentPct: number
  }
  questionStatus: { approved: number; pending: number; rejected: number }
  levelCompletion: { levelName: string; order: number; completions: number; pct: number }[]
  groupComparison: { name: string; avgXp: number; studentCount: number }[]
  progressDistribution: { label: string; count: number }[]
  topStudents: { displayName: string; totalXp: number; levelsCompleted: number; groupName: string | null }[]
}

export const adminService = {
  getUsers: async (): Promise<AdminUser[]> => {
    const { data } = await apiClient.get<ApiResponse<AdminUser[]>>(ENDPOINTS.admin.users)
    return data.data
  },

  createTeacher: async (dto: {
    email: string; username: string; displayName: string; password: string
  }): Promise<AdminUser> => {
    const { data } = await apiClient.post<ApiResponse<AdminUser>>(ENDPOINTS.admin.users, dto)
    return data.data
  },

  updateUser: async (
    id: string,
    dto: { isActive?: boolean; role?: AdminUser['role'] },
  ): Promise<AdminUser> => {
    const { data } = await apiClient.patch<ApiResponse<AdminUser>>(ENDPOINTS.admin.user(id), dto)
    return data.data
  },

  getTeachers: async (): Promise<AdminTeacher[]> => {
    const { data } = await apiClient.get<ApiResponse<AdminTeacher[]>>(ENDPOINTS.admin.teachers)
    return data.data
  },

  getGroups: async (): Promise<AdminGroup[]> => {
    const { data } = await apiClient.get<ApiResponse<AdminGroup[]>>(ENDPOINTS.admin.groups)
    return data.data
  },

  createGroup: async (dto: {
    name: string; description?: string; teacherId?: string
  }): Promise<AdminGroup> => {
    const { data } = await apiClient.post<ApiResponse<AdminGroup>>(ENDPOINTS.admin.groups, dto)
    return data.data
  },

  updateGroup: async (
    id: string,
    dto: { name?: string; description?: string; teacherId?: string | null; isActive?: boolean },
  ): Promise<AdminGroup> => {
    const { data } = await apiClient.patch<ApiResponse<AdminGroup>>(ENDPOINTS.admin.group(id), dto)
    return data.data
  },

  getLevels: async (): Promise<AdminLevel[]> => {
    const { data } = await apiClient.get<ApiResponse<AdminLevel[]>>(ENDPOINTS.admin.levels)
    return data.data
  },

  updateLevel: async (
    id: string,
    dto: Partial<Pick<AdminLevel, 'name' | 'description' | 'xpReward' | 'coinsReward' | 'isActive'>>,
  ): Promise<AdminLevel> => {
    const { data } = await apiClient.patch<ApiResponse<AdminLevel>>(ENDPOINTS.admin.level(id), dto)
    return data.data
  },

  getPendingQuestions: async (): Promise<PendingQuestion[]> => {
    const { data } = await apiClient.get<ApiResponse<PendingQuestion[]>>(ENDPOINTS.admin.pendingQuestions)
    return data.data
  },

  getApprovedQuestions: async (): Promise<ApprovedQuestion[]> => {
    const { data } = await apiClient.get<ApiResponse<ApprovedQuestion[]>>(ENDPOINTS.admin.approvedQuestions)
    return data.data
  },

  reviewQuestion: async (
    id: string,
    dto: { status: 'APPROVED' | 'REJECTED'; reviewNote?: string },
  ): Promise<{ id: string; status: string; reviewNote: string | null }> => {
    const { data } = await apiClient.patch<
      ApiResponse<{ id: string; status: string; reviewNote: string | null }>
    >(ENDPOINTS.admin.reviewQuestion(id), dto)
    return data.data
  },

  toggleQuestion: async (id: string): Promise<{ id: string; isActive: boolean }> => {
    const { data } = await apiClient.patch<ApiResponse<{ id: string; isActive: boolean }>>(
      ENDPOINTS.admin.toggleQuestion(id),
    )
    return data.data
  },

  getGroupStudents: async (groupId: string): Promise<GroupStudent[]> => {
    const { data } = await apiClient.get<ApiResponse<GroupStudent[]>>(ENDPOINTS.admin.groupStudents(groupId))
    return data.data
  },

  assignStudent: async (groupId: string, studentId: string): Promise<{ id: string; username: string; groupId: string }> => {
    const { data } = await apiClient.post<ApiResponse<{ id: string; username: string; groupId: string }>>(
      ENDPOINTS.admin.groupStudent(groupId, studentId), {},
    )
    return data.data
  },

  removeStudent: async (groupId: string, studentId: string): Promise<{ id: string; username: string }> => {
    const { data } = await apiClient.delete<ApiResponse<{ id: string; username: string }>>(
      ENDPOINTS.admin.groupStudent(groupId, studentId),
    )
    return data.data
  },

  getUnassignedStudents: async (): Promise<AdminUnassignedStudent[]> => {
    const { data } = await apiClient.get<ApiResponse<AdminUnassignedStudent[]>>(ENDPOINTS.admin.unassignedStudents)
    return data.data
  },

  createQuestion: async (dto: {
    type: string; topic: string; difficulty: number; stem: string
    options?: { id: string; text: string }[]; correctAnswer: object; explanation: string
  }): Promise<ApprovedQuestion> => {
    const { data } = await apiClient.post<ApiResponse<ApprovedQuestion>>(ENDPOINTS.admin.createQuestion, dto)
    return data.data
  },

  updateQuestion: async (id: string, dto: {
    type: string; topic: string; difficulty: number; stem: string
    options?: { id: string; text: string }[]; correctAnswer: object; explanation: string
  }): Promise<ApprovedQuestion> => {
    const { data } = await apiClient.patch<ApiResponse<ApprovedQuestion>>(ENDPOINTS.admin.updateQuestion(id), dto)
    return data.data
  },

  getAnalytics: async (): Promise<AdminAnalytics> => {
    const { data } = await apiClient.get<ApiResponse<AdminAnalytics>>(ENDPOINTS.admin.analytics)
    return data.data
  },

  seedReset: async (): Promise<{ message: string; details: string[] }> => {
    const { data } = await apiClient.post<ApiResponse<{ message: string; details: string[] }>>(ENDPOINTS.admin.seedReset)
    return data.data
  },

  seedDemo: async (): Promise<{ message: string; details: string[] }> => {
    const { data } = await apiClient.post<ApiResponse<{ message: string; details: string[] }>>(ENDPOINTS.admin.seedDemo)
    return data.data
  },
}
