// Use relative URLs so Next.js rewrites can proxy to backend
const API_BASE_URL =
    typeof window !== 'undefined'
        ? ''
        : process.env.NEXT_PUBLIC_API_BASE_URL || '';

// TypeScript Types
export interface User {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
}

// Permission types
export type Permission =
    | 'TASK_VIEW'
    | 'TASK_CREATE'
    | 'TASK_EDIT'
    | 'TASK_DELETE'
    | 'PROJECT_VIEW'
    | 'PROJECT_CREATE'
    | 'PROJECT_EDIT'
    | 'PROJECT_DELETE'
    | 'WORKSPACE_VIEW'
    | 'WORKSPACE_CREATE'
    | 'WORKSPACE_EDIT'
    | 'WORKSPACE_DELETE'
    | 'MEMBER_VIEW'
    | 'MEMBER_INVITE'
    | 'MEMBER_REMOVE'
    | 'SETTINGS_VIEW'
    | 'SETTINGS_EDIT'
    | 'ORG_EDIT'
    | 'ORG_DELETE'
    | 'ORG_MANAGE_MEMBERS';

export interface UserPermissions {
    organizations: Record<string, Permission[]>;
    projects: Record<string, Permission[]>;
}

export interface Organization {
    id: string;
    name: string;
}

export interface MeResponse {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    clerkId?: string;
    hasCompletedOnboarding: boolean;
    organization: Organization | null;
    permissions: UserPermissions;
}

export interface Workspace {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    owners: User[];
    members: User[];
    progress?: number;
}

export interface Project {
    id: string;
    name: string;
    description?: string;
    workspaceId: string;
    createdAt: string;
    updatedAt: string;
    workspace: {
        id: string;
        name: string;
        description?: string;
    };
    owners: User[];
    members: User[];
}

export interface Document {
    id: string;
    filename: string;
    originalName: string;
    filesize: number;
    mimeType: string;
    status: string;
}

export interface Task {
    id: string;
    name: string;
    description?: string;
    projectId: string;
    dueAt?: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';
    createdAt: string;
    updatedAt: string;
    project: {
        id: string;
        description?: string;
    };
    preparers: User[];
    reviewers: User[];
    linkedFiles: Document[];
    customFieldValues?: CustomFieldValue[];
    comments?: Comment[];
    attachments?: TaskAttachment[];
}

export interface CustomFieldValue {
    id: string;
    value: string;
    customFieldId: string;
    customField: {
        id: string;
        name: string;
        dataType: DataType;
        required: boolean;
    };
}

export type DataType =
    | 'STRING'
    | 'NUMBER'
    | 'TASK'
    | 'USER'
    | 'DATE'
    | 'DOCUMENT'
    | 'CUSTOM';

export interface CustomField {
    id: string;
    name: string;
    description?: string;
    defaultValue: string;
    dataType: DataType;
    color?: string;
    required: boolean;
    customOptions?: string[];
    projectId: string;
    createdAt: string;
    updatedAt: string;
}

export interface TaskCommentReaction {
    id: string;
    emoji: string;
    userId: string;
    user: User;
    commentId: string;
    createdAt: string;
}

export interface Comment {
    id: string;
    content: string;
    comment?: string; // For backward compatibility
    createdAt: string;
    updatedAt: string;
    user: User;
    status: 'OPEN' | 'RESOLVED';
    resolved?: boolean; // For backward compatibility
    resolvedBy?: User;
    replies?: Comment[];
    reactions?: TaskCommentReaction[];
    parentId?: string;
}

export interface TaskAttachment {
    id: string;
    name: string;
    url: string;
    type: string;
    size: number;
    uploadedAt: string;
    uploadedBy: User;
}

export interface PermissionDetail {
    id: string;
    key: string;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    permissions: PermissionDetail[];
}

export interface RoleAssignment {
    id: string;
    roleId: string;
    role: Role;
    organizationId?: string;
    projectId?: string;
}

