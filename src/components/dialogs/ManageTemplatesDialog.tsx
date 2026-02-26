'use client';

import { useState } from 'react';
import { Layers, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormDialog } from './shared/FormDialog';
import { TemplateDeleteButton } from './shared/TemplateSelector';
import { useCustomFieldTemplates } from '@/hooks/useCustomFieldTemplates';
import { cn } from '@/lib/utils';

interface ManageTemplatesDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    workspaceId: string;
}

export function ManageTemplatesDialog({
    open,
    onOpenChange,
    workspaceId,
}: ManageTemplatesDialogProps) {
    const { templates, deleteTemplate, updateTemplate } =
        useCustomFieldTemplates(workspaceId);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    function startEdit(id: string, name: string, description?: string) {
        setEditingId(id);
        setEditName(name);
        setEditDescription(description ?? '');
    }

    function cancelEdit() {
        setEditingId(null);
        setEditName('');
        setEditDescription('');
    }

    function commitEdit(id: string) {
        if (!editName.trim()) return;
        updateTemplate(id, {
            name: editName.trim(),
            description: editDescription.trim() || undefined,
        });
        cancelEdit();
    }

    return (
        <FormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Manage Templates"
            description="Templates save sets of custom field values that you can quickly apply when creating tasks."
            maxWidth="md"
            scrollable
        >
            <div className="py-4">
                {templates.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                            <Layers className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm font-medium text-dashboard-text-primary">
                            No templates yet
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-75 leading-relaxed">
                            Hover over any task in the list, click the{' '}
                            <span className="font-medium text-dashboard-text-primary">
                                ⋮
                            </span>{' '}
                            menu, and choose{' '}
                            <span className="font-medium text-dashboard-text-primary">
                                Save as Template
                            </span>{' '}
                            to capture its custom field values here.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {templates.map((t) => (
                            <div
                                key={t.id}
                                className={cn(
                                    'rounded-lg border border-border bg-card px-4 py-3 transition-colors',
                                    editingId === t.id &&
                                        'border-accent-blue/40 bg-accent/30',
                                )}
                            >
                                {editingId === t.id ? (
                                    /* Edit mode */
                                    <div className="space-y-2">
                                        <Input
                                            value={editName}
                                            onChange={(e) =>
                                                setEditName(e.target.value)
                                            }
                                            className="h-8 text-sm font-medium"
                                            placeholder="Template name"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter')
                                                    commitEdit(t.id);
                                                if (e.key === 'Escape')
                                                    cancelEdit();
                                            }}
                                        />
                                        <Input
                                            value={editDescription}
                                            onChange={(e) =>
                                                setEditDescription(
                                                    e.target.value,
                                                )
                                            }
                                            className="h-8 text-sm"
                                            placeholder="Description (optional)"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter')
                                                    commitEdit(t.id);
                                                if (e.key === 'Escape')
                                                    cancelEdit();
                                            }}
                                        />
                                        <div className="flex items-center gap-2 pt-1">
                                            <Button
                                                type="button"
                                                size="sm"
                                                className="h-7 text-xs gap-1"
                                                onClick={() => commitEdit(t.id)}
                                            >
                                                <Check className="h-3 w-3" />
                                                Save
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs gap-1"
                                                onClick={cancelEdit}
                                            >
                                                <X className="h-3 w-3" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    /* View mode */
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-medium text-dashboard-text-primary">
                                                    {t.name}
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-5 w-5 opacity-0 group-hover:opacity-100 hover:opacity-100 text-muted-foreground"
                                                    onClick={() =>
                                                        startEdit(
                                                            t.id,
                                                            t.name,
                                                            t.description,
                                                        )
                                                    }
                                                >
                                                    <Pencil className="h-3 w-3" />
                                                </Button>
                                            </div>
                                            {t.description && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {t.description}
                                                </p>
                                            )}
                                            {t.fields.length > 0 ? (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {t.fields.map((f) => (
                                                        <span
                                                            key={f.fieldName}
                                                            className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
                                                        >
                                                            <span className="font-medium text-dashboard-text-primary mr-1">
                                                                {f.fieldName}:
                                                            </span>
                                                            {f.value.length > 20
                                                                ? `${f.value.slice(0, 20)}…`
                                                                : f.value}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="text-[11px] text-muted-foreground mt-1">
                                                    No field values saved
                                                </p>
                                            )}
                                            <p className="text-[10px] text-muted-foreground/60 mt-2">
                                                Created{' '}
                                                {new Date(
                                                    t.createdAt,
                                                ).toLocaleDateString(
                                                    undefined,
                                                    {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric',
                                                    },
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-dashboard-text-primary"
                                                onClick={() =>
                                                    startEdit(
                                                        t.id,
                                                        t.name,
                                                        t.description,
                                                    )
                                                }
                                            >
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            <TemplateDeleteButton
                                                onDelete={() =>
                                                    deleteTemplate(t.id)
                                                }
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </FormDialog>
    );
}
