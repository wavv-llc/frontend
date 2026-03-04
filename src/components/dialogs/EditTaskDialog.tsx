'use client';

import { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { taskApi, type Task } from '@/lib/api';
import { useAuthenticatedMutation } from '@/hooks/useAuthenticatedMutation';
import { useDialogForm } from '@/hooks/useDialogForm';
import { FormDialog } from './shared/FormDialog';
import { FormDialogField } from './shared/FormDialogField';
import { FormDialogActions } from './shared/FormDialogActions';

interface EditTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task;
    onSuccess?: () => void;
}

interface TaskFormData {
    name: string;
    description: string;
    dueDate?: Date;
}

export function EditTaskDialog({
    open,
    onOpenChange,
    task,
    onSuccess,
}: EditTaskDialogProps) {
    const { mutate, isLoading } = useAuthenticatedMutation({
        mutationFn: (
            token,
            data: { name: string; description?: string; dueAt?: string },
        ) => taskApi.updateTask(token, task.projectId, task.id, data),
        successMessage: 'Task updated successfully',
        onSuccess: () => {
            onSuccess?.();
        },
    });

    const form = useDialogForm<TaskFormData>({
        initialValues: {
            name: task.name,
            description: task.description || '',
            dueDate: task.dueAt ? new Date(task.dueAt) : undefined,
        },
        validate: (values) => {
            if (!values.name.trim()) {
                return { name: 'Please enter a task name' };
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
            });
            onOpenChange(false);
        },
        resetOnSuccess: false, // Don't reset on success for edit dialogs
    });

    // Update form values when task changes or dialog opens
    useEffect(() => {
        if (open) {
            form.setValues({
                name: task.name,
                description: task.description || '',
                dueDate: task.dueAt ? new Date(task.dueAt) : undefined,
            });
        }
    }, [open, task]);

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Edit Task"
            description="Update task details and assignments."
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
                </div>

                <FormDialogActions
                    onCancel={() => onOpenChange(false)}
                    submitLabel="Save Changes"
                    isLoading={isLoading}
                    loadingLabel="Saving..."
                />
            </form>
        </FormDialog>
    );
}
