'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { customFieldApi, CustomField } from '@/lib/api';
import { toast } from 'sonner';

/**
 * Return type for the useCustomFields hook
 */
export interface UseCustomFieldsResult {
    /**
     * Array of custom fields for the project
     */
    customFields: CustomField[];

    /**
     * Current values for all custom fields, keyed by field ID
     */
    customFieldValues: Record<string, string>;

    /**
     * Whether custom fields are currently being fetched
     */
    isLoadingFields: boolean;

    /**
     * Update the value of a specific custom field
     */
    updateCustomFieldValue: (fieldId: string, value: string) => void;

    /**
     * Validate all custom fields.
     * Returns true if all validation passes, false otherwise.
     * Automatically shows toast errors for validation failures.
     */
    validateCustomFields: () => boolean;

    /**
     * Transform custom field values to the format expected by the API.
     * Converts NUMBER types to numbers, handles null values.
     */
    getCustomFieldsPayload: () => Record<string, string | number | null>;

    /**
     * Reset all custom field values to their defaults
     */
    resetCustomFields: () => void;
}

/**
 * Custom hook for managing task custom fields.
 *
 * Handles:
 * - Fetching custom fields for a project
 * - Managing custom field values state
 * - Validating custom fields (required, data types, custom options)
 * - Transforming values for API submission (type conversion)
 *
 * @param projectId - The ID of the project to fetch custom fields for
 * @param enabled - Whether to fetch custom fields (useful for controlling when to load)
 *
 * @example
 * ```typescript
 * const customFieldsHook = useCustomFields(projectId, open)
 *
 * // Validate before submission
 * if (!customFieldsHook.validateCustomFields()) {
 *   return
 * }
 *
 * // Get transformed payload for API
 * const customFieldsPayload = customFieldsHook.getCustomFieldsPayload()
 * await taskApi.createTask(token, projectId, {
 *   name,
 *   customFields: customFieldsPayload
 * })
 * ```
 */
export function useCustomFields(
    projectId: string,
    enabled: boolean = true,
): UseCustomFieldsResult {
    const { getToken } = useAuth();
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [customFieldValues, setCustomFieldValues] = useState<
        Record<string, string>
    >({});
    const [isLoadingFields, setIsLoadingFields] = useState(false);

    /**
     * Fetch custom fields when enabled and projectId changes
     */
    useEffect(() => {
        if (enabled && projectId) {
            fetchCustomFields();
        }
    }, [enabled, projectId]);

    /**
     * Fetch custom fields from API
     */
    const fetchCustomFields = async () => {
        setIsLoadingFields(true);
        try {
            const token = await getToken();
            if (!token) return;

            const response = await customFieldApi.getCustomFields(
                token,
                projectId,
            );
            const fields = response.data || [];
            setCustomFields(fields);

            // Initialize custom field values with defaults
            const initialValues: Record<string, string> = {};
            fields.forEach((field) => {
                initialValues[field.id] = field.defaultValue || '';
            });
            setCustomFieldValues(initialValues);
        } catch (error) {
            console.error('Failed to fetch custom fields:', error);
            // Don't show toast error here - custom fields are optional
        } finally {
            setIsLoadingFields(false);
        }
    };

    /**
     * Update a single custom field value
     */
    const updateCustomFieldValue = (fieldId: string, value: string) => {
        setCustomFieldValues((prev) => ({
            ...prev,
            [fieldId]: value,
        }));
    };

    /**
     * Validate all custom fields
     */
    const validateCustomFields = (): boolean => {
        for (const field of customFields) {
            const value = customFieldValues[field.id];

            // Check required fields
            if (field.required && (!value || value.trim() === '')) {
                toast.error(`${field.name} is required`);
                return false;
            }

            // Skip validation for empty non-required fields
            if (!value || value.trim() === '') continue;

            // Data type validation
            switch (field.dataType) {
                case 'NUMBER':
                    if (isNaN(Number(value))) {
                        toast.error(`${field.name} must be a valid number`);
                        return false;
                    }
                    break;
                case 'DATE':
                    if (isNaN(Date.parse(value))) {
                        toast.error(`${field.name} must be a valid date`);
                        return false;
                    }
                    break;
                case 'CUSTOM':
                    if (field.customOptions && field.customOptions.length > 0) {
                        if (!field.customOptions.includes(value)) {
                            toast.error(
                                `${field.name} must be one of the available options`,
                            );
                            return false;
                        }
                    }
                    break;
            }
        }
        return true;
    };

    /**
     * Transform custom field values to API format
     */
    const getCustomFieldsPayload = (): Record<
        string,
        string | number | null
    > => {
        const payload: Record<string, string | number | null> = {};

        customFields.forEach((field) => {
            const value = customFieldValues[field.id];

            if (value && value.trim() !== '') {
                if (field.dataType === 'NUMBER') {
                    payload[field.id] = Number(value);
                } else {
                    payload[field.id] = value;
                }
            } else {
                payload[field.id] = null;
            }
        });

        return payload;
    };

    /**
     * Reset custom fields to default values
     */
    const resetCustomFields = () => {
        const initialValues: Record<string, string> = {};
        customFields.forEach((field) => {
            initialValues[field.id] = field.defaultValue || '';
        });
        setCustomFieldValues(initialValues);
    };

    return {
        customFields,
        customFieldValues,
        isLoadingFields,
        updateCustomFieldValue,
        validateCustomFields,
        getCustomFieldsPayload,
        resetCustomFields,
    };
}
