'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    rectSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    GripVertical,
    X,
    Settings2,
    Plus,
    CheckCircle2,
    Clock,
    Calendar,
    CalendarDays,
    Maximize2,
    Minimize2,
    ChevronsUpDown,
    ChevronsDownUp,
    RotateCcw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { type DashboardTask, type RecentItem } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { DashboardHeader } from './pure-steel/DashboardHeader';
import {
    CalendarSection,
    type CalendarEvent,
} from './pure-steel/CalendarSection';
import { TaskTable, type Task } from './pure-steel/TaskTable';
import {
    ActivityFeed,
    type ActivityItem,
    type ActivityStat,
} from './pure-steel/ActivityFeed';
import { AgendaWidget } from './widgets/AgendaWidget';

// ─── Types ────────────────────────────────────────────────────────────────────

type WidgetType = 'tasks' | 'recents' | 'calendar' | 'agenda';

interface WidgetConfig {
    id: string;
    type: WidgetType;
    colSpan: 1 | 2;
    height: 'default' | 'tall';
}

export interface DashboardData {
    tasks: DashboardTask[];
    recents: RecentItem[];
    calendar: DashboardTask[];
    isLoading: boolean;
    onTaskClick: (task: DashboardTask) => void;
    onRecentClick: (item: RecentItem) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'wavv_dashboard_layout_v2';

const DEFAULT_LAYOUT: WidgetConfig[] = [
    { id: 'default-calendar', type: 'calendar', colSpan: 2, height: 'default' },
    { id: 'default-tasks', type: 'tasks', colSpan: 1, height: 'default' },
    { id: 'default-recents', type: 'recents', colSpan: 1, height: 'default' },
];

const WIDGET_META: Record<
    WidgetType,
    { label: string; icon: React.ReactNode; description: string }
> = {
    tasks: {
        label: 'My Tasks',
        icon: <CheckCircle2 className="w-5 h-5" />,
        description: 'View and manage your assigned tasks',
    },
    recents: {
        label: 'Recent Activity',
        icon: <Clock className="w-5 h-5" />,
        description: 'See recently accessed items',
    },
    calendar: {
        label: 'Calendar',
        icon: <Calendar className="w-5 h-5" />,
        description: 'Weekly calendar of upcoming due dates',
    },
    agenda: {
        label: 'My Agenda',
        icon: <CalendarDays className="w-5 h-5" />,
        description: 'Upcoming tasks grouped by date',
    },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadLayout(): WidgetConfig[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
        // eslint-disable-next-line no-empty
    } catch {}
    return DEFAULT_LAYOUT;
}

function saveLayout(layout: WidgetConfig[]) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
        // eslint-disable-next-line no-empty
    } catch {}
}

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}

// ─── SortableWidget ───────────────────────────────────────────────────────────

interface SortableWidgetProps {
    config: WidgetConfig;
    isEditMode: boolean;
    onRemove: (id: string) => void;
    onToggleWidth: (id: string) => void;
    onToggleHeight: (id: string) => void;
    children: React.ReactNode;
}

