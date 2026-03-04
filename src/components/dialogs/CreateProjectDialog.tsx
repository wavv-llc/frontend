'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { projectApi } from '@/lib/api';
import { useAuthenticatedMutation } from '@/hooks/useAuthenticatedMutation';
import { useDialogForm } from '@/hooks/useDialogForm';
import { FormDialog } from './shared/FormDialog';
import { FormDialogField } from './shared/FormDialogField';
import { FormDialogActions } from './shared/FormDialogActions';

interface CreateProjectDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: string;
    onSuccess?: () => void;
}

interface ProjectFormData {
    name: string;
    description: string;
}

export function CreateProjectDialog({
    open,
    onOpenChange,
    workspaceId,
    onSuccess,
}: CreateProjectDialogProps) {
    const { mutate, isLoading } = useAuthenticatedMutation({
        mutationFn: (token, name: string, description?: string) =>
            projectApi.createProject(token, workspaceId, name, description),
        successMessage: 'Project created successfully',
        requiresSidebarRefresh: true,
        onSuccess: () => {
            // Delay to ensure dialog closes first
            setTimeout(() => {
                onSuccess?.();
            }, 100);
        },
    });

    const form = useDialogForm<ProjectFormData>({
        initialValues: { name: '', description: '' },
        validate: (values) => {
            if (!values.name.trim()) {
                return { name: 'Project name is required' };
            }
            return null;
        },
        onSubmit: async (values) => {
            await mutate(values.name, values.description || undefined);
            onOpenChange(false);
        },
        resetOnSuccess: true,
    });

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Create New Project"
            description="Create a new project within this workspace."
        >
            <form onSubmit={form.handleSubmit}>
                <div className="grid gap-4 py-4">
                    <FormDialogField
                        label="Project Name"
                        name="name"
                        required
                        error={form.errors.name}
                    >
                        <Input
                            id="name"
                            placeholder="Enter project name..."
                            value={form.values.name}
                            onChange={(e) =>
                                form.handleChange('name', e.target.value)
                            }
                            disabled={isLoading}
                            autoFocus
                        />
                    </FormDialogField>

                    <FormDialogField
                        label="Project Description"
                        name="description"
                        description="Optional"
                    >
                        <Textarea
                            id="description"
                            placeholder="Add a description for this project..."
                            value={form.values.description}
                            onChange={(e) =>
                                form.handleChange('description', e.target.value)
                            }
                            disabled={isLoading}
                            rows={3}
                        />
                    </FormDialogField>
                </div>

                <FormDialogActions
                    onCancel={() => onOpenChange(false)}
                    submitLabel="Create Project"
                    isLoading={isLoading}
                    loadingLabel="Creating..."
                />
            </form>
        </FormDialog>
    );
}