export interface OrganizationMember {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    active: boolean;
    createdAt: string;
    roleAssignments: RoleAssignment[];
}

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        message: string;
        code?: string;

        details?: any;
    };
    meta?: {
        timestamp: string;
        path: string;
        method: string;
    };
}

export async function apiRequest<T = any>(
    endpoint: string,
    options: RequestInit & { token?: string } = {},
): Promise<ApiResponse<T>> {
    const { token, ...fetchOptions } = options;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers as Record<string, string>),
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
    });

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        throw new Error(
            `Expected JSON response but got ${
                contentType || 'unknown'
            }. This usually means the API endpoint is not found (404).`,
        );
    }

    let data;
    try {
        data = await response.json();
    } catch (parseError) {
        console.error('Failed to parse JSON response:', parseError);
        throw new Error(`Failed to parse response: ${response.statusText}`);
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
        });

        // Handle various error response formats
        let errorMessage = 'An error occurred';

        if (data && typeof data === 'object') {
            // Check for nested error.message
            if (
                data.error &&
                typeof data.error === 'object' &&
                data.error.message
            ) {
                errorMessage = data.error.message;
            }
            // Check for error as string
            else if (data.error && typeof data.error === 'string') {
                errorMessage = data.error;
            }
            // Check for direct message property
            else if (data.message && typeof data.message === 'string') {
                errorMessage = data.message;
            }
            // If data exists but has no recognizable error format
            else if (Object.keys(data).length > 0) {
                errorMessage = `API error (${response.status}): ${response.statusText || 'Unknown error'}`;
            }
            // Empty object
            else {
                errorMessage = `API error (${response.status}): ${response.statusText || 'Unknown error'}`;
            }
        } else {
            errorMessage = `API error (${response.status}): ${response.statusText || 'Unknown error'}`;
        }

        throw new Error(errorMessage);
    }

    return data;
}

// User API functions
export const userApi = {
    createUser: async (token: string, clerkId: string) => {
        return apiRequest<{
            id: string;
            clerkId: string;
            email: string;
            firstName?: string;
            lastName?: string;
            hasCompletedOnboarding: boolean;
        }>('/api/v1/users/', {
            method: 'POST',
            token,
            body: JSON.stringify({ clerkId }),
        });
    },

    getMe: async (token: string) => {
        return apiRequest<MeResponse>('/api/v1/users/me', {
            method: 'GET',
            token,
        });
    },

    updateProfile: async (
        token: string,
        data: { firstName?: string; lastName?: string },
    ) => {
        return apiRequest('/api/v1/users/me', {
            method: 'PATCH',
            token,
            body: JSON.stringify(data),
        });
    },

    completeOnboarding: async (token: string) => {
        return apiRequest('/api/v1/users/me/complete-onboarding', {
            method: 'POST',
            token,
        });
    },

    abandonOnboarding: async (token: string) => {
        return apiRequest('/api/v1/users/me/abandon-onboarding', {
            method: 'POST',
            token,
        });
    },
};

// Organization API functions
export const organizationApi = {
    createOrganization: async (token: string, name: string) => {
        return apiRequest('/api/v1/organizations', {
            method: 'POST',
            token,
            body: JSON.stringify({ name }),
        });
    },

    inviteMember: async (
        token: string,
        organizationId: string,
        email: string,
    ) => {
        return apiRequest<{ message: string }>(
            `/api/v1/organizations/${organizationId}/access-links/member`,
            {
                method: 'POST',
                token,
                body: JSON.stringify({ email }),
            },
        );
    },

    getMembers: async (token: string, organizationId: string) => {
        return apiRequest<OrganizationMember[]>(
            `/api/v1/organizations/${organizationId}/members`,
            {
                method: 'GET',
                token,
            },
        );
    },

    updateMemberRole: async (
        token: string,
        organizationId: string,
        userId: string,
        roleId: string,
    ) => {
        return apiRequest<RoleAssignment>(
            `/api/v1/organizations/${organizationId}/users/${userId}/role`,
            {
                method: 'PATCH',
                token,
                body: JSON.stringify({ roleId }),
            },
        );
    },

    removeMember: async (
        token: string,
        organizationId: string,
        userId: string,
    ) => {
        return apiRequest(
            `/api/v1/organizations/${organizationId}/users/${userId}`,
            {
                method: 'DELETE',
                token,
            },
        );
    },
};

