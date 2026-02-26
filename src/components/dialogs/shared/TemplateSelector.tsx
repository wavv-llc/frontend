'use client';

import { useState } from 'react';
import { Layers, ChevronDown, Save, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from 'sonner';
import type { CustomField } from '@/lib/api';
import {
    useCustomFieldTemplates,
    type CustomFieldTemplate,
} from '@/hooks/useCustomFieldTemplates';
import { cn } from '@/lib/utils';

interface TemplateSelectorProps {
    workspaceId: string;
    customFields: CustomField[];
    customFieldValues: Record<string, string>;
    onApply: (values: Record<string, string>) => void;
}

export function TemplateSelector({
    workspaceId,
    customFields,
    customFieldValues,
    onApply,
}: TemplateSelectorProps) {
    const { templates, saveTemplate, matchTemplate } =
        useCustomFieldTemplates(workspaceId);

    const [applyOpen, setApplyOpen] = useState(false);
    const [saveOpen, setSaveOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [appliedId, setAppliedId] = useState<string | null>(null);

    const hasAnyValue = customFields.some((f) => {
        const v = customFieldValues[f.id];
        return v !== undefined && v.trim() !== '';
    });

    function handleApply(template: CustomFieldTemplate) {
        const matched = matchTemplate(template, customFields);
        onApply(matched);
        setAppliedId(template.id);
        setApplyOpen(false);
        toast.success(`Template "${template.name}" applied`);
        setTimeout(() => setAppliedId(null), 2000);
    }

    function handleSave() {
        if (!templateName.trim()) {
            toast.error('Please enter a template name');
            return;
        }
        if (!hasAnyValue) {
            toast.error(
                'Fill in at least one custom field value to save a template',
            );
            return;
        }
        saveTemplate(
            templateName.trim(),
            templateDescription.trim() || undefined,
            customFields,
            customFieldValues,
        );
        toast.success(`Template "${templateName.trim()}" saved`);
        setTemplateName('');
        setTemplateDescription('');
        setSaveOpen(false);
    }

    function getMatchCount(template: CustomFieldTemplate): number {
        return Object.keys(matchTemplate(template, customFields)).length;
    }

    if (customFields.length === 0) return null;

    return (
        <div className="flex items-center gap-2 py-1">
            {/* Apply Templates dropdown */}
            {templates.length > 0 && (
                <Popover open={applyOpen} onOpenChange={setApplyOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 gap-1.5 text-xs text-dashboard-text-muted"
                        >
                            <Layers className="h-3.5 w-3.5" />
                            Templates
                            <span className="ml-0.5 rounded-full bg-accent-blue/15 text-accent-blue px-1.5 py-0 text-[10px] font-semibold leading-4">
                                {templates.length}
                            </span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-72 p-0"
                        align="start"
                        sideOffset={4}
                    >
                        <div className="px-3 py-2 border-b border-border">
                            <p className="text-xs font-medium text-dashboard-text-primary">
                                Apply a template
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5">
                                Pre-fills matching custom fields
                            </p>
                        </div>
                        <div className="max-h-60 overflow-y-auto py-1">
                            {templates.map((t) => {
                                const matchCount = getMatchCount(t);
                                return (
                                    <div
                                        key={t.id}
                                        className="flex items-center justify-between px-3 py-2 hover:bg-accent/50 group"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-dashboard-text-primary truncate">
                                                {t.name}
                                            </p>
                                            <p className="text-[11px] text-muted-foreground">
                                                {matchCount === 0
                                                    ? 'No fields match this project'
                                                    : `${matchCount} field${matchCount !== 1 ? 's' : ''} will be filled`}
                                            </p>
                                        </div>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="ghost"
                                            className={cn(
                                                'h-7 text-xs ml-2 shrink-0',
                                                matchCount === 0 &&
                                                    'opacity-50 pointer-events-none',
                                                appliedId === t.id &&
                                                    'text-green-600',
                                            )}
                                            onClick={() => handleApply(t)}
                                            disabled={matchCount === 0}
                                        >
                                            {appliedId === t.id ? (
                                                <Check className="h-3.5 w-3.5" />
                                            ) : (
                                                'Apply'
                                            )}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>
                    </PopoverContent>
                </Popover>
            )}

            {/* Save as Template */}
            <Popover open={saveOpen} onOpenChange={setSaveOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-dashboard-text-primary"
                    >
                        <Save className="h-3.5 w-3.5" />
                        Save as template
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-72 p-3"
                    align="start"
                    sideOffset={4}
                >
                    <p className="text-xs font-medium text-dashboard-text-primary mb-3">
                        Save current field values as a template
                    </p>
                    <div className="space-y-2">
                        <Input
                            placeholder="Template name"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                            }}
                        />
                        <Input
                            placeholder="Description (optional)"
                            value={templateDescription}
                            onChange={(e) =>
                                setTemplateDescription(e.target.value)
                            }
                            className="h-8 text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                            }}
                        />
                        {!hasAnyValue && (
                            <p className="text-[11px] text-muted-foreground">
                                Fill in custom fields above to include them in
                                this template.
                            </p>
                        )}
                        <Button
                            type="button"
                            size="sm"
                            className="w-full h-8 text-xs"
                            onClick={handleSave}
                        >
                            Save template
                        </Button>
                    </div>
                </PopoverContent>
            </Popover>
        </div>
    );
}

// Compact delete button for use inside ManageTemplatesDialog
export function TemplateDeleteButton({ onDelete }: { onDelete: () => void }) {
    const [confirming, setConfirming] = useState(false);

    if (confirming) {
        return (
            <div className="flex items-center gap-1">
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={onDelete}
                >
                    Delete
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setConfirming(false)}
                >
                    Cancel
                </Button>
            </div>
        );
    }

    return (
        <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={() => setConfirming(true)}
        >
            <Trash2 className="h-3.5 w-3.5" />
        </Button>
    );
}
