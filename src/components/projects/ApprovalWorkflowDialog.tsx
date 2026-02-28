'use client';

import { useState, useEffect } from 'react';
import {
    DndContext,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X, GitBranch, Plus } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import {
    type CustomField,
    type ApprovalWorkflowStep,
    approvalApi,
} from '@/lib/api';
import { cn } from '@/lib/utils';

interface StepEntry {
    localId: string;
    customFieldId: string;
    fieldName: string;
    type: 'PREPARER' | 'REVIEWER';
}

function roleLabel(type: 'PREPARER' | 'REVIEWER') {
    return type === 'PREPARER' ? 'Preparer' : 'Reviewer';
}

function roleBadgeClass(type: 'PREPARER' | 'REVIEWER') {
    return type === 'PREPARER'
        ? 'bg-violet-100 text-violet-700 border-violet-200'
        : 'bg-blue-100 text-blue-700 border-blue-200';
}

// ── Sortable row ──────────────────────────────────────────────────────────────
function SortableStep({
    step,
    index,
    onRemove,
}: {
    step: StepEntry;
    index: number;
    onRemove: (localId: string) => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: step.localId });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/40 bg-background/60',
                isDragging && 'opacity-50 shadow-lg',
            )}
        >
            {/* Drag handle */}
            <button
                className="shrink-0 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground focus:outline-none"
                {...attributes}
                {...listeners}
                aria-label="Drag to reorder"
            >
                <GripVertical className="w-4 h-4" />
            </button>

            {/* Step number */}
            <span className="shrink-0 w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
                {index + 1}
            </span>

            {/* Role badge */}
            <Badge
                variant="outline"
                className={cn(
                    'text-[10px] px-1.5 py-0 shrink-0',
                    roleBadgeClass(step.type),
                )}
            >
                {roleLabel(step.type)}
            </Badge>

            {/* Field name */}
            <span className="flex-1 text-sm truncate">{step.fieldName}</span>

            {/* Remove */}
            <button
                onClick={() => onRemove(step.localId)}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors focus:outline-none"
                aria-label={`Remove ${step.fieldName}`}
            >
                <X className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}

// ── Main dialog ───────────────────────────────────────────────────────────────
export interface ApprovalWorkflowDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    projectId: string;
    /** USER-type custom fields for this project */
    userCustomFields: CustomField[];
}

export function ApprovalWorkflowDialog({
    open,
    onOpenChange,
    projectId,
    userCustomFields,
}: ApprovalWorkflowDialogProps) {
    const { getToken } = useAuth();
    const [steps, setSteps] = useState<StepEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [addFieldId, setAddFieldId] = useState<string>('');
    const [addType, setAddType] = useState<'PREPARER' | 'REVIEWER'>('REVIEWER');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // Fields not yet in the workflow
    const availableToAdd = userCustomFields.filter(
        (f) => !steps.some((s) => s.customFieldId === f.id),
    );

    // Load existing workflow when dialog opens
    useEffect(() => {
        if (!open) return;
        let cancelled = false;
        setLoading(true);
        (async () => {
            try {
                const token = await getToken();
                if (!token) return;
                const response = await approvalApi.getWorkflow(
                    token,
                    projectId,
                );
                if (cancelled) return;
                const existing: ApprovalWorkflowStep[] = response.data ?? [];
                const loaded: StepEntry[] = existing
                    .sort((a, b) => a.order - b.order)
                    .map((ws) => ({
                        localId: ws.id,
                        customFieldId: ws.customFieldId,
                        fieldName: ws.customField?.name ?? ws.customFieldId,
                        type: ws.type,
                    }));
                setSteps(loaded);
            } catch (err) {
                console.error('Failed to load workflow', err);
                toast.error('Failed to load approval workflow');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [open, projectId, getToken]);

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setSteps((prev) => {
            const oldIndex = prev.findIndex((s) => s.localId === active.id);
            const newIndex = prev.findIndex((s) => s.localId === over.id);
            return arrayMove(prev, oldIndex, newIndex);
        });
    }

    function handleAddStep() {
        if (!addFieldId) return;
        const field = userCustomFields.find((f) => f.id === addFieldId);
        if (!field) return;
        setSteps((prev) => [
            ...prev,
            {
                localId: `new-${addFieldId}-${Date.now()}`,
                customFieldId: addFieldId,
                fieldName: field.name,
                type: addType,
            },
        ]);
        setAddFieldId('');
    }

    function handleRemove(localId: string) {
        setSteps((prev) => prev.filter((s) => s.localId !== localId));
    }

    async function handleSave() {
        setSaving(true);
        try {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');
            await approvalApi.setWorkflow(
                token,
                projectId,
                steps.map((s, i) => ({
                    type: s.type,
                    customFieldId: s.customFieldId,
                    order: i,
                })),
            );
            toast.success('Approval workflow saved');
            onOpenChange(false);
        } catch (err) {
            console.error('Failed to save workflow', err);
            toast.error('Failed to save approval workflow');
        } finally {
            setSaving(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-serif">
                        <GitBranch className="w-4 h-4 text-primary" />
                        Approval Workflow
                    </DialogTitle>
                    <DialogDescription>
                        Configure which person columns define the approval
                        chain. Drag to reorder. Tasks pass each step in sequence
                        before being marked complete.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    {userCustomFields.length === 0 && (
                        <div className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border/40 rounded-lg">
                            No person columns found. Add a{' '}
                            <span className="font-medium">Person</span> column
                            to this project first.
                        </div>
                    )}

                    {/* Configured steps */}
                    {loading ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            Loading…
                        </div>
                    ) : steps.length === 0 && userCustomFields.length > 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border/40 rounded-lg">
                            No steps configured — tasks go directly to Complete
                            on submit.
                        </div>
                    ) : (
                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleDragEnd}
                        >
                            <SortableContext
                                items={steps.map((s) => s.localId)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="space-y-2">
                                    {steps.map((step, i) => (
                                        <SortableStep
                                            key={step.localId}
                                            step={step}
                                            index={i}
                                            onRemove={handleRemove}
                                        />
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    )}

                    {/* Add step */}
                    {availableToAdd.length > 0 && (
                        <>
                            <Separator className="my-1" />
                            <div className="flex items-center gap-2">
                                <Select
                                    value={addType}
                                    onValueChange={(v) =>
                                        setAddType(v as 'PREPARER' | 'REVIEWER')
                                    }
                                >
                                    <SelectTrigger className="w-32 h-8 text-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PREPARER">
                                            Preparer
                                        </SelectItem>
                                        <SelectItem value="REVIEWER">
                                            Reviewer
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={addFieldId}
                                    onValueChange={setAddFieldId}
                                >
                                    <SelectTrigger className="flex-1 h-8 text-sm">
                                        <SelectValue placeholder="Add a column…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableToAdd.map((f) => (
                                            <SelectItem key={f.id} value={f.id}>
                                                {f.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleAddStep}
                                    disabled={!addFieldId}
                                    className="h-8 px-2"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                    >
                        Cancel
                    </Button>
                    <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={saving || loading}
                    >
                        {saving ? 'Saving…' : 'Save Workflow'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