// Role API functions
export const roleApi = {
    getAllRoles: async (token: string) => {
        return apiRequest<Role[]>('/api/v1/roles', {
            method: 'GET',
            token,
        });
    },
};

// SharePoint API functions
export const sharepointApi = {
    getSites: async (token: string) => {
        return apiRequest<{
            sites: Array<{
                id: string;
                name: string;
                displayName: string;
                webUrl: string;
                description?: string;
                createdDateTime: string;
                lastModifiedDateTime: string;
            }>;
        }>('/api/v1/sharepoint/sites', {
            method: 'GET',
            token,
        });
    },

    saveSelectedSites: async (
        token: string,
        sites: Array<{ id: string; name: string; webUrl: string }>,
    ) => {
        return apiRequest<{
            selectedSites: Array<{
                id: string;
                siteId: string;
                siteName: string;
                webUrl: string;
            }>;
        }>('/api/v1/sharepoint/sites/selected', {
            method: 'POST',
            token,
            body: JSON.stringify({ sites }),
        });
    },

    getSelectedSites: async (token: string) => {
        return apiRequest<{
            selectedSites: Array<{
                id: string;
                siteId: string;
                siteName: string;
                webUrl: string;
            }>;
        }>('/api/v1/sharepoint/sites/selected', {
            method: 'GET',
            token,
        });
    },
};

