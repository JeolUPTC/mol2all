import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'
import type { ApiResponse } from '@core/types/api.types'

export interface TeacherGroup {
  id: string
  name: string
  description: string | null
  isActive: boolean
  _count: { students: number }
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

export interface UnassignedStudent {
  id: string
  username: string
  profile: { displayName: string | null } | null
}

export interface StudentStat {
  id: string
  email: string
  username: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  profile: {
    id: string
    displayName: string | null
    totalXp: number
    totalCoins: number
    avatarId: string
  } | null
  _count: { progress: number }
}

export interface ProgressWithLevel {
  id: string
  userId: string
  levelId: string
  status: string
  stars: number
  highScore: number
  attempts: number
  completedAt: string | null
  level: {
    id: string
    order: number
    name: string
    topic: string
    difficulty: number
    xpReward: number
    coinsReward: number
  }
}

export type QuestionType = 'MULTIPLE_CHOICE' | 'NUMERIC_INPUT' | 'EQUATION_BALANCE'
export type QuestionStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface QuestionOption {
  id: string
  text: string
}

export interface QuestionDraft {
  type: QuestionType
  topic: string
  difficulty: number
  stem: string
  explanation: string
  options?: QuestionOption[]
  correctAnswer: { id: string } | { value: number; tolerance: number }
}

export interface TeacherQuestion {
  id: string
  type: QuestionType
  topic: string
  stem: string
  options: QuestionOption[] | null
  correctAnswer: { id: string } | { value: number; tolerance: number }
  explanation: string | null
  difficulty: number
  status: QuestionStatus
  reviewNote: string | null
  createdAt: string
}


export interface BankQuestion {
  id: string
  type: QuestionType
  topic: string
  stem: string
  difficulty: number
  options: QuestionOption[] | null
  correctAnswer: { id: string } | { value: number; tolerance: number }
  explanation: string | null
  isActive: boolean
  createdAt: string
  authorId: string | null
  author: { username: string; profile: { displayName: string | null } | null } | null
}

export interface TeacherAnalytics {
  kpis: { totalStudents: number; avgXp: number; avgLevels: number; activeStudentPct: number }
  levelCompletion: { levelName: string; order: number; completions: number; pct: number }[]
  starsDistribution: { stars: number; count: number }[]
  groupComparison: { name: string; avgXp: number; studentCount: number }[]
  topStudents: { displayName: string; totalXp: number; levelsCompleted: number; groupName: string | null }[]
}

export const teacherService = {
  getAnalytics: async (): Promise<TeacherAnalytics> => {
    const { data } = await apiClient.get<ApiResponse<TeacherAnalytics>>(ENDPOINTS.teacher.analytics)
    return data.data
  },

  getMyGroups: async (): Promise<TeacherGroup[]> => {
    const { data } = await apiClient.get<ApiResponse<TeacherGroup[]>>(ENDPOINTS.teacher.groups)
    return data.data
  },

  getGroupStudents: async (groupId: string): Promise<GroupStudent[]> => {
    const { data } = await apiClient.get<ApiResponse<GroupStudent[]>>(
      ENDPOINTS.teacher.groupStudents(groupId),
    )
    return data.data
  },

  assignStudent: async (groupId: string, studentId: string): Promise<void> => {
    await apiClient.post(ENDPOINTS.teacher.assignStudent(groupId, studentId))
  },

  removeStudent: async (groupId: string, studentId: string): Promise<void> => {
    await apiClient.delete(ENDPOINTS.teacher.removeStudent(groupId, studentId))
  },

  getUnassignedStudents: async (): Promise<UnassignedStudent[]> => {
    const { data } = await apiClient.get<ApiResponse<UnassignedStudent[]>>(
      ENDPOINTS.teacher.unassignedStudents,
    )
    return data.data
  },

  createStudent: async (dto: {
    email: string
    username: string
    displayName: string
    password: string
    groupId?: string
  }): Promise<StudentStat> => {
    const { data } = await apiClient.post<ApiResponse<StudentStat>>(
      ENDPOINTS.teacher.createStudent,
      dto,
    )
    return data.data
  },

  getStudentProgress: async (studentId: string): Promise<ProgressWithLevel[]> => {
    const { data } = await apiClient.get<ApiResponse<ProgressWithLevel[]>>(
      ENDPOINTS.teacher.studentProgress(studentId),
    )
    return data.data
  },

  resetStudentProgress: async (studentId: string): Promise<{ message: string }> => {
    const { data } = await apiClient.post<ApiResponse<{ message: string }>>(
      ENDPOINTS.teacher.resetStudentProgress(studentId),
    )
    return data.data
  },

  createQuestion: async (draft: QuestionDraft): Promise<TeacherQuestion> => {
    const { data } = await apiClient.post<ApiResponse<TeacherQuestion>>(
      ENDPOINTS.teacher.questions,
      draft,
    )
    return data.data
  },

  getMyQuestions: async (): Promise<TeacherQuestion[]> => {
    const { data } = await apiClient.get<ApiResponse<TeacherQuestion[]>>(
      ENDPOINTS.teacher.myQuestions,
    )
    return data.data
  },

  getBankQuestions: async (): Promise<BankQuestion[]> => {
    const { data } = await apiClient.get<ApiResponse<BankQuestion[]>>(
      ENDPOINTS.teacher.bankQuestions,
    )
    return data.data
  },

  updateQuestion: async (id: string, draft: QuestionDraft): Promise<BankQuestion> => {
    const { data } = await apiClient.patch<ApiResponse<BankQuestion>>(
      ENDPOINTS.teacher.updateQuestion(id),
      draft,
    )
    return data.data
  },
}
