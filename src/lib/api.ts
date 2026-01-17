// Use relative URLs so Next.js rewrites can proxy to backend
const API_BASE_URL = typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_API_BASE_URL || '')

// TypeScript Types
export interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

export interface Workspace {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  owners: User[]
  members: User[]
  progress?: number
}

export interface Project {
  id: string
  name: string
  description?: string
  workspaceId: string
  createdAt: string
  updatedAt: string
  workspace: {
    id: string
    name: string
    description?: string
  }
  owners: User[]
  members: User[]
}

export interface Category {
  id: string
  name: string
  description?: string
  color?: string
}

export interface Document {
  id: string
  filename: string
  originalName: string
  filesize: number
  mimeType: string
  status: string
}

export interface Task {
  id: string
  name: string
  description?: string
  projectId: string
  categoryId?: string
  dueAt?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED'
  createdAt: string
  updatedAt: string
  project: {
    id: string
    description?: string
  }
  category?: Category
  preparers: User[]
  reviewers: User[]
  linkedFiles: Document[]
  comments?: Comment[]
  attachments?: TaskAttachment[]
}

export interface Comment {
  id: string
  content: string
  comment?: string // For backward compatibility
  createdAt: string
  updatedAt: string
  user: User
  status: 'OPEN' | 'RESOLVED'
  resolved?: boolean // For backward compatibility
  resolvedBy?: User
  replies?: Comment[]
  parentId?: string
}

export interface TaskAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt: string
  uploadedBy: User
}

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

  let data
  try {
    data = await response.json()
  } catch (parseError) {
    console.error('Failed to parse JSON response:', parseError)
    throw new Error(`Failed to parse response: ${response.statusText}`)
  }

  if (!response.ok) {
    // Log the error response for debugging
    console.error('API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      data,
      endpoint,
      dataKeys: data ? Object.keys(data) : 'null/undefined',
      dataType: typeof data,
    })

    // Handle various error response formats
    let errorMessage = 'An error occurred'

    if (data && typeof data === 'object') {
      // Check for nested error.message
      if (data.error && typeof data.error === 'object' && data.error.message) {
        errorMessage = data.error.message
      }
      // Check for error as string
      else if (data.error && typeof data.error === 'string') {
        errorMessage = data.error
      }
      // Check for direct message property
      else if (data.message && typeof data.message === 'string') {
        errorMessage = data.message
      }
      // If data exists but has no recognizable error format
      else if (Object.keys(data).length > 0) {
        errorMessage = `API error (${response.status}): ${response.statusText || 'Unknown error'}`
      }
      // Empty object
      else {
        errorMessage = `API error (${response.status}): ${response.statusText || 'Unknown error'}`
      }
    } else {
      errorMessage = `API error (${response.status}): ${response.statusText || 'Unknown error'}`
    }

    throw new Error(errorMessage)
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

// Workspace API functions
export const workspaceApi = {
  getWorkspaces: async (token: string) => {
    return apiRequest<Workspace[]>('/api/v1/workspaces', {
      method: 'GET',
      token,
    })
  },

  getWorkspace: async (token: string, id: string) => {
    return apiRequest<Workspace>(`/api/v1/workspaces/${id}`, {
      method: 'GET',
      token,
    })
  },

  createWorkspace: async (token: string, name: string, description?: string) => {
    return apiRequest<Workspace>('/api/v1/workspaces', {
      method: 'POST',
      token,
      body: JSON.stringify({ name, description }),
    })
  },

  updateWorkspace: async (
    token: string,
    id: string,
    data: { name?: string; description?: string }
  ) => {
    return apiRequest<Workspace>(`/api/v1/workspaces/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    })
  },

  deleteWorkspace: async (token: string, id: string) => {
    return apiRequest<{ message: string; workspaceId: string }>(
      `/api/v1/workspaces/${id}`,
      {
        method: 'DELETE',
        token,
      }
    )
  },

  addMember: async (token: string, workspaceId: string, userId: string) => {
    return apiRequest<Workspace>(`/api/v1/workspaces/${workspaceId}/members`, {
      method: 'POST',
      token,
      body: JSON.stringify({ userId }),
    })
  },

  removeMember: async (token: string, workspaceId: string, userId: string) => {
    return apiRequest<Workspace>(
      `/api/v1/workspaces/${workspaceId}/members/${userId}`,
      {
        method: 'DELETE',
        token,
      }
    )
  },

  addOwner: async (token: string, workspaceId: string, userId: string) => {
    return apiRequest<Workspace>(`/api/v1/workspaces/${workspaceId}/owners`, {
      method: 'POST',
      token,
      body: JSON.stringify({ userId }),
    })
  },

  removeOwner: async (token: string, workspaceId: string, userId: string) => {
    return apiRequest<Workspace>(
      `/api/v1/workspaces/${workspaceId}/owners/${userId}`,
      {
        method: 'DELETE',
        token,
      }
    )
  },
}

// Project API functions
export const projectApi = {
  getProjectsByWorkspace: async (token: string, workspaceId: string) => {
    return apiRequest<Project[]>(`/api/v1/projects/workspace/${workspaceId}`, {
      method: 'GET',
      token,
    })
  },

  getProject: async (token: string, id: string) => {
    return apiRequest<Project>(`/api/v1/projects/${id}`, {
      method: 'GET',
      token,
    })
  },

  createProject: async (
    token: string,
    workspaceId: string,
    name: string,
    description?: string
  ) => {
    return apiRequest<Project>('/api/v1/projects', {
      method: 'POST',
      token,
      body: JSON.stringify({ workspaceId, name, description }),
    })
  },

  updateProject: async (
    token: string,
    id: string,
    data: { name?: string; description?: string }
  ) => {
    return apiRequest<Project>(`/api/v1/projects/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    })
  },

  deleteProject: async (token: string, id: string) => {
    return apiRequest<{ message: string }>(`/api/v1/projects/${id}`, {
      method: 'DELETE',
      token,
    })
  },

  addMember: async (token: string, projectId: string, userId: string) => {
    return apiRequest<Project>(`/api/v1/projects/${projectId}/members`, {
      method: 'POST',
      token,
      body: JSON.stringify({ userId }),
    })
  },

  removeMember: async (token: string, projectId: string, userId: string) => {
    return apiRequest<Project>(`/api/v1/projects/${projectId}/members/${userId}`, {
      method: 'DELETE',
      token,
    })
  },

  addOwner: async (token: string, projectId: string, userId: string) => {
    return apiRequest<Project>(`/api/v1/projects/${projectId}/owners`, {
      method: 'POST',
      token,
      body: JSON.stringify({ userId }),
    })
  },

  removeOwner: async (token: string, projectId: string, userId: string) => {
    return apiRequest<Project>(`/api/v1/projects/${projectId}/owners/${userId}`, {
      method: 'DELETE',
      token,
    })
  },
}

