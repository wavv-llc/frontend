'use client';

import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { taskApi, type Task } from '@/lib/api';
import { useAuthenticatedMutation } from '@/hooks/useAuthenticatedMutation';
import { useDialogForm } from '@/hooks/useDialogForm';
import { useCustomFields } from '@/hooks/useCustomFields';
import { FormDialog } from './shared/FormDialog';
import { FormDialogField } from './shared/FormDialogField';
import { FormDialogActions } from './shared/FormDialogActions';
import { CustomFieldsSection } from './shared/CustomFieldsSection';

type TaskFormMode = 'create' | 'edit';

interface TaskFormDialogProps {
    mode: TaskFormMode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    task?: Task;
    onSuccess?: () => void;
}

interface TaskFormData {
    name: string;
    description: string;
    dueDate?: Date;
}

export function TaskFormDialog({
    mode,
    open,
    onOpenChange,
    projectId,
    task,
    onSuccess,
}: TaskFormDialogProps) {
    const isCreateMode = mode === 'create';

    // Custom fields hook (only for create mode)
    const customFieldsHook = useCustomFields(projectId, open && isCreateMode);

    // Mutation hook
    const { mutate, isLoading } = useAuthenticatedMutation({
        mutationFn: (
            token,
            data: {
                name: string;
                description?: string;
                dueAt?: string;
                status?: 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';
                customFields?: Record<string, string | number | null>;
            },
        ) => {
            // Transform customFields to match API expectations (string values only, no null)
            const transformedData = {
                ...data,
                customFields: data.customFields
                    ? Object.entries(data.customFields).reduce(
                          (acc, [key, value]) => {
                              if (value !== null) {
                                  acc[key] = String(value);
                              }
                              return acc;
                          },
                          {} as Record<string, string>,
                      )
                    : undefined,
            };

            if (isCreateMode) {
                return taskApi.createTask(token, projectId, transformedData);
            } else {
                // Edit mode - task must exist
                if (!task) throw new Error('Task is required for edit mode');
                return taskApi.updateTask(
                    token,
                    task.projectId,
                    task.id,
                    transformedData,
                );
            }
        },
        successMessage: isCreateMode
            ? 'Task created successfully'
            : 'Task updated successfully',
        onSuccess: () => {
            if (isCreateMode) {
                // Reset custom fields after success
                customFieldsHook.resetCustomFields();
            }
            // Delay to ensure dialog closes first
            setTimeout(() => {
                onSuccess?.();
            }, 100);
        },
    });

    // Form hook
    const form = useDialogForm<TaskFormData>({
        initialValues: isCreateMode
            ? {
                  name: '',
                  description: '',
                  dueDate: new Date(),
              }
            : {
                  name: task?.name || '',
                  description: task?.description || '',
                  dueDate: task?.dueAt ? new Date(task.dueAt) : undefined,
              },
        validate: (values): Record<string, string> | null => {
            if (!values.name.trim()) {
                return { name: 'Please enter a task name' };
            }
            // Validate custom fields (only in create mode)
            if (isCreateMode && !customFieldsHook.validateCustomFields()) {
                return { customFields: 'Custom field validation failed' };
            }
            return null;
        },
        onSubmit: async (values) => {
            const payload: {
                name: string;
                description?: string;
                dueAt?: string;
                status?: 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED';
                customFields?: Record<string, string | number | null>;
            } = {
                name: values.name,
                description: values.description || undefined,
                dueAt: values.dueDate
                    ? values.dueDate.toISOString()
                    : undefined,
            };

            // Add status and custom fields only for create mode
            if (isCreateMode) {
                payload.status = 'PENDING';
                payload.customFields =
                    customFieldsHook.getCustomFieldsPayload();
            }

            await mutate(payload);
            onOpenChange(false);
        },
        resetOnSuccess: isCreateMode, // Reset only for create mode
    });

    // Update form values when task changes or dialog opens (edit mode only)
    useEffect(() => {
        if (!isCreateMode && open && task) {
            form.setValues({
                name: task.name,
                description: task.description || '',
                dueDate: task.dueAt ? new Date(task.dueAt) : undefined,
            });
        }
    }, [open, task, isCreateMode]);

    const dialogConfig = isCreateMode
        ? {
              title: 'Create New Task',
              description: 'Create a new task for this project.',
              submitLabel: 'Create Task',
              loadingLabel: 'Creating...',
              scrollable: true,
          }
        : {
              title: 'Edit Task',
              description: 'Update task details and assignments.',
              submitLabel: 'Save Changes',
              loadingLabel: 'Saving...',
              scrollable: false,
          };

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title={dialogConfig.title}
            description={dialogConfig.description}
            scrollable={dialogConfig.scrollable}
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

                    {/* Custom Fields Section - only show in create mode */}
                    {isCreateMode && (
                        <CustomFieldsSection
                            customFields={customFieldsHook.customFields}
                            customFieldValues={
                                customFieldsHook.customFieldValues
                            }
                            onChange={customFieldsHook.updateCustomFieldValue}
                            disabled={isLoading}
                            isLoading={customFieldsHook.isLoadingFields}
                        />
                    )}
                </div>

                <FormDialogActions
                    onCancel={() => onOpenChange(false)}
                    submitLabel={dialogConfig.submitLabel}
                    isLoading={isLoading}
                    loadingLabel={dialogConfig.loadingLabel}
                    disabled={isCreateMode && customFieldsHook.isLoadingFields}
                />
            </form>
        </FormDialog>
    );
}
