'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * Validation function that returns error messages keyed by field name
 * @template TFormData - The shape of the form data
 * @returns Object with field names as keys and error messages as values, or null if valid
 */
export type FormValidator<TFormData> = (
    values: TFormData,
) => Record<string, string> | null;

/**
 * Options for configuring the dialog form hook
 * @template TFormData - The shape of the form data
 */
export interface UseDialogFormOptions<TFormData> {
    /**
     * Initial values for the form fields
     */
    initialValues: TFormData;

    /**
     * Optional validation function that runs before submission.
     * Should return an object with field errors or null if valid.
     */
    validate?: FormValidator<TFormData>;

    /**
     * Form submission handler. Receives the validated form values.
     * Should throw an error if submission fails.
     */
    onSubmit: (values: TFormData) => Promise<void>;

    /**
     * Whether to reset the form to initial values after successful submission.
     * @default true
     */
    resetOnSuccess?: boolean;

    /**
     * Optional callback when form is submitted and isSubmitting state changes.
     * Useful for coordinating with dialog close state.
     */
    onOpenChange?: (open: boolean) => void;
}

/**
 * Return type for the useDialogForm hook
 * @template TFormData - The shape of the form data
 */
export interface UseDialogFormResult<TFormData> {
    /**
     * Current form values
     */
    values: TFormData;

    /**
     * Current validation errors keyed by field name
     */
    errors: Record<string, string>;

    /**
     * Whether the form is currently being submitted
     */
    isSubmitting: boolean;

    /**
     * Update a single field value in a type-safe way
     */
    handleChange: <K extends keyof TFormData>(
        field: K,
        value: TFormData[K],
    ) => void;

    /**
     * Handle form submission. Call from form's onSubmit handler.
     * Automatically prevents default, validates, and handles submission flow.
     */
    handleSubmit: (e: React.FormEvent) => Promise<void>;

    /**
     * Reset form to initial values and clear errors
     */
    reset: () => void;

    /**
     * Set multiple form values at once (useful for pre-filling)
     */
    setValues: (values: Partial<TFormData>) => void;
}

/**
 * Custom hook for managing dialog form state, validation, and submission.
 *
 * This hook eliminates boilerplate for:
 * - Form state management
 * - Field updates with type safety
 * - Form validation with error display
 * - Submit handler with preventDefault
 * - Reset logic after successful submission
 *
 * @example
 * ```typescript
 * interface ProjectFormData {
 *   name: string
 *   description: string
 * }
 *
 * const form = useDialogForm<ProjectFormData>({
 *   initialValues: { name: '', description: '' },
 *   validate: (values) => {
 *     if (!values.name.trim()) {
 *       return { name: 'Project name is required' }
 *     }
 *     return null
 *   },
 *   onSubmit: async (values) => {
 *     await createProject(values)
 *   },
 *   resetOnSuccess: true
 * })
 *
 * // In JSX:
 * <form onSubmit={form.handleSubmit}>
 *   <Input
 *     value={form.values.name}
 *     onChange={(e) => form.handleChange('name', e.target.value)}
 *   />
 *   {form.errors.name && <span>{form.errors.name}</span>}
 * </form>
 * ```
 */
export function useDialogForm<TFormData extends Record<string, any>>({
    initialValues,
    validate,
    onSubmit,
    resetOnSuccess = true,
    onOpenChange,
}: UseDialogFormOptions<TFormData>): UseDialogFormResult<TFormData> {
    const [values, setValues] = useState<TFormData>(initialValues);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    /**
     * Reset form to initial values and clear errors
     */
    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
    }, [initialValues]);

    /**
     * Update a single field value
     */
    const handleChange = useCallback(
        <K extends keyof TFormData>(field: K, value: TFormData[K]) => {
            setValues((prev) => ({
                ...prev,
                [field]: value,
            }));

            // Clear error for this field when user starts typing
            if (errors[field as string]) {
                setErrors((prev) => {
                    const newErrors = { ...prev };
                    delete newErrors[field as string];
                    return newErrors;
                });
            }
        },
        [errors],
    );

    /**
     * Set multiple values at once (useful for pre-filling edit forms)
     */
    const setValuesPartial = useCallback((newValues: Partial<TFormData>) => {
        setValues((prev) => ({
            ...prev,
            ...newValues,
        }));
    }, []);

    /**
     * Handle form submission
     */
    const handleSubmit = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();

            // Don't submit if already submitting
            if (isSubmitting) {
                return;
            }

            // Clear previous errors
            setErrors({});

            // Run validation if provided
            if (validate) {
                const validationErrors = validate(values);
                if (validationErrors) {
                    setErrors(validationErrors);
                    return;
                }
            }

            setIsSubmitting(true);

            try {
                // Execute submission handler
                await onSubmit(values);

                // Reset form if configured to do so
                if (resetOnSuccess) {
                    reset();
                }
            } catch (error) {
                // Error handling is done by useAuthenticatedMutation
                // We just need to ensure isSubmitting is reset
                console.error('Form submission error:', error);
            } finally {
                setIsSubmitting(false);
            }
        },
        [isSubmitting, validate, values, onSubmit, resetOnSuccess, reset],
    );

    // Reset form when dialog closes (optional coordination with parent)
    useEffect(() => {
        if (!isSubmitting && onOpenChange) {
            // This allows the form to be reset when dialog closes
            // The parent can trigger this by changing the open prop
        }
    }, [isSubmitting, onOpenChange]);

    return {
        values,
        errors,
        isSubmitting,
        handleChange,
        handleSubmit,
        reset,
        setValues: setValuesPartial,
    };
}
