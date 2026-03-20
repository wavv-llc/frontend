'use client';

import {
    useState,
    useRef,
    useImperativeHandle,
    forwardRef,
    useLayoutEffect,
    useMemo,
} from 'react';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
    useDroppable,
    type DragEndEvent,
    type DragStartEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    horizontalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    Plus,
    CheckCircle2,
    MoreVertical,
    Trash2,
    Calendar,
    Type,
    Hash,
    GripVertical,
    User as UserIcon,
    ChevronRight,
    ChevronDown,
    X,
    FileText,
    CheckSquare,
    Pencil,
    ExternalLink,
    Bell,
    Send,
    XCircle,
    RefreshCw,
    Link2,
    Activity,
    Layers,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
import { useCustomFieldTemplates } from '@/hooks/useCustomFieldTemplates';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    type Task,
    type CustomField,
    type DataType,
    type User as ApiUser,
    type OrganizationDocument,
    type Section,
    customFieldApi,
    taskApi,
    approvalApi,
    sectionApi,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MultiSelect } from '@/components/ui/multi-select';
import { useAuth } from '@clerk/nextjs';
import { useUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { cn, formatDateOnly, parseDateOnly } from '@/lib/utils';

import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { StatusPill } from './StatusPill';

export interface TaskListRef {
    startCreatingTask: () => void;
}

interface TaskListProps {
    tasks: Task[];
    customFields: CustomField[];
    onTaskClick: (task: Task) => void;
    onTaskEdit: (task: Task) => void;
    onTaskDelete: (taskId: string) => void;
    onTaskCopy: (task: Task) => void;
    onCustomFieldCreated: () => void;
    onTaskCreated: () => void;
    onTaskAdded: (task: Task) => void;
    onTasksRemoved?: (taskIds: string[]) => void;
    projectId: string;
    workspaceId: string;
    members: ApiUser[];
    documents?: OrganizationDocument[];
    groupByField: string | null;
    columnFilters: Record<string, { value: string; type: 'text' | 'date' }>;
    onColumnFilterChange: (
        fieldId: string,
        value: string,
        type?: 'text' | 'date',
    ) => void;
    sections?: Section[];
    onAddSection?: () => void;
    onRenameSection?: (sectionId: string, name: string) => void;
    onDeleteSection?: (sectionId: string) => void;
    hiddenColumns?: Set<string>;
    readOnly?: boolean;
}

const STATUS_COL_WIDTH = 140;

function formatApprovalStatus(status: string | null | undefined): string {
    switch (status) {
        case 'IN_PREPARATION':
            return 'In Preparation';
        case 'IN_REVIEW':
            return 'In Review';
        case 'COMPLETED':
            return 'Completed';
        default:
            return status ?? '—';
    }
}

// Field types shown in the "New field" dropdown (Text is the default, not shown)
const FIELD_TYPES = [
    {
        value: 'USER' as DataType,
        label: 'Person',
        icon: UserIcon,
    },
    {
        value: 'CUSTOM' as DataType,
        label: 'Status',
        icon: CheckCircle2,
    },
    {
        value: 'DATE' as DataType,
        label: 'Date',
        icon: Calendar,
    },
] as const;

interface EditableContentProps {
    value: string;
    onSave: (value: string) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    textStyle?: string;
    autoFocus?: boolean;
}

/** Notion-style inline editable: single contentEditable div, no visible box. */
const EditableContent = ({
    value,
    onSave,
    placeholder = 'Click to edit',
    className = '',
    inputClassName = '',
    textStyle = '',
    autoFocus = false,
}: EditableContentProps) => {
    const [isEditing, setIsEditing] = useState(autoFocus);
    const [displayValue, setDisplayValue] = useState(value);
    const [prevValue, setPrevValue] = useState(value);
    // Derived state pattern to sync value from props when not editing
    if (value !== prevValue && !isEditing) {
        setPrevValue(value);
        setDisplayValue(value);
    }

    const [editEmpty, setEditEmpty] = useState(autoFocus && !value.trim());
    const ref = useRef<HTMLDivElement>(null);
    const discardOnBlurRef = useRef(false);

    useLayoutEffect(() => {
        if (!isEditing || !ref.current) return;
        const el = ref.current;
        if (autoFocus) {
            el.focus();
        }
        // Clear first to avoid appending to any residual content (e.g. <br> from browser)
        el.textContent = '';
        el.textContent = displayValue;
        placeCaretAtEnd(el);
    }, [isEditing, displayValue, autoFocus]);

    const handleBlur = () => {
        if (discardOnBlurRef.current) {
            discardOnBlurRef.current = false;
            setDisplayValue(value);
            setIsEditing(false);
            return;
        }
        const el = ref.current;
        const raw = el?.textContent ?? '';
        const trimmed = raw.trim();
        if (trimmed !== value) onSave(trimmed);
        setDisplayValue(trimmed || value);
        setIsEditing(false);
    };

    const handleInput = () => {
        const raw = ref.current?.textContent ?? '';
        setEditEmpty(!raw.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLDivElement).blur();
        }
        if (e.key === 'Escape') {
            discardOnBlurRef.current = true;
            if (ref.current) ref.current.textContent = displayValue;
            (e.target as HTMLDivElement).blur();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        // Update empty state after paste (execCommand is sync but DOM updates after)
        queueMicrotask(handleInput);
    };

    const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        // Prevent row selection or opening side panel
        e.stopPropagation();
        if (!isEditing) {
            setIsEditing(true);
            setEditEmpty(!displayValue.trim());
        }
    };

    if (isEditing) {
        return (
            <div className={cn('relative', className)}>
                <div
                    ref={ref}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={handleBlur}
                    onInput={handleInput}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    className={cn(
                        'outline-none cursor-text',
                        'rounded px-1 py-0.5 -mx-1 -my-0.5',
                        'bg-muted/40 focus:bg-muted/60',
                        'transition-colors duration-150',
                        'min-h-[1.5em] w-full',
                        textStyle,
                        inputClassName,
                    )}
                />
                {/* Placeholder overlay when empty */}
                {editEmpty && (
                    <div
                        className={cn(
                            'pointer-events-none absolute left-0 top-0 px-1 py-0.5 text-muted-foreground/50 italic',
                            'min-h-[1.5em]',
                            textStyle,
                        )}
                        aria-hidden
                    >
                        {placeholder}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick(e);
                }
            }}
            className={cn(
                'group cursor-pointer rounded -ml-1 pl-1 pr-1 border border-transparent',
                'hover:bg-muted/30 active:bg-muted/40 transition-colors duration-150',
                'flex items-center gap-2',
                className,
            )}
            title="Click to edit"
        >
            <div className={cn('flex-1 min-h-[1.5em]', textStyle)}>
                {displayValue || (
                    <span className="text-muted-foreground/50 italic">
                        {placeholder}
                    </span>
                )}
            </div>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
    );
};

function placeCaretAtEnd(el: HTMLElement) {
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
}

interface EditableHeaderProps {
    initialValue: string;
    icon?: React.ComponentType<{ className?: string }>;
    className?: string;
    onSave: (value: string) => void;
    placeholder?: string;
}

/** Notion-style inline editable header using contentEditable for seamless editing */
const EditableHeader = ({
    initialValue,
    icon: Icon,
    onSave,
    placeholder = 'Field name...',
}: EditableHeaderProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [displayValue, setDisplayValue] = useState(initialValue);
    const [prevValue, setPrevValue] = useState(initialValue);
    // Derived state pattern to sync value from props when not editing
    if (initialValue !== prevValue && !isEditing) {
        setPrevValue(initialValue);
        setDisplayValue(initialValue);
    }

    const [editEmpty, setEditEmpty] = useState(false);
    const headerRef = useRef<HTMLDivElement>(null);
    const discardOnBlurRef = useRef(false);

    useLayoutEffect(() => {
        if (!isEditing || !headerRef.current) return;
        const el = headerRef.current;
        el.focus();
        el.textContent = '';
        el.textContent = displayValue;
        placeCaretAtEnd(el);
    }, [isEditing, displayValue]);

    const handleBlur = () => {
        if (discardOnBlurRef.current) {
            discardOnBlurRef.current = false;
            setDisplayValue(initialValue);
            setIsEditing(false);
            return;
        }
        const el = headerRef.current;
        const raw = el?.textContent ?? '';
        const trimmed = raw.trim();
        if (trimmed && trimmed !== initialValue) {
            onSave(trimmed);
        }
        setDisplayValue(trimmed || initialValue);
        setIsEditing(false);
    };

    const handleInput = () => {
        const raw = headerRef.current?.textContent ?? '';
        setEditEmpty(!raw.trim());
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            (e.target as HTMLDivElement).blur();
        }
        if (e.key === 'Escape') {
            discardOnBlurRef.current = true;
            if (headerRef.current) headerRef.current.textContent = displayValue;
            (e.target as HTMLDivElement).blur();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        queueMicrotask(handleInput);
    };

    const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        e.stopPropagation();
        if (!isEditing) {
            setIsEditing(true);
            setEditEmpty(!displayValue.trim());
        }
    };

    if (isEditing) {
        return (
            <div
                className={cn(
                    'relative flex items-center gap-2 min-w-0 flex-1',
                )}
            >
                {Icon && (
                    <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
                )}
                <div className="relative flex-1 min-w-0">
                    <div
                        ref={headerRef}
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={handleBlur}
                        onInput={handleInput}
                        onKeyDown={handleKeyDown}
                        onPaste={handlePaste}
                        className={cn(
                            'outline-none cursor-text',
                            'rounded px-1 py-0.5 -mx-1 -my-0.5',
                            'bg-muted/40 focus:bg-muted/60',
                            'transition-colors duration-150',
                            'text-[11px] font-medium tracking-wide uppercase truncate',
                            'min-h-[1.5em]',
                        )}
                        onClick={(e) => e.stopPropagation()}
                    />
                    {editEmpty && (
                        <div
                            className={cn(
                                'pointer-events-none absolute left-0 top-0 px-1 py-0.5',
                                'text-sm font-medium text-muted-foreground/50 italic',
                            )}
                            aria-hidden
                        >
                            {placeholder}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClick(e);
                }
            }}
            className={cn(
                'flex items-center gap-2 min-w-0 flex-1',
                'group/header cursor-pointer',
                'rounded px-1 py-0.5 -mx-1 -my-0.5',
                'hover:bg-muted/50 active:bg-muted/70',
                'transition-colors duration-150',
                'relative',
            )}
            title="Click to edit"
        >
            {Icon && (
                <Icon className="h-3 w-3 shrink-0 text-muted-foreground" />
            )}
            <span
                className={cn(
                    'text-[11px] font-medium tracking-wide uppercase truncate',
                    !displayValue && 'text-muted-foreground/50 italic',
                )}
            >
                {displayValue || placeholder}
            </span>
        </div>
    );
};

/** Thin sortable wrapper for task rows — exposes drag handle props via render prop */
function SortableRow({
    id,
    children,
}: {
    id: string;
    children: (
        dragHandleProps: React.HTMLAttributes<HTMLElement>,
    ) => React.ReactNode;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
        >
            {isDragging ? (
                <div className="h-9 border border-dashed border-blue-300/60 rounded-sm bg-blue-50/20 mx-0.5 my-px" />
            ) : (
                children({ ...attributes, ...listeners })
            )}
        </div>
    );
}

/** Droppable wrapper for section headers — receives tasks dragged onto the header */
function DroppableSectionHeader({
    sectionId,
    isOver: _isOver,
    children,
}: {
    sectionId: string | null;
    isOver?: boolean;
    children: (isOver: boolean) => React.ReactNode;
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: sectionId ? `section:${sectionId}` : 'section:none',
    });
    return <div ref={setNodeRef}>{children(isOver)}</div>;
}

/** Thin sortable wrapper for column headers */
function SortableColumn({
    id,
    className,
    style,
    children,
}: {
    id: string;
    className?: string;
    style?: React.CSSProperties;
    children: (
        dragHandleProps: React.HTMLAttributes<HTMLElement>,
    ) => React.ReactNode;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    return (
        <div
            ref={setNodeRef}
            style={{
                transform: CSS.Transform.toString(transform),
                transition,
                ...style,
            }}
            className={cn(
                className,
                isDragging ? 'opacity-50 z-50' : undefined,
            )}
        >
            {children({ ...attributes, ...listeners })}
        </div>
    );
}

/** Drag-to-resize handle anchored to the right edge of a column header */
function ColumnResizeHandle({
    fieldId,
    currentWidth,
    onResize,
    onResizeEnd,
}: {
    fieldId: string;
    currentWidth: number;
    onResize: (fieldId: string, newWidth: number) => void;
    onResizeEnd: (fieldId: string, finalWidth: number) => void;
}) {
    const handlePointerDown = (e: React.PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const startX = e.clientX;
        const startWidth = currentWidth;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);

        const onPointerMove = (moveEvent: PointerEvent) => {
            const newWidth = Math.max(
                80,
                startWidth + (moveEvent.clientX - startX),
            );
            onResize(fieldId, newWidth);
        };
        const onPointerUp = (upEvent: PointerEvent) => {
            const finalWidth = Math.max(
                80,
                startWidth + (upEvent.clientX - startX),
            );
            onResizeEnd(fieldId, finalWidth);
            document.removeEventListener('pointermove', onPointerMove);
            document.removeEventListener('pointerup', onPointerUp);
        };
        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    };

    return (
        <div
            onPointerDown={handlePointerDown}
            onClick={(e) => e.stopPropagation()}
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize opacity-0 group-hover:opacity-100 hover:opacity-100 hover:bg-accent-blue/40 transition-opacity z-10 select-none"
        />
    );
}

