'use client';

import React, { useState, useCallback } from 'react';
import {
    DndContext,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragOverlay,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TasksWidget, RecentsWidget, CalendarWidget } from './widgets';
import { GripVertical } from 'lucide-react';
import { DashboardTask, RecentItem } from '@/lib/api';
import { cn } from '@/lib/utils';

// Data props for the dashboard
interface DashboardData {
    tasks: DashboardTask[];
    recents: RecentItem[];
    calendar: DashboardTask[];
    loading: boolean;
    onTaskClick: (task: DashboardTask) => void;
    onRecentClick: (item: RecentItem) => void;
}

// Widget types
type WidgetType = 'tasks' | 'recents' | 'calendar';

interface Widget {
    id: string;
    type: WidgetType;
}

interface Column {
    id: string;
    widgets: Widget[];
    width: number; // Percentage
}

// Wrapper for draggable items
function SortableWidget({
    id,
    widget,
    data,
}: {
    id: string;
    widget: Widget;
    data: DashboardData;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({
        id,
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        transition,
    };

    const renderWidget = () => {
        switch (widget.type) {
            case 'tasks':
                return (
                    <TasksWidget
                        tasks={data.tasks}
                        isLoading={data.loading}
                        onTaskClick={data.onTaskClick}
                    />
                );
            case 'recents':
                return (
                    <RecentsWidget
                        items={data.recents}
                        isLoading={data.loading}
                        onItemClick={data.onRecentClick}
                    />
                );
            case 'calendar':
                return <CalendarWidget tasks={data.calendar} />;
            default:
                return null;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            className={cn(
                'group relative transition-all',
                isDragging
                    ? 'opacity-50 z-50 overflow-hidden ring-2 ring-primary'
                    : '',
            )}
        >
            {/* Drag Handle Indicator (visible on hover) */}
            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 cursor-move z-10 p-1 bg-background/80 backdrop-blur-sm rounded-md transition-opacity">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
            </div>

            <div className={cn('h-full', isDragging && 'pointer-events-none')}>
                {renderWidget()}
            </div>
        </div>
    );
}

// Main Component
export function DraggableDashboard({ data }: { data: DashboardData }) {
    // Initial Layout State
    const [columns, setColumns] = useState<Column[]>([
        {
            id: 'col-left',
            width: 66.66,
            widgets: [{ id: 'widget-tasks', type: 'tasks' }],
        },
        {
            id: 'col-right',
            width: 33.33,
            widgets: [
                { id: 'widget-recents', type: 'recents' },
                { id: 'widget-calendar', type: 'calendar' },
            ],
        },
    ]);

    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    // Resizing logic
    const handleResize = useCallback(
        (index: number, newWidth: number) => {
            // Simple 2-column resize for now
            // Logic updates adjacent columns
            if (index >= columns.length - 1) return;

            setColumns((prev) => {
                const next = [...prev];
                // Calculate delta?
                // Simplified: The resizer passes the new percentage width for the LEFT column
                // We constrain it between 20% and 80%
                const constrainedWidth = Math.min(Math.max(newWidth, 20), 80);

                next[index].width = constrainedWidth;
                next[index + 1].width = 100 - constrainedWidth;
                return next;
            });
        },
        [columns.length],
    );

    // Drag Handlers
    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        // Find the containers
        const findColumn = (id: string) =>
            columns.find((col) => col.widgets.some((w) => w.id === id))?.id ||
            columns.find((col) => col.id === id)?.id;

        const activeColId = findColumn(activeId as string);
        const overColId = findColumn(overId as string);

        if (!activeColId || !overColId) return;

        if (activeColId !== overColId) {
            setColumns((prev) => {
                const activeColIndex = prev.findIndex(
                    (c) => c.id === activeColId,
                );
                const overColIndex = prev.findIndex((c) => c.id === overColId);

                const activeWidgets = [...prev[activeColIndex].widgets];
                const overWidgets = [...prev[overColIndex].widgets];

                const activeWidgetIndex = activeWidgets.findIndex(
                    (w) => w.id === activeId,
                );
                const activeWidget = activeWidgets[activeWidgetIndex];

                activeWidgets.splice(activeWidgetIndex, 1);

                // If over a column directly, add to end. If over a widget, add relative to it.
                const isOverColumn = prev.some((c) => c.id === overId);
                if (isOverColumn) {
                    overWidgets.push(activeWidget);
                } else {
                    const overWidgetIndex = overWidgets.findIndex(
                        (w) => w.id === overId,
                    );
                    const isBelowOverItem =
                        over &&
                        active.rect.current.translated &&
                        active.rect.current.translated.top >
                            over.rect.top + over.rect.height;

                    const modifier = isBelowOverItem ? 1 : 0;
                    const newIndex =
                        overWidgetIndex >= 0
                            ? overWidgetIndex + modifier
                            : overWidgets.length + 1;

                    overWidgets.splice(newIndex, 0, activeWidget);
                }

                const newCols = [...prev];
                newCols[activeColIndex] = {
                    ...newCols[activeColIndex],
                    widgets: activeWidgets,
                };
                newCols[overColIndex] = {
                    ...newCols[overColIndex],
                    widgets: overWidgets,
                };

                return newCols;
            });
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) {
            setActiveId(null);
            return;
        }

        const activeId = active.id as string;
        const overId = over.id as string;

        const activeCol = columns.find((c) =>
            c.widgets.some((w) => w.id === activeId),
        );
        const overCol =
            columns.find((c) => c.widgets.some((w) => w.id === overId)) ||
            columns.find((c) => c.id === overId);

        if (activeCol && overCol && activeCol.id === overCol.id) {
            const colIndex = columns.findIndex((c) => c.id === activeCol.id);
            const oldIndex = activeCol.widgets.findIndex(
                (w) => w.id === activeId,
            );
            const newIndex = activeCol.widgets.findIndex(
                (w) => w.id === overId,
            );

            if (oldIndex !== newIndex) {
                setColumns((prev) => {
                    const next = [...prev];
                    next[colIndex].widgets = arrayMove(
                        next[colIndex].widgets,
                        oldIndex,
                        newIndex,
                    );
                    return next;
                });
            }
        }

        setActiveId(null);
    };

    // Helper to find widget by ID for Overlay
    const findWidget = (id: string) => {
        for (const col of columns) {
            const w = col.widgets.find((w) => w.id === id);
            if (w) return w;
        }
        return null;
    };

    const activeWidget = activeId ? findWidget(activeId) : null;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full w-full gap-6">
                {columns.map((col, index) => (
                    <React.Fragment key={col.id}>
                        {/* Column */}
                        <div
                            className="flex flex-col h-full min-h-0 min-w-[200px]"
                            style={{ width: `${col.width}%` }}
                        >
                            <SortableContext
                                id={col.id}
                                items={col.widgets.map((w) => w.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                <div className="flex-1 h-full flex flex-col gap-6 rounded-xl overflow-visible">
                                    {col.widgets.map((widget) => (
                                        <SortableWidget
                                            key={widget.id}
                                            id={widget.id}
                                            widget={widget}
                                            data={data}
                                        />
                                    ))}
                                    {/* Drop zone placeholder if empty */}
                                    {col.widgets.length === 0 && (
                                        <div className="flex-1 border-2 border-dashed border-muted/20 rounded-xl flex items-center justify-center text-muted-foreground/50 text-sm">
                                            Drop items here
                                        </div>
                                    )}
                                </div>
                            </SortableContext>
                        </div>

                        {/* Resizer Handle (between columns only) */}
                        {index < columns.length - 1 && (
                            <Resizer
                                currentWidth={col.width}
                                onUpdateWidth={(w) => handleResize(index, w)}
                            />
                        )}
                    </React.Fragment>
                ))}
            </div>

            <DragOverlay>
                {activeWidget ? (
                    <div className="opacity-90 rotate-2 cursor-grabbing shadow-2xl">
                        <SortableWidget
                            id={activeWidget.id}
                            widget={activeWidget}
                            data={data}
                        />
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
}

function Resizer({
    currentWidth,
    onUpdateWidth,
}: {
    currentWidth: number;
    onUpdateWidth: (w: number) => void;
}) {
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = currentWidth;
        const parentWidth =
            e.currentTarget.parentElement?.parentElement?.offsetWidth || 1000;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const delta = moveEvent.clientX - startX;
            // Convert delta to percentage of parent width
            const deltaPercent = (delta / parentWidth) * 100;
            onUpdateWidth(startWidth + deltaPercent);
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    };

    return (
        <div
            className="w-1.5 hover:bg-primary/20 cursor-col-resize rounded-full transition-colors flex items-center justify-center group shrink-0"
            onMouseDown={handleMouseDown}
        >
            <div className="w-[1px] h-8 bg-border group-hover:bg-primary/50 transition-colors" />
        </div>
    );
}
