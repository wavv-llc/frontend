'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { useSidebar } from '@/contexts/SidebarContext';
import type { ApiResponse } from '@/lib/api';

/**
 * Options for configuring the authenticated mutation hook
 * @template TData - The type of data returned by the mutation
 * @template TParams - Tuple type of parameters passed to the mutation function (excluding token)
 */
export interface UseAuthenticatedMutationOptions<
    TData,
    TParams extends unknown[],
> {
    /**
     * The mutation function to execute. Receives the auth token as first parameter,
     * followed by any additional parameters passed to mutate().
     */
    mutationFn: (
        token: string,
        ...params: TParams
    ) => Promise<ApiResponse<TData>>;

    /**
     * Optional callback executed after successful mutation.
     * Receives the data from the mutation response.
     */
    onSuccess?: (data: TData) => void | Promise<void>;

    /**
     * Optional callback executed when mutation fails.
     * Receives the error object.
     */
    onError?: (error: Error) => void;

    /**
     * Optional success message to display in a toast notification.
     * If not provided, no success toast will be shown.
     */
    successMessage?: string;

    /**
     * Optional error message to display in a toast notification.
     * If not provided, the error message from the caught error will be used.
     */
    errorMessage?: string;

    /**
     * Whether to trigger a sidebar refresh after successful mutation.
     * Uses the SidebarContext's triggerRefresh function.
     * @default false
     */
    requiresSidebarRefresh?: boolean;
}

/**
 * Return type for the useAuthenticatedMutation hook
 * @template TParams - Tuple type of parameters passed to the mutation function
 */
export interface UseAuthenticatedMutationResult<TParams extends unknown[]> {
    /**
     * Execute the mutation with the given parameters.
     * Automatically handles token retrieval, error handling, and loading states.
     */
    mutate: (...params: TParams) => Promise<void>;

    /**
     * Whether the mutation is currently in progress
     */
    isLoading: boolean;

    /**
     * The error from the last failed mutation, or null if no error
     */
    error: Error | null;
}

/**
 * Custom hook for handling authenticated API mutations with automatic error handling,
 * loading states, and toast notifications.
 *
 * This hook eliminates boilerplate for:
 * - Token retrieval and validation
 * - Try/catch error handling
 * - Loading state management
 * - Toast notifications for success/error
 * - Optional sidebar refresh
 *
 * @example
 * ```typescript
 * const { mutate, isLoading } = useAuthenticatedMutation({
 *   mutationFn: (token, name: string, description?: string) =>
 *     workspaceApi.createWorkspace(token, name, description),
 *   successMessage: 'Workspace created successfully',
 *   requiresSidebarRefresh: true,
 *   onSuccess: () => {
 *     // Additional success handling
 *   }
 * })
 *
 * // Later, in your component:
 * await mutate('My Workspace', 'Description')
 * ```
 */
export function useAuthenticatedMutation<TData, TParams extends unknown[]>({
    mutationFn,
    onSuccess,
    onError,
    successMessage,
    errorMessage,
    requiresSidebarRefresh = false,
}: UseAuthenticatedMutationOptions<
    TData,
    TParams
>): UseAuthenticatedMutationResult<TParams> {
    const { getToken } = useAuth();
    const { triggerRefresh } = useSidebar();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const mutate = async (...params: TParams): Promise<void> => {
        // Reset error state
        setError(null);
        setIsLoading(true);

        try {
            // Get authentication token
            const token = await getToken();

            if (!token) {
                const authError = new Error(
                    'You must be logged in to perform this action',
                );
                setError(authError);
                toast.error('You must be logged in to perform this action');
                return;
            }

            // Execute the mutation
            const response = await mutationFn(token, ...params);

            // Check if the response indicates success
            if (!response.success || !response.data) {
                throw new Error(response.error?.message || 'Operation failed');
            }

            // Show success toast if message provided
            if (successMessage) {
                toast.success(successMessage);
            }

            // Trigger sidebar refresh if requested
            if (requiresSidebarRefresh) {
                triggerRefresh();
            }

            // Call success callback if provided
            if (onSuccess) {
                await onSuccess(response.data);
            }
        } catch (err) {
            // Create error object
            const errorObj =
                err instanceof Error
                    ? err
                    : new Error('An unknown error occurred');
            setError(errorObj);

            // Show error toast
            const displayMessage = errorMessage || errorObj.message;
            toast.error(displayMessage);

            // Log error for debugging
            console.error('Mutation failed:', errorObj);

            // Call error callback if provided
            if (onError) {
                onError(errorObj);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return {
        mutate,
        isLoading,
        error,
    };
}
