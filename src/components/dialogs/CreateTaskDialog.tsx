'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { taskApi } from '@/lib/api';
import { useAuthenticatedMutation } from '@/hooks/useAuthenticatedMutation';
import { useDialogForm } from '@/hooks/useDialogForm';
import { useCustomFields } from '@/hooks/useCustomFields';
import { FormDialog } from './shared/FormDialog';
import { FormDialogField } from './shared/FormDialogField';
import { FormDialogActions } from './shared/FormDialogActions';
import { CustomFieldsSection } from './shared/CustomFieldsSection';

interface CreateTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    onSuccess?: () => void;
}

interface TaskFormData {
    name: string;
    description: string;
    dueDate?: Date;
}

export function CreateTaskDialog({
    open,
    onOpenChange,
    projectId,
    onSuccess,
}: CreateTaskDialogProps) {
    // Custom fields hook
    const customFieldsHook = useCustomFields(projectId, open);

    // Mutation hook
    const { mutate, isLoading } = useAuthenticatedMutation({
        mutationFn: (
            token,
            data: {
                name: string;
                description?: string;
                dueAt?: string;
                status: string;
                customFields: Record<string, string | number | null>;
            },
        ) => taskApi.createTask(token, projectId, data),
        successMessage: 'Task created successfully',
        onSuccess: () => {
            // Reset custom fields after success
            customFieldsHook.resetCustomFields();
            // Delay to ensure dialog closes first
            setTimeout(() => {
                onSuccess?.();
            }, 100);
        },
    });

    // Form hook
    const form = useDialogForm<TaskFormData>({
        initialValues: {
            name: '',
            description: '',
            dueDate: new Date(),
        },
        validate: (values) => {
            if (!values.name.trim()) {
                return { name: 'Please enter a task name' };
            }
            // Validate custom fields
            if (!customFieldsHook.validateCustomFields()) {
                return { customFields: 'Custom field validation failed' };
            }
            return null;
        },
        onSubmit: async (values) => {
            await mutate({
                name: values.name,
                description: values.description || undefined,
                dueAt: values.dueDate
                    ? values.dueDate.toISOString()
                    : undefined,
                status: 'PENDING',
                customFields: customFieldsHook.getCustomFieldsPayload(),
            });
            onOpenChange(false);
        },
        resetOnSuccess: true,
    });

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Create New Task"
            description="Create a new task for this project."
            scrollable
        >
            <form onSubmit={form.handleSubmit}>
                <div className="grid gap-4 py-4">
                    <FormDialogField
                        label="Task Name"
                        name="name"
                        required
                        error={form.errors.name}
                    >
                        <Input
                            id="name"
                            placeholder="e.g., Review financial statements"
                            value={form.values.name}
                            onChange={(e) =>
                                form.handleChange('name', e.target.value)
                            }
                            disabled={isLoading}
                            autoFocus
                        />
                    </FormDialogField>

                    <FormDialogField
                        label="Description"
                        name="description"
                        description="Optional"
                    >
                        <Textarea
                            id="description"
                            placeholder="Add a description for this task..."
                            value={form.values.description}
                            onChange={(e) =>
                                form.handleChange('description', e.target.value)
                            }
                            disabled={isLoading}
                            rows={3}
                        />
                    </FormDialogField>

                    <FormDialogField
                        label="Due Date"
                        name="dueDate"
                        description="Optional"
                    >
                        <DatePicker
                            date={form.values.dueDate}
                            setDate={(date) =>
                                form.handleChange('dueDate', date)
                            }
                            disabled={isLoading}
                            placeholder="Select a due date"
                        />
                    </FormDialogField>

                    {/* Custom Fields Section */}
                    <CustomFieldsSection
                        customFields={customFieldsHook.customFields}
                        customFieldValues={customFieldsHook.customFieldValues}
                        onChange={customFieldsHook.updateCustomFieldValue}
                        disabled={isLoading}
                        isLoading={customFieldsHook.isLoadingFields}
                    />
                </div>

                <FormDialogActions
                    onCancel={() => onOpenChange(false)}
                    submitLabel="Create Task"
                    isLoading={isLoading}
                    loadingLabel="Creating..."
                    disabled={customFieldsHook.isLoadingFields}
                />
            </form>
        </FormDialog>
    );
}