export const TaskList = forwardRef<TaskListRef, TaskListProps>(
    (
        {
            tasks,
            customFields,
            onTaskClick,
            onTaskEdit: _onTaskEdit,
            onTaskDelete: _onTaskDelete,
            onTaskCopy: _onTaskCopy,
            onCustomFieldCreated,
            onTaskCreated,
            onTaskAdded,
            onTasksRemoved,
            projectId,
            workspaceId,
            members,
            documents = [],
            groupByField,
            columnFilters: _columnFilters,
            onColumnFilterChange: _onColumnFilterChange,
            sections = [],
            onAddSection: _onAddSection,
            onRenameSection,
            onDeleteSection,
            hiddenColumns,
            readOnly = false,
        },
        ref,
    ) => {
        const { getToken } = useAuth();
        const { user: currentUser } = useUser();
        const orgPrefix = currentUser?.organization?.name
            ? currentUser.organization.name
                  .replace(/[^a-zA-Z]/g, '')
                  .slice(0, 3)
                  .toUpperCase() || 'TSK'
            : 'TSK';
        const formatTaskId = (taskNumber: number | null | undefined) =>
            taskNumber !== null && taskNumber !== undefined
                ? `${orgPrefix}-${String(taskNumber).padStart(3, '0')}`
                : null;
        const { saveTemplateFromTask } = useCustomFieldTemplates(workspaceId);
        const [isCreatingField, setIsCreatingField] = useState(false);
        const [fieldName, setFieldName] = useState('');
        const [fieldType, setFieldType] = useState<DataType>('STRING');
        const [showRoleSelection, setShowRoleSelection] = useState(false);
        const [roleName, setRoleName] = useState<string>('');
        const [selectedApprovalRole, setSelectedApprovalRole] = useState<
            'NONE' | 'PREPARER' | 'REVIEWER_1' | 'REVIEWER_2'
        >('NONE');
        const [allowMultiple, setAllowMultiple] = useState(false);
        const [isSubmitting, setIsSubmitting] = useState(false);

        const MULTIPLE_SUPPORTED_TYPES: DataType[] = [
            'USER',
            'TASK',
            'DOCUMENT',
            'CUSTOM',
        ];

        // Delete field state
        const [fieldToDelete, setFieldToDelete] = useState<CustomField | null>(
            null,
        );
        const [isDeletingField, setIsDeletingField] = useState(false);

        // Save-as-template state
        const [templateTask, setTemplateTask] = useState<Task | null>(null);
        const [templateName, setTemplateName] = useState('');

        // Optimistic updates: store pending field value changes
        // Key format: "taskId:fieldId" -> value
        const [optimisticUpdates, setOptimisticUpdates] = useState<
            Record<string, string>
        >({});

        // Optimistic task name overrides (taskId -> name), cleared after server refresh
        const [optimisticTaskNames, setOptimisticTaskNames] = useState<
            Record<string, string>
        >({});

        // Optimistic approval status overrides (taskId -> ApprovalStatus)
        const [optimisticApprovalStatus, setOptimisticApprovalStatus] =
            useState<Record<string, Task['approvalStatus']>>({});

        // Local field name overrides (fieldId -> name), cleared when customFields prop refreshes
        const [localFieldNameOverrides, setLocalFieldNameOverrides] = useState<
            Record<string, string>
        >({});

        // Deduplicate members to avoid key collision errors
        const uniqueMembers = useMemo(() => {
            return Array.from(new Map(members.map((m) => [m.id, m])).values());
        }, [members]);

        // ─── DnD state & sensors ────────────────────────────────────────────
        // Local task ID order (drives flat-list rendering + row reorder)
        const [taskOrder, setTaskOrder] = useState<string[]>(() =>
            tasks.map((t) => t.id),
        );

        // Sync taskOrder when the tasks prop changes (adds/removes tasks)
        useLayoutEffect(() => {
            setTaskOrder((prev) => {
                const incoming = tasks.map((t) => t.id);
                const prevSet = new Set(prev);
                const incomingSet = new Set(incoming);
                // Keep existing order, remove deleted, append new at end
                const kept = prev.filter((id) => incomingSet.has(id));
                const added = incoming.filter((id) => !prevSet.has(id));
                return [...kept, ...added];
            });
        }, [tasks]);

        // Local field order (drives column header + cell rendering)
        const [fieldOrder, setFieldOrder] = useState<string[]>(() =>
            customFields.map((f) => f.id),
        );

        useLayoutEffect(() => {
            setFieldOrder((prev) => {
                const incoming = customFields.map((f) => f.id);
                const prevSet = new Set(prev);
                const incomingSet = new Set(incoming);
                const kept = prev.filter((id) => incomingSet.has(id));
                const added = incoming.filter((id) => !prevSet.has(id));
                return [...kept, ...added];
            });
            setLocalFieldNameOverrides({});
        }, [customFields]);

        // Column widths (fieldId -> px width), seeded from backend
        const [columnWidths, setColumnWidths] = useState<
            Record<string, number>
        >(() =>
            Object.fromEntries(customFields.map((f) => [f.id, f.width ?? 150])),
        );

        useLayoutEffect(() => {
            setColumnWidths((prev) => {
                const next = { ...prev };
                let changed = false;
                for (const f of customFields) {
                    if (!(f.id in next)) {
                        next[f.id] = f.width ?? 150;
                        changed = true;
                    }
                }
                return changed ? next : prev;
            });
        }, [customFields]);

        // Name column width (resizable, not persisted to server)
        const [nameColWidth, setNameColWidth] = useState(300);

        const handleColumnResize = (fieldId: string, newWidth: number) => {
            setColumnWidths((prev) => ({ ...prev, [fieldId]: newWidth }));
        };

        const handleColumnResizeEnd = async (
            fieldId: string,
            finalWidth: number,
        ) => {
            const clamped = Math.max(80, Math.min(600, finalWidth));
            setColumnWidths((prev) => ({ ...prev, [fieldId]: clamped }));
            try {
                const token = await getToken();
                if (!token) return;
                await customFieldApi.updateCustomField(
                    token,
                    projectId,
                    fieldId,
                    {
                        width: clamped,
                    },
                );
            } catch {
                toast.error('Failed to save column width');
            }
        };

        const dndSensors = useSensors(
            useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
            useSensor(KeyboardSensor, {
                coordinateGetter: sortableKeyboardCoordinates,
            }),
        );

        const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
        const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null;

        const handleRowDragStart = (event: DragStartEvent) => {
            setActiveTaskId(event.active.id as string);
        };

        const handleRowDragEnd = async (event: DragEndEvent) => {
            setActiveTaskId(null);
            const { active, over } = event;
            if (!over) return;

            const activeId = active.id as string;
            const overId = over.id as string;

            // ── Dropped onto a section header drop zone ──────────────────────
            if (overId.startsWith('section:')) {
                const targetSectionId =
                    overId === 'section:none'
                        ? null
                        : overId.slice('section:'.length);
                const activeTask = tasks.find((t) => t.id === activeId);
                if (!activeTask) return;
                const currentSectionId = getEffectiveSectionId(activeTask);
                if (currentSectionId === targetSectionId) return;

                // Optimistic update
                setLocalTaskSectionOverrides((prev) => ({
                    ...prev,
                    [activeId]: targetSectionId,
                }));
                try {
                    const token = await getToken();
                    if (!token) return;
                    await taskApi.updateTask(token, projectId, activeId, {
                        sectionId: targetSectionId,
                    });
                    onTaskCreated();
                } catch {
                    setLocalTaskSectionOverrides((prev) => {
                        const next = { ...prev };
                        delete next[activeId];
                        return next;
                    });
                    toast.error('Failed to move task');
                }
                return;
            }

            // ── Dropped onto another task ─────────────────────────────────────
            if (activeId === overId) return;

            const activeTask = tasks.find((t) => t.id === activeId);
            const overTask = tasks.find((t) => t.id === overId);
            const activeSectionId = activeTask
                ? getEffectiveSectionId(activeTask)
                : null;
            const overSectionId = overTask
                ? getEffectiveSectionId(overTask)
                : null;

            const oldIndex = taskOrder.indexOf(activeId);
            const newIndex = taskOrder.indexOf(overId);
            const newOrder = arrayMove(taskOrder, oldIndex, newIndex);
            setTaskOrder(newOrder);

            // Optimistically update sectionId if dropping into a different section
            if (activeSectionId !== overSectionId) {
                setLocalTaskSectionOverrides((prev) => ({
                    ...prev,
                    [activeId]: overSectionId,
                }));
            }

            try {
                const token = await getToken();
                if (!token) return;

                const calls: Promise<unknown>[] = [
                    taskApi.reorderTasks(
                        token,
                        projectId,
                        newOrder.map((id, idx) => ({ id, order: idx })),
                    ),
                ];
                if (activeSectionId !== overSectionId) {
                    calls.push(
                        taskApi.updateTask(token, projectId, activeId, {
                            sectionId: overSectionId,
                        }),
                    );
                }
                await Promise.all(calls);
                if (activeSectionId !== overSectionId) {
                    onTaskCreated();
                }
            } catch {
                setTaskOrder(taskOrder);
                if (activeSectionId !== overSectionId) {
                    setLocalTaskSectionOverrides((prev) => {
                        const next = { ...prev };
                        delete next[activeId];
                        return next;
                    });
                }
                toast.error('Failed to save new task order');
            }
        };

        const handleColumnDragEnd = async (event: DragEndEvent) => {
            const { active, over } = event;
            if (!over || active.id === over.id) return;

            const oldIndex = fieldOrder.indexOf(active.id as string);
            const newIndex = fieldOrder.indexOf(over.id as string);
            const newOrder = arrayMove(fieldOrder, oldIndex, newIndex);
            setFieldOrder(newOrder);

            try {
                const token = await getToken();
                if (!token) return;
                // Persist order for each affected field
                await Promise.all(
                    newOrder.map((id, idx) =>
                        customFieldApi.updateCustomField(token, projectId, id, {
                            order: idx,
                        }),
                    ),
                );
            } catch {
                setFieldOrder(fieldOrder);
                toast.error('Failed to save new column order');
            }
        };
        // ────────────────────────────────────────────────────────────────────

        // Clear optimistic updates when tasks change (e.g., after successful refresh)
        // This prevents stale optimistic updates from persisting
        useLayoutEffect(() => {
            if (Object.keys(optimisticUpdates).length > 0) {
                // Only clear optimistic updates that are now reflected in the actual data
                setOptimisticUpdates((prev) => {
                    const next = { ...prev };
                    let hasChanges = false;

                    Object.keys(next).forEach((key) => {
                        const [taskId, fieldId] = key.split(':');
                        const task = tasks.find((t) => t.id === taskId);
                        const actualValue = task?.customFieldValues?.find(
                            (v) => v.customFieldId === fieldId,
                        )?.value;
                        const optimisticValue = next[key];

                        // Clear the optimistic update if:
                        // 1. The actual value matches the optimistic value exactly
                        // 2. Both are "empty" (undefined, null, or empty string)
                        const actualIsEmpty =
                            !actualValue || actualValue === '';
                        const optimisticIsEmpty =
                            !optimisticValue || optimisticValue === '';

                        if (
                            actualValue === optimisticValue ||
                            (actualIsEmpty && optimisticIsEmpty)
                        ) {
                            delete next[key];
                            hasChanges = true;
                        }
                    });

                    return hasChanges ? next : prev;
                });
            }
        }, [tasks, optimisticUpdates]);

        // Clear optimistic task names once the server data reflects the updated name
        useLayoutEffect(() => {
            if (Object.keys(optimisticTaskNames).length === 0) return;
            setOptimisticTaskNames((prev) => {
                const next = { ...prev };
                let hasChanges = false;
                Object.keys(next).forEach((taskId) => {
                    const task = tasks.find((t) => t.id === taskId);
                    if (!task || task.name === next[taskId]) {
                        delete next[taskId];
                        hasChanges = true;
                    }
                });
                return hasChanges ? next : prev;
            });
        }, [tasks, optimisticTaskNames]);

        // Scroll preservation on task create
        const scrollContainerRef = useRef<HTMLDivElement>(null);
        const pendingScrollRestore = useRef<number | null>(null);

        // Restore scroll position after tasks refresh (fixes MIN#1 jump-to-top)
        useLayoutEffect(() => {
            if (
                pendingScrollRestore.current !== null &&
                scrollContainerRef.current
            ) {
                scrollContainerRef.current.scrollTop =
                    pendingScrollRestore.current;
                pendingScrollRestore.current = null;
            }
        }, [tasks]);

        // Inline task creation
        const [isCreatingTask, setIsCreatingTask] = useState(false);
        const [collapsedGroups, setCollapsedGroups] = useState<
            Record<string, boolean>
        >({});

        const toggleGroup = (groupValue: string) => {
            setCollapsedGroups((prev) => ({
                ...prev,
                [groupValue]: !prev[groupValue],
            }));
        };

        // Section state
        const [collapsedSections, setCollapsedSections] = useState<
            Record<string, boolean>
        >({});
        const [editingSectionId, setEditingSectionId] = useState<string | null>(
            null,
        );
        const [editingSectionName, setEditingSectionName] = useState('');
        const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
        const [editingTaskName, setEditingTaskName] = useState('');
        const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([]);

        // Merge real + optimistic tasks for rendering
        const allTasks = useMemo(
            () => [...tasks, ...optimisticTasks],
            [tasks, optimisticTasks],
        );

        // Clear optimistic tasks once the parent refreshes with real server data
        useLayoutEffect(() => {
            setOptimisticTasks([]);
        }, [tasks]);
        const [sectionColors, setSectionColors] = useState<
            Record<string, string>
        >(() => {
            const init: Record<string, string> = {};
            for (const s of sections ?? []) {
                if (s.color) init[s.id] = s.color;
            }
            return init;
        });

        // Sync section colors when sections prop changes (e.g. after refresh)
        useLayoutEffect(() => {
            setSectionColors((prev) => {
                const next = { ...prev };
                for (const s of sections ?? []) {
                    if (!(s.id in prev) && s.color) next[s.id] = s.color;
                }
                return next;
            });
        }, [sections]);

        // Optimistic overrides for task sectionId during/after cross-section DnD
        const [localTaskSectionOverrides, setLocalTaskSectionOverrides] =
            useState<Record<string, string | null>>({});

        // Clear overrides when the tasks prop is refreshed with updated data
        useLayoutEffect(() => {
            if (Object.keys(localTaskSectionOverrides).length === 0) return;
            setLocalTaskSectionOverrides((prev) => {
                const next = { ...prev };
                let changed = false;
                for (const taskId of Object.keys(next)) {
                    const task = tasks.find((t) => t.id === taskId);
                    if (!task) {
                        delete next[taskId];
                        changed = true;
                        continue;
                    }
                    const overrideVal = next[taskId];
                    const actualVal = task.sectionId ?? null;
                    if (overrideVal === actualVal) {
                        delete next[taskId];
                        changed = true;
                    }
                }
                return changed ? next : prev;
            });
        }, [tasks]);

        const getEffectiveSectionId = (task: Task): string | null => {
            if (task.id in localTaskSectionOverrides) {
                return localTaskSectionOverrides[task.id];
            }
            return task.sectionId ?? null;
        };
        // Per-section inline task creation
        const [creatingSectionTask, setCreatingSectionTask] = useState<
            string | null
        >(null);
        const [newSectionTaskName, setNewSectionTaskName] = useState('');
        const [newTaskName, setNewTaskName] = useState('');

        const toggleSection = (sectionId: string) => {
            setCollapsedSections((prev) => ({
                ...prev,
                [sectionId]: !prev[sectionId],
            }));
        };

        const startRenamingSection = (section: Section) => {
            setEditingSectionId(section.id);
            setEditingSectionName(section.name);
        };

        const commitRenameSection = async () => {
            if (!editingSectionId || !onRenameSection) return;
            const name = editingSectionName.trim() || 'Untitled section';
            onRenameSection(editingSectionId, name);
            setEditingSectionId(null);
            setEditingSectionName('');
        };

        const commitRenameTask = async (task: Task) => {
            const name = editingTaskName.trim();
            setEditingTaskId(null);
            setEditingTaskName('');
            const previousName = task.name;
            if (!name || name === previousName) return;

            // Apply optimistic update immediately so UI reflects the change at once
            setOptimisticTaskNames((prev) => ({ ...prev, [task.id]: name }));

            try {
                const token = await getToken();
                if (!token) {
                    setOptimisticTaskNames((prev) => {
                        const next = { ...prev };
                        delete next[task.id];
                        return next;
                    });
                    return;
                }
                await taskApi.updateTask(token, projectId, task.id, { name });
                onTaskCreated(); // triggers parent refresh; optimistic entry cleared below
            } catch {
                toast.error('Failed to rename task');
                // Revert optimistic update on error
                setOptimisticTaskNames((prev) => {
                    const next = { ...prev };
                    delete next[task.id];
                    return next;
                });
            }
        };

        const makeOptimisticTask = (
            name: string,
            sectionId?: string,
        ): Task => ({
            id: `optimistic-${Date.now()}-${Math.random()}`,
            name,
            projectId,
            sectionId,
            order: 0,
            approvalStatus: 'IN_PREPARATION',
            currentStepIndex: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            project: { id: projectId },
            approvalChain: [],
            linkedFiles: [],
            customFieldValues: [],
        });

        const handleCreateSectionTask = async (
            sectionId: string,
            name: string,
        ) => {
            const trimmed = name.trim();
            setCreatingSectionTask(null);
            setNewSectionTaskName('');
            if (!trimmed) return;

            const optimistic = makeOptimisticTask(trimmed, sectionId);
            setOptimisticTasks((prev) => [...prev, optimistic]);
            setTaskOrder((prev) => [...prev, optimistic.id]);

            try {
                const token = await getToken();
                if (!token) {
                    setOptimisticTasks((prev) =>
                        prev.filter((t) => t.id !== optimistic.id),
                    );
                    setTaskOrder((prev) =>
                        prev.filter((id) => id !== optimistic.id),
                    );
                    toast.error('Authentication required');
                    return;
                }
                const response = await taskApi.createTask(token, projectId, {
                    name: trimmed,
                    customFields: {},
                    sectionId,
                });
                setOptimisticTasks((prev) =>
                    prev.filter((t) => t.id !== optimistic.id),
                );
                setTaskOrder((prev) =>
                    prev.filter((id) => id !== optimistic.id),
                );
                if (response.data) {
                    onTaskAdded(response.data);
                } else {
                    onTaskCreated();
                }
            } catch (error) {
                setOptimisticTasks((prev) =>
                    prev.filter((t) => t.id !== optimistic.id),
                );
                setTaskOrder((prev) =>
                    prev.filter((id) => id !== optimistic.id),
                );
                console.error('Failed to create task:', error);
                toast.error('Failed to create task');
            }
        };

        const handleCreateTask = async (name: string) => {
            const trimmed = name.trim();
            setIsCreatingTask(false);
            setNewTaskName('');
            if (!trimmed) return;

            const optimistic = makeOptimisticTask(trimmed);
            setOptimisticTasks((prev) => [...prev, optimistic]);
            setTaskOrder((prev) => [...prev, optimistic.id]);

            try {
                const token = await getToken();
                if (!token) {
                    setOptimisticTasks((prev) =>
                        prev.filter((t) => t.id !== optimistic.id),
                    );
                    setTaskOrder((prev) =>
                        prev.filter((id) => id !== optimistic.id),
                    );
                    toast.error('Authentication required');
                    return;
                }
                const response = await taskApi.createTask(token, projectId, {
                    name: trimmed,
                    customFields: {},
                });
                setOptimisticTasks((prev) =>
                    prev.filter((t) => t.id !== optimistic.id),
                );
                setTaskOrder((prev) =>
                    prev.filter((id) => id !== optimistic.id),
                );
                if (response.data) {
                    onTaskAdded(response.data);
                } else {
                    onTaskCreated();
                }
            } catch (error) {
                setOptimisticTasks((prev) =>
                    prev.filter((t) => t.id !== optimistic.id),
                );
                setTaskOrder((prev) =>
                    prev.filter((id) => id !== optimistic.id),
                );
                console.error('Failed to create task:', error);
                toast.error('Failed to create task');
            }
        };

        // Bulk selection state
        const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
            new Set(),
        );
        const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);

        const toggleTaskSelection = (taskId: string, selected: boolean) => {
            setSelectedTaskIds((prev) => {
                const next = new Set(prev);
                if (selected) next.add(taskId);
                else next.delete(taskId);
                return next;
            });
        };

        const toggleAllTasks = (selected: boolean) => {
            if (selected) {
                setSelectedTaskIds(new Set(tasks.map((t) => t.id)));
            } else {
                setSelectedTaskIds(new Set());
            }
        };

        const handleBulkDelete = () => {
            if (selectedTaskIds.size === 0) return;
            setBulkDeleteDialogOpen(true);
        };

        const confirmBulkDelete = async () => {
            const idsToDelete = Array.from(selectedTaskIds);
            setBulkDeleteDialogOpen(false);
            setSelectedTaskIds(new Set());
            onTasksRemoved?.(idsToDelete);
            try {
                const token = await getToken();
                if (!token) {
                    onTaskCreated();
                    return;
                }
                await Promise.all(
                    idsToDelete.map((id) =>
                        taskApi.deleteTask(token, projectId, id),
                    ),
                );
                toast.success(
                    `Deleted ${idsToDelete.length} task${idsToDelete.length !== 1 ? 's' : ''}`,
                );
            } catch (error) {
                console.error('Failed to bulk delete:', error);
                onTaskCreated();
                toast.error('Failed to delete some tasks');
            }
        };

        // Bulk move to section
        const [bulkMoveSectionOpen, setBulkMoveSectionOpen] = useState(false);

        const handleBulkMoveSection = async (sectionId: string | null) => {
            const ids = Array.from(selectedTaskIds);
            setBulkMoveSectionOpen(false);
            setSelectedTaskIds(new Set());
            try {
                const token = await getToken();
                if (!token) return;
                const results = await Promise.allSettled(
                    ids.map((id) =>
                        taskApi.updateTask(token, projectId, id, { sectionId }),
                    ),
                );
                const failed = results.filter(
                    (r) => r.status === 'rejected',
                ).length;
                if (failed > 0) {
                    toast.warning(
                        `${ids.length - failed} of ${ids.length} tasks moved`,
                    );
                } else {
                    toast.success(
                        `Moved ${ids.length} task${ids.length !== 1 ? 's' : ''}`,
                    );
                }
                onTaskCreated();
            } catch {
                toast.error('Failed to move tasks');
            }
        };

        // Bulk set field value
        const [bulkFieldOpen, setBulkFieldOpen] = useState(false);
        const [bulkFieldId, setBulkFieldId] = useState<string | null>(null);
        const [bulkFieldValue, setBulkFieldValue] = useState('');

        const handleBulkSetField = async () => {
            if (!bulkFieldId || !bulkFieldValue) return;
            const ids = Array.from(selectedTaskIds);
            setBulkFieldOpen(false);
            setBulkFieldId(null);
            setBulkFieldValue('');
            setSelectedTaskIds(new Set());
            try {
                const token = await getToken();
                if (!token) return;
                const results = await Promise.allSettled(
                    ids.map((id) =>
                        taskApi.updateTask(token, projectId, id, {
                            customFields: { [bulkFieldId]: bulkFieldValue },
                        }),
                    ),
                );
                const failed = results.filter(
                    (r) => r.status === 'rejected',
                ).length;
                if (failed > 0) {
                    toast.warning(
                        `${ids.length - failed} of ${ids.length} tasks updated`,
                    );
                } else {
                    toast.success(
                        `Updated ${ids.length} task${ids.length !== 1 ? 's' : ''}`,
                    );
                }
                onTaskCreated();
            } catch {
                toast.error('Failed to update tasks');
            }
        };

        // Expose method to start creating task from parent
        useImperativeHandle(ref, () => ({
            startCreatingTask: () => {
                setIsCreatingTask(true);
            },
        }));

        // Order fields by fieldOrder state (respects drag reorder), fallback to createdAt
        const displayedFields = useMemo(() => {
            const byId = new Map(customFields.map((f) => [f.id, f]));
            const ordered = fieldOrder
                .map((id) => byId.get(id))
                .filter((f): f is CustomField => f !== undefined);
            // Include any new fields not yet in fieldOrder
            const inOrder = new Set(fieldOrder);
            const extras = customFields
                .filter((f) => !inOrder.has(f.id))
                .sort(
                    (a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime(),
                );
            const all = [...ordered, ...extras];
            return hiddenColumns && hiddenColumns.size > 0
                ? all.filter((f) => !hiddenColumns.has(f.id))
                : all;
        }, [customFields, fieldOrder, hiddenColumns]);

        // Task action handlers for the row menu
        const handleSubmitTask = async (task: Task) => {
            const prevStatus = task.approvalStatus;
            setOptimisticApprovalStatus((prev) => ({
                ...prev,
                [task.id]: 'IN_REVIEW',
            }));
            try {
                const token = await getToken();
                if (!token) {
                    setOptimisticApprovalStatus((prev) => {
                        const next = { ...prev };
                        delete next[task.id];
                        return next;
                    });
                    return;
                }
                await approvalApi.submitTask(token, projectId, task.id);
                toast.success('Task submitted for review');
                onTaskCreated();
            } catch {
                setOptimisticApprovalStatus((prev) => ({
                    ...prev,
                    [task.id]: prevStatus,
                }));
                toast.error('Failed to submit task');
            }
        };

        const handleRejectTask = async (task: Task) => {
            const prevStatus = task.approvalStatus;
            setOptimisticApprovalStatus((prev) => ({
                ...prev,
                [task.id]: 'IN_PREPARATION',
            }));
            try {
                const token = await getToken();
                if (!token) {
                    setOptimisticApprovalStatus((prev) => {
                        const next = { ...prev };
                        delete next[task.id];
                        return next;
                    });
                    return;
                }
                await approvalApi.rejectTask(token, projectId, task.id);
                toast.success('Task rejected');
                onTaskCreated();
            } catch {
                setOptimisticApprovalStatus((prev) => ({
                    ...prev,
                    [task.id]: prevStatus,
                }));
                toast.error('Failed to reject task');
            }
        };

        const handleReopenTask = async (task: Task) => {
            const prevStatus = task.approvalStatus;
            setOptimisticApprovalStatus((prev) => ({
                ...prev,
                [task.id]: 'IN_PREPARATION',
            }));
            try {
                const token = await getToken();
                if (!token) {
                    setOptimisticApprovalStatus((prev) => {
                        const next = { ...prev };
                        delete next[task.id];
                        return next;
                    });
                    return;
                }
                await approvalApi.reopenTask(token, projectId, task.id);
                toast.success('Task reopened');
                onTaskCreated();
            } catch {
                setOptimisticApprovalStatus((prev) => ({
                    ...prev,
                    [task.id]: prevStatus,
                }));
                toast.error('Failed to reopen task');
            }
        };

        const handleShareTaskLink = (task: Task) => {
            const url = `${window.location.origin}${window.location.pathname}?task=${task.slug ?? task.id}`;
            navigator.clipboard.writeText(url).then(() => {
                toast.success('Link copied to clipboard');
            });
        };

        const handleUpdateCustomField = async (
            task: Task,
            fieldId: string,
            value: string,
        ) => {
            const optimisticKey = `${task.id}:${fieldId}`;

            // Check against current value (including any pending optimistic update)
            const currentValue =
                optimisticUpdates[optimisticKey] ??
                task.customFieldValues?.find((v) => v.customFieldId === fieldId)
                    ?.value;
            if (currentValue === value) return;

            // Apply optimistic update immediately
            setOptimisticUpdates((prev) => ({
                ...prev,
                [optimisticKey]: value,
            }));

            try {
                const token = await getToken();
                if (!token) {
                    // Revert optimistic update on auth failure
                    setOptimisticUpdates((prev) => {
                        const next = { ...prev };
                        delete next[optimisticKey];
                        return next;
                    });
                    return;
                }

                await taskApi.updateTask(token, projectId, task.id, {
                    customFields: { [fieldId]: value },
                });

                // DON'T clear the optimistic update here - let it persist until the refresh completes
                // The cleanup effect will clear it once the new data arrives

                // Refresh list to get the authoritative data from server
                onTaskCreated();
            } catch (error) {
                console.error('Failed to update field:', error);
                toast.error('Failed to update field');

                // Revert optimistic update on error
                setOptimisticUpdates((prev) => {
                    const next = { ...prev };
                    delete next[optimisticKey];
                    return next;
                });
            }
        };

        const getCustomFieldValue = (task: Task, field: CustomField) => {
            // Check for optimistic update first
            const optimisticKey = `${task.id}:${field.id}`;
            if (optimisticKey in optimisticUpdates) {
                return optimisticUpdates[optimisticKey];
            }

            // Fall back to actual task data
            const val = task.customFieldValues?.find(
                (v) => v.customFieldId === field.id,
            )?.value;
            if (!val) return null;
            return val;
        };

        const handleFieldTypeSelect = (type: DataType) => {
            setFieldType(type);
            setAllowMultiple(false);
            if (type === 'USER') {
                setShowRoleSelection(true);
                setRoleName('');
            } else {
                setShowRoleSelection(false);
                setRoleName('');
                // Auto-create if field name is already filled
                if (fieldName.trim()) {
                    handleCreateFieldWithType(type);
                }
            }
        };

        const handleCreateFieldWithType = async (typeOverride?: DataType) => {
            const type = typeOverride ?? fieldType;
            if (type === 'USER') {
                if (!roleName.trim()) {
                    toast.error('Please enter a label for the Person field');
                    return;
                }
            } else if (!fieldName.trim()) {
                return;
            }

            try {
                setIsSubmitting(true);
                const token = await getToken();
                if (!token) {
                    toast.error('Authentication required');
                    return;
                }

                const customOptions =
                    type === 'USER' && roleName.trim()
                        ? [roleName.trim()]
                        : undefined;
                const statusOptions =
                    type === 'CUSTOM'
                        ? ['ToDo', 'In Progress', 'Done']
                        : undefined;

                const createdField = await customFieldApi.createCustomField(
                    token,
                    projectId,
                    {
                        name:
                            type === 'USER'
                                ? roleName.trim()
                                : fieldName.trim(),
                        dataType: type,
                        customOptions: customOptions || statusOptions,
                        order: customFields.length,
                        multiple:
                            MULTIPLE_SUPPORTED_TYPES.includes(type) &&
                            selectedApprovalRole === 'NONE'
                                ? allowMultiple
                                : false,
                    },
                );

                // Auto-add to approval workflow at the correct fixed slot
                if (
                    type === 'USER' &&
                    selectedApprovalRole !== 'NONE' &&
                    createdField.data?.id
                ) {
                    try {
                        const slotIndex =
                            selectedApprovalRole === 'PREPARER'
                                ? 0
                                : selectedApprovalRole === 'REVIEWER_1'
                                  ? 1
                                  : 2;

                        // Fetch existing workflow
                        const existingRes = await approvalApi.getWorkflow(
                            token,
                            projectId,
                        );
                        const existing = (existingRes.data ?? []).sort(
                            (a, b) => a.order - b.order,
                        );

                        // Build the 3 fixed slots from existing workflow
                        const fixedSlots = ['', '', ''];
                        const extras: {
                            type: 'PREPARER' | 'REVIEWER';
                            customFieldId: string;
                        }[] = [];
                        existing.forEach((ws, i) => {
                            if (i < 3) {
                                fixedSlots[i] = ws.customFieldId;
                            } else {
                                extras.push({
                                    type: ws.type,
                                    customFieldId: ws.customFieldId,
                                });
                            }
                        });

                        // Place new field in the correct slot
                        fixedSlots[slotIndex] = createdField.data.id;

                        // Rebuild and save
                        const FIXED_LEVEL_TYPES: ('PREPARER' | 'REVIEWER')[] = [
                            'PREPARER',
                            'REVIEWER',
                            'REVIEWER',
                        ];
                        const stepsToSave: {
                            type: 'PREPARER' | 'REVIEWER';
                            customFieldId: string;
                            order: number;
                        }[] = [];
                        let order = 0;
                        fixedSlots.forEach((fieldId, i) => {
                            if (fieldId) {
                                stepsToSave.push({
                                    type: FIXED_LEVEL_TYPES[i],
                                    customFieldId: fieldId,
                                    order: order++,
                                });
                            }
                        });
                        extras.forEach((s) => {
                            stepsToSave.push({
                                type: s.type,
                                customFieldId: s.customFieldId,
                                order: order++,
                            });
                        });

                        await approvalApi.setWorkflow(
                            token,
                            projectId,
                            stepsToSave,
                        );
                    } catch (err) {
                        console.error(
                            'Failed to auto-add field to approval workflow',
                            err,
                        );
                        // Non-blocking: field was created, just workflow auto-add failed
                    }
                }

                toast.success('Custom field created successfully');
                setFieldName('');
                setFieldType('STRING');
                setRoleName('');
                setSelectedApprovalRole('NONE');
                setShowRoleSelection(false);
                setAllowMultiple(false);
                setIsCreatingField(false);
                onCustomFieldCreated();
            } catch (error) {
                console.error('Failed to create custom field:', error);
                toast.error('Failed to create custom field');
            } finally {
                setIsSubmitting(false);
            }
        };

        const handleCancelFieldCreation = () => {
            setFieldName('');
            setFieldType('STRING');
            setRoleName('');
            setSelectedApprovalRole('NONE');
            setShowRoleSelection(false);
            setAllowMultiple(false);
            setIsCreatingField(false);
        };

        const handleDeleteField = async () => {
            if (!fieldToDelete) return;
            const { id: fieldId, name: fieldName } = fieldToDelete;
            setFieldOrder((prev) => prev.filter((id) => id !== fieldId));
            setFieldToDelete(null);
            try {
                const token = await getToken();
                if (!token) {
                    onCustomFieldCreated();
                    return;
                }
                await customFieldApi.deleteCustomField(
                    token,
                    projectId,
                    fieldId,
                );
                toast.success(`"${fieldName}" field deleted`);
                onCustomFieldCreated();
            } catch (error) {
                console.error('Failed to delete custom field:', error);
                onCustomFieldCreated();
                toast.error('Failed to delete field');
            } finally {
                setIsDeletingField(false);
            }
        };

        const handleUpdateFieldName = async (
            fieldId: string,
            newName: string,
        ) => {
            const trimmedName = newName.trim();
            if (!trimmedName) {
                toast.error('Field name cannot be empty');
                return;
            }

            const field = customFields.find((f) => f.id === fieldId);
            if (!field || field.name === trimmedName) {
                return;
            }

            setLocalFieldNameOverrides((prev) => ({
                ...prev,
                [fieldId]: trimmedName,
            }));

            try {
                const token = await getToken();
                if (!token) {
                    setLocalFieldNameOverrides((prev) => {
                        const next = { ...prev };
                        delete next[fieldId];
                        return next;
                    });
                    return;
                }

                await customFieldApi.updateCustomField(
                    token,
                    projectId,
                    fieldId,
                    { name: trimmedName },
                );

                toast.success('Field name updated');
                onCustomFieldCreated(); // Refresh fields (will clear overrides via useLayoutEffect)
            } catch (error) {
                console.error('Failed to update field name:', error);
                setLocalFieldNameOverrides((prev) => {
                    const next = { ...prev };
                    delete next[fieldId];
                    return next;
                });
                toast.error('Failed to update field name');
            }
        };

        const parseMultiValue = (value: string | null): string[] => {
            if (!value) return [];
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [value];
            } catch {
                return value ? [value] : [];
            }
        };

        const renderCustomFieldCell = (task: Task, field: CustomField) => {
            const value = getCustomFieldValue(task, field);

            if (field.dataType === 'CUSTOM') {
                if (field.multiple) {
                    const selected = parseMultiValue(value);
                    return (
                        <MultiSelect
                            options={(field.customOptions || []).map((opt) => ({
                                value: opt,
                                label: opt,
                            }))}
                            selected={selected}
                            onChange={(vals) =>
                                handleUpdateCustomField(
                                    task,
                                    field.id,
                                    JSON.stringify(vals),
                                )
                            }
                            placeholder="-"
                            className="h-7 border-none shadow-none bg-transparent hover:bg-muted/50 text-xs"
                        />
                    );
                }
                // Status pill (single CUSTOM field)
                return (
                    <StatusPill
                        value={value as string | null}
                        options={field.customOptions || []}
                        onChange={(val) =>
                            handleUpdateCustomField(task, field.id, val)
                        }
                    />
                );
            }

            if (field.dataType === 'USER') {
                if (field.multiple) {
                    const selected = parseMultiValue(value);
                    return (
                        <MultiSelect
                            options={uniqueMembers.map((m) => ({
                                value: m.id,
                                label: m.firstName
                                    ? `${m.firstName} ${m.lastName || ''}`
                                    : m.email,
                            }))}
                            selected={selected}
                            onChange={(vals) =>
                                handleUpdateCustomField(
                                    task,
                                    field.id,
                                    JSON.stringify(vals),
                                )
                            }
                            placeholder="-"
                            className="h-7 border-none shadow-none bg-transparent hover:bg-muted/50 text-xs"
                        />
                    );
                }
                // User dropdown (single)
                const selectedMember = uniqueMembers.find(
                    (m) => m.id === value,
                );

                return (
                    <Select
                        value={value || ''}
                        onValueChange={(val) =>
                            handleUpdateCustomField(task, field.id, val)
                        }
                    >
                        <SelectTrigger className="h-7 w-full border-none shadow-none bg-transparent hover:bg-muted/50 p-0 px-2 focus:ring-0 cursor-pointer">
                            <SelectValue placeholder="-">
                                {value ? (
                                    selectedMember ? (
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <Avatar className="h-4 w-4">
                                                <AvatarFallback className="text-[10px]">
                                                    {(
                                                        selectedMember
                                                            .firstName?.[0] ||
                                                        selectedMember.email[0]
                                                    ).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="truncate text-xs">
                                                {selectedMember.firstName
                                                    ? `${selectedMember.firstName} ${selectedMember.lastName || ''}`
                                                    : selectedMember.email}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            Unknown ({value.slice(0, 8)}...)
                                        </span>
                                    )
                                ) : null}
                            </SelectValue>
                        </SelectTrigger>

                        <SelectContent>
                            {uniqueMembers.length > 0 ? (
                                uniqueMembers.map((member) => (
                                    <SelectItem
                                        key={member.id}
                                        value={member.id}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-4 w-4">
                                                <AvatarFallback className="text-[10px]">
                                                    {(
                                                        member.firstName?.[0] ||
                                                        member.email[0]
                                                    ).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span>
                                                {member.firstName
                                                    ? `${member.firstName} ${member.lastName || ''}`
                                                    : member.email}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                    No members available
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                );
            }

            if (field.dataType === 'TASK') {
                if (field.multiple) {
                    const selected = parseMultiValue(value);
                    return (
                        <MultiSelect
                            options={tasks.map((t) => ({
                                value: t.id,
                                label: t.name,
                            }))}
                            selected={selected}
                            onChange={(vals) =>
                                handleUpdateCustomField(
                                    task,
                                    field.id,
                                    JSON.stringify(vals),
                                )
                            }
                            placeholder="-"
                            className="h-7 border-none shadow-none bg-transparent hover:bg-muted/50 text-xs"
                        />
                    );
                }
                // Task dropdown (single)
                const selectedTask = tasks.find((t) => t.id === value);

                return (
                    <Select
                        value={value || ''}
                        onValueChange={(val) =>
                            handleUpdateCustomField(task, field.id, val)
                        }
                    >
                        <SelectTrigger className="h-7 w-full border-none shadow-none bg-transparent hover:bg-muted/50 p-0 px-2 focus:ring-0 cursor-pointer">
                            <SelectValue placeholder="-">
                                {value ? (
                                    selectedTask ? (
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="truncate text-xs">
                                                {selectedTask.name}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            Unknown task ({value.slice(0, 8)}
                                            ...)
                                        </span>
                                    )
                                ) : null}
                            </SelectValue>
                        </SelectTrigger>

                        <SelectContent>
                            {tasks.length > 0 ? (
                                tasks.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        <div className="flex items-center gap-2">
                                            <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="truncate max-w-50">
                                                {t.name}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                    No tasks available
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                );
            }

            if (field.dataType === 'DOCUMENT') {
                if (field.multiple) {
                    const selected = parseMultiValue(value);
                    return (
                        <MultiSelect
                            options={documents.map((d) => ({
                                value: d.id,
                                label: d.originalName || d.filename,
                            }))}
                            selected={selected}
                            onChange={(vals) =>
                                handleUpdateCustomField(
                                    task,
                                    field.id,
                                    JSON.stringify(vals),
                                )
                            }
                            placeholder="-"
                            className="h-7 border-none shadow-none bg-transparent hover:bg-muted/50 text-xs"
                        />
                    );
                }
                // Document dropdown (single)
                const selectedDoc = documents.find((d) => d.id === value);

                return (
                    <Select
                        value={value || ''}
                        onValueChange={(val) =>
                            handleUpdateCustomField(task, field.id, val)
                        }
                    >
                        <SelectTrigger className="h-7 w-full border-none shadow-none bg-transparent hover:bg-muted/50 p-0 px-2 focus:ring-0 cursor-pointer">
                            <SelectValue placeholder="-">
                                {value ? (
                                    selectedDoc ? (
                                        <div className="flex items-center gap-2 overflow-hidden">
                                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="truncate text-xs">
                                                {selectedDoc.originalName ||
                                                    selectedDoc.filename}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">
                                            Unknown document (
                                            {value.slice(0, 8)}...)
                                        </span>
                                    )
                                ) : null}
                            </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                            {documents.length > 0 ? (
                                documents.map((doc) => (
                                    <SelectItem key={doc.id} value={doc.id}>
                                        <div className="flex items-center gap-2">
                                            <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="truncate max-w-50">
                                                {doc.originalName ||
                                                    doc.filename}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                    No documents available
                                </div>
                            )}
                        </SelectContent>
                    </Select>
                );
            }

            // Date field — opens a calendar picker
            if (field.dataType === 'DATE') {
                const dateObj = value ? parseDateOnly(value) : undefined;
                const formatted = dateObj
                    ? dateObj.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                      })
                    : null;
                return (
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="h-7 w-full px-2 text-left text-sm text-muted-foreground hover:bg-muted/50 rounded transition-colors flex items-center gap-1.5 focus:outline-none">
                                {formatted ? (
                                    <>
                                        <Calendar className="h-3 w-3 shrink-0" />
                                        <span className="truncate">
                                            {formatted}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-muted-foreground/40">
                                        —
                                    </span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent
                            className="w-auto p-0"
                            align="start"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <CalendarComponent
                                mode="single"
                                selected={dateObj}
                                onSelect={(date) => {
                                    if (date instanceof Date) {
                                        handleUpdateCustomField(
                                            task,
                                            field.id,
                                            formatDateOnly(date),
                                        );
                                    }
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                );
            }

            // Text/Number/String fallback
            return (
                <EditableContent
                    value={value || ''}
                    onSave={(val) =>
                        handleUpdateCustomField(task, field.id, val)
                    }
                    placeholder="-"
                    textStyle="text-sm text-muted-foreground truncate"
                />
            );
        };

        return (
            <div className="w-full h-full overflow-hidden flex flex-col min-w-0">
                {/* Bulk Delete Confirmation Dialog */}
                <AlertDialog
                    open={bulkDeleteDialogOpen}
                    onOpenChange={setBulkDeleteDialogOpen}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Delete {selectedTaskIds.size} task
                                {selectedTaskIds.size !== 1 ? 's' : ''}?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete{' '}
                                {selectedTaskIds.size} selected task
                                {selectedTaskIds.size !== 1 ? 's' : ''}. This
                                action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmBulkDelete}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {`Delete ${selectedTaskIds.size} task${selectedTaskIds.size !== 1 ? 's' : ''}`}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Delete Field Confirmation Dialog */}
                <AlertDialog
                    open={!!fieldToDelete}
                    onOpenChange={(open) => {
                        if (!open) setFieldToDelete(null);
                    }}
                >
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>
                                Delete &quot;{fieldToDelete?.name}&quot; field?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the field and all
                                its values across every task. This action cannot
                                be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel disabled={isDeletingField}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={handleDeleteField}
                                disabled={isDeletingField}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isDeletingField
                                    ? 'Deleting...'
                                    : 'Delete field'}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Save as Template Dialog */}
                <Dialog
                    open={!!templateTask}
                    onOpenChange={(open) => {
                        if (!open) {
                            setTemplateTask(null);
                            setTemplateName('');
                        }
                    }}
                >
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>Save as Template</DialogTitle>
                        </DialogHeader>
                        <div className="py-3 space-y-3">
                            <p className="text-sm text-muted-foreground">
                                {(templateTask?.customFieldValues?.length ??
                                    0) > 0
                                    ? `Saves ${templateTask?.customFieldValues?.filter((cfv) => cfv.value?.trim()).length ?? 0} custom field value(s) from "${templateTask?.name}".`
                                    : `"${templateTask?.name}" has no custom field values — the template will be saved empty.`}
                            </p>
                            <input
                                type="text"
                                value={templateName}
                                onChange={(e) =>
                                    setTemplateName(e.target.value)
                                }
                                placeholder="Template name..."
                                className="w-full px-3 py-2 text-sm border border-border rounded-md bg-background outline-none focus:ring-1 focus:ring-ring"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (
                                        e.key === 'Enter' &&
                                        templateName.trim()
                                    ) {
                                        saveTemplateFromTask(
                                            templateName.trim(),
                                            undefined,
                                            templateTask?.customFieldValues ??
                                                [],
                                        );
                                        toast.success(
                                            `Template "${templateName.trim()}" saved`,
                                        );
                                        setTemplateTask(null);
                                        setTemplateName('');
                                    }
                                }}
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                variant="ghost"
                                onClick={() => {
                                    setTemplateTask(null);
                                    setTemplateName('');
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                disabled={!templateName.trim()}
                                onClick={() => {
                                    if (!templateName.trim()) return;
                                    saveTemplateFromTask(
                                        templateName.trim(),
                                        undefined,
                                        templateTask?.customFieldValues ?? [],
                                    );
                                    toast.success(
                                        `Template "${templateName.trim()}" saved`,
                                    );
                                    setTemplateTask(null);
                                    setTemplateName('');
                                }}
                            >
                                Save Template
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <div
                    ref={scrollContainerRef}
                    className="flex-1 overflow-auto relative scroll-smooth"
                >
                    <div className="min-w-max h-full">
                        {/* Table Header - Sticky Top */}
                        <div className="sticky top-0 z-30 flex border-b border-dashboard-border bg-[#f8f9fb]">
                            {/* Bulk Action Bar Overlay */}
                            {selectedTaskIds.size > 0 && (
                                <div className="absolute inset-0 z-50 bg-accent-subtle backdrop-blur-sm flex items-center justify-between px-4 border-b border-dashboard-border">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            checked={true}
                                            onCheckedChange={() =>
                                                toggleAllTasks(false)
                                            }
                                            aria-label="Deselect all"
                                        />
                                        <span className="text-[12px] font-medium text-dashboard-text-primary">
                                            {selectedTaskIds.size} selected
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Move to Section */}
                                        {sections.length > 0 && (
                                            <DropdownMenu
                                                open={bulkMoveSectionOpen}
                                                onOpenChange={
                                                    setBulkMoveSectionOpen
                                                }
                                            >
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-[12px] gap-1.5 cursor-pointer"
                                                    >
                                                        <Layers className="h-3.5 w-3.5" />
                                                        Move to
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-48"
                                                >
                                                    <DropdownMenuLabel>
                                                        Move to Section
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            handleBulkMoveSection(
                                                                null,
                                                            )
                                                        }
                                                    >
                                                        No Section
                                                    </DropdownMenuItem>
                                                    {sections.map((s) => (
                                                        <DropdownMenuItem
                                                            key={s.id}
                                                            onClick={() =>
                                                                handleBulkMoveSection(
                                                                    s.id,
                                                                )
                                                            }
                                                        >
                                                            {s.name}
                                                        </DropdownMenuItem>
                                                    ))}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}

                                        {/* Set Field Value */}
                                        {displayedFields.length > 0 && (
                                            <Dialog
                                                open={bulkFieldOpen}
                                                onOpenChange={(open) => {
                                                    setBulkFieldOpen(open);
                                                    if (!open) {
                                                        setBulkFieldId(null);
                                                        setBulkFieldValue('');
                                                    }
                                                }}
                                            >
                                                <DialogTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-7 text-[12px] gap-1.5 cursor-pointer"
                                                        onClick={() =>
                                                            setBulkFieldOpen(
                                                                true,
                                                            )
                                                        }
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Set field
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-sm">
                                                    <DialogHeader>
                                                        <DialogTitle>
                                                            Set field for{' '}
                                                            {
                                                                selectedTaskIds.size
                                                            }{' '}
                                                            task
                                                            {selectedTaskIds.size !==
                                                            1
                                                                ? 's'
                                                                : ''}
                                                        </DialogTitle>
                                                    </DialogHeader>
                                                    <div className="flex flex-col gap-3 py-2">
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="text-sm font-medium">
                                                                Field
                                                            </label>
                                                            <select
                                                                className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                                                                value={
                                                                    bulkFieldId ??
                                                                    ''
                                                                }
                                                                onChange={(
                                                                    e,
                                                                ) => {
                                                                    setBulkFieldId(
                                                                        e.target
                                                                            .value ||
                                                                            null,
                                                                    );
                                                                    setBulkFieldValue(
                                                                        '',
                                                                    );
                                                                }}
                                                            >
                                                                <option value="">
                                                                    Select a
                                                                    field…
                                                                </option>
                                                                {displayedFields
                                                                    .filter(
                                                                        (f) =>
                                                                            f.dataType ===
                                                                                'STRING' ||
                                                                            f.dataType ===
                                                                                'NUMBER' ||
                                                                            f.dataType ===
                                                                                'CUSTOM',
                                                                    )
                                                                    .map(
                                                                        (f) => (
                                                                            <option
                                                                                key={
                                                                                    f.id
                                                                                }
                                                                                value={
                                                                                    f.id
                                                                                }
                                                                            >
                                                                                {
                                                                                    f.name
                                                                                }
                                                                            </option>
                                                                        ),
                                                                    )}
                                                            </select>
                                                        </div>
                                                        {bulkFieldId &&
                                                            (() => {
                                                                const field =
                                                                    displayedFields.find(
                                                                        (f) =>
                                                                            f.id ===
                                                                            bulkFieldId,
                                                                    );
                                                                if (!field)
                                                                    return null;
                                                                if (
                                                                    field.dataType ===
                                                                        'CUSTOM' &&
                                                                    (
                                                                        field.customOptions ||
                                                                        []
                                                                    ).length > 0
                                                                ) {
                                                                    return (
                                                                        <div className="flex flex-col gap-1.5">
                                                                            <label className="text-sm font-medium">
                                                                                Value
                                                                            </label>
                                                                            <select
                                                                                className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                                                                                value={
                                                                                    bulkFieldValue
                                                                                }
                                                                                onChange={(
                                                                                    e,
                                                                                ) =>
                                                                                    setBulkFieldValue(
                                                                                        e
                                                                                            .target
                                                                                            .value,
                                                                                    )
                                                                                }
                                                                            >
                                                                                <option value="">
                                                                                    Select…
                                                                                </option>
                                                                                {(
                                                                                    field.customOptions ||
                                                                                    []
                                                                                ).map(
                                                                                    (
                                                                                        opt,
                                                                                    ) => (
                                                                                        <option
                                                                                            key={
                                                                                                opt
                                                                                            }
                                                                                            value={
                                                                                                opt
                                                                                            }
                                                                                        >
                                                                                            {
                                                                                                opt
                                                                                            }
                                                                                        </option>
                                                                                    ),
                                                                                )}
                                                                            </select>
                                                                        </div>
                                                                    );
                                                                }
                                                                return (
                                                                    <div className="flex flex-col gap-1.5">
                                                                        <label className="text-sm font-medium">
                                                                            Value
                                                                        </label>
                                                                        <input
                                                                            type={
                                                                                field.dataType ===
                                                                                'NUMBER'
                                                                                    ? 'number'
                                                                                    : 'text'
                                                                            }
                                                                            className="border border-input rounded-md px-3 py-2 text-sm bg-background"
                                                                            value={
                                                                                bulkFieldValue
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                setBulkFieldValue(
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                            placeholder="Enter value…"
                                                                        />
                                                                    </div>
                                                                );
                                                            })()}
                                                    </div>
                                                    <DialogFooter>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() =>
                                                                setBulkFieldOpen(
                                                                    false,
                                                                )
                                                            }
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            onClick={
                                                                handleBulkSetField
                                                            }
                                                            disabled={
                                                                !bulkFieldId ||
                                                                !bulkFieldValue
                                                            }
                                                        >
                                                            Apply to{' '}
                                                            {
                                                                selectedTaskIds.size
                                                            }{' '}
                                                            task
                                                            {selectedTaskIds.size !==
                                                            1
                                                                ? 's'
                                                                : ''}
                                                        </Button>
                                                    </DialogFooter>
                                                </DialogContent>
                                            </Dialog>
                                        )}

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleBulkDelete}
                                            className="h-7 text-[12px] text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5 cursor-pointer"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Delete
                                        </Button>
                                        <div className="h-4 w-px bg-dashboard-border mx-1" />
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                setSelectedTaskIds(new Set())
                                            }
                                            className="h-7 w-7 text-dashboard-text-muted cursor-pointer"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                            {/* Task Name Column Header - Sticky Left & Top */}
                            <div
                                className="sticky left-0 z-40 shrink-0 px-3 py-1.5 border-r border-dashboard-border bg-[#f8f9fb] flex items-center justify-between shadow-[1px_0_0_0_theme(colors.dashboard-border)] group relative"
                                style={{ width: nameColWidth }}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="flex items-center"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Checkbox
                                            checked={
                                                tasks.length > 0 &&
                                                selectedTaskIds.size ===
                                                    tasks.length
                                            }
                                            onCheckedChange={(checked) =>
                                                toggleAllTasks(!!checked)
                                            }
                                            aria-label="Select all"
                                            className="translate-y-[1px]"
                                        />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-dashboard-text-muted uppercase">
                                        <Type className="h-3.5 w-3.5 text-dashboard-text-muted" />
                                        Task name
                                    </div>
                                </div>
                                <ColumnResizeHandle
                                    fieldId="__name__"
                                    currentWidth={nameColWidth}
                                    onResize={(_, w) => setNameColWidth(w)}
                                    onResizeEnd={(_, w) =>
                                        setNameColWidth(
                                            Math.max(150, Math.min(600, w)),
                                        )
                                    }
                                />
                            </div>

                            {/* System Status Column Header */}
                            <div
                                className="shrink-0 px-3 py-1.5 border-r border-dashboard-border bg-[#f8f9fb] flex items-center gap-1.5"
                                style={{ width: STATUS_COL_WIDTH }}
                            >
                                <Activity className="h-3.5 w-3.5 text-dashboard-text-muted" />
                                <span className="text-[11px] font-medium tracking-wide text-dashboard-text-muted uppercase">
                                    Status
                                </span>
                            </div>

                            {/* Custom Field Columns Headers */}
                            <DndContext
                                sensors={dndSensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleColumnDragEnd}
                            >
                                <SortableContext
                                    items={fieldOrder}
                                    strategy={horizontalListSortingStrategy}
                                >
                                    {displayedFields.map((field) => {
                                        // Get the appropriate icon for this field type
                                        const getFieldIcon = () => {
                                            switch (field.dataType) {
                                                case 'DATE':
                                                    return Calendar;
                                                case 'NUMBER':
                                                    return Hash;
                                                case 'USER':
                                                    return UserIcon;
                                                case 'TASK':
                                                    return CheckSquare;
                                                case 'DOCUMENT':
                                                    return FileText;
                                                case 'STRING':
                                                    return Type;
                                                case 'CUSTOM':
                                                    return CheckCircle2;
                                                default:
                                                    return Type;
                                            }
                                        };

                                        return (
                                            <SortableColumn
                                                key={field.id}
                                                id={field.id}
                                                className="shrink-0"
                                                style={{
                                                    width:
                                                        columnWidths[
                                                            field.id
                                                        ] ?? 150,
                                                }}
                                            >
                                                {(dragHandleProps) => (
                                                    <div className="px-2 py-1.5 border-r border-dashboard-border flex items-center gap-1.5 bg-[#f8f9fb] group relative h-full">
                                                        {/* Column drag handle */}
                                                        <div
                                                            {...dragHandleProps}
                                                            className="opacity-0 group-hover:opacity-40 hover:!opacity-100 cursor-grab shrink-0 touch-none"
                                                            onClick={(e) =>
                                                                e.stopPropagation()
                                                            }
                                                        >
                                                            <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0 flex-1 overflow-visible">
                                                            <div className="min-w-0 overflow-visible">
                                                                <EditableHeader
                                                                    initialValue={
                                                                        localFieldNameOverrides[
                                                                            field
                                                                                .id
                                                                        ] ??
                                                                        field.name
                                                                    }
                                                                    icon={getFieldIcon()}
                                                                    onSave={(
                                                                        newName,
                                                                    ) =>
                                                                        handleUpdateFieldName(
                                                                            field.id,
                                                                            newName,
                                                                        )
                                                                    }
                                                                    placeholder="Field name..."
                                                                />
                                                            </div>
                                                            {field.dataType ===
                                                                'USER' &&
                                                            field
                                                                .customOptions?.[0] ? (
                                                                <span className="text-[10px] text-muted-foreground/70 pl-5 truncate font-normal mt-0.5">
                                                                    {
                                                                        field
                                                                            .customOptions[0]
                                                                    }
                                                                </span>
                                                            ) : null}
                                                        </div>

                                                        {/* Column actions dropdown */}
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity hover:bg-dashboard-bg rounded"
                                                                    onClick={(
                                                                        e,
                                                                    ) =>
                                                                        e.stopPropagation()
                                                                    }
                                                                >
                                                                    <MoreVertical className="h-3 w-3" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent
                                                                align="end"
                                                                className="w-40"
                                                            >
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                                    onSelect={() =>
                                                                        setFieldToDelete(
                                                                            field,
                                                                        )
                                                                    }
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                                    Delete field
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                        <ColumnResizeHandle
                                                            fieldId={field.id}
                                                            currentWidth={
                                                                columnWidths[
                                                                    field.id
                                                                ] ?? 150
                                                            }
                                                            onResize={
                                                                handleColumnResize
                                                            }
                                                            onResizeEnd={
                                                                handleColumnResizeEnd
                                                            }
                                                        />
                                                    </div>
                                                )}
                                            </SortableColumn>
                                        );
                                    })}
                                </SortableContext>
                            </DndContext>

                            {/* Add Column Button */}
                            <div className="w-[150px] shrink-0 px-2 py-1.5 bg-[#f8f9fb] border-r border-dashboard-border">
                                <Popover
                                    open={isCreatingField}
                                    onOpenChange={setIsCreatingField}
                                >
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start text-dashboard-text-muted hover:text-dashboard-text-primary"
                                        >
                                            <Plus className="h-4 w-4 mr-2" />
                                            New field
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent
                                        className="w-auto p-3"
                                        align="start"
                                        sideOffset={5}
                                        collisionPadding={20}
                                        onOpenAutoFocus={(e) =>
                                            e.preventDefault()
                                        }
                                    >
                                        {!showRoleSelection ? (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={fieldName}
                                                    onChange={(e) =>
                                                        setFieldName(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Type property name..."
                                                    className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:border-ring"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (
                                                            e.key === 'Enter' &&
                                                            fieldName.trim()
                                                        ) {
                                                            handleCreateFieldWithType(
                                                                fieldType,
                                                            );
                                                        }
                                                        if (
                                                            e.key === 'Escape'
                                                        ) {
                                                            handleCancelFieldCreation();
                                                        }
                                                    }}
                                                />
                                                <div className="flex gap-1">
                                                    {FIELD_TYPES.map((type) => {
                                                        const Icon = type.icon;
                                                        return (
                                                            <button
                                                                key={type.value}
                                                                onClick={() =>
                                                                    handleFieldTypeSelect(
                                                                        type.value,
                                                                    )
                                                                }
                                                                className={cn(
                                                                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm hover:bg-muted transition-colors cursor-pointer whitespace-nowrap',
                                                                    fieldType ===
                                                                        type.value &&
                                                                        'bg-muted',
                                                                )}
                                                            >
                                                                <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                                                {type.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-3 w-56">
                                                <div>
                                                    <Label
                                                        htmlFor="role-name"
                                                        className="text-xs"
                                                    >
                                                        Display label
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground mt-0.5 mb-1.5">
                                                        e.g.
                                                        &quot;Preparer&quot;,
                                                        &quot;Reviewer&quot;,
                                                        &quot;Manager&quot;
                                                    </p>
                                                    <input
                                                        id="role-name"
                                                        type="text"
                                                        value={roleName}
                                                        onChange={(e) =>
                                                            setRoleName(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Label..."
                                                        className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background outline-none focus:ring-0 focus:border-ring"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                    'Enter' &&
                                                                roleName.trim()
                                                            ) {
                                                                handleCreateFieldWithType(
                                                                    'USER',
                                                                );
                                                            }
                                                            if (
                                                                e.key ===
                                                                'Escape'
                                                            ) {
                                                                handleCancelFieldCreation();
                                                            }
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <Label className="text-xs">
                                                        Select role
                                                    </Label>
                                                    <div className="flex flex-col gap-1.5 mt-1.5">
                                                        {(
                                                            [
                                                                {
                                                                    value: 'PREPARER',
                                                                    label: 'Preparer',
                                                                },
                                                                {
                                                                    value: 'REVIEWER_1',
                                                                    label: '1st-level Reviewer',
                                                                },
                                                                {
                                                                    value: 'REVIEWER_2',
                                                                    label: '2nd-level Reviewer',
                                                                },
                                                            ] as const
                                                        ).map((opt) => (
                                                            <button
                                                                key={opt.value}
                                                                type="button"
                                                                onClick={() =>
                                                                    setSelectedApprovalRole(
                                                                        opt.value,
                                                                    )
                                                                }
                                                                className={`px-2.5 py-1.5 text-xs text-left rounded-md border transition-colors cursor-pointer ${
                                                                    selectedApprovalRole ===
                                                                    opt.value
                                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                                        : 'bg-background text-muted-foreground border-border hover:border-ring'
                                                                }`}
                                                            >
                                                                {opt.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 pt-1">
                                                    <Button
                                                        size="sm"
                                                        onClick={() =>
                                                            handleCreateFieldWithType(
                                                                'USER',
                                                            )
                                                        }
                                                        disabled={
                                                            !roleName.trim() ||
                                                            isSubmitting
                                                        }
                                                        className="flex-1"
                                                    >
                                                        {isSubmitting
                                                            ? 'Creating...'
                                                            : 'Create'}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={
                                                            handleCancelFieldCreation
                                                        }
                                                        disabled={isSubmitting}
                                                    >
                                                        Back
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </PopoverContent>
                                </Popover>
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="min-w-max pb-20">
                            {groupByField
                                ? // Render Grouped Tasks
                                  (() => {
                                      // Group tasks
                                      const groups: Record<string, Task[]> = {};
                                      allTasks.forEach((task) => {
                                          let key = 'Unassigned';
                                          if (groupByField === 'status') {
                                              key =
                                                  task.approvalStatus ||
                                                  'Unassigned';
                                          } else {
                                              const field = customFields.find(
                                                  (f) => f.id === groupByField,
                                              );
                                              if (field) {
                                                  const val =
                                                      task.customFieldValues?.find(
                                                          (v) =>
                                                              v.customFieldId ===
                                                              groupByField,
                                                      )?.value;

                                                  if (
                                                      field.dataType === 'USER'
                                                  ) {
                                                      const u =
                                                          uniqueMembers.find(
                                                              (m) =>
                                                                  m.id === val,
                                                          );
                                                      key = u
                                                          ? u.firstName
                                                              ? `${u.firstName} ${u.lastName || ''}`
                                                              : u.email
                                                          : 'Unassigned';
                                                  } else {
                                                      key = val || 'Empty';
                                                  }
                                              }
                                          }
                                          if (!groups[key]) groups[key] = [];
                                          groups[key].push(task);
                                      });

                                      return Object.entries(groups).map(
                                          ([groupName, groupTasks]) => {
                                              const isCollapsed =
                                                  collapsedGroups[groupName];

                                              return (
                                                  <div key={groupName}>
                                                      {/* Group Header */}
                                                      <div
                                                          className="border-y border-dashboard-border bg-[#f0f2f5]"
                                                          style={{
                                                              minWidth: '100%',
                                                          }}
                                                      >
                                                          <div className="sticky left-0 flex items-center gap-2 px-4 py-2 w-max bg-[#f0f2f5] font-medium text-sm text-dashboard-text-body">
                                                              <button
                                                                  onClick={() =>
                                                                      toggleGroup(
                                                                          groupName,
                                                                      )
                                                                  }
                                                                  className="p-0.5 hover:bg-muted rounded cursor-pointer"
                                                              >
                                                                  {isCollapsed ? (
                                                                      <ChevronRight className="h-4 w-4" />
                                                                  ) : (
                                                                      <ChevronDown className="h-4 w-4" />
                                                                  )}
                                                              </button>
                                                              <span className="truncate">
                                                                  {groupName}
                                                              </span>
                                                              <span className="text-muted-foreground text-xs ml-1 bg-muted px-1.5 py-0.5 rounded-full">
                                                                  {
                                                                      groupTasks.length
                                                                  }
                                                              </span>
                                                          </div>
                                                      </div>

                                                      {/* Tasks in Group */}
                                                      {!isCollapsed &&
                                                          groupTasks.map(
                                                              (task) => (
                                                                  <div
                                                                      key={
                                                                          task.id
                                                                      }
                                                                      className="flex border-b border-dashboard-border hover:bg-accent-hover transition-colors group min-w-max relative"
                                                                  >
                                                                      {/* Same Task Row Content as below, duplicate logic or extract component? 
                                                        For minimal edits, I will inline or use the existing mapping if possible but structure text differs. 
                                                        Let's just duplicate the row markup for now to access closures.
                                                    */}
                                                                      <div
                                                                          className="sticky left-0 z-20 shrink-0 px-3 py-1 border-r border-dashboard-border bg-dashboard-surface group-hover:bg-accent-row-hover transition-colors shadow-[1px_0_0_0_var(--dashboard-border)] flex items-center gap-3"
                                                                          style={{
                                                                              width: nameColWidth,
                                                                          }}
                                                                      >
                                                                          <div
                                                                              onClick={(
                                                                                  e,
                                                                              ) =>
                                                                                  e.stopPropagation()
                                                                              }
                                                                              className="flex items-center shrink-0"
                                                                          >
                                                                              <Checkbox
                                                                                  checked={selectedTaskIds.has(
                                                                                      task.id,
                                                                                  )}
                                                                                  onCheckedChange={(
                                                                                      checked,
                                                                                  ) =>
                                                                                      toggleTaskSelection(
                                                                                          task.id,
                                                                                          !!checked,
                                                                                      )
                                                                                  }
                                                                              />
                                                                          </div>
                                                                          {editingTaskId ===
                                                                          task.id ? (
                                                                              <input
                                                                                  className="flex-1 min-w-0 text-sm font-medium text-dashboard-text-primary bg-transparent border-none outline-none focus:outline-none rounded px-1 -mx-1"
                                                                                  value={
                                                                                      editingTaskName
                                                                                  }
                                                                                  onChange={(
                                                                                      e,
                                                                                  ) =>
                                                                                      setEditingTaskName(
                                                                                          e
                                                                                              .target
                                                                                              .value,
                                                                                      )
                                                                                  }
                                                                                  onBlur={() =>
                                                                                      commitRenameTask(
                                                                                          task,
                                                                                      )
                                                                                  }
                                                                                  onKeyDown={(
                                                                                      e,
                                                                                  ) => {
                                                                                      if (
                                                                                          e.key ===
                                                                                          'Enter'
                                                                                      )
                                                                                          commitRenameTask(
                                                                                              task,
                                                                                          );
                                                                                      if (
                                                                                          e.key ===
                                                                                          'Escape'
                                                                                      ) {
                                                                                          setEditingTaskId(
                                                                                              null,
                                                                                          );
                                                                                          setEditingTaskName(
                                                                                              '',
                                                                                          );
                                                                                      }
                                                                                  }}
                                                                                  onClick={(
                                                                                      e,
                                                                                  ) =>
                                                                                      e.stopPropagation()
                                                                                  }
                                                                                  autoFocus
                                                                              />
                                                                          ) : (
                                                                              <button
                                                                                  className="flex-1 min-w-0 text-left cursor-text group/name"
                                                                                  onClick={(
                                                                                      e,
                                                                                  ) => {
                                                                                      e.stopPropagation();
                                                                                      if (
                                                                                          !readOnly
                                                                                      ) {
                                                                                          setEditingTaskId(
                                                                                              task.id,
                                                                                          );
                                                                                          setEditingTaskName(
                                                                                              task.name ||
                                                                                                  '',
                                                                                          );
                                                                                      }
                                                                                  }}
                                                                              >
                                                                                  <span className="text-sm font-medium text-dashboard-text-primary truncate flex items-center gap-1.5 hover:text-accent-blue transition-colors">
                                                                                      {formatTaskId(
                                                                                          task.taskNumber,
                                                                                      ) && (
                                                                                          <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                                                                                              {formatTaskId(
                                                                                                  task.taskNumber,
                                                                                              )}
                                                                                          </span>
                                                                                      )}
                                                                                      <span className="truncate">
                                                                                          {(optimisticTaskNames[
                                                                                              task
                                                                                                  .id
                                                                                          ] ??
                                                                                              task.name) || (
                                                                                              <span className="text-muted-foreground/50 italic font-normal">
                                                                                                  Untitled
                                                                                              </span>
                                                                                          )}
                                                                                      </span>
                                                                                  </span>
                                                                              </button>
                                                                          )}
                                                                          <button
                                                                              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0 ml-1 text-dashboard-text-muted hover:text-accent-blue cursor-pointer"
                                                                              onClick={(
                                                                                  e,
                                                                              ) => {
                                                                                  e.stopPropagation();
                                                                                  onTaskClick(
                                                                                      task,
                                                                                  );
                                                                              }}
                                                                              title="Open task detail"
                                                                          >
                                                                              <ExternalLink className="h-3 w-3" />
                                                                          </button>
                                                                      </div>

                                                                      {/* System Status Cell */}
                                                                      <div
                                                                          className="shrink-0 px-3 py-1 border-r border-dashboard-border flex items-center"
                                                                          style={{
                                                                              width: STATUS_COL_WIDTH,
                                                                          }}
                                                                      >
                                                                          <StatusPill
                                                                              value={formatApprovalStatus(
                                                                                  task.approvalStatus,
                                                                              )}
                                                                              options={[]}
                                                                              onChange={() => {}}
                                                                              readOnly
                                                                          />
                                                                      </div>

                                                                      {/* Custom Field Values */}
                                                                      {displayedFields.map(
                                                                          (
                                                                              field,
                                                                          ) => (
                                                                              <div
                                                                                  key={
                                                                                      field.id
                                                                                  }
                                                                                  style={{
                                                                                      width:
                                                                                          columnWidths[
                                                                                              field
                                                                                                  .id
                                                                                          ] ??
                                                                                          150,
                                                                                  }}
                                                                                  className="shrink-0 px-3 py-1 border-r border-dashboard-border flex items-center"
                                                                              >
                                                                                  <div className="w-full">
                                                                                      {renderCustomFieldCell(
                                                                                          task,
                                                                                          field,
                                                                                      )}
                                                                                  </div>
                                                                              </div>
                                                                          ),
                                                                      )}

                                                                      {/* Actions Column */}
                                                                      <div className="w-[150px] shrink-0 px-3 py-1 flex items-center justify-end">
                                                                          <DropdownMenu>
                                                                              <DropdownMenuTrigger
                                                                                  asChild
                                                                              >
                                                                                  <Button
                                                                                      variant="ghost"
                                                                                      size="icon"
                                                                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                                      onClick={(
                                                                                          e,
                                                                                      ) =>
                                                                                          e.stopPropagation()
                                                                                      }
                                                                                  >
                                                                                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                                                  </Button>
                                                                              </DropdownMenuTrigger>
                                                                              <DropdownMenuContent align="end">
                                                                                  <DropdownMenuItem
                                                                                      onClick={(
                                                                                          e,
                                                                                      ) => {
                                                                                          e.stopPropagation();
                                                                                          toast.info(
                                                                                              'Task notifications coming soon',
                                                                                          );
                                                                                      }}
                                                                                  >
                                                                                      <Bell className="h-4 w-4 mr-2" />
                                                                                      Notify
                                                                                  </DropdownMenuItem>
                                                                                  {!readOnly && (
                                                                                      <>
                                                                                          <DropdownMenuSeparator />
                                                                                          <DropdownMenuItem
                                                                                              disabled={
                                                                                                  (optimisticApprovalStatus[
                                                                                                      task
                                                                                                          .id
                                                                                                  ] ??
                                                                                                      task.approvalStatus) !==
                                                                                                  'IN_PREPARATION'
                                                                                              }
                                                                                              onClick={(
                                                                                                  e,
                                                                                              ) => {
                                                                                                  e.stopPropagation();
                                                                                                  handleSubmitTask(
                                                                                                      task,
                                                                                                  );
                                                                                              }}
                                                                                          >
                                                                                              <Send className="h-4 w-4 mr-2" />
                                                                                              Submit
                                                                                          </DropdownMenuItem>
                                                                                          <DropdownMenuItem
                                                                                              disabled={
                                                                                                  (optimisticApprovalStatus[
                                                                                                      task
                                                                                                          .id
                                                                                                  ] ??
                                                                                                      task.approvalStatus) !==
                                                                                                  'IN_REVIEW'
                                                                                              }
                                                                                              onClick={(
                                                                                                  e,
                                                                                              ) => {
                                                                                                  e.stopPropagation();
                                                                                                  handleRejectTask(
                                                                                                      task,
                                                                                                  );
                                                                                              }}
                                                                                          >
                                                                                              <XCircle className="h-4 w-4 mr-2" />
                                                                                              Reject
                                                                                          </DropdownMenuItem>
                                                                                          <DropdownMenuItem
                                                                                              disabled={
                                                                                                  (optimisticApprovalStatus[
                                                                                                      task
                                                                                                          .id
                                                                                                  ] ??
                                                                                                      task.approvalStatus) ===
                                                                                                  'IN_PREPARATION'
                                                                                              }
                                                                                              onClick={(
                                                                                                  e,
                                                                                              ) => {
                                                                                                  e.stopPropagation();
                                                                                                  handleReopenTask(
                                                                                                      task,
                                                                                                  );
                                                                                              }}
                                                                                          >
                                                                                              <RefreshCw className="h-4 w-4 mr-2" />
                                                                                              Reopen
                                                                                              Task
                                                                                          </DropdownMenuItem>
                                                                                          <DropdownMenuSeparator />
                                                                                      </>
                                                                                  )}
                                                                                  <DropdownMenuItem
                                                                                      onClick={(
                                                                                          e,
                                                                                      ) => {
                                                                                          e.stopPropagation();
                                                                                          onTaskClick(
                                                                                              task,
                                                                                          );
                                                                                      }}
                                                                                  >
                                                                                      <Activity className="h-4 w-4 mr-2" />
                                                                                      Activity
                                                                                  </DropdownMenuItem>
                                                                                  <DropdownMenuItem
                                                                                      onClick={(
                                                                                          e,
                                                                                      ) => {
                                                                                          e.stopPropagation();
                                                                                          handleShareTaskLink(
                                                                                              task,
                                                                                          );
                                                                                      }}
                                                                                  >
                                                                                      <Link2 className="h-4 w-4 mr-2" />
                                                                                      Share
                                                                                      Link
                                                                                  </DropdownMenuItem>
                                                                              </DropdownMenuContent>
                                                                          </DropdownMenu>
                                                                      </div>
                                                                  </div>
                                                              ),
                                                          )}
                                                  </div>
                                              );
                                          },
                                      );
                                  })()
                                : // Render Flat List (with sections if available)
                                  (() => {
                                      const orderedTasks = taskOrder
                                          .map((id) =>
                                              allTasks.find((t) => t.id === id),
                                          )
                                          .filter(
                                              (t): t is Task => t !== undefined,
                                          );

                                      const SECTION_COLORS = [
                                          { label: 'Default', value: '' },
                                          { label: 'Gray', value: '#f0f2f5' },
                                          { label: 'Blue', value: '#e8f0fe' },
                                          { label: 'Green', value: '#e6f4ea' },
                                          { label: 'Yellow', value: '#fef9e7' },
                                          { label: 'Orange', value: '#fef3e2' },
                                          { label: 'Red', value: '#fce8e6' },
                                          { label: 'Purple', value: '#f3e8fd' },
                                          { label: 'Pink', value: '#fde8f3' },
                                      ];

                                      const renderTaskRow = (task: Task) => (
                                          <SortableRow
                                              key={task.id}
                                              id={task.id}
                                          >
                                              {(dragHandleProps) => (
                                                  <div
                                                      className={cn(
                                                          'flex border-b border-dashboard-border hover:bg-accent-row-hover transition-colors group min-w-max',
                                                          task.id.startsWith(
                                                              'optimistic-',
                                                          ) &&
                                                              'opacity-50 pointer-events-none',
                                                      )}
                                                  >
                                                      {/* Task Name - Sticky */}
                                                      <div
                                                          className="sticky left-0 z-20 shrink-0 px-3 py-1 border-r border-dashboard-border bg-dashboard-surface group-hover:bg-accent-row-hover transition-colors shadow-[1px_0_0_0_var(--dashboard-border)] flex items-center gap-3"
                                                          style={{
                                                              width: nameColWidth,
                                                          }}
                                                      >
                                                          {/* Drag handle */}
                                                          <div
                                                              {...dragHandleProps}
                                                              className="opacity-0 group-hover:opacity-40 hover:!opacity-100 cursor-grab shrink-0 -ml-1 touch-none"
                                                              onClick={(e) =>
                                                                  e.stopPropagation()
                                                              }
                                                          >
                                                              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                                          </div>
                                                          <div
                                                              onClick={(e) =>
                                                                  e.stopPropagation()
                                                              }
                                                              className="flex items-center shrink-0"
                                                          >
                                                              <Checkbox
                                                                  checked={selectedTaskIds.has(
                                                                      task.id,
                                                                  )}
                                                                  onCheckedChange={(
                                                                      checked,
                                                                  ) =>
                                                                      toggleTaskSelection(
                                                                          task.id,
                                                                          !!checked,
                                                                      )
                                                                  }
                                                              />
                                                          </div>
                                                          {/* Task name — inline editable */}
                                                          {editingTaskId ===
                                                          task.id ? (
                                                              <input
                                                                  className="flex-1 min-w-0 text-sm font-medium text-dashboard-text-primary bg-transparent border-none outline-none focus:outline-none rounded px-1 -mx-1"
                                                                  value={
                                                                      editingTaskName
                                                                  }
                                                                  onChange={(
                                                                      e,
                                                                  ) =>
                                                                      setEditingTaskName(
                                                                          e
                                                                              .target
                                                                              .value,
                                                                      )
                                                                  }
                                                                  onBlur={() =>
                                                                      commitRenameTask(
                                                                          task,
                                                                      )
                                                                  }
                                                                  onKeyDown={(
                                                                      e,
                                                                  ) => {
                                                                      if (
                                                                          e.key ===
                                                                          'Enter'
                                                                      )
                                                                          commitRenameTask(
                                                                              task,
                                                                          );
                                                                      if (
                                                                          e.key ===
                                                                          'Escape'
                                                                      ) {
                                                                          setEditingTaskId(
                                                                              null,
                                                                          );
                                                                          setEditingTaskName(
                                                                              '',
                                                                          );
                                                                      }
                                                                  }}
                                                                  onClick={(
                                                                      e,
                                                                  ) =>
                                                                      e.stopPropagation()
                                                                  }
                                                                  autoFocus
                                                              />
                                                          ) : (
                                                              <button
                                                                  className="flex-1 min-w-0 text-left cursor-text group/name"
                                                                  onClick={(
                                                                      e,
                                                                  ) => {
                                                                      e.stopPropagation();
                                                                      if (
                                                                          !readOnly
                                                                      ) {
                                                                          setEditingTaskId(
                                                                              task.id,
                                                                          );
                                                                          setEditingTaskName(
                                                                              task.name ||
                                                                                  '',
                                                                          );
                                                                      }
                                                                  }}
                                                              >
                                                                  <span className="text-sm font-medium text-dashboard-text-primary truncate block hover:text-accent-blue transition-colors">
                                                                      {(optimisticTaskNames[
                                                                          task
                                                                              .id
                                                                      ] ??
                                                                          task.name) || (
                                                                          <span className="text-muted-foreground/50 italic font-normal">
                                                                              Untitled
                                                                          </span>
                                                                      )}
                                                                  </span>
                                                              </button>
                                                          )}
                                                          <button
                                                              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0 ml-1 text-dashboard-text-muted hover:text-accent-blue cursor-pointer"
                                                              onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  onTaskClick(
                                                                      task,
                                                                  );
                                                              }}
                                                              title="Open task detail"
                                                          >
                                                              <ExternalLink className="h-3 w-3" />
                                                          </button>
                                                      </div>

                                                      {/* System Status Cell */}
                                                      <div
                                                          className="shrink-0 px-3 py-1 border-r border-dashboard-border flex items-center"
                                                          style={{
                                                              width: STATUS_COL_WIDTH,
                                                          }}
                                                      >
                                                          <StatusPill
                                                              value={formatApprovalStatus(
                                                                  task.approvalStatus,
                                                              )}
                                                              options={[]}
                                                              onChange={() => {}}
                                                              readOnly
                                                          />
                                                      </div>

                                                      {/* Custom Field Values */}
                                                      {displayedFields.map(
                                                          (field) => (
                                                              <div
                                                                  key={field.id}
                                                                  style={{
                                                                      width:
                                                                          columnWidths[
                                                                              field
                                                                                  .id
                                                                          ] ??
                                                                          150,
                                                                  }}
                                                                  className="shrink-0 px-3 py-1 border-r border-dashboard-border flex items-center"
                                                              >
                                                                  <div className="w-full">
                                                                      {renderCustomFieldCell(
                                                                          task,
                                                                          field,
                                                                      )}
                                                                  </div>
                                                              </div>
                                                          ),
                                                      )}

                                                      {/* Actions Column */}
                                                      <div className="w-[150px] shrink-0 px-3 py-1 flex items-center justify-end">
                                                          <DropdownMenu>
                                                              <DropdownMenuTrigger
                                                                  asChild
                                                              >
                                                                  <Button
                                                                      variant="ghost"
                                                                      size="icon"
                                                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                      onClick={(
                                                                          e,
                                                                      ) =>
                                                                          e.stopPropagation()
                                                                      }
                                                                  >
                                                                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                                  </Button>
                                                              </DropdownMenuTrigger>
                                                              <DropdownMenuContent align="end">
                                                                  <DropdownMenuItem
                                                                      onClick={(
                                                                          e,
                                                                      ) => {
                                                                          e.stopPropagation();
                                                                          toast.info(
                                                                              'Task notifications coming soon',
                                                                          );
                                                                      }}
                                                                  >
                                                                      <Bell className="h-4 w-4 mr-2" />
                                                                      Notify
                                                                  </DropdownMenuItem>
                                                                  {!readOnly && (
                                                                      <>
                                                                          <DropdownMenuSeparator />
                                                                          <DropdownMenuItem
                                                                              disabled={
                                                                                  (optimisticApprovalStatus[
                                                                                      task
                                                                                          .id
                                                                                  ] ??
                                                                                      task.approvalStatus) !==
                                                                                  'IN_PREPARATION'
                                                                              }
                                                                              onClick={(
                                                                                  e,
                                                                              ) => {
                                                                                  e.stopPropagation();
                                                                                  handleSubmitTask(
                                                                                      task,
                                                                                  );
                                                                              }}
                                                                          >
                                                                              <Send className="h-4 w-4 mr-2" />
                                                                              Submit
                                                                          </DropdownMenuItem>
                                                                          <DropdownMenuItem
                                                                              disabled={
                                                                                  (optimisticApprovalStatus[
                                                                                      task
                                                                                          .id
                                                                                  ] ??
                                                                                      task.approvalStatus) !==
                                                                                  'IN_REVIEW'
                                                                              }
                                                                              onClick={(
                                                                                  e,
                                                                              ) => {
                                                                                  e.stopPropagation();
                                                                                  handleRejectTask(
                                                                                      task,
                                                                                  );
                                                                              }}
                                                                          >
                                                                              <XCircle className="h-4 w-4 mr-2" />
                                                                              Reject
                                                                          </DropdownMenuItem>
                                                                          <DropdownMenuItem
                                                                              disabled={
                                                                                  (optimisticApprovalStatus[
                                                                                      task
                                                                                          .id
                                                                                  ] ??
                                                                                      task.approvalStatus) ===
                                                                                  'IN_PREPARATION'
                                                                              }
                                                                              onClick={(
                                                                                  e,
                                                                              ) => {
                                                                                  e.stopPropagation();
                                                                                  handleReopenTask(
                                                                                      task,
                                                                                  );
                                                                              }}
                                                                          >
                                                                              <RefreshCw className="h-4 w-4 mr-2" />
                                                                              Reopen
                                                                              Task
                                                                          </DropdownMenuItem>
                                                                          <DropdownMenuSeparator />
                                                                      </>
                                                                  )}
                                                                  <DropdownMenuItem
                                                                      onClick={(
                                                                          e,
                                                                      ) => {
                                                                          e.stopPropagation();
                                                                          onTaskClick(
                                                                              task,
                                                                          );
                                                                      }}
                                                                  >
                                                                      <Activity className="h-4 w-4 mr-2" />
                                                                      Activity
                                                                  </DropdownMenuItem>
                                                                  <DropdownMenuItem
                                                                      onClick={(
                                                                          e,
                                                                      ) => {
                                                                          e.stopPropagation();
                                                                          handleShareTaskLink(
                                                                              task,
                                                                          );
                                                                      }}
                                                                  >
                                                                      <Link2 className="h-4 w-4 mr-2" />
                                                                      Share Link
                                                                  </DropdownMenuItem>
                                                              </DropdownMenuContent>
                                                          </DropdownMenu>
                                                      </div>
                                                  </div>
                                              )}
                                          </SortableRow>
                                      );

                                      const renderAddTaskRow = (
                                          sectionId?: string,
                                      ) => (
                                          <div
                                              key={`add-task-${sectionId ?? 'root'}`}
                                              className="flex border-b border-dashboard-border hover:bg-accent-subtle/20 transition-colors group min-w-max cursor-pointer"
                                              onClick={() => {
                                                  if (sectionId) {
                                                      setCreatingSectionTask(
                                                          sectionId,
                                                      );
                                                      setNewSectionTaskName('');
                                                  } else {
                                                      setIsCreatingTask(true);
                                                  }
                                              }}
                                          >
                                              <div
                                                  className="sticky left-0 z-20 shrink-0 px-3 py-1 border-r border-dashboard-border bg-dashboard-surface group-hover:bg-accent-subtle/30 transition-colors shadow-[1px_0_0_0_var(--dashboard-border)] flex items-center gap-2 text-[13px] text-dashboard-text-muted group-hover:text-accent-blue"
                                                  style={{
                                                      width: nameColWidth,
                                                  }}
                                              >
                                                  <Plus className="h-3.5 w-3.5" />
                                                  Add task
                                              </div>
                                              <div
                                                  className="shrink-0 border-r border-dashboard-border"
                                                  style={{
                                                      width: STATUS_COL_WIDTH,
                                                  }}
                                              />
                                              {displayedFields.map((field) => (
                                                  <div
                                                      key={field.id}
                                                      style={{
                                                          width:
                                                              columnWidths[
                                                                  field.id
                                                              ] ?? 150,
                                                      }}
                                                      className="shrink-0 border-r border-dashboard-border"
                                                  />
                                              ))}
                                              <div className="w-[150px] shrink-0" />
                                          </div>
                                      );

                                      const renderInlineTaskCreate = (
                                          sectionId: string,
                                      ) => (
                                          <div
                                              key={`creating-${sectionId}`}
                                              className="flex border-b border-dashboard-border bg-accent-subtle/50 min-w-max animate-in fade-in slide-in-from-top-1 duration-150"
                                          >
                                              <div
                                                  className="sticky left-0 z-20 shrink-0 px-3 py-1 border-r border-dashboard-border bg-accent-subtle/50 shadow-[1px_0_0_0_var(--dashboard-border)]"
                                                  style={{
                                                      width: nameColWidth,
                                                  }}
                                              >
                                                  <EditableContent
                                                      value={newSectionTaskName}
                                                      onSave={(name) =>
                                                          handleCreateSectionTask(
                                                              sectionId,
                                                              name,
                                                          )
                                                      }
                                                      placeholder="Task name..."
                                                      textStyle="text-sm font-medium"
                                                      autoFocus
                                                  />
                                              </div>
                                              <div
                                                  className="shrink-0 border-r border-dashboard-border"
                                                  style={{
                                                      width: STATUS_COL_WIDTH,
                                                  }}
                                              />
                                              {displayedFields.map((field) => (
                                                  <div
                                                      key={field.id}
                                                      style={{
                                                          width:
                                                              columnWidths[
                                                                  field.id
                                                              ] ?? 150,
                                                      }}
                                                      className="shrink-0 border-r border-dashboard-border"
                                                  />
                                              ))}
                                              <div className="w-[150px] shrink-0" />
                                          </div>
                                      );

                                      const sectionedIds = new Set(
                                          sections.flatMap((s) =>
                                              orderedTasks
                                                  .filter(
                                                      (t) =>
                                                          getEffectiveSectionId(
                                                              t,
                                                          ) === s.id,
                                                  )
                                                  .map((t) => t.id),
                                          ),
                                      );
                                      const unsectionedOrdered =
                                          orderedTasks.filter(
                                              (t) => !sectionedIds.has(t.id),
                                          );

                                      if (sections.length === 0) {
                                          return (
                                              <DndContext
                                                  sensors={dndSensors}
                                                  collisionDetection={
                                                      closestCenter
                                                  }
                                                  onDragStart={
                                                      handleRowDragStart
                                                  }
                                                  onDragEnd={handleRowDragEnd}
                                              >
                                                  <SortableContext
                                                      items={taskOrder}
                                                      strategy={
                                                          verticalListSortingStrategy
                                                      }
                                                  >
                                                      {orderedTasks.map(
                                                          renderTaskRow,
                                                      )}
                                                      {isCreatingTask ? (
                                                          <div
                                                              key="creating-root"
                                                              className="flex border-b border-dashboard-border bg-accent-subtle/50 min-w-max animate-in fade-in slide-in-from-top-1 duration-150"
                                                          >
                                                              <div
                                                                  className="sticky left-0 z-20 shrink-0 px-3 py-1 border-r border-dashboard-border bg-accent-subtle/50 shadow-[1px_0_0_0_var(--dashboard-border)]"
                                                                  style={{
                                                                      width: nameColWidth,
                                                                  }}
                                                              >
                                                                  <EditableContent
                                                                      value={
                                                                          newTaskName
                                                                      }
                                                                      onSave={(
                                                                          name,
                                                                      ) =>
                                                                          handleCreateTask(
                                                                              name,
                                                                          )
                                                                      }
                                                                      placeholder="Task name..."
                                                                      textStyle="text-sm font-medium"
                                                                      autoFocus
                                                                  />
                                                              </div>
                                                              <div
                                                                  className="shrink-0 border-r border-dashboard-border"
                                                                  style={{
                                                                      width: STATUS_COL_WIDTH,
                                                                  }}
                                                              />
                                                              {displayedFields.map(
                                                                  (field) => (
                                                                      <div
                                                                          key={
                                                                              field.id
                                                                          }
                                                                          style={{
                                                                              width:
                                                                                  columnWidths[
                                                                                      field
                                                                                          .id
                                                                                  ] ??
                                                                                  150,
                                                                          }}
                                                                          className="shrink-0 border-r border-dashboard-border"
                                                                      />
                                                                  ),
                                                              )}
                                                              <div className="w-[150px] shrink-0" />
                                                          </div>
                                                      ) : (
                                                          !readOnly &&
                                                          renderAddTaskRow()
                                                      )}
                                                  </SortableContext>
                                                  <DragOverlay
                                                      dropAnimation={{
                                                          duration: 150,
                                                          easing: 'ease',
                                                      }}
                                                  >
                                                      {activeTask ? (
                                                          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-blue-400/50 rounded-lg shadow-lg shadow-blue-500/20 ring-2 ring-blue-300/30 w-fit max-w-50 cursor-grabbing">
                                                              <GripVertical className="h-3 w-3 text-blue-400/60 shrink-0" />
                                                              <span className="text-xs font-medium text-foreground truncate">
                                                                  {activeTask.name ||
                                                                      'Untitled'}
                                                              </span>
                                                          </div>
                                                      ) : null}
                                                  </DragOverlay>
                                              </DndContext>
                                          );
                                      }

                                      return (
                                          <DndContext
                                              sensors={dndSensors}
                                              collisionDetection={closestCenter}
                                              onDragStart={handleRowDragStart}
                                              onDragEnd={handleRowDragEnd}
                                          >
                                              <SortableContext
                                                  items={taskOrder}
                                                  strategy={
                                                      verticalListSortingStrategy
                                                  }
                                              >
                                                  <>
                                                      {/* Unsectioned tasks — droppable zone to move tasks out of sections */}
                                                      <DroppableSectionHeader
                                                          sectionId={null}
                                                      >
                                                          {(isDropOver) => (
                                                              <div
                                                                  className={cn(
                                                                      'transition-colors',
                                                                      isDropOver &&
                                                                          'outline-2 outline-blue-300/60 -outline-offset-2 rounded-sm bg-blue-50/40',
                                                                  )}
                                                              >
                                                                  {unsectionedOrdered.map(
                                                                      renderTaskRow,
                                                                  )}
                                                                  {/* Always show a drop zone when dragging + unsectioned area is empty */}
                                                                  {activeTaskId &&
                                                                      unsectionedOrdered.length ===
                                                                          0 && (
                                                                          <div
                                                                              className={cn(
                                                                                  'h-10 flex items-center justify-center text-xs rounded-sm mx-2 my-1 border border-dashed transition-colors',
                                                                                  isDropOver
                                                                                      ? 'text-blue-500/80 border-blue-400/70 bg-blue-50/60'
                                                                                      : 'text-muted-foreground/40 border-muted-foreground/20',
                                                                              )}
                                                                          >
                                                                              {isDropOver
                                                                                  ? 'Drop to remove from section'
                                                                                  : 'No section'}
                                                                          </div>
                                                                      )}
                                                              </div>
                                                          )}
                                                      </DroppableSectionHeader>

                                                      {/* Sections */}
                                                      {sections.map(
                                                          (section) => {
                                                              const sectionTasks =
                                                                  orderedTasks.filter(
                                                                      (t) =>
                                                                          getEffectiveSectionId(
                                                                              t,
                                                                          ) ===
                                                                          section.id,
                                                                  );
                                                              const isCollapsed =
                                                                  collapsedSections[
                                                                      section.id
                                                                  ];
                                                              const isEditing =
                                                                  editingSectionId ===
                                                                  section.id;

                                                              return (
                                                                  <div
                                                                      key={
                                                                          section.id
                                                                      }
                                                                  >
                                                                      {/* Section Header */}
                                                                      <DroppableSectionHeader
                                                                          sectionId={
                                                                              section.id
                                                                          }
                                                                      >
                                                                          {(
                                                                              isDropOver,
                                                                          ) => (
                                                                              <div
                                                                                  className="border-y border-dashboard-border group/section"
                                                                                  style={{
                                                                                      minWidth:
                                                                                          '100%',
                                                                                      backgroundColor:
                                                                                          isDropOver
                                                                                              ? 'color-mix(in srgb, var(--accent-blue) 12%, transparent)'
                                                                                              : sectionColors[
                                                                                                    section
                                                                                                        .id
                                                                                                ] ||
                                                                                                '#f0f2f5',
                                                                                  }}
                                                                              >
                                                                                  <div
                                                                                      className="sticky left-0 flex items-center gap-2 px-4 py-2 w-max transition-colors"
                                                                                      style={{
                                                                                          backgroundColor:
                                                                                              isDropOver
                                                                                                  ? 'color-mix(in srgb, var(--accent-blue) 12%, transparent)'
                                                                                                  : sectionColors[
                                                                                                        section
                                                                                                            .id
                                                                                                    ] ||
                                                                                                    '#f0f2f5',
                                                                                      }}
                                                                                  >
                                                                                      <button
                                                                                          onClick={() =>
                                                                                              toggleSection(
                                                                                                  section.id,
                                                                                              )
                                                                                          }
                                                                                          className="p-0.5 hover:bg-muted rounded cursor-pointer shrink-0"
                                                                                      >
                                                                                          {isCollapsed ? (
                                                                                              <ChevronRight className="h-4 w-4 text-dashboard-text-muted" />
                                                                                          ) : (
                                                                                              <ChevronDown className="h-4 w-4 text-dashboard-text-muted" />
                                                                                          )}
                                                                                      </button>

                                                                                      {isEditing ? (
                                                                                          <input
                                                                                              className="text-sm font-medium text-dashboard-text-body bg-transparent border-none outline-none focus:outline-none px-0 w-48"
                                                                                              value={
                                                                                                  editingSectionName
                                                                                              }
                                                                                              onChange={(
                                                                                                  e,
                                                                                              ) =>
                                                                                                  setEditingSectionName(
                                                                                                      e
                                                                                                          .target
                                                                                                          .value,
                                                                                                  )
                                                                                              }
                                                                                              onBlur={
                                                                                                  commitRenameSection
                                                                                              }
                                                                                              onKeyDown={(
                                                                                                  e,
                                                                                              ) => {
                                                                                                  if (
                                                                                                      e.key ===
                                                                                                      'Enter'
                                                                                                  )
                                                                                                      commitRenameSection();
                                                                                                  if (
                                                                                                      e.key ===
                                                                                                      'Escape'
                                                                                                  ) {
                                                                                                      setEditingSectionId(
                                                                                                          null,
                                                                                                      );
                                                                                                      setEditingSectionName(
                                                                                                          '',
                                                                                                      );
                                                                                                  }
                                                                                              }}
                                                                                              autoFocus
                                                                                          />
                                                                                      ) : (
                                                                                          <span
                                                                                              className="font-medium text-sm text-dashboard-text-body truncate cursor-pointer hover:text-accent-blue"
                                                                                              onClick={() =>
                                                                                                  startRenamingSection(
                                                                                                      section,
                                                                                                  )
                                                                                              }
                                                                                          >
                                                                                              {
                                                                                                  section.name
                                                                                              }
                                                                                          </span>
                                                                                      )}

                                                                                      <span className="text-muted-foreground text-xs ml-1 bg-muted px-1.5 py-0.5 rounded-full shrink-0">
                                                                                          {
                                                                                              sectionTasks.length
                                                                                          }
                                                                                      </span>

                                                                                      {/* Section actions */}
                                                                                      {onDeleteSection && (
                                                                                          <DropdownMenu>
                                                                                              <DropdownMenuTrigger
                                                                                                  asChild
                                                                                              >
                                                                                                  <Button
                                                                                                      variant="ghost"
                                                                                                      size="icon"
                                                                                                      className="h-6 w-6 opacity-0 group-hover/section:opacity-100 transition-opacity shrink-0"
                                                                                                      onClick={(
                                                                                                          e,
                                                                                                      ) =>
                                                                                                          e.stopPropagation()
                                                                                                      }
                                                                                                  >
                                                                                                      <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                                                                                                  </Button>
                                                                                              </DropdownMenuTrigger>
                                                                                              <DropdownMenuContent align="end">
                                                                                                  <DropdownMenuItem
                                                                                                      onClick={() =>
                                                                                                          startRenamingSection(
                                                                                                              section,
                                                                                                          )
                                                                                                      }
                                                                                                  >
                                                                                                      <Pencil className="h-4 w-4 mr-2" />
                                                                                                      Rename
                                                                                                  </DropdownMenuItem>
                                                                                                  <DropdownMenuSeparator />
                                                                                                  <div className="px-2 py-1.5">
                                                                                                      <p className="text-xs text-muted-foreground mb-2 font-medium">
                                                                                                          Section
                                                                                                          color
                                                                                                      </p>
                                                                                                      <div className="grid grid-cols-5 gap-1">
                                                                                                          {SECTION_COLORS.map(
                                                                                                              (
                                                                                                                  color,
                                                                                                              ) => (
                                                                                                                  <button
                                                                                                                      key={
                                                                                                                          color.value
                                                                                                                      }
                                                                                                                      title={
                                                                                                                          color.label
                                                                                                                      }
                                                                                                                      onClick={async () => {
                                                                                                                          setSectionColors(
                                                                                                                              (
                                                                                                                                  prev,
                                                                                                                              ) => ({
                                                                                                                                  ...prev,
                                                                                                                                  [section.id]:
                                                                                                                                      color.value,
                                                                                                                              }),
                                                                                                                          );
                                                                                                                          try {
                                                                                                                              const token =
                                                                                                                                  await getToken();
                                                                                                                              if (
                                                                                                                                  token
                                                                                                                              ) {
                                                                                                                                  await sectionApi.updateSection(
                                                                                                                                      token,
                                                                                                                                      projectId,
                                                                                                                                      section.id,
                                                                                                                                      {
                                                                                                                                          color:
                                                                                                                                              color.value ||
                                                                                                                                              null,
                                                                                                                                      },
                                                                                                                                  );
                                                                                                                              }
                                                                                                                          } catch {
                                                                                                                              // non-critical: color just won't persist
                                                                                                                          }
                                                                                                                      }}
                                                                                                                      className={`w-5 h-5 rounded-sm border transition-all cursor-pointer ${
                                                                                                                          (sectionColors[
                                                                                                                              section
                                                                                                                                  .id
                                                                                                                          ] ??
                                                                                                                              '') ===
                                                                                                                          color.value
                                                                                                                              ? 'border-primary ring-1 ring-primary'
                                                                                                                              : 'border-border hover:border-ring'
                                                                                                                      }`}
                                                                                                                      style={{
                                                                                                                          backgroundColor:
                                                                                                                              color.value ||
                                                                                                                              '#f0f2f5',
                                                                                                                      }}
                                                                                                                  />
                                                                                                              ),
                                                                                                          )}
                                                                                                      </div>
                                                                                                  </div>
                                                                                                  <DropdownMenuSeparator />
                                                                                                  <DropdownMenuItem
                                                                                                      onClick={() =>
                                                                                                          onDeleteSection(
                                                                                                              section.id,
                                                                                                          )
                                                                                                      }
                                                                                                      className="text-destructive focus:text-destructive"
                                                                                                  >
                                                                                                      <Trash2 className="h-4 w-4 mr-2" />
                                                                                                      Delete
                                                                                                      Section
                                                                                                  </DropdownMenuItem>
                                                                                              </DropdownMenuContent>
                                                                                          </DropdownMenu>
                                                                                      )}
                                                                                  </div>
                                                                              </div>
                                                                          )}
                                                                      </DroppableSectionHeader>

                                                                      {/* Tasks in section */}
                                                                      {!isCollapsed && (
                                                                          <>
                                                                              {sectionTasks.map(
                                                                                  renderTaskRow,
                                                                              )}
                                                                              {creatingSectionTask ===
                                                                              section.id
                                                                                  ? renderInlineTaskCreate(
                                                                                        section.id,
                                                                                    )
                                                                                  : !readOnly &&
                                                                                    renderAddTaskRow(
                                                                                        section.id,
                                                                                    )}
                                                                          </>
                                                                      )}
                                                                  </div>
                                                              );
                                                          },
                                                      )}
                                                  </>
                                              </SortableContext>
                                              <DragOverlay
                                                  dropAnimation={{
                                                      duration: 150,
                                                      easing: 'ease',
                                                  }}
                                              >
                                                  {activeTask ? (
                                                      <div className="flex items-center h-9 px-3 gap-3 bg-dashboard-surface border border-blue-300/50 rounded shadow-lg shadow-black/10 min-w-75 opacity-95 cursor-grabbing">
                                                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                                                          <span className="text-sm font-medium text-dashboard-text-primary truncate">
                                                              {activeTask.name ||
                                                                  'Untitled'}
                                                          </span>
                                                      </div>
                                                  ) : null}
                                              </DragOverlay>
                                          </DndContext>
                                      );
                                  })()}

                            {/* Empty state message - shown below the add task row */}
                            {tasks.length === 0 && !isCreatingTask && (
                                <div className="flex flex-col items-center justify-center h-24 text-center px-8 sticky left-0 w-full min-w-[300px]">
                                    <p className="text-muted-foreground text-sm">
                                        No tasks yet. Click &quot;Add task&quot;
                                        above to get started.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    },
);

TaskList.displayName = 'TaskList';