// Task API functions
export const taskApi = {
  getTasksByProject: async (token: string, projectId: string) => {
    return apiRequest<Task[]>(`/api/v1/projects/${projectId}/tasks`, {
      method: 'GET',
      token,
    })
  },

  getTask: async (token: string, projectId: string, id: string) => {
    return apiRequest<Task>(`/api/v1/projects/${projectId}/tasks/${id}`, {
      method: 'GET',
      token,
    })
  },

  createTask: async (
    token: string,
    projectId: string,
    data: {
      name: string
      description?: string
      categoryId?: string
      dueAt?: string
      status?: 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED'
    }
  ) => {
    return apiRequest<Task>(`/api/v1/projects/${projectId}/tasks`, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    })
  },

  updateTask: async (
    token: string,
    projectId: string,
    id: string,
    data: { name?: string; description?: string }
  ) => {
    return apiRequest<Task>(`/api/v1/projects/${projectId}/tasks/${id}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(data),
    })
  },

  deleteTask: async (token: string, projectId: string, id: string) => {
    return apiRequest<{ message: string }>(
      `/api/v1/projects/${projectId}/tasks/${id}`,
      {
        method: 'DELETE',
        token,
      }
    )
  },

  changeStatus: async (
    token: string,
    projectId: string,
    id: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED'
  ) => {
    return apiRequest<Task>(`/api/v1/projects/${projectId}/tasks/${id}/status`, {
      method: 'PATCH',
      token,
      body: JSON.stringify({ status }),
    })
  },

  changeDueDate: async (
    token: string,
    projectId: string,
    id: string,
    dueAt: string | null
  ) => {
    return apiRequest<Task>(
      `/api/v1/projects/${projectId}/tasks/${id}/due-date`,
      {
        method: 'PATCH',
        token,
        body: JSON.stringify({ dueAt }),
      }
    )
  },

  addPreparer: async (
    token: string,
    projectId: string,
    id: string,
    userId: string
  ) => {
    return apiRequest<Task>(
      `/api/v1/projects/${projectId}/tasks/${id}/preparers`,
      {
        method: 'POST',
        token,
        body: JSON.stringify({ userId }),
      }
    )
  },

  removePreparer: async (
    token: string,
    projectId: string,
    id: string,
    userId: string
  ) => {
    return apiRequest<Task>(
      `/api/v1/projects/${projectId}/tasks/${id}/preparers/${userId}`,
      {
        method: 'DELETE',
        token,
      }
    )
  },

  addReviewer: async (
    token: string,
    projectId: string,
    id: string,
    userId: string
  ) => {
    return apiRequest<Task>(
      `/api/v1/projects/${projectId}/tasks/${id}/reviewers`,
      {
        method: 'POST',
        token,
        body: JSON.stringify({ userId }),
      }
    )
  },

  removeReviewer: async (
    token: string,
    projectId: string,
    id: string,
    userId: string
  ) => {
    return apiRequest<Task>(
      `/api/v1/projects/${projectId}/tasks/${id}/reviewers/${userId}`,
      {
        method: 'DELETE',
        token,
      }
    )
  },

  moveTaskToCategory: async (
    token: string,
    projectId: string,
    id: string,
    categoryId: string | null
  ) => {
    return apiRequest<Task>(
      `/api/v1/projects/${projectId}/tasks/${id}/category`,
      {
        method: 'PATCH',
        token,
        body: JSON.stringify({ categoryId }),
      }
    )
  },

  attachFile: async (
    token: string,
    projectId: string,
    id: string,
    documentId: string
  ) => {
    return apiRequest<Task>(
      `/api/v1/projects/${projectId}/tasks/${id}/files`,
      {
        method: 'POST',
        token,
        body: JSON.stringify({ documentId }),
      }
    )
  },

  removeFile: async (
    token: string,
    projectId: string,
    id: string,
    documentId: string
  ) => {
    return apiRequest<Task>(
      `/api/v1/projects/${projectId}/tasks/${id}/files/${documentId}`,
      {
        method: 'DELETE',
        token,
      }
    )
  },
}

// Category API functions
export const categoryApi = {
  getCategoriesByProject: async (token: string, projectId: string) => {
    return apiRequest<Category[]>(`/api/v1/projects/${projectId}/categories`, {
      method: 'GET',
      token,
    })
  },

  createCategory: async (
    token: string,
    projectId: string,
    data: {
      name: string
      description?: string
      color?: string
    }
  ) => {
    return apiRequest<Category>(`/api/v1/projects/${projectId}/categories`, {
      method: 'POST',
      token,
      body: JSON.stringify(data),
    })
  },

  updateCategory: async (
    token: string,
    projectId: string,
    id: string,
    data: {
      name?: string
      description?: string
      color?: string
    }
  ) => {
    return apiRequest<Category>(
      `/api/v1/projects/${projectId}/categories/${id}`,
      {
        method: 'PATCH',
        token,
        body: JSON.stringify(data),
      }
    )
  },

  deleteCategory: async (token: string, projectId: string, id: string) => {
    return apiRequest<{ message: string }>(
      `/api/v1/projects/${projectId}/categories/${id}`,
      {
        method: 'DELETE',
        token,
      }
    )
  },
}

// Task Comment API functions
export const taskCommentApi = {
  getCommentsByTask: async (
    token: string,
    projectId: string,
    taskId: string
  ) => {
    return apiRequest<Comment[]>(
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments`,
      {
        method: 'GET',
        token,
      }
    )
  },

  createComment: async (
    token: string,
    projectId: string,
    taskId: string,
    data: {
      comment: string
      parentId?: string
    }
  ) => {
    return apiRequest<Comment>(
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments`,
      {
        method: 'POST',
        token,
        body: JSON.stringify(data),
      }
    )
  },

  getComment: async (
    token: string,
    projectId: string,
    taskId: string,
    id: string
  ) => {
    return apiRequest<Comment>(
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments/${id}`,
      {
        method: 'GET',
        token,
      }
    )
  },

  updateComment: async (
    token: string,
    projectId: string,
    taskId: string,
    id: string,
    data: {
      comment: string
    }
  ) => {
    return apiRequest<Comment>(
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments/${id}`,
      {
        method: 'PATCH',
        token,
        body: JSON.stringify(data),
      }
    )
  },

  deleteComment: async (
    token: string,
    projectId: string,
    taskId: string,
    id: string
  ) => {
    return apiRequest<{ message: string }>(
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments/${id}`,
      {
        method: 'DELETE',
        token,
      }
    )
  },

  setResolvedStatus: async (
    token: string,
    projectId: string,
    taskId: string,
    id: string,
    resolved: boolean
  ) => {
    return apiRequest<Comment>(
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments/${id}/resolved`,
      {
        method: 'PATCH',
        token,
        body: JSON.stringify({ resolved }),
      }
    )
  },

  resolveComment: async (
    token: string,
    projectId: string,
    taskId: string,
    id: string
  ) => {
    return taskCommentApi.setResolvedStatus(token, projectId, taskId, id, true)
  },

  reopenComment: async (
    token: string,
    projectId: string,
    taskId: string,
    id: string
  ) => {
    return taskCommentApi.setResolvedStatus(token, projectId, taskId, id, false)
  },

  linkFiles: async (
    token: string,
    projectId: string,
    taskId: string,
    id: string,
    documentIds: string[]
  ) => {
    return apiRequest<Comment>(
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments/${id}/files`,
      {
        method: 'POST',
        token,
        body: JSON.stringify({ documentIds }),
      }
    )
  },

  unlinkFile: async (
    token: string,
    projectId: string,
    taskId: string,
    id: string,
    documentId: string
  ) => {
    return apiRequest<Comment>(
      `/api/v1/projects/${projectId}/tasks/${taskId}/comments/${id}/files/${documentId}`,
      {
        method: 'DELETE',
        token,
      }
    )
  },
}

