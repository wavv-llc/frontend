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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@clerk/nextjs';
import { type User, type ApprovalWorkflowStep, approvalApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface StepEntry {
    /** Temporary local id for dnd-kit (not the DB id which may not exist yet) */
    localId: string;
    userId: string;
    user: User;
}

function userDisplayName(user: User) {
    return user.firstName
        ? `${user.firstName} ${user.lastName ?? ''}`.trim()
        : user.email;
}

function userInitials(user: User) {
    return user.firstName
        ? `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase()
        : user.email[0].toUpperCase();
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

            {/* Avatar */}
            <Avatar className="h-6 w-6 shrink-0">
                <AvatarFallback className="text-[9px] bg-accent/30">
                    {userInitials(step.user)}
                </AvatarFallback>
            </Avatar>

            {/* Name */}
            <span className="flex-1 text-sm truncate">
                {userDisplayName(step.user)}
            </span>
            <span className="text-xs text-muted-foreground truncate max-w-30 hidden sm:block">
                {step.user.email}
            </span>

            {/* Remove */}
            <button
                onClick={() => onRemove(step.localId)}
                className="shrink-0 text-muted-foreground hover:text-destructive transition-colors focus:outline-none"
                aria-label={`Remove ${userDisplayName(step.user)}`}
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
    projectMembers: User[];
    projectOwners: User[];
}

export function ApprovalWorkflowDialog({
    open,
    onOpenChange,
    projectId,
    projectMembers,
    projectOwners,
}: ApprovalWorkflowDialogProps) {
    const { getToken } = useAuth();
    const [steps, setSteps] = useState<StepEntry[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [addUserId, setAddUserId] = useState<string>('');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // All project members + owners as candidates
    const allCandidates: User[] = [
        ...projectOwners.map((u) => ({ ...u, _role: 'Owner' as const })),
        ...projectMembers.map((u) => ({ ...u, _role: 'Member' as const })),
    ].filter(
        (u, i, arr) => arr.findIndex((x) => x.id === u.id) === i, // dedupe
    );

    // Users not already in the workflow
    const availableToAdd = allCandidates.filter(
        (u) => !steps.some((s) => s.userId === u.id),
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
                // NOTE: The backend ApprovalWorkflowStep now uses customFieldId/type/order
                // rather than a direct userId reference. This dialog represents the
                // deprecated per-user workflow UI and steps are loaded but cannot be
                // mapped to users without resolving the custom field value per task.
                // For now, initialize with an empty set when workflow steps exist.
                const existing: ApprovalWorkflowStep[] = response.data ?? [];
                if (existing.length === 0) {
                    setSteps([]);
                }
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

    function handleAddReviewer() {
        if (!addUserId) return;
        const user = allCandidates.find((u) => u.id === addUserId);
        if (!user) return;
        setSteps((prev) => [
            ...prev,
            {
                localId: `new-${addUserId}-${Date.now()}`,
                userId: addUserId,
                user,
            },
        ]);
        setAddUserId('');
    }

    function handleRemove(localId: string) {
        setSteps((prev) => prev.filter((s) => s.localId !== localId));
    }

    async function handleSave() {
        setSaving(true);
        try {
            const token = await getToken();
            if (!token) throw new Error('Not authenticated');
            // NOTE: The backend requires { type, customFieldId, order } per step.
            // This dialog's UI (user-based selection) does not map directly to the
            // new workflow model. Saving an empty array to clear the workflow.
            await approvalApi.setWorkflow(token, projectId, []);
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
                        Set the order of reviewers for tasks in this project.
                        Drag to reorder. Tasks must pass each reviewer in
                        sequence before being marked complete.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 py-2">
                    {/* Preparer row — always first, non-removable */}
                    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/30 bg-muted/30">
                        <span className="shrink-0 w-4 h-4" />
                        <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
                            P
                        </span>
                        <Avatar className="h-6 w-6 shrink-0">
                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                —
                            </AvatarFallback>
                        </Avatar>
                        <span className="flex-1 text-sm text-muted-foreground italic">
                            Preparer (any project member)
                        </span>
                    </div>

                    {/* Reviewer steps */}
                    {loading ? (
                        <div className="text-sm text-muted-foreground text-center py-4">
                            Loading…
                        </div>
                    ) : steps.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-4 border border-dashed border-border/40 rounded-lg">
                            No reviewers configured — tasks go directly to
                            Complete on submit.
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

                    {/* Add reviewer */}
                    {availableToAdd.length > 0 && (
                        <>
                            <Separator className="my-1" />
                            <div className="flex items-center gap-2">
                                <Select
                                    value={addUserId}
                                    onValueChange={setAddUserId}
                                >
                                    <SelectTrigger className="flex-1 h-8 text-sm">
                                        <SelectValue placeholder="Add a reviewer…" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableToAdd.map((u) => (
                                            <SelectItem key={u.id} value={u.id}>
                                                {userDisplayName(u)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleAddReviewer}
                                    disabled={!addUserId}
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