function SortableWidget({
    config,
    isEditMode,
    onRemove,
    onToggleWidth,
    onToggleHeight,
    children,
}: SortableWidgetProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: config.id });

    const isTall = config.height === 'tall';

    const style: React.CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        gridColumn: `span ${config.colSpan}`,
        // Keep the grid slot but hide the card — DragOverlay shows the floating ghost
        visibility: isDragging ? 'hidden' : undefined,
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes}>
            {/* Edit bar — sits above the card, not inside it */}
            {isEditMode && (
                <div className="flex items-center gap-1 mb-1.5 px-0.5">
                    {/* Drag handle — only element with drag listeners */}
                    <div
                        {...listeners}
                        className="cursor-grab active:cursor-grabbing p-1 rounded-md hover:bg-muted/60 transition-colors"
                        title="Drag to reorder"
                    >
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/50" />
                    </div>

                    <span className="text-[10px] font-medium text-muted-foreground/50 flex-1 select-none">
                        {WIDGET_META[config.type].label}
                    </span>

                    {/* Width toggle */}
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onToggleWidth(config.id)}
                        title={
                            config.colSpan === 1
                                ? 'Expand to full width'
                                : 'Shrink to half width'
                        }
                        className="p-1 rounded-md hover:bg-muted/60 transition-colors cursor-pointer"
                    >
                        {config.colSpan === 1 ? (
                            <Maximize2 className="w-3.5 h-3.5 text-muted-foreground/50" />
                        ) : (
                            <Minimize2 className="w-3.5 h-3.5 text-muted-foreground/50" />
                        )}
                    </button>

                    {/* Height toggle */}
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onToggleHeight(config.id)}
                        title={isTall ? 'Collapse height' : 'Expand height'}
                        className="p-1 rounded-md hover:bg-muted/60 transition-colors cursor-pointer"
                    >
                        {isTall ? (
                            <ChevronsDownUp className="w-3.5 h-3.5 text-muted-foreground/50" />
                        ) : (
                            <ChevronsUpDown className="w-3.5 h-3.5 text-muted-foreground/50" />
                        )}
                    </button>

                    {/* Remove */}
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={() => onRemove(config.id)}
                        title="Remove card"
                        className="p-1 rounded-md hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-500 transition-colors cursor-pointer"
                    >
                        <X className="w-3.5 h-3.5 text-muted-foreground/50" />
                    </button>
                </div>
            )}

            {/* Card content — fixed height when tall */}
            <div
                className={cn(
                    isEditMode &&
                        'ring-1 ring-border/50 ring-dashed rounded-xl',
                    isTall && 'flex flex-col overflow-hidden',
                )}
                style={isTall ? { height: '560px' } : undefined}
            >
                {children}
            </div>
        </div>
    );
}

// ─── Add Card Dialog ──────────────────────────────────────────────────────────

