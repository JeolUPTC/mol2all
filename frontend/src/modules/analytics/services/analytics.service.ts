import { apiClient } from '@core/api/client'
import { ENDPOINTS } from '@core/api/endpoints'

export interface AnalyticsPlatform {
  totalStudents: number
  totalTeachers: number
  totalCompletedSessions: number
  totalCompletedLevels: number
  avgStarsOverall: number
}

export interface ActivityDay {
  date: string
  sessions: number
}

export interface LevelPerformance {
  levelId: string
  levelName: string
  levelOrder: number
  topic: string
  completionCount: number
  totalAttempts: number
  avgStars: number
}

export interface TopStudent {
  id: string
  username: string
  displayName: string | null
  totalXp: number
  completedLevels: number
}

export interface AnalyticsOverview {
  platform: AnalyticsPlatform
  activity: ActivityDay[]
  levelPerformance: LevelPerformance[]
  topStudents: TopStudent[]
}

export const analyticsService = {
  async getOverview(): Promise<AnalyticsOverview> {
    const res = await apiClient.get<{ data: AnalyticsOverview }>(ENDPOINTS.analytics.overview)
    return res.data.data
  },
}
