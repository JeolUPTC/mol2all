import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '@stores/authStore'

const resolveBaseURL = () => {
  const url = import.meta.env.VITE_API_URL
  if (!url) return '/api'
  return url.endsWith('/api') ? url : `${url}/api`
}

export const apiClient = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (err: unknown) => void
}> = []

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach((p) => {
    if (error) p.reject(error)
    else p.resolve(token!)
  })
  failedQueue = []
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error)
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject })
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`
        return apiClient(original)
      })
    }

    original._retry = true
    isRefreshing = true

    try {
      const { data } = await axios.post<{ data: { accessToken: string } }>(
        `${resolveBaseURL()}/auth/refresh`,
        {},
        { withCredentials: true },
      )
      const newToken = data.data.accessToken
      useAuthStore.getState().setAccessToken(newToken)
      processQueue(null, newToken)
      original.headers.Authorization = `Bearer ${newToken}`
      return apiClient(original)
    } catch (err) {
      processQueue(err, null)
      // Only force logout if the user had an established session; skip if this
      // is just the initial session-restore attempt racing with an explicit login.
      if (useAuthStore.getState().isAuthenticated) {
        useAuthStore.getState().logout()
      }
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  },
)