function AddCardDialog({
    open,
    onOpenChange,
    onAdd,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAdd: (type: WidgetType) => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Add a Card</DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-3 py-2">
                    {(
                        Object.entries(WIDGET_META) as [
                            WidgetType,
                            (typeof WIDGET_META)[WidgetType],
                        ][]
                    ).map(([type, meta]) => (
                        <button
                            key={type}
                            onClick={() => {
                                onAdd(type);
                                onOpenChange(false);
                            }}
                            className="flex flex-col items-start gap-2.5 p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-muted/30 transition-all text-left group cursor-pointer"
                        >
                            <div className="text-primary group-hover:scale-110 transition-transform">
                                {meta.icon}
                            </div>
                            <div>
                                <div className="text-sm font-medium">
                                    {meta.label}
                                </div>
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    {meta.description}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function CustomizableDashboard({
    userName,
    data,
}: {
    userName: string;
    data: DashboardData;
}) {
    const [widgets, setWidgets] = useState<WidgetConfig[]>(() => loadLayout());
    const [isEditMode, setIsEditMode] = useState(false);
    const [addCardOpen, setAddCardOpen] = useState(false);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [calendarWeekStart, setCalendarWeekStart] = useState(() =>
        getWeekStart(new Date()),
    );

    useEffect(() => {
        saveLayout(widgets);
    }, [widgets]);

    // ── Data Mapping ──────────────────────────────────────────────────────────

    const mappedTasks = useMemo<Task[]>(
        () =>
            data.tasks.map((t) => ({
                id: t.id,
                clientName: t.project.name,
                formType: t.name || 'Task',
                priority: 'medium' as const,
                status: (t.approvalStatus === 'COMPLETED'
                    ? 'complete'
                    : t.approvalStatus === 'IN_REVIEW'
                      ? 'review'
                      : 'pending') as Task['status'],
                dueDate: t.dueAt ? new Date(t.dueAt) : new Date(),
            })),
        [data.tasks],
    );

    const mappedEvents = useMemo<CalendarEvent[]>(
        () =>
            data.calendar.map((t) => ({
                id: t.id,
                title: t.name || t.project.name,
                date: t.dueAt ? new Date(t.dueAt) : new Date(),
                type: 'task' as const,
                status: (t.approvalStatus === 'COMPLETED'
                    ? 'complete'
                    : t.approvalStatus === 'IN_REVIEW'
                      ? 'review'
                      : 'pending') as CalendarEvent['status'],
            })),
        [data.calendar],
    );

    const mappedActivities = useMemo<ActivityItem[]>(
        () =>
            data.recents.slice(0, 8).map((item) => ({
                id: item.id,
                type: (item.type === 'task'
                    ? 'assignment'
                    : 'review') as ActivityItem['type'],
                title: item.name,
                description: `${item.name}${item.parentName ? ` in ${item.parentName}` : ''}`,
                user: { name: 'You' },
                timestamp: new Date(item.updatedAt),
            })),
        [data.recents],
    );

    const mappedStats = useMemo<ActivityStat[]>(
        () => [
            {
                label: 'Active Tasks',
                value: data.tasks.length,
                subLabel: 'Total',
            },
            {
                label: 'This Week',
                value: data.calendar.length,
                subLabel: 'Due items',
            },
        ],
        [data.tasks.length, data.calendar.length],
    );

    // ── Event Handlers ────────────────────────────────────────────────────────

    const handleTaskTableClick = useCallback(
        (task: Task) => {
            const original = data.tasks.find((t) => t.id === task.id);
            if (original) data.onTaskClick(original);
        },
        [data],
    );

    const handleEventClick = useCallback(
        (event: CalendarEvent) => {
            const original = data.calendar.find((t) => t.id === event.id);
            if (original) data.onTaskClick(original);
        },
        [data],
    );

    const handleCalendarNavigate = useCallback(
        (direction: 'prev' | 'next' | 'today') => {
            if (direction === 'today') {
                setCalendarWeekStart(getWeekStart(new Date()));
            } else {
                setCalendarWeekStart((prev) => {
                    const d = new Date(prev);
                    d.setDate(d.getDate() + (direction === 'prev' ? -7 : 7));
                    return d;
                });
            }
        },
        [],
    );

    // ── DnD Handlers ──────────────────────────────────────────────────────────

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            setWidgets((prev) => {
                const oldIdx = prev.findIndex((w) => w.id === active.id);
                const newIdx = prev.findIndex((w) => w.id === over.id);
                return arrayMove(prev, oldIdx, newIdx);
            });
        }
        setActiveId(null);
    };

    const handleRemove = useCallback((id: string) => {
        setWidgets((prev) => prev.filter((w) => w.id !== id));
    }, []);

    const handleToggleWidth = useCallback((id: string) => {
        setWidgets((prev) =>
            prev.map((w) =>
                w.id === id ? { ...w, colSpan: w.colSpan === 1 ? 2 : 1 } : w,
            ),
        );
    }, []);

    const handleToggleHeight = useCallback((id: string) => {
        setWidgets((prev) =>
            prev.map((w) =>
                w.id === id
                    ? {
                          ...w,
                          height: w.height === 'default' ? 'tall' : 'default',
                      }
                    : w,
            ),
        );
    }, []);

    const handleAddWidget = useCallback((type: WidgetType) => {
        const id = `widget-${type}-${Date.now()}`;
        setWidgets((prev) => [
            ...prev,
            {
                id,
                type,
                colSpan: type === 'calendar' ? 2 : 1,
                height: 'default',
            },
        ]);
    }, []);

    const handleReset = useCallback(() => {
        setWidgets(DEFAULT_LAYOUT);
    }, []);

    // ── Widget Render ─────────────────────────────────────────────────────────

    const renderWidgetContent = (config: WidgetConfig) => {
        const isTall = config.height === 'tall';
        switch (config.type) {
            case 'tasks':
                return (
                    <TaskTable
                        tasks={mappedTasks}
                        onTaskClick={handleTaskTableClick}
                        isLoading={data.isLoading}
                        className={isTall ? 'h-full' : undefined}
                    />
                );
            case 'recents':
                return (
                    <ActivityFeed
                        activities={mappedActivities}
                        stats={mappedStats}
                        isLoading={data.isLoading}
                        expandHeight={isTall}
                    />
                );
            case 'calendar':
                return (
                    <CalendarSection
                        events={mappedEvents}
                        currentWeekStart={calendarWeekStart}
                        onNavigate={handleCalendarNavigate}
                        onEventClick={handleEventClick}
                    />
                );
            case 'agenda':
                return (
                    <AgendaWidget
                        tasks={data.calendar}
                        isLoading={data.isLoading}
                        onTaskClick={data.onTaskClick}
                    />
                );
            default:
                return null;
        }
    };

    const activeWidget = activeId
        ? widgets.find((w) => w.id === activeId)
        : null;

    const headerActions = (
        <div className="flex items-center gap-1.5">
            {isEditMode && (
                <>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleReset}
                        className="gap-1.5 text-muted-foreground cursor-pointer h-8 px-2.5"
                    >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Reset
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAddCardOpen(true)}
                        className="gap-1.5 cursor-pointer h-8 px-2.5"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        Add Card
                    </Button>
                </>
            )}
            <Button
                variant={isEditMode ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setIsEditMode(!isEditMode)}
                className="gap-1.5 cursor-pointer h-8 px-2.5"
            >
                <Settings2 className="w-3.5 h-3.5" />
                {isEditMode ? 'Done' : 'Customize'}
            </Button>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-dashboard-bg">
            <DashboardHeader
                userName={userName}
                className="animate-fade-up"
                actions={headerActions}
            />

            <main className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
                {/* Widget Grid */}
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={widgets.map((w) => w.id)}
                        strategy={rectSortingStrategy}
                    >
                        <div className="grid grid-cols-2 gap-x-4 gap-y-5 items-start">
                            {widgets.map((config) => (
                                <SortableWidget
                                    key={config.id}
                                    config={config}
                                    isEditMode={isEditMode}
                                    onRemove={handleRemove}
                                    onToggleWidth={handleToggleWidth}
                                    onToggleHeight={handleToggleHeight}
                                >
                                    {renderWidgetContent(config)}
                                </SortableWidget>
                            ))}

                            {/* Empty state */}
                            {widgets.length === 0 && (
                                <div
                                    className="col-span-2 border-2 border-dashed border-border/40 rounded-xl flex flex-col items-center justify-center gap-3 min-h-75 cursor-pointer hover:border-primary/50 hover:bg-muted/10 transition-all"
                                    onClick={() => setAddCardOpen(true)}
                                >
                                    <Plus className="w-10 h-10 text-muted-foreground/30" />
                                    <span className="text-sm text-muted-foreground/60">
                                        Add a card to get started
                                    </span>
                                </div>
                            )}

                            {/* Add card placeholder in edit mode */}
                            {isEditMode && widgets.length > 0 && (
                                <div
                                    className="border-2 border-dashed border-border/40 rounded-xl flex flex-col items-center justify-center gap-2 min-h-30 cursor-pointer hover:border-primary/50 hover:bg-muted/10 transition-all"
                                    onClick={() => setAddCardOpen(true)}
                                >
                                    <Plus className="w-6 h-6 text-muted-foreground/30" />
                                    <span className="text-xs text-muted-foreground/50">
                                        Add card
                                    </span>
                                </div>
                            )}
                        </div>
                    </SortableContext>

                    <DragOverlay
                        dropAnimation={{
                            duration: 200,
                            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                        }}
                    >
                        {activeWidget ? (
                            <div
                                className="pointer-events-none"
                                style={{ rotate: '1.5deg' }}
                            >
                                <div
                                    className={cn(
                                        'bg-dashboard-surface border border-dashboard-border',
                                        'rounded-xl shadow-2xl',
                                        'flex items-center gap-3 px-5 py-4',
                                        'opacity-95 scale-[1.02]',
                                    )}
                                >
                                    <div className="text-(--accent) opacity-80 shrink-0">
                                        {WIDGET_META[activeWidget.type].icon}
                                    </div>
                                    <span className="font-serif text-sm font-semibold text-dashboard-text-primary">
                                        {WIDGET_META[activeWidget.type].label}
                                    </span>
                                </div>
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </main>

            <AddCardDialog
                open={addCardOpen}
                onOpenChange={setAddCardOpen}
                onAdd={handleAddWidget}
            />
        </div>
    );
}
