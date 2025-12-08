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
      hasCompletedOnboarding: boolean
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

  completeOnboarding: async (token: string) => {
    return apiRequest('/api/v1/users/me/complete-onboarding', {
      method: 'POST',
      token,
    })
  },
}

// SharePoint API functions
export const sharepointApi = {
  getSites: async (token: string) => {
    return apiRequest<{
      sites: Array<{
        id: string
        name: string
        displayName: string
        webUrl: string
        description?: string
        createdDateTime: string
        lastModifiedDateTime: string
      }>
    }>('/api/v1/sharepoint/sites', {
      method: 'GET',
      token,
    })
  },

  saveSelectedSites: async (
    token: string,
    sites: Array<{ id: string; name: string; webUrl: string }>
  ) => {
    return apiRequest<{
      selectedSites: Array<{
        id: string
        siteId: string
        siteName: string
        webUrl: string
      }>
    }>('/api/v1/sharepoint/sites/selected', {
      method: 'POST',
      token,
      body: JSON.stringify({ sites }),
    })
  },

  getSelectedSites: async (token: string) => {
    return apiRequest<{
      selectedSites: Array<{
        id: string
        siteId: string
        siteName: string
        webUrl: string
      }>
    }>('/api/v1/sharepoint/sites/selected', {
      method: 'GET',
      token,
    })
  },
}

// Sign-up request API functions
export const signupRequestApi = {
  createRequest: async (data: {
    name: string
    email: string
    organization: string
    message?: string
  }) => {
    return apiRequest('/api/v1/signup-requests', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  getAllRequests: async (token: string) => {
    return apiRequest<{
      requests: Array<{
        id: string
        name: string
        email: string
        organization: string
        message?: string
        status: 'PENDING' | 'APPROVED' | 'REJECTED'
        createdAt: string
        updatedAt: string
      }>
    }>('/api/v1/signup-requests', {
      method: 'GET',
      token,
    })
  },

  updateRequestStatus: async (
    token: string,
    requestId: string,
    status: 'PENDING' | 'APPROVED' | 'REJECTED'
  ) => {
    return apiRequest(`/api/v1/signup-requests/${requestId}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    })
  },
}

