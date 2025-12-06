// Use relative URLs so Next.js rewrites can proxy to backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || ''

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: {
    message: string
    code?: string
    details?: any
  }
  meta?: {
    timestamp: string
    path: string
    method: string
  }
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit & { token?: string } = {}
): Promise<ApiResponse<T>> {
  const { token, ...fetchOptions } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  // Check if response is JSON before parsing
  const contentType = response.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error(`Expected JSON response but got ${contentType || 'unknown'}. This usually means the API endpoint is not found (404).`)
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error?.message || `API error: ${response.statusText}`)
  }

  return data
}

// User API functions
export const userApi = {
  getMe: async (token: string) => {
    return apiRequest<{
      id: string
      clerkId: string
      email: string
      firstName?: string
      lastName?: string
    }>('/api/v1/users/me', {
      method: 'GET',
      token,
    })
  },

  updateProfile: async (token: string, data: { firstName?: string; lastName?: string }) => {
    return apiRequest('/api/v1/users/me', {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    })
  },
}

