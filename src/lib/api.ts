const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

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

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...fetchOptions.headers,
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

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
      connections?: Array<{
        id: string
        type: string
        name: string
        isActive: boolean
        createdAt: string
      }>
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

// Connection API functions
export const connectionApi = {
  getConnections: async (token: string) => {
    return apiRequest<Array<{
      id: string
      type: string
      name: string
      isActive: boolean
      createdAt: string
      updatedAt: string
    }>>('/api/v1/connections', {
      method: 'GET',
      token,
    })
  },

  createConnection: async (
    token: string,
    data: {
      type: string
      name: string
      accessToken: string
      refreshToken?: string
      expiresAt?: string
      metadata?: Record<string, any>
    }
  ) => {
    return apiRequest('/api/v1/connections', {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    })
  },

  deleteConnection: async (token: string, connectionId: string) => {
    return apiRequest(`/api/v1/connections/${connectionId}`, {
      method: 'DELETE',
      token,
    })
  },
}

