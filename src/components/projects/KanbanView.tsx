'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
    DndContext,
    DragOverlay,
    pointerWithin,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    useDroppable,
    type DragEndEvent,
    type DragStartEvent,
    type DragOverEvent,
    type CollisionDetection,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, GripVertical, MoreVertical, Trash2, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    type Task,
    type CustomField,
    type Section,
    type User,
    taskApi,
} from '@/lib/api';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { StatusPill } from './StatusPill';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Card-first collision: prefer hitting a card (precise ordering) over a column
const kanbanCollision: CollisionDetection = (args) => {
    const hits = pointerWithin(args);
    const cardHits = hits.filter((c) => !String(c.id).startsWith('board-col:'));
    if (cardHits.length > 0) return cardHits;
    const colHits = hits.filter((c) => String(c.id).startsWith('board-col:'));
    if (colHits.length > 0) return colHits;
    return closestCenter(args);
};

export interface KanbanViewProps {
    tasks: Task[];
    sections: Section[];
    customFields: CustomField[];
    projectId: string;
    members: User[];
    onTaskClick: (task: Task) => void;
    onTaskCreated: () => void;
    onTaskAdded: (task: Task) => void;
    onAddSection?: () => void;
    onRenameSection?: (sectionId: string, name: string) => void;
    onDeleteSection?: (sectionId: string) => void;
    readOnly?: boolean;
}

// ─── Card ─────────────────────────────────────────────────────────────────────

interface KanbanCardProps {
    task: Task;
    statusField: CustomField | undefined;
    isOverlay?: boolean;
    onClick: () => void;
}

