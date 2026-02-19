'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { workspaceApi } from '@/lib/api';
import { useAuthenticatedMutation } from '@/hooks/useAuthenticatedMutation';
import { useDialogForm } from '@/hooks/useDialogForm';
import { FormDialog } from './shared/FormDialog';
import { FormDialogField } from './shared/FormDialogField';
import { FormDialogActions } from './shared/FormDialogActions';

interface CreateWorkspaceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

interface WorkspaceFormData {
    name: string;
    description: string;
}

export function CreateWorkspaceDialog({
    open,
    onOpenChange,
    onSuccess,
}: CreateWorkspaceDialogProps) {
    const { mutate, isLoading } = useAuthenticatedMutation({
        mutationFn: (token, name: string, description?: string) =>
            workspaceApi.createWorkspace(token, name, description),
        successMessage: 'Workspace created successfully',
        requiresSidebarRefresh: true,
        onSuccess: () => {
            onSuccess?.();
        },
    });

    const form = useDialogForm<WorkspaceFormData>({
        initialValues: { name: '', description: '' },
        validate: (values) => {
            if (!values.name.trim()) {
                return { name: 'Please enter a workspace name' };
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
            title="Create New Workspace"
            description="Create a new workspace to organize your tax projects and files."
        >
            <form onSubmit={form.handleSubmit}>
                <div className="grid gap-4 py-4">
                    <FormDialogField
                        label="Workspace Name"
                        name="name"
                        required
                        error={form.errors.name}
                    >
                        <Input
                            id="name"
                            placeholder="e.g., 2024 Tax Returns"
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
                            placeholder="Add a description for this workspace..."
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
                    submitLabel="Create Workspace"
                    isLoading={isLoading}
                    loadingLabel="Creating..."
                />
            </form>
        </FormDialog>
    );
}
