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

export type OrganizationRole = 'ADMIN' | 'MEMBER';
export type MembershipRole = 'OWNER' | 'MEMBER' | 'GUEST';

export interface Organization {
    id: string;
    name: string;
    slug?: string;
}

export interface OrganizationDetails {
    id: string;
    name: string;
    slug?: string;
    createdAt: string;
    updatedAt: string;
    _count: {
        documents: number;
    };
    users: Array<{
        id: string;
        email: string;
        firstName?: string;
        lastName?: string;
        organizationRole: OrganizationRole;
    }>;
}

export interface MeResponse {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    clerkId?: string;
    organizationRole: OrganizationRole;
    organizationId: string;
    organization: Organization | null;
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

export type ApprovalStatus = 'IN_PREPARATION' | 'IN_REVIEW' | 'COMPLETED';

export type ApprovalRole = 'NONE' | 'PREPARER' | 'REVIEWER';

export interface ApprovalChainEntry {
    role: 'PREPARER' | 'REVIEWER';
    customFieldId: string;
    stepOrder: number;
    user: (User & { clerkId?: string }) | null;
}

/** Project-level workflow step as returned by GET/PUT /projects/:projectId/approval-workflow */
export interface ApprovalWorkflowStep {
    id: string;
    type: 'PREPARER' | 'REVIEWER';
    order: number;
    customFieldId: string;
    projectId: string;
    customField: {
        id: string;
        name: string;
        dataType: DataType;
    };
    createdAt: string;
    updatedAt: string;
}

export interface Task {
    id: string;
    name: string;
    description?: string;
    projectId: string;
    dueAt?: string;
    // Approval workflow fields
    approvalStatus: ApprovalStatus;
    currentStepIndex: number;
    createdAt: string;
    updatedAt: string;
    project: {
        id: string;
        description?: string;
    };
    approvalChain?: ApprovalChainEntry[];
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
        order: number;
        customOptions?: string[];
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
    multiple: boolean;
    order: number;
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
    comment: string;
    createdAt: string;
    updatedAt: string;
    user: User;
    resolved: boolean;
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

export interface OrganizationMember {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    organizationRole: OrganizationRole;
    createdAt: string;
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
        console.warn('API Error Response:', {
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
        return apiRequest<MeResponse>('/api/v1/users/me', {
            method: 'PATCH',
            token,
            body: JSON.stringify(data),
        });
    },

    completeOnboarding: async (
        token: string,
        data: {
            email: string;
            firstName?: string;
            lastName?: string;
            organizationName: string;
        },
    ) => {
        return apiRequest<{
            organization: Organization;
            user: MeResponse;
            workspace: { id: string; name: string; isPersonal: boolean };
        }>('/api/v1/users/me/complete-onboarding', {
            method: 'POST',
            token,
            body: JSON.stringify(data),
        });
    },

    joinOrganization: async (
        token: string,
        data: {
            email: string;
            firstName?: string;
            lastName?: string;
            organizationId: string;
        },
    ) => {
        return apiRequest<MeResponse>('/api/v1/users/me/join-organization', {
            method: 'POST',
            token,
            body: JSON.stringify(data),
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
        role: OrganizationRole,
    ) => {
        return apiRequest<OrganizationMember>(
            `/api/v1/organizations/${organizationId}/users/${userId}/role`,
            {
                method: 'PATCH',
                token,
                body: JSON.stringify({ role }),
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

    getOrganization: async (token: string, organizationId: string) => {
        return apiRequest<OrganizationDetails>(
            `/api/v1/organizations/${organizationId}`,
            {
                method: 'GET',
                token,
            },
        );
    },

    renameOrganization: async (
        token: string,
        organizationId: string,
        name: string,
    ) => {
        return apiRequest<OrganizationDetails>(
            `/api/v1/organizations/${organizationId}`,
            {
                method: 'PATCH',
                token,
                body: JSON.stringify({ name }),
            },
        );
    },

    updateDetails: async (
        token: string,
        organizationId: string,
        data: { industry?: string; size?: string; description?: string },
    ) => {
        return apiRequest<OrganizationDetails>(
            `/api/v1/organizations/${organizationId}/details`,
            {
                method: 'PATCH',
                token,
                body: JSON.stringify(data),
            },
        );
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
            multiple?: boolean;
            order?: number;
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
            multiple?: boolean;
            order?: number;
            customOptions?: string[];
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

    deleteCustomField: async (
        token: string,
        projectId: string,
        fieldId: string,
    ) => {
        return apiRequest<void>(
            `/api/v1/projects/${projectId}/custom-fields/${fieldId}`,
            {
                method: 'DELETE',
                token,
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
            },
        );
    },
};

// Approval Workflow API functions
export const approvalApi = {
    submitTask: async (token: string, projectId: string, taskId: string) => {
        return apiRequest<Task>(
            `/api/v1/projects/${projectId}/tasks/${taskId}/submit`,
            {
                method: 'POST',
                token,
            },
        );
    },

    rejectTask: async (token: string, projectId: string, taskId: string) => {
        return apiRequest<Task>(
            `/api/v1/projects/${projectId}/tasks/${taskId}/reject`,
            {
                method: 'POST',
                token,
            },
        );
    },

    reopenTask: async (token: string, projectId: string, taskId: string) => {
        return apiRequest<Task>(
            `/api/v1/projects/${projectId}/tasks/${taskId}/reopen`,
            {
                method: 'POST',
                token,
            },
        );
    },

    getWorkflow: async (token: string, projectId: string) => {
        return apiRequest<ApprovalWorkflowStep[]>(
            `/api/v1/projects/${projectId}/approval-workflow`,
            {
                method: 'GET',
                token,
            },
        );
    },

    setWorkflow: async (
        token: string,
        projectId: string,
        steps: Array<{
            type: 'PREPARER' | 'REVIEWER';
            customFieldId: string;
            order: number;
        }>,
    ) => {
        return apiRequest<ApprovalWorkflowStep[]>(
            `/api/v1/projects/${projectId}/approval-workflow`,
            {
                method: 'PUT',
                token,
                body: JSON.stringify({ steps }),
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
export interface ChatMessage {
    id: string;
    message: string;
    response: string | null;
    externalSearchEnabled: boolean;
    conversationId: string;
    createdAt: string;
    updatedAt: string;
}

export interface ChatConversation {
    id: string;
    title: string | null;
    createdById: string;
    organizationId: string;
    taskId: string | null;
    projectId: string | null;
    workspaceId: string | null;
    createdAt: string;
    updatedAt: string;
    messages: ChatMessage[];
    sources?: any;
}

// Normalised flat view used by the chat UI
export interface Chat {
    id: string;
    title: string | null;
    message: string;
    response: string | null;
    createdAt: string;
    updatedAt: string;
}

function normalizeChatConversation(conv: ChatConversation): Chat {
    const firstMsg = conv.messages?.[0];
    const lastMsg = conv.messages?.[conv.messages.length - 1];
    return {
        id: conv.id,
        title: conv.title ?? null,
        message: firstMsg?.message ?? '',
        response: lastMsg?.response ?? null,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
    };
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
        | 'UPLOADING'
        | 'PROCESSING'
        | 'EMBEDDING'
        | 'READY'
        | 'FAILED'
        | 'FAILED_CORRUPTED'
        | 'FAILED_UNSUPPORTED'
        | 'FAILED_TOO_LARGE'
        | 'FAILED_PROCESSING'
        | 'FAILED_EMBEDDING'
        | 'DELETING'
        | 'DELETED';
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

    reembedDocument: async (
        token: string,
        documentId: string,
        resume = false,
    ) => {
        return apiRequest<OrganizationDocument>(
            `/api/v1/documents/${documentId}/reembed`,
            {
                method: 'POST',
                token,
                body: JSON.stringify({ resume }),
            },
        );
    },
};

// Job types
export type ServiceJobStatus =
    | 'PENDING'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'FAILED';
export type DocumentStatusPhase = 'UPLOADING' | 'PROCESSING' | 'EMBEDDING';

export interface ServiceJobChild {
    id: string;
    jobName: string;
    status: ServiceJobStatus;
    createdAt: string;
}

export interface ServiceJob {
    id: string;
    jobName: string;
    description: string;
    status: ServiceJobStatus;
    documentStatusPhase: DocumentStatusPhase | null;
    triggeredBy: string;
    documentId: string | null;
    organizationId: string;
    parentJobId: string | null;
    sharepointSiteId: string | null;
    version: number;
    createdAt: string;
    updatedAt: string;
    organization: {
        id: string;
        name: string;
    };
    parentJob: {
        id: string;
        jobName: string;
    } | null;
    childJobs: ServiceJobChild[];
}

export const jobsApi = {
    getJobsByDocument: async (token: string, documentId: string) => {
        return apiRequest<ServiceJob[]>(
            `/api/v1/jobs/by-document/${documentId}`,
            {
                method: 'GET',
                token,
            },
        );
    },
};

// Chat API functions
export const chatApi = {
    getChats: async (token: string): Promise<ApiResponse<Chat[]>> => {
        const response = await apiRequest<ChatConversation[]>(
            '/api/v1/chats/',
            {
                method: 'GET',
                token,
            },
        );
        if (response.data) {
            return {
                ...response,
                data: response.data.map(normalizeChatConversation),
            };
        }
        return response as unknown as ApiResponse<Chat[]>;
    },

    getChat: async (
        token: string,
        chatId: string,
    ): Promise<ApiResponse<ChatConversation>> => {
        const response = await apiRequest<ChatConversation>(
            `/api/v1/chats/${chatId}`,
            {
                method: 'GET',
                token,
            },
        );
        return response;
    },

    sendMessage: async (
        token: string,
        conversationId: string,
        message: string,
        externalSearchEnabled: boolean = false,
    ): Promise<ApiResponse<ChatMessage>> => {
        return apiRequest<ChatMessage>(
            `/api/v1/chats/${conversationId}/messages`,
            {
                method: 'POST',
                token,
                body: JSON.stringify({ message, externalSearchEnabled }),
            },
        );
    },

    createChat: async (
        token: string,
        message: string,
        externalSearchEnabled: boolean = false,
    ): Promise<ApiResponse<Chat>> => {
        const response = await apiRequest<{
            conversation: ChatConversation;
            message: ChatMessage;
        }>('/api/v1/chats/', {
            method: 'POST',
            token,
            body: JSON.stringify({ message, externalSearchEnabled }),
        });
        if (response.data) {
            const { conversation, message: msg } = response.data;
            return {
                ...response,
                data: {
                    id: conversation.id,
                    title: conversation.title ?? null,
                    message: msg.message,
                    response: msg.response,
                    createdAt: conversation.createdAt,
                    updatedAt: conversation.updatedAt,
                },
            };
        }
        return response as unknown as ApiResponse<Chat>;
    },

    pollChatStatus: async (
        token: string,
        conversationId: string,
        messageId: string,
        onUpdate: (conv: ChatConversation) => void,
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
                const response = await chatApi.getChat(token, conversationId);

                if (!response.data) {
                    throw new Error('Conversation not found');
                }

                const targetMsg = response.data.messages?.find(
                    (m) => m.id === messageId,
                );
                if (
                    targetMsg?.response !== null &&
                    targetMsg?.response !== undefined
                ) {
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
        const uploadInfo = uploadUrlData.data.uploadUrls?.[0];

        if (!uploadInfo?.url) {
            throw new Error('No signed URL returned from server');
        }

        const signedUrl = uploadInfo.url;

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