function KanbanCard({
    task,
    statusField,
    isOverlay = false,
    onClick,
}: KanbanCardProps) {
    const statusValue = statusField
        ? (task.customFieldValues?.find(
              (v) => v.customFieldId === statusField.id,
          )?.value ?? null)
        : null;

    return (
        <div
            className={cn(
                'bg-white border border-dashboard-border rounded-lg px-3 py-2.5',
                'cursor-pointer select-none transition-all duration-150',
                'hover:border-slate-300 hover:shadow-sm',
                isOverlay && 'shadow-lg border-slate-300 ring-1 ring-black/5',
            )}
            onClick={onClick}
        >
            <p className="text-sm font-medium text-dashboard-text-primary leading-snug">
                {task.name}
            </p>
            {(statusField || task.dueAt) && (
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {statusField && (
                        <StatusPill
                            value={statusValue}
                            options={statusField.customOptions || []}
                            onChange={() => {}}
                            readOnly
                            compact
                        />
                    )}
                    {task.dueAt && (
                        <span className="text-[10px] text-dashboard-text-muted font-medium">
                            {new Date(task.dueAt).toLocaleDateString(
                                undefined,
                                { month: 'short', day: 'numeric' },
                            )}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

// ─── Sortable Card ────────────────────────────────────────────────────────────

function SortableCard({
    task,
    statusField,
    onClick,
}: {
    task: Task;
    statusField: CustomField | undefined;
    onClick: () => void;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: task.id });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Translate.toString(transform),
                transition: transition ?? 'transform 150ms ease',
            }}
            className={cn('group flex items-stretch gap-0')}
        >
            {/* Grip gutter — never overlaps card text */}
            <div
                {...attributes}
                {...listeners}
                className={cn(
                    'flex items-center justify-center w-5 shrink-0',
                    'opacity-0 group-hover:opacity-100 transition-opacity duration-100',
                    'cursor-grab active:cursor-grabbing text-slate-300',
                    'hover:text-slate-500',
                )}
            >
                <GripVertical className="h-3.5 w-3.5" />
            </div>

            {/* Placeholder shown in source slot while dragging */}
            {isDragging ? (
                <div className="flex-1 min-w-0 rounded-lg border-2 border-dashed border-accent-blue/30 bg-accent-blue/3 min-h-10" />
            ) : (
                <div className="flex-1 min-w-0">
                    <KanbanCard
                        task={task}
                        statusField={statusField}
                        onClick={onClick}
                    />
                </div>
            )}
        </div>
    );
}

// ─── Column ───────────────────────────────────────────────────────────────────

interface KanbanColumnProps {
    id: string;
    section: Section | null;
    tasks: Task[];
    statusField: CustomField | undefined;
    isDragging: boolean;
    onTaskClick: (task: Task) => void;
    onRenameSection?: (sectionId: string, name: string) => void;
    onDeleteSection?: (sectionId: string) => void;
    readOnly?: boolean;
}

function KanbanColumn({
    id,
    section,
    tasks,
    statusField,
    isDragging,
    onTaskClick,
    onRenameSection,
    onDeleteSection,
    readOnly,
}: KanbanColumnProps) {
    const { setNodeRef, isOver } = useDroppable({ id });
    const title = section?.name ?? 'No Section';

    return (
        <div className="flex flex-col w-72 shrink-0 group/col">
            {/* Column header */}
            <div className="flex items-center gap-2 h-10 px-1 mb-2">
                <div
                    className={cn(
                        'w-2 h-2 rounded-full shrink-0 transition-colors duration-200',
                        section
                            ? isOver
                                ? 'bg-accent-blue'
                                : 'bg-accent-blue/60'
                            : isOver
                              ? 'bg-slate-500'
                              : 'bg-slate-300',
                    )}
                />
                <span className="text-sm font-semibold text-dashboard-text-primary flex-1 truncate">
                    {title}
                </span>
                <span
                    className={cn(
                        'text-[11px] font-medium rounded-full px-1.5 py-0.5 transition-colors duration-200',
                        isOver
                            ? 'bg-accent-blue/10 text-accent-blue'
                            : 'bg-muted/60 text-dashboard-text-muted',
                    )}
                >
                    {tasks.length}
                </span>
                {section &&
                    !readOnly &&
                    (onRenameSection || onDeleteSection) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover/col:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                                >
                                    <MoreVertical className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                                {onRenameSection && (
                                    <DropdownMenuItem
                                        onClick={() => {
                                            const name = window.prompt(
                                                'Rename section',
                                                section.name,
                                            );
                                            if (name?.trim())
                                                onRenameSection(
                                                    section.id,
                                                    name.trim(),
                                                );
                                        }}
                                    >
                                        <Pencil className="h-3.5 w-3.5 mr-2" />
                                        Rename
                                    </DropdownMenuItem>
                                )}
                                {onDeleteSection && (
                                    <DropdownMenuItem
                                        className="text-destructive"
                                        onClick={() =>
                                            onDeleteSection(section.id)
                                        }
                                    >
                                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
            </div>

            {/* Drop zone */}
            <div
                ref={setNodeRef}
                className={cn(
                    'flex-1 flex flex-col gap-1.5 rounded-xl p-2 min-h-[140px]',
                    'border-2 transition-all duration-150',
                    isOver && isDragging
                        ? 'bg-accent-blue/4 border-accent-blue/25'
                        : 'bg-dashboard-bg/30 border-transparent',
                )}
            >
                <SortableContext
                    items={tasks.map((t) => t.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {tasks.map((task) => (
                        <SortableCard
                            key={task.id}
                            task={task}
                            statusField={statusField}
                            onClick={() => onTaskClick(task)}
                        />
                    ))}
                </SortableContext>

                {/* Empty state — only visible when no cards and nothing being dragged in */}
                {tasks.length === 0 && !(isOver && isDragging) && (
                    <div className="flex-1 flex items-center justify-center">
                        <span className="text-xs text-dashboard-text-muted/40 select-none">
                            No tasks
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── KanbanView ───────────────────────────────────────────────────────────────

interface DragSnapshot {
    order: string[];
    overrides: Record<string, string | null>;
}

export function KanbanView({
    tasks,
    sections,
    customFields,
    projectId,
    onTaskClick,
    onTaskCreated,
    onAddSection,
    onRenameSection,
    onDeleteSection,
    readOnly,
}: KanbanViewProps) {
    const { getToken } = useAuth();
    const [activeId, setActiveId] = useState<string | null>(null);
    const [taskOrder, setTaskOrder] = useState<string[]>(() =>
        tasks.map((t) => t.id),
    );
    const [localSectionOverrides, setLocalSectionOverrides] = useState<
        Record<string, string | null>
    >({});

    // Pre-drag snapshot for rollback on error or cancel
    const snapshot = useRef<DragSnapshot | null>(null);

    // Keep latest values accessible in event handlers without stale closures
    const taskOrderRef = useRef(taskOrder);
    const overridesRef = useRef(localSectionOverrides);
    taskOrderRef.current = taskOrder;
    overridesRef.current = localSectionOverrides;

    // Sync when tasks are added or removed (sorted key — ignores reorder)
    const taskIdSet = tasks
        .map((t) => t.id)
        .sort()
        .join(',');

    useEffect(() => {
        setTaskOrder((prev) => {
            const existingSet = new Set(prev);
            const newIds = tasks
                .filter((t) => !existingSet.has(t.id))
                .map((t) => t.id);
            const filtered = prev.filter((id) =>
                tasks.some((t) => t.id === id),
            );
            if (newIds.length === 0 && filtered.length === prev.length)
                return prev;
            return [...filtered, ...newIds];
        });
    }, [taskIdSet]);

    const statusField = customFields.find(
        (f) => f.dataType === 'CUSTOM' && f.name.toLowerCase() === 'status',
    );

    // Resolve effective section for a task (local override wins)
    const effectiveSectionId = useCallback(
        (taskId: string): string | null => {
            const overrides = overridesRef.current;
            if (taskId in overrides) return overrides[taskId];
            const task = tasks.find((t) => t.id === taskId);
            return task?.sectionId ?? null;
        },
        [tasks],
    );

    const getTasksForSection = useCallback(
        (sectionId: string | null) =>
            taskOrderRef.current
                .map((id) => tasks.find((t) => t.id === id))
                .filter((t): t is Task => t !== undefined)
                .filter((t) => effectiveSectionId(t.id) === sectionId),
        // taskOrder and localSectionOverrides are accessed via refs but we still
        // want the component to re-render when they change, so include them:

        [tasks, taskOrder, localSectionOverrides, effectiveSectionId],
    );

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // ── Drag start: snapshot current state ───────────────────────────────────
    const handleDragStart = useCallback(({ active }: DragStartEvent) => {
        setActiveId(active.id as string);
        snapshot.current = {
            order: [...taskOrderRef.current],
            overrides: { ...overridesRef.current },
        };
    }, []);

    // ── Drag over: live preview — update order and section in real-time ───────
    const handleDragOver = useCallback(
        ({ active, over }: DragOverEvent) => {
            if (!over) return;
            const dragId = active.id as string;
            const overId = over.id as string;
            if (dragId === overId) return;

            const isColTarget = String(overId).startsWith('board-col:');

            // Determine target section
            let targetSection: string | null = null;
            if (isColTarget) {
                targetSection =
                    overId === 'board-col:none'
                        ? null
                        : overId.slice('board-col:'.length);
            } else {
                const overTask = tasks.find((t) => t.id === overId);
                if (overTask) targetSection = effectiveSectionId(overId);
            }

            // Move to different column
            const currentSection = effectiveSectionId(dragId);
            if (currentSection !== targetSection) {
                setLocalSectionOverrides((prev) => ({
                    ...prev,
                    [dragId]: targetSection,
                }));
            }

            // Reorder within/across columns (skip pure column drops)
            if (!isColTarget) {
                setTaskOrder((prev) => {
                    const oldIdx = prev.indexOf(dragId);
                    const newIdx = prev.indexOf(overId);
                    if (oldIdx === -1 || newIdx === -1 || oldIdx === newIdx)
                        return prev;
                    return arrayMove(prev, oldIdx, newIdx);
                });
            }
        },
        [tasks, effectiveSectionId],
    );

    // ── Drag end: persist to backend (local state already updated) ────────────
    const handleDragEnd = useCallback(
        async ({ active }: DragEndEvent) => {
            setActiveId(null);
            const snap = snapshot.current;
            snapshot.current = null;
            if (!snap) return;

            const dragId = active.id as string;
            const currentOrder = taskOrderRef.current;
            const currentOverrides = overridesRef.current;

            const dragTask = tasks.find((t) => t.id === dragId);
            if (!dragTask) return;

            const originalSection =
                snap.overrides[dragId] !== undefined
                    ? snap.overrides[dragId]
                    : (dragTask.sectionId ?? null);
            const newSection =
                currentOverrides[dragId] !== undefined
                    ? currentOverrides[dragId]
                    : (dragTask.sectionId ?? null);

            const orderChanged =
                snap.order.join(',') !== currentOrder.join(',');
            const sectionChanged = originalSection !== newSection;

            if (!orderChanged && !sectionChanged) return;

            try {
                const token = await getToken();
                if (!token) return;
                const calls: Promise<unknown>[] = [];
                if (orderChanged) {
                    calls.push(
                        taskApi.reorderTasks(
                            token,
                            projectId,
                            currentOrder.map((id, idx) => ({ id, order: idx })),
                        ),
                    );
                }
                if (sectionChanged) {
                    calls.push(
                        taskApi.updateTask(token, projectId, dragId, {
                            sectionId: newSection,
                        }),
                    );
                }
                await Promise.all(calls);
                onTaskCreated();
            } catch {
                // Rollback
                setTaskOrder(snap.order);
                setLocalSectionOverrides(snap.overrides);
                toast.error('Failed to move task');
            }
        },
        [tasks, projectId, getToken, onTaskCreated],
    );

    // ── Drag cancel: revert ───────────────────────────────────────────────────
    const handleDragCancel = useCallback(() => {
        setActiveId(null);
        if (snapshot.current) {
            setTaskOrder(snapshot.current.order);
            setLocalSectionOverrides(snapshot.current.overrides);
            snapshot.current = null;
        }
    }, []);

    const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

    const columns: Array<{ id: string; section: Section | null }> = [
        { id: 'board-col:none', section: null },
        ...sections.map((s) => ({ id: `board-col:${s.id}`, section: s })),
    ];

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={kanbanCollision}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="flex gap-3 h-full overflow-x-auto overflow-y-hidden px-6 py-5">
                {columns.map(({ id, section }) => (
                    <KanbanColumn
                        key={id}
                        id={id}
                        section={section}
                        tasks={getTasksForSection(section?.id ?? null)}
                        statusField={statusField}
                        isDragging={activeId !== null}
                        onTaskClick={onTaskClick}
                        onRenameSection={onRenameSection}
                        onDeleteSection={onDeleteSection}
                        readOnly={readOnly}
                    />
                ))}

                {!readOnly && onAddSection && (
                    <div className="flex flex-col w-64 shrink-0">
                        <div className="h-10 mb-2" />
                        <button
                            onClick={onAddSection}
                            className={cn(
                                'flex-1 min-h-35 flex flex-col items-center justify-center gap-2',
                                'rounded-xl border-2 border-dashed border-dashboard-border',
                                'text-dashboard-text-muted',
                                'hover:border-accent-blue/50 hover:bg-accent-blue/5 hover:text-accent-blue',
                                'transition-all duration-200 cursor-pointer group/add',
                            )}
                        >
                            <div
                                className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center',
                                    'bg-dashboard-bg group-hover/add:bg-accent-blue/10',
                                    'transition-colors duration-200',
                                )}
                            >
                                <Plus className="h-4 w-4" />
                            </div>
                            <span className="text-xs font-medium">
                                Add section
                            </span>
                        </button>
                    </div>
                )}
            </div>

            <DragOverlay
                dropAnimation={{
                    duration: 200,
                    easing: 'cubic-bezier(0.2, 0, 0, 1)',
                }}
            >
                {activeTask && (
                    <div style={{ width: '268px' }}>
                        <KanbanCard
                            task={activeTask}
                            statusField={statusField}
                            isOverlay
                            onClick={() => {}}
                        />
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