// Sign-up request API functions
export const signupRequestApi = {
    createRequest: async (data: {
        name: string;
        email: string;
        organization: string;
        message?: string;
    }) => {
        return apiRequest('/api/v1/signup-requests', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getAllRequests: async (token: string) => {
        return apiRequest<{
            requests: Array<{
                id: string;
                name: string;
                email: string;
                organization: string;
                message?: string;
                status: 'PENDING' | 'APPROVED' | 'REJECTED';
                createdAt: string;
                updatedAt: string;
            }>;
        }>('/api/v1/signup-requests', {
            method: 'GET',
            token,
        });
    },

    updateRequestStatus: async (
        token: string,
        requestId: string,
        status: 'PENDING' | 'APPROVED' | 'REJECTED',
    ) => {
        return apiRequest(`/api/v1/signup-requests/${requestId}/status`, {
            method: 'PATCH',
            token,
            body: JSON.stringify({ status }),
        });
    },
};

// Workspace API functions
export const workspaceApi = {
    getWorkspaces: async (token: string) => {
        return apiRequest<Workspace[]>('/api/v1/workspaces', {
            method: 'GET',
            token,
        });
    },

    getWorkspace: async (token: string, id: string) => {
        return apiRequest<Workspace>(`/api/v1/workspaces/${id}`, {
            method: 'GET',
            token,
        });
    },

    createWorkspace: async (
        token: string,
        name: string,
        description?: string,
    ) => {
        return apiRequest<Workspace>('/api/v1/workspaces', {
            method: 'POST',
            token,
            body: JSON.stringify({ name, description }),
        });
    },

    updateWorkspace: async (
        token: string,
        id: string,
        data: { name?: string; description?: string; order?: number },
    ) => {
        return apiRequest<Workspace>(`/api/v1/workspaces/${id}`, {
            method: 'PATCH',
            token,
            body: JSON.stringify(data),
        });
    },

    deleteWorkspace: async (token: string, id: string) => {
        return apiRequest<{ message: string; workspaceId: string }>(
            `/api/v1/workspaces/${id}`,
            {
                method: 'DELETE',
                token,
            },
        );
    },
};

// Project API functions
export const projectApi = {
    getProjectsByWorkspace: async (token: string, workspaceId: string) => {
        return apiRequest<Project[]>(
            `/api/v1/projects/workspace/${workspaceId}`,
            {
                method: 'GET',
                token,
            },
        );
    },

    getProject: async (token: string, id: string) => {
        return apiRequest<Project>(`/api/v1/projects/${id}`, {
            method: 'GET',
            token,
        });
    },

    createProject: async (
        token: string,
        workspaceId: string | undefined,
        name: string,
        description?: string,
    ) => {
        return apiRequest<Project>('/api/v1/projects', {
            method: 'POST',
            token,
            body: JSON.stringify({ workspaceId, name, description }),
        });
    },

    updateProject: async (
        token: string,
        id: string,
        data: {
            name?: string;
            description?: string;
            workspaceId?: string;
            order?: number;
        },
    ) => {
        return apiRequest<Project>(`/api/v1/projects/${id}`, {
            method: 'PATCH',
            token,
            body: JSON.stringify(data),
        });
    },

    deleteProject: async (token: string, id: string) => {
        return apiRequest<{ message: string }>(`/api/v1/projects/${id}`, {
            method: 'DELETE',
            token,
        });
    },
};

// Custom Field API functions
export const customFieldApi = {
    getCustomFields: async (token: string, projectId: string) => {
        return apiRequest<CustomField[]>(
            `/api/v1/projects/${projectId}/custom-fields`,
            {
                method: 'GET',
                token,
            },
        );
    },

    createCustomField: async (
        token: string,
        projectId: string,
        data: {
            name: string;
            description?: string;
            defaultValue?: string;
            dataType: DataType;
            color?: string;
            required?: boolean;
            customOptions?: string[];
        },
    ) => {
        return apiRequest<CustomField>(
            `/api/v1/projects/${projectId}/custom-fields`,
            {
                method: 'POST',
                token,
                body: JSON.stringify(data),
            },
        );
    },

    updateCustomField: async (
        token: string,
        projectId: string,
        fieldId: string,
        data: {
            name?: string;
            description?: string;
            defaultValue?: string;
            dataType?: DataType;
            color?: string;
            required?: boolean;
        },
    ) => {
        return apiRequest<CustomField>(
            `/api/v1/projects/${projectId}/custom-fields/${fieldId}`,
            {
                method: 'PATCH',
                token,
                body: JSON.stringify(data),
            },
        );
    },
};

// Task API functions
export const taskApi = {
    getTasksByProject: async (token: string, projectId: string) => {
        return apiRequest<Task[]>(`/api/v1/projects/${projectId}/tasks`, {
            method: 'GET',
            token,
        });
    },

    getTask: async (token: string, projectId: string, id: string) => {
        return apiRequest<Task>(`/api/v1/projects/${projectId}/tasks/${id}`, {
            method: 'GET',
            token,
        });
    },

    createTask: async (
        token: string,
        projectId: string,
        data: {
            name: string;
            description?: string;
            dueAt?: string;
            status?: 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';
            customFields?: Record<string, string | number | null>;
        },
    ) => {
        return apiRequest<Task>(`/api/v1/projects/${projectId}/tasks`, {
            method: 'POST',
            token,
            body: JSON.stringify(data),
        });
    },

    updateTask: async (
        token: string,
        projectId: string,
        id: string,
        data: {
            name?: string;
            description?: string;
            dueAt?: string;
            customFields?: Record<string, string>;
        },
    ) => {
        return apiRequest<Task>(`/api/v1/projects/${projectId}/tasks/${id}`, {
            method: 'PATCH',
            token,
            body: JSON.stringify(data),
        });
    },

    deleteTask: async (token: string, projectId: string, id: string) => {
        return apiRequest<{ message: string }>(
            `/api/v1/projects/${projectId}/tasks/${id}`,
            {
                method: 'DELETE',
                token,
            },
        );
    },

    copyTask: async (token: string, projectId: string, taskId: string) => {
        return apiRequest<Task>(
            `/api/v1/projects/${projectId}/tasks/${taskId}/copy`,
            {
                method: 'POST',
                token,
                body: JSON.stringify({ projectId, id: taskId }),
            },
        );
    },
};

// Task Comment API functions
export const taskCommentApi = {
    getCommentsByTask: async (
        token: string,
        projectId: string,
        taskId: string,
    ) => {
        return apiRequest<Comment[]>(
            `/api/v1/projects/${projectId}/tasks/${taskId}/comments`,
            {
                method: 'GET',
                token,
            },
        );
    },

    createComment: async (
        token: string,
        projectId: string,
        taskId: string,
        data: {
            comment: string;
            parentId?: string;
        },
    ) => {
        return apiRequest<Comment>(
            `/api/v1/projects/${projectId}/tasks/${taskId}/comments`,
            {
                method: 'POST',
                token,
                body: JSON.stringify({
                    comment: data.comment,
                    parentCommentId: data.parentId,
                }),
            },
        );
    },

    getComment: async (
        token: string,
        projectId: string,
        taskId: string,
        id: string,
    ) => {
        return apiRequest<Comment>(
            `/api/v1/projects/${projectId}/tasks/${taskId}/comments/${id}`,
            {
                method: 'GET',
                token,
            },
        );
    },

    toggleReaction: async (
        token: string,
        projectId: string,
        taskId: string,
        commentId: string,
        emoji: string,
    ) => {
        return apiRequest<{
            action: 'added' | 'removed';
        }>(
            `/api/v1/projects/${projectId}/tasks/${taskId}/comments/${commentId}/reactions`,
            {
                method: 'POST',
                token,
                body: JSON.stringify({ emoji }),
            },
        );
    },

    setResolvedStatus: async (
        token: string,
        projectId: string,
        taskId: string,
        id: string,
        resolved: boolean,
    ) => {
        return apiRequest<Comment>(
            `/api/v1/projects/${projectId}/tasks/${taskId}/comments/${id}/resolved`,
            {
                method: 'PATCH',
                token,
                body: JSON.stringify({ resolved }),
            },
        );
    },

    resolveComment: async (
        token: string,
        projectId: string,
        taskId: string,
        id: string,
    ) => {
        return taskCommentApi.setResolvedStatus(
            token,
            projectId,
            taskId,
            id,
            true,
        );
    },

    reopenComment: async (
        token: string,
        projectId: string,
        taskId: string,
        id: string,
    ) => {
        return taskCommentApi.setResolvedStatus(
            token,
            projectId,
            taskId,
            id,
            false,
        );
    },
};

// Dashboard types
export interface RecentItem {
    id: string;
    type: 'task' | 'project' | 'workspace';
    name: string;
    description?: string;
    parentName: string | null;
    parentId: string | null;
    workspaceName: string;
    workspaceId: string;
    status: string | null;
    updatedAt: string;
    icon: string;
}

export interface DashboardTask extends Task {
    project: {
        id: string;
        name: string;
        description?: string;
        workspace: {
            id: string;
            name: string;
        };
    };
}

export interface DashboardStats {
    totalTasks: number;
    pendingTasks: number;
    inProgressTasks: number;
    completedTasks: number;
    overdueTasks: number;
}

// Chat types
export interface Chat {
    id: string;
    message: string;
    response: string | null;
    createdAt: string;
    updatedAt: string;
}

// Access Link API functions
export interface AccessLink {
    id: string;
    type: string;
    active: boolean;
    expiresAt: string | null;
    email: string;
    project: {
        id: string;
        name: string;
    } | null;
}

export const accessLinkApi = {
    getAccessLink: async (linkId: string) => {
        const response = await apiRequest<AccessLink>(
            `/api/v1/access-links/${linkId}`,
            {
                method: 'GET',
            },
        );
        return response;
    },

    acceptAccessLink: async (
        token: string,
        linkId: string,
        data: {
            email: string;
            firstName: string;
            lastName: string;
            clerkId: string;
        },
    ) => {
        console.log(`[API] POST /api/v1/access-links/${linkId}/accept`, {
            endpoint: `/api/v1/access-links/${linkId}/accept`,
            method: 'POST',
            data,
            hasToken: !!token,
        });
        const response = await apiRequest<{ message: string }>(
            `/api/v1/access-links/${linkId}/accept`,
            {
                method: 'POST',
                token,
                body: JSON.stringify(data),
            },
        );
        console.log(
            `[API] POST /api/v1/access-links/${linkId}/accept - Response:`,
            response,
        );
        return response;
    },
};

// Dashboard API functions
export const dashboardApi = {
    getMyTasks: async (token: string) => {
        return apiRequest<DashboardTask[]>('/api/v1/dashboard/my-tasks', {
            method: 'GET',
            token,
        });
    },

    getRecentItems: async (token: string, limit?: number) => {
        const params = limit ? `?limit=${limit}` : '';
        return apiRequest<RecentItem[]>(`/api/v1/dashboard/recent${params}`, {
            method: 'GET',
            token,
        });
    },

    getCalendarTasks: async (
        token: string,
        startDate?: string,
        endDate?: string,
    ) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const queryString = params.toString() ? `?${params.toString()}` : '';
        return apiRequest<DashboardTask[]>(
            `/api/v1/dashboard/calendar${queryString}`,
            {
                method: 'GET',
                token,
            },
        );
    },
};

// Organization Document API functions
export interface OrganizationDocument {
    id: string;
    filename: string;
    originalName: string;
    filesize: number;
    mimeType: string;
    status:
        | 'PENDING'
        | 'PROCESSING'
        | 'EMBEDDING'
        | 'READY'
        | 'COMPLETED'
        | 'FAILED'
        | 'ARCHIVED';
    createdAt: string;
    updatedAt: string;
    sharepointSite?: {
        siteName: string;
    };
}

export interface OrganizationDocumentsResponse {
    documents: OrganizationDocument[];
}

export interface DocumentDetail extends OrganizationDocument {
    sourceType?: string;
    sourceUrl?: string;
    organizationId?: string;
    chunks?: Array<{
        id: string;
        content: string;
        metadata?: Record<string, unknown>;
    }>;
}

export const documentsApi = {
    getOrganizationDocuments: async (token: string, organizationId: string) => {
        return apiRequest<
            OrganizationDocument[] | OrganizationDocumentsResponse
        >(`/api/v1/documents/organization/${organizationId}`, {
            method: 'GET',
            token,
        });
    },

    getDocument: async (token: string, documentId: string) => {
        return apiRequest<{ document: DocumentDetail }>(
            `/api/v1/documents/${documentId}`,
            {
                method: 'GET',
                token,
            },
        );
    },

    retryDocument: async (token: string, documentId: string) => {
        return apiRequest<OrganizationDocument>(
            `/api/v1/documents/${documentId}/reprocess`,
            {
                method: 'POST',
                token,
            },
        );
    },

    reembedDocument: async (token: string, documentId: string) => {
        return apiRequest<OrganizationDocument>(
            `/api/v1/documents/${documentId}/reembed`,
            {
                method: 'POST',
                token,
            },
        );
    },
};

// Chat API functions
export const chatApi = {
    getChats: async (token: string) => {
        return apiRequest<Chat[]>('/api/v1/chats/', {
            method: 'GET',
            token,
        });
    },

    getChat: async (token: string, chatId: string) => {
        return apiRequest<Chat>(`/api/v1/chats/${chatId}`, {
            method: 'GET',
            token,
        });
    },

    createChat: async (
        token: string,
        message: string,
        externalSearchEnabled: boolean = false,
    ) => {
        return apiRequest<Chat>('/api/v1/chats/', {
            method: 'POST',
            token,
            body: JSON.stringify({ message, externalSearchEnabled }),
        });
    },

    pollChatStatus: async (
        token: string,
        chatId: string,
        onUpdate: (chat: Chat) => void,
        options: {
            interval?: number;
            maxAttempts?: number;
            onError?: (error: Error) => void;
        } = {},
    ): Promise<() => void> => {
        const { interval = 1500, maxAttempts = 60, onError } = options;

        let attempts = 0;
        let timeoutId: NodeJS.Timeout | null = null;
        let isCancelled = false;

        const poll = async () => {
            if (isCancelled) return;

            attempts++;

            try {
                const response = await chatApi.getChat(token, chatId);

                if (!response.data) {
                    throw new Error('Chat not found');
                }

                if (response.data.response !== null) {
                    onUpdate(response.data);
                    return;
                }

                if (attempts < maxAttempts) {
                    timeoutId = setTimeout(poll, interval);
                } else {
                    if (onError) {
                        onError(
                            new Error('Polling timeout: Response not ready'),
                        );
                    }
                }
            } catch (error) {
                if (onError) {
                    onError(
                        error instanceof Error
                            ? error
                            : new Error('Unknown error'),
                    );
                }
            }
        };

        poll();

        return () => {
            isCancelled = true;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        };
    },
};

// Tax Library Document types
export interface TaxLibraryDocument {
    id: string;
    organizationId: string;
    documentId: string;
    createdAt: string;
    updatedAt: string;
    document: {
        id: string;
        filename: string;
        originalName: string;
        filesize: number;
        mimeType: string;
        status: string;
        createdAt: string;
        updatedAt: string;
        uploadedByUser: {
            id: string;
            email: string;
        } | null;
        sharepointSite: {
            id: string;
            siteId: string;
            siteName: string;
        } | null;
    };
}

export interface TaxLibraryDocumentsResponse {
    taxLibraryDocuments: TaxLibraryDocument[];
}

// Tax Library API functions
export const taxLibraryApi = {
    getOrganizationDocuments: async (token: string, organizationId: string) => {
        return apiRequest<TaxLibraryDocumentsResponse>(
            `/api/v1/tax-library-documents/organization/${organizationId}`,
            {
                method: 'GET',
                token,
            },
        );
    },

    uploadDocument: async (
        token: string,
        organizationId: string,
        file: File,
    ) => {
        // Step 1: Get signed S3 upload URL from Core API
        const uploadUrlResponse = await fetch(
            `${API_BASE_URL}/api/v1/documents/upload`,
            {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    files: [file.name],
                    organizationId,
                    source: 'library',
                }),
            },
        );

        if (!uploadUrlResponse.ok) {
            throw new Error('Failed to get upload URL');
        }

        const uploadUrlData = await uploadUrlResponse.json();
        const signedUrl =
            uploadUrlData.data?.[0]?.signedUrl ||
            uploadUrlData.signedUrl ||
            uploadUrlData[0]?.signedUrl;

        if (!signedUrl) {
            throw new Error('No signed URL returned from server');
        }

        // Step 2: Upload file directly to S3 using the signed URL
        const s3Response = await fetch(signedUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': file.type || 'application/octet-stream',
            },
            body: file,
        });

        if (!s3Response.ok) {
            throw new Error('Failed to upload file to S3');
        }

        return uploadUrlData;
    },

    deleteDocument: async (token: string, documentId: string) => {
        return apiRequest<{ message: string }>(
            `/api/v1/tax-library-documents/${documentId}`,
            {
                method: 'DELETE',
                token,
            },
        );
    },
};

// Permission utilities
export const permissionUtils = {
    hasAnyOrgPermission: (
        permissions: UserPermissions | undefined,
        orgId: string,
        requiredPermissions: Permission[],
    ): boolean => {
        if (!permissions?.organizations) return false;
        const orgPermissions = permissions.organizations[orgId];
        if (!orgPermissions) return false;
        return requiredPermissions.some((p) => orgPermissions.includes(p));
    },
};
