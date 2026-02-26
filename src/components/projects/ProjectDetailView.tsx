'use client';

import {
    useState,
    useEffect,
    useRef,
    useLayoutEffect,
    useCallback,
    useMemo,
} from 'react';

import { useRouter, useSearchParams } from 'next/navigation';
import {
    Calendar as CalendarIcon,
    List as ListIcon,
    Plus,
    Search,
    Filter,
    ArrowLeft,
    Settings,
    Trash2,
    X,
    Copy,
    Pencil,
    Layers,
    Download,
    Upload,
    Mail,
    Activity,
    Bell,
    Lock,
    Archive,
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    LayoutGrid,
    Loader2,
    LayoutTemplate,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '@/lib/utils';
import {
    type Project,
    type Task,
    type CustomField,
    projectApi,
    taskApi,
    customFieldApi,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
    CalendarSection,
    type CalendarEvent,
} from '@/components/dashboard/pure-steel/CalendarSection';
import { TaskDetailView } from '@/components/tasks/TaskDetailView';
import { TaskList, type TaskListRef } from './TaskList';
import { EditTaskDialog } from '@/components/dialogs/EditTaskDialog';
import { ManageTemplatesDialog } from '@/components/dialogs/ManageTemplatesDialog';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Link from 'next/link';

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuItem,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { usePreferences } from '@knocklabs/react';

interface ProjectDetailViewProps {
    project: Project;
    tasks: Task[];
    onRefresh: () => void;
    onCreateTask: () => void;
}

type ViewMode = 'list' | 'calendar';
type StatusFilter = 'ALL' | 'IN_PREPARATION' | 'IN_REVIEW' | 'COMPLETED';

interface EditableContentProps {
    value: string;
    onSave: (value: string) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    isTextarea?: boolean;
    textStyle?: string;
}

/** Notion-style inline editable: single contentEditable div, no visible box. */
const EditableContent = ({
    value,
    onSave,
    placeholder = 'Click to edit',
    className = '',
    inputClassName = '',
    isTextarea = false,
    textStyle = '',
}: EditableContentProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [displayValue, setDisplayValue] = useState(value);
    const [prevValue, setPrevValue] = useState(value);
    // Derived state pattern
    if (value !== prevValue && !isEditing) {
        setPrevValue(value);
        setDisplayValue(value);
    }

    const [editEmpty, setEditEmpty] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const discardOnBlurRef = useRef(false);

    useLayoutEffect(() => {
        if (!isEditing || !ref.current) return;
        const el = ref.current;
        el.focus();
        // Clear first to avoid appending to any residual content (e.g. <br> from browser)
        el.textContent = '';
        el.textContent = displayValue;
        placeCaretAtEnd(el);
    }, [isEditing, displayValue]);

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
        if (e.key === 'Enter' && !isTextarea) {
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

    const handleClick = () => {
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
                        'outline-none cursor-text rounded px-1 -mx-1 py-0.5 -my-0.5 wrap-break-word',
                        'bg-muted/30 focus:bg-muted/40 transition-colors duration-150',
                        'min-h-[1.5em]',
                        isTextarea && 'min-h-[80px] whitespace-pre-wrap',
                        textStyle,
                        inputClassName,
                    )}
                />
                {/* Placeholder overlay when empty – avoid ::before on contentEditable (causes duplicate text) */}
                {editEmpty && (
                    <div
                        className={cn(
                            'pointer-events-none absolute left-0 top-0 px-1 py-0.5 text-muted-foreground/50 italic',
                            'min-h-[1.5em]',
                            textStyle,
                            isTextarea && 'min-h-[80px]',
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
                    handleClick();
                }
            }}
            className={cn(
                'group cursor-pointer rounded -ml-1 pl-1 pr-1 border border-transparent',
                'hover:bg-muted/30 active:bg-muted/40 transition-colors duration-150',
                'flex items-start gap-2',
                className,
            )}
            title="Click to edit"
        >
            <div
                className={cn(
                    'flex-1 wrap-break-word min-h-[1.5em]',
                    textStyle,
                )}
            >
                {displayValue || (
                    <span className="text-muted-foreground/50 italic">
                        {placeholder}
                    </span>
                )}
            </div>
            <Pencil className="h-3.5 w-3.5 mt-1.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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

function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
    return new Date(d.setDate(diff));
}

const MONTH_NAMES = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];
const DAY_ABBR = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function isSameDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

/** Monthly grid calendar view */
function MonthCalendarView({ events }: { events: CalendarEvent[] }) {
    const today = new Date();
    const [viewDate, setViewDate] = useState(
        () => new Date(today.getFullYear(), today.getMonth(), 1),
    );

    const navigate = (dir: 'prev' | 'next' | 'today') => {
        if (dir === 'today') {
            setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
        } else if (dir === 'prev') {
            setViewDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
        } else {
            setViewDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
        }
    };

    // Build 6-week grid starting from the Monday on or before the 1st of the month
    const gridDays = useMemo(() => {
        const firstDay = new Date(
            viewDate.getFullYear(),
            viewDate.getMonth(),
            1,
        );
        // getDay(): 0=Sun,1=Mon,...,6=Sat → offset to make Monday=0
        const offset = (firstDay.getDay() + 6) % 7;
        const gridStart = new Date(firstDay);
        gridStart.setDate(gridStart.getDate() - offset);
        const days: Date[] = [];
        for (let i = 0; i < 42; i++) {
            const d = new Date(gridStart);
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    }, [viewDate]);

    // Group events by date key
    const eventsByDay = useMemo(() => {
        const map = new Map<string, CalendarEvent[]>();
        for (const ev of events) {
            const key = `${ev.date.getFullYear()}-${ev.date.getMonth()}-${ev.date.getDate()}`;
            if (!map.has(key)) map.set(key, []);
            map.get(key)!.push(ev);
        }
        return map;
    }, [events]);

    const getDayEvents = (d: Date) => {
        const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
        return eventsByDay.get(key) || [];
    };

    const isCurrentMonth = (d: Date) => d.getMonth() === viewDate.getMonth();

    return (
        <div className="flex flex-col h-full">
            {/* Month header */}
            <div className="flex items-center gap-3 px-1 pb-3 shrink-0">
                <h2 className="text-base font-semibold text-dashboard-text-primary font-serif">
                    {MONTH_NAMES[viewDate.getMonth()]} {viewDate.getFullYear()}
                </h2>
                <div className="flex items-center gap-1 ml-auto">
                    <button
                        onClick={() => navigate('today')}
                        className="px-2.5 py-1 text-xs font-medium text-dashboard-text-body border border-dashboard-border rounded-md hover:bg-accent-subtle/50 transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={() => navigate('prev')}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-dashboard-border text-dashboard-text-muted hover:bg-accent-subtle/50 hover:text-dashboard-text-primary transition-colors"
                    >
                        <ChevronLeft className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={() => navigate('next')}
                        className="h-7 w-7 flex items-center justify-center rounded-md border border-dashboard-border text-dashboard-text-muted hover:bg-accent-subtle/50 hover:text-dashboard-text-primary transition-colors"
                    >
                        <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>

            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-t border-l border-dashboard-border shrink-0">
                {DAY_ABBR.map((day) => (
                    <div
                        key={day}
                        className="border-r border-b border-dashboard-border bg-[#f8f9fb] px-2 py-1.5 text-center text-[10px] font-medium text-dashboard-text-muted uppercase tracking-wide"
                    >
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-7 grid-rows-6 border-l border-dashboard-border flex-1 min-h-0 overflow-hidden">
                {gridDays.map((day, idx) => {
                    const dayEvents = getDayEvents(day);
                    const isToday = isSameDay(day, today);
                    const inMonth = isCurrentMonth(day);
                    const visible = dayEvents.slice(0, 2);
                    const overflow = dayEvents.length - visible.length;

                    return (
                        <div
                            key={idx}
                            className={cn(
                                'border-r border-b border-dashboard-border p-1.5 flex flex-col gap-0.5 min-h-0 overflow-hidden',
                                !inMonth && 'bg-[#f8f9fb]/60',
                            )}
                        >
                            {/* Day number */}
                            <div className="flex items-center justify-end mb-0.5">
                                <span
                                    className={cn(
                                        'text-[11px] font-medium w-5 h-5 flex items-center justify-center rounded-full',
                                        isToday
                                            ? 'bg-accent-blue text-white'
                                            : inMonth
                                              ? 'text-dashboard-text-primary'
                                              : 'text-dashboard-text-muted',
                                    )}
                                >
                                    {day.getDate()}
                                </span>
                            </div>

                            {/* Task pills */}
                            {visible.map((ev) => (
                                <div
                                    key={ev.id}
                                    className={cn(
                                        'truncate rounded px-1.5 py-0.5 text-[10px] leading-tight font-medium',
                                        ev.type === 'deadline'
                                            ? 'bg-[rgba(224,82,82,0.10)] text-[#e05252]'
                                            : 'bg-[rgba(94,142,173,0.10)] text-[#5e8ead]',
                                    )}
                                    title={ev.title}
                                >
                                    {ev.title}
                                </div>
                            ))}

                            {/* Overflow count */}
                            {overflow > 0 && (
                                <span className="text-[10px] text-dashboard-text-muted pl-1">
                                    +{overflow} more
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

/** Wrapper to convert Task[] to CalendarEvent[] and provide week/month navigation */
function CalendarViewWrapper({ tasks }: { tasks: Task[] }) {
    const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('month');
    const [currentWeekStart, setCurrentWeekStart] = useState(() =>
        getWeekStart(new Date()),
    );

    const handleNavigate = (direction: 'prev' | 'next' | 'today') => {
        if (direction === 'today') {
            setCurrentWeekStart(getWeekStart(new Date()));
        } else if (direction === 'prev') {
            const newDate = new Date(currentWeekStart);
            newDate.setDate(newDate.getDate() - 7);
            setCurrentWeekStart(newDate);
        } else {
            const newDate = new Date(currentWeekStart);
            newDate.setDate(newDate.getDate() + 7);
            setCurrentWeekStart(newDate);
        }
    };

    const calendarEvents: CalendarEvent[] = useMemo(
        () =>
            tasks.map((task) => ({
                id: task.id,
                title: task.name,
                date: task.dueAt
                    ? new Date(task.dueAt)
                    : new Date(task.createdAt),
                type: (task.approvalStatus === 'COMPLETED'
                    ? 'task'
                    : task.dueAt && new Date(task.dueAt) < new Date()
                      ? 'deadline'
                      : 'task') as CalendarEvent['type'],
                status: (task.approvalStatus === 'COMPLETED'
                    ? 'complete'
                    : task.approvalStatus === 'IN_REVIEW'
                      ? 'review'
                      : 'pending') as CalendarEvent['status'],
            })),
        [tasks],
    );

    return (
        <div className="flex-1 min-h-0 p-4 flex flex-col gap-3">
            {/* Mode toggle */}
            <div className="flex items-center gap-1 self-end shrink-0">
                <button
                    onClick={() => setCalendarMode('week')}
                    className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors',
                        calendarMode === 'week'
                            ? 'bg-accent-blue text-white border-accent-blue'
                            : 'text-dashboard-text-body border-dashboard-border hover:bg-accent-subtle/50',
                    )}
                >
                    <CalendarIcon className="h-3 w-3" />
                    Week
                </button>
                <button
                    onClick={() => setCalendarMode('month')}
                    className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors',
                        calendarMode === 'month'
                            ? 'bg-accent-blue text-white border-accent-blue'
                            : 'text-dashboard-text-body border-dashboard-border hover:bg-accent-subtle/50',
                    )}
                >
                    <LayoutGrid className="h-3 w-3" />
                    Month
                </button>
            </div>

            {calendarMode === 'week' ? (
                <CalendarSection
                    events={calendarEvents}
                    currentWeekStart={currentWeekStart}
                    onNavigate={handleNavigate}
                    className="flex-1 min-h-0"
                />
            ) : (
                <div className="flex-1 min-h-0 overflow-hidden">
                    <MonthCalendarView events={calendarEvents} />
                </div>
            )}
        </div>
    );
}

export function ProjectDetailView({
    project,
    tasks,
    onRefresh,
}: ProjectDetailViewProps) {
    const { getToken } = useAuth();
    const [view, setView] = useState<ViewMode>('list');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editTaskOpen, setEditTaskOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    // Templates
    const [templatesOpen, setTemplatesOpen] = useState(false);
    // Import modal
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    // Email invite modal
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteEmailError, setInviteEmailError] = useState('');
    const [isSendingInvite, setIsSendingInvite] = useState(false);
    // Activity log modal
    const [activityLogOpen, setActivityLogOpen] = useState(false);
    // Notifications modal
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const {
        preferences: notifPreferences,
        setPreferences: setNotifPreferences,
        isLoading: isLoadingPrefs,
    } = usePreferences();
    // Permissions modal
    const [permissionsOpen, setPermissionsOpen] = useState(false);
    const [projectVisibility, setProjectVisibility] = useState<
        'private' | 'team' | 'public'
    >('team');

    // Local project state for optimistic updates
    const [localProject, setLocalProject] = useState(project);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setLocalProject(project);
    }, [project]);

    // Settings modal state
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [isLoadingCustomFields, setIsLoadingCustomFields] = useState(false);
    const taskListRef = useRef<TaskListRef>(null);

    // Grouping & Deep Filtering
    const [groupByField, setGroupByField] = useState<string | null>(null);
    const [columnFilters, setColumnFilters] = useState<
        Record<string, { value: string; type: 'text' | 'date' }>
    >({});

    const handleColumnFilterChange = (
        fieldId: string,
        value: string,
        type: 'text' | 'date' = 'text',
    ) => {
        setColumnFilters((prev) => {
            const next = { ...prev };
            if (!value) {
                delete next[fieldId];
            } else {
                next[fieldId] = { value, type };
            }
            return next;
        });
    };

    const handleUpdateProjectField = async (updates: Partial<Project>) => {
        // Optimistic update
        setLocalProject((prev) => ({ ...prev, ...updates }));

        try {
            const token = await getToken();
            if (!token) return;

            await projectApi.updateProject(token, project.id, updates);
            toast.success('Project updated');
            onRefresh();
        } catch (error) {
            console.error('Failed to update project:', error);
            toast.error('Failed to update project');
            // Revert on error
            setLocalProject(project);
        }
    };

    const handleDeleteProject = async () => {
        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await projectApi.deleteProject(token, project.id);
            toast.success('Project deleted successfully');
            setDeleteDialogOpen(false);
            window.history.back();
        } catch {
            // Error handling can be added here if needed
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExportProject = () => {
        try {
            // Prepare data
            const dataToExport = tasks.map((task) => {
                const row: Record<string, string> = {
                    'Task Name': task.name,
                    Status: task.approvalStatus,
                };

                customFields.forEach((field) => {
                    const val = task.customFieldValues?.find(
                        (v) => v.customFieldId === field.id,
                    )?.value;

                    if (field.dataType === 'USER' && val) {
                        const u =
                            project.members.find((m) => m.id === val) ||
                            project.owners.find((o) => o.id === val);
                        row[field.name] = u
                            ? u.firstName
                                ? `${u.firstName} ${u.lastName || ''}`
                                : u.email
                            : val;
                    } else {
                        row[field.name] = val || '';
                    }
                });

                return row;
            });

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
            XLSX.writeFile(
                workbook,
                `${project.name.replace(/\s+/g, '_')}_export.xlsx`,
            );
            toast.success('Project exported successfully');
        } catch (error) {
            console.error('Export failed:', error);
            toast.error('Failed to export project');
        }
    };

    const handleConfirmImport = async () => {
        if (!importFile) return;
        setIsImporting(true);
        try {
            const data = await importFile.arrayBuffer();
            const workbook = XLSX.read(data);
            const worksheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[worksheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet);

            if (jsonData.length === 0) {
                toast.error('No data found in file');
                return;
            }

            const token = await getToken();
            if (!token) return;

            let count = 0;
            for (const row of jsonData as Record<string, unknown>[]) {
                const taskName = row['Task Name'] || row['Name'] || row['Task'];
                if (!taskName || typeof taskName !== 'string') continue;

                const customFieldsPayload: Record<
                    string,
                    string | number | null
                > = {};
                customFields.forEach((field) => {
                    const value = row[field.name];
                    if (
                        typeof value === 'string' ||
                        typeof value === 'number'
                    ) {
                        customFieldsPayload[field.id] = value;
                    }
                });

                await taskApi.createTask(token, project.id, {
                    name: taskName,
                    status: 'PENDING',
                    customFields: customFieldsPayload,
                });
                count++;
            }

            toast.success(
                `Imported ${count} task${count !== 1 ? 's' : ''} successfully`,
            );
            onRefresh();
            setImportModalOpen(false);
            setImportFile(null);
        } catch (error) {
            console.error('Import failed:', error);
            toast.error('Failed to import file');
        } finally {
            setIsImporting(false);
        }
    };

    const handleSendInvite = async () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!inviteEmail.trim()) {
            setInviteEmailError('Email is required');
            return;
        }
        if (!emailRegex.test(inviteEmail)) {
            setInviteEmailError('Please enter a valid email address');
            return;
        }
        setInviteEmailError('');
        setIsSendingInvite(true);
        await new Promise((resolve) => setTimeout(resolve, 700));
        setIsSendingInvite(false);
        toast.success(`Invite sent to ${inviteEmail}`);
        setInviteEmail('');
        setInviteModalOpen(false);
    };

    const handleCopyProject = async () => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            // Manual copy to avoid "Copy of" prefix on tasks

            // 1. Create new project
            const newProjectName = `Copy of ${project.name}`;
            const newProjectResponse = await projectApi.createProject(
                token,
                project.workspaceId,
                newProjectName,
                project.description,
            );

            if (!newProjectResponse.data) {
                throw new Error('Failed to create new project');
            }
            const newProjectId = newProjectResponse.data.id;

            // 3. Create Custom Fields
            const fieldIdMap = new Map<string, string>();

            for (const field of customFields) {
                const newFieldResponse = await customFieldApi.createCustomField(
                    token,
                    newProjectId,
                    {
                        name: field.name,
                        dataType: field.dataType,
                        customOptions: field.customOptions,
                        defaultValue: field.defaultValue,
                        description: field.description,
                        required: field.required,
                        color: field.color,
                    },
                );
                if (newFieldResponse.data) {
                    fieldIdMap.set(field.id, newFieldResponse.data.id);
                }
            }

            // 4. Create Tasks
            toast.info(`Copying ${tasks.length} tasks...`);

            // Create tasks in parallel batches of 5 to speed up but not overwhelm
            const batchSize = 5;
            for (let i = 0; i < tasks.length; i += batchSize) {
                const batch = tasks.slice(i, i + batchSize);
                await Promise.all(
                    batch.map(async (task) => {
                        const newCustomFields: Record<string, string> = {};

                        // Map custom values
                        if (task.customFieldValues) {
                            task.customFieldValues.forEach((val) => {
                                const newFieldId = fieldIdMap.get(
                                    val.customFieldId,
                                );
                                if (newFieldId) {
                                    // For USER type, the value is userId, which is fine to copy as is (same workspace)
                                    newCustomFields[newFieldId] = val.value;
                                }
                            });
                        }

                        await taskApi.createTask(token, newProjectId, {
                            name: task.name, // DIRECT NAME COPY - NO PREFIX
                            description: task.description,
                            dueAt: task.dueAt,
                            customFields: newCustomFields,
                        });
                    }),
                );
            }

            const newWorkspaceId = project.workspaceId;
            toast.success(
                <div className="flex items-center justify-between gap-3 w-full">
                    <span>Project copied to your workspace.</span>
                    <button
                        onClick={() =>
                            (window.location.href = `/workspaces/${newWorkspaceId}/projects/${newProjectId}`)
                        }
                        className="flex items-center gap-1.5 text-xs font-medium text-accent-blue hover:underline shrink-0"
                    >
                        View copy
                        <ExternalLink className="h-3 w-3" />
                    </button>
                </div>,
                { duration: 6000 },
            );
            onRefresh();
        } catch (error) {
            console.error('Failed to copy project:', error);
            toast.error('Failed to copy project');
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await taskApi.deleteTask(token, project.id, taskId);
            toast.success('Task deleted successfully');
            onRefresh();
        } catch (error) {
            console.error('Failed to delete task:', error);
            toast.error('Failed to delete task');
        }
    };

    const handleCopyTask = async (task: Task) => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await taskApi.copyTask(token, project.id, task.id);
            toast.success('Task copied successfully');
            onRefresh();
        } catch (error) {
            console.error('Failed to copy task:', error);
            toast.error('Failed to copy task');
        }
    };

    const fetchCustomFields = useCallback(async () => {
        try {
            setIsLoadingCustomFields(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await customFieldApi.getCustomFields(
                token,
                project.id,
            );
            setCustomFields(response.data || []);
        } catch (error) {
            console.error('Failed to fetch custom fields:', error);
            toast.error('Failed to load custom fields');
        } finally {
            setIsLoadingCustomFields(false);
        }
    }, [getToken, project.id]);

    // getStatusIcon and getStatusLabel removed

    // Filter tasks
    // Filter tasks
    const filteredTasks = tasks.filter((task) => {
        // 1. Search Query
        const matchesSearch = task.name
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        // 2. Status FilterButton (Legacy/High-level)
        const matchesStatus =
            statusFilter === 'ALL' || task.approvalStatus === statusFilter;

        // 3. Column Filters
        const matchesColumnFilters = Object.entries(columnFilters).every(
            ([fieldId, filter]) => {
                if (!filter.value) return true;

                let cellValue = '';
                if (fieldId === 'name') {
                    cellValue = task.name;
                } else {
                    // Find custom field value
                    const cv = task.customFieldValues?.find(
                        (v) => v.customFieldId === fieldId,
                    );
                    cellValue = cv?.value || '';
                }

                if (filter.type === 'date') {
                    // simple substring match for now, or exact match? User asked for "filters by keywords or dates"
                    // For date fields, usually stored as ISO strings or YYYY-MM-DD.
                    return cellValue.includes(filter.value);
                }

                return cellValue
                    .toLowerCase()
                    .includes(filter.value.toLowerCase());
            },
        );

        return matchesSearch && matchesStatus && matchesColumnFilters;
    });

    const router = useRouter();
    const searchParams = useSearchParams();

    // Fetch custom fields on mount
    useEffect(() => {
        fetchCustomFields();
    }, [fetchCustomFields]);

    // Sync URL with selected task
    useEffect(() => {
        const taskId = searchParams.get('taskId');
        if (taskId && tasks.length > 0) {
            const task = tasks.find((t) => t.id === taskId);
            if (task) {
                setSelectedTask(task);
            } else {
                // Task in URL not found in current list (maybe separate fetch needed if pagination, but likely just wait for tasks)
                // If tasks are loaded and task not found, maybe clear param?
                // For now, let's trust tasks list is complete for the project
            }
        } else if (!taskId) {
            setSelectedTask(null);
        }
    }, [searchParams, tasks]);

    const handleTaskSelect = (task: Task) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('taskId', task.id);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const handleTaskClose = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('taskId');
        router.push(`?${params.toString()}`, { scroll: false });
    };

    // Refresh handler that keeps task selected
    const handleRefresh = async () => {
        await onRefresh();
        // If selected task exists, checking for updates is handled by task list update
        // But if we need to update the detail view specifically, that's done inside TaskDetailView via its own refresh
    };

    if (selectedTask) {
        return (
            <TaskDetailView
                task={selectedTask}
                onBack={handleTaskClose}
                onUpdate={handleRefresh}
                onDelete={() => {
                    handleTaskClose();
                    handleRefresh();
                }}
                workspaceName={project.workspace?.name}
                workspaceId={project.workspaceId}
                projectName={project.name}
                projectId={project.id}
            />
        );
    }

    return (
        <div className="flex flex-col h-full bg-dashboard-bg animate-in fade-in duration-500">
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-dashboard-border px-8 py-4 flex items-start justify-between shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link href={`/workspaces/${project.workspaceId}`}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -ml-1 text-dashboard-text-muted hover:text-dashboard-text-primary cursor-pointer"
                                onClick={() => window.history.back()}
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2 text-sm text-dashboard-text-muted">
                            <Link
                                href={`/workspaces/${project.workspaceId}`}
                                className="hover:text-dashboard-text-primary hover:underline transition-colors cursor-pointer"
                            >
                                {project.workspace.name}
                            </Link>
                            <span className="text-(--dashboard-text-muted)/40">
                                /
                            </span>
                            <span className="font-medium text-dashboard-text-primary">
                                {project.name}
                            </span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1 max-w-2xl">
                        <EditableContent
                            value={localProject.name}
                            onSave={(val) =>
                                handleUpdateProjectField({ name: val })
                            }
                            className="w-fit"
                            textStyle="text-2xl font-serif font-semibold tracking-tight text-dashboard-text-primary"
                            inputClassName="text-2xl font-serif font-semibold h-auto py-1 px-2"
                            placeholder="Project Name"
                        />
                        <EditableContent
                            value={localProject.description || ''}
                            onSave={(val) =>
                                handleUpdateProjectField({
                                    description: val,
                                })
                            }
                            className="w-full mt-0.5"
                            textStyle="text-sm text-dashboard-text-muted"
                            inputClassName="text-sm min-h-[80px]"
                            isTextarea
                            placeholder="Add a description..."
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-1">
                    <div className="flex items-center bg-dashboard-surface p-1 rounded-lg border border-dashboard-border shadow-sm mr-2">
                        <button
                            onClick={() => setView('list')}
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer',
                                view === 'list'
                                    ? 'bg-accent-subtle text-dashboard-text-primary'
                                    : 'text-dashboard-text-muted hover:text-dashboard-text-primary hover:bg-accent-hover',
                            )}
                        >
                            <ListIcon className="h-4 w-4" />
                            List
                        </button>
                        <button
                            onClick={() => setView('calendar')}
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer',
                                view === 'calendar'
                                    ? 'bg-accent-subtle text-dashboard-text-primary'
                                    : 'text-dashboard-text-muted hover:text-dashboard-text-primary hover:bg-accent-hover',
                            )}
                        >
                            <CalendarIcon className="h-4 w-4" />
                            Calendar
                        </button>
                    </div>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-9 w-9 bg-dashboard-surface border-dashboard-border hover:bg-accent-subtle hover:border-accent-blue shadow-sm cursor-pointer"
                                title="Project Settings"
                            >
                                <Settings className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuItem
                                onClick={() => setInviteModalOpen(true)}
                            >
                                <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>Invite with email</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleExportProject}>
                                <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>Export board to Excel</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setImportModalOpen(true)}
                            >
                                <Upload className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>Import tasks</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCopyProject}>
                                <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>Copy Project</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setActivityLogOpen(true)}
                            >
                                <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>Activity log</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={() => setNotificationsOpen(true)}
                            >
                                <Bell className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>Notifications</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => setPermissionsOpen(true)}
                            >
                                <Lock className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>Permissions</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                                onClick={() => setDeleteDialogOpen(true)}
                                className="text-destructive focus:text-destructive"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() =>
                                    toast.info('Archive feature coming soon')
                                }
                            >
                                <Archive className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>Archive</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Content Controls */}
            {view === 'list' && (
                <div className="flex items-center justify-between px-8 py-3 border-b border-dashboard-border bg-dashboard-surface/50">
                    <div className="flex items-center gap-2">
                        <Button
                            className="bg-accent-blue hover:bg-accent-light text-white gap-1 rounded-md px-3 font-medium cursor-pointer shadow-sm"
                            onClick={() =>
                                toast.info('New Section feature coming soon')
                            }
                        >
                            New <Plus className="ml-1 h-4 w-4" />
                        </Button>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-dashboard-text-muted" />
                            <Input
                                placeholder="Search tasks..."
                                className="pl-9 bg-dashboard-surface border-dashboard-border shadow-sm text-dashboard-text-body placeholder:text-dashboard-text-muted"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {statusFilter !== 'ALL' && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-dashboard-text-muted hover:text-dashboard-text-primary cursor-pointer"
                                onClick={() => setStatusFilter('ALL')}
                            >
                                <X className="h-3.5 w-3.5" />
                                Clear Filter
                            </Button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="gap-2 text-dashboard-text-muted hover:text-dashboard-text-primary bg-dashboard-surface border-dashboard-border hover:border-accent-blue hover:bg-accent-subtle cursor-pointer"
                                >
                                    <Filter className="h-3.5 w-3.5" />
                                    Status
                                    {statusFilter !== 'ALL' && (
                                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs">
                                            1
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel>
                                    Filter by Status
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === 'ALL'}
                                    onCheckedChange={() =>
                                        setStatusFilter('ALL')
                                    }
                                >
                                    All Tasks
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === 'IN_PREPARATION'}
                                    onCheckedChange={() =>
                                        setStatusFilter('IN_PREPARATION')
                                    }
                                >
                                    In Preparation
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === 'IN_REVIEW'}
                                    onCheckedChange={() =>
                                        setStatusFilter('IN_REVIEW')
                                    }
                                >
                                    In Review
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === 'COMPLETED'}
                                    onCheckedChange={() =>
                                        setStatusFilter('COMPLETED')
                                    }
                                >
                                    Completed
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        'gap-2 text-dashboard-text-muted hover:text-dashboard-text-primary bg-dashboard-surface border-dashboard-border hover:border-accent-blue hover:bg-accent-subtle cursor-pointer',
                                        groupByField &&
                                            'text-accent-blue border-accent-blue/50 bg-accent-subtle',
                                    )}
                                >
                                    <Layers className="h-3.5 w-3.5" />
                                    Group
                                    {groupByField && (
                                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent-blue text-white text-xs font-normal">
                                            1
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>Group by</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                    checked={groupByField === null}
                                    onCheckedChange={() =>
                                        setGroupByField(null)
                                    }
                                >
                                    None
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuSeparator />
                                {/* Internal fields */}
                                <DropdownMenuCheckboxItem
                                    checked={groupByField === 'status'}
                                    onCheckedChange={() =>
                                        setGroupByField('status')
                                    }
                                >
                                    Status
                                </DropdownMenuCheckboxItem>
                                {/* Custom fields */}
                                {customFields.map((field) => (
                                    <DropdownMenuCheckboxItem
                                        key={field.id}
                                        checked={groupByField === field.id}
                                        onCheckedChange={() =>
                                            setGroupByField(field.id)
                                        }
                                    >
                                        {field.name}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2 text-dashboard-text-muted hover:text-dashboard-text-primary bg-dashboard-surface border-dashboard-border hover:border-accent-blue hover:bg-accent-subtle cursor-pointer"
                            onClick={() => setTemplatesOpen(true)}
                        >
                            <LayoutTemplate className="h-3.5 w-3.5" />
                            Templates
                        </Button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-h-0 min-w-0 bg-dashboard-surface rounded-none border-0 overflow-hidden flex flex-col">
                {view === 'calendar' ? (
                    <CalendarViewWrapper tasks={tasks} />
                ) : (
                    <div className="flex flex-col h-full w-full max-w-full">
                        {!isLoadingCustomFields && (
                            <div className="flex-1 overflow-hidden">
                                <TaskList
                                    ref={taskListRef}
                                    tasks={filteredTasks}
                                    customFields={customFields}
                                    onTaskClick={handleTaskSelect}
                                    onTaskEdit={(task) => {
                                        setTaskToEdit(task);
                                        setEditTaskOpen(true);
                                    }}
                                    onTaskDelete={handleDeleteTask}
                                    onTaskCopy={handleCopyTask}
                                    onCustomFieldCreated={fetchCustomFields}
                                    onTaskCreated={onRefresh}
                                    projectId={project.id}
                                    workspaceId={project.workspaceId}
                                    members={Array.from(
                                        new Map(
                                            [
                                                ...project.owners,
                                                ...project.members,
                                            ].map((m) => [m.id, m]),
                                        ).values(),
                                    )}
                                    // New Props
                                    groupByField={groupByField}
                                    columnFilters={columnFilters}
                                    onColumnFilterChange={
                                        handleColumnFilterChange
                                    }
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Delete Project Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this project? This
                            will also delete all tasks in this project. This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteProject}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete Project'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {taskToEdit && (
                <EditTaskDialog
                    open={editTaskOpen}
                    onOpenChange={setEditTaskOpen}
                    task={taskToEdit}
                    onSuccess={onRefresh}
                />
            )}

            {/* Manage Templates Dialog */}
            <ManageTemplatesDialog
                open={templatesOpen}
                onOpenChange={setTemplatesOpen}
                workspaceId={project.workspaceId}
            />

            {/* Import Tasks Dialog (#9) */}
            <Dialog
                open={importModalOpen}
                onOpenChange={(open) => {
                    setImportModalOpen(open);
                    if (!open) setImportFile(null);
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Import Tasks</DialogTitle>
                        <DialogDescription>
                            Upload an Excel (.xlsx, .xls) or CSV file. Tasks are
                            created from rows with a &ldquo;Task Name&rdquo;,
                            &ldquo;Name&rdquo;, or &ldquo;Task&rdquo; column.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div
                            className={cn(
                                'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
                                importFile
                                    ? 'border-accent-blue/50 bg-accent-subtle/30'
                                    : 'border-dashboard-border hover:border-accent-blue/30',
                            )}
                        >
                            {importFile ? (
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-accent-subtle flex items-center justify-center shrink-0">
                                        <Upload className="h-5 w-5 text-accent-blue" />
                                    </div>
                                    <div className="flex-1 text-left min-w-0">
                                        <p className="text-sm font-medium text-dashboard-text-primary truncate">
                                            {importFile.name}
                                        </p>
                                        <p className="text-xs text-dashboard-text-muted">
                                            {(importFile.size / 1024).toFixed(
                                                1,
                                            )}{' '}
                                            KB
                                        </p>
                                    </div>
                                    <button
                                        className="text-dashboard-text-muted hover:text-destructive transition-colors shrink-0"
                                        onClick={() => setImportFile(null)}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ) : (
                                <label className="cursor-pointer block">
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        className="hidden"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) setImportFile(file);
                                        }}
                                    />
                                    <Upload className="h-8 w-8 mx-auto mb-2 text-dashboard-text-muted" />
                                    <p className="text-sm font-medium text-dashboard-text-primary">
                                        Click to upload a file
                                    </p>
                                    <p className="text-xs text-dashboard-text-muted mt-1">
                                        .xlsx, .xls, or .csv
                                    </p>
                                </label>
                            )}
                        </div>
                        {!importFile && (
                            <div className="rounded-md bg-dashboard-surface border border-dashboard-border px-3 py-2.5">
                                <p className="text-xs text-dashboard-text-muted leading-relaxed">
                                    <strong className="text-dashboard-text-body font-medium">
                                        Expected columns:
                                    </strong>{' '}
                                    &ldquo;Task Name&rdquo; (required), plus any
                                    custom field names defined in this project.
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setImportModalOpen(false);
                                setImportFile(null);
                            }}
                            disabled={isImporting}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirmImport}
                            disabled={!importFile || isImporting}
                            className="bg-accent-blue hover:bg-accent-light text-white"
                        >
                            {isImporting ? 'Importing...' : 'Import Tasks'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Email Invite Dialog (#8) */}
            <Dialog
                open={inviteModalOpen}
                onOpenChange={(open) => {
                    setInviteModalOpen(open);
                    if (!open) {
                        setInviteEmail('');
                        setInviteEmailError('');
                    }
                }}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Invite with Email</DialogTitle>
                        <DialogDescription>
                            Send an invitation to collaborate on{' '}
                            <strong>{project.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label
                                htmlFor="invite-email"
                                className="text-sm font-medium text-dashboard-text-body"
                            >
                                Email address
                            </Label>
                            <Input
                                id="invite-email"
                                type="email"
                                placeholder="colleague@example.com"
                                value={inviteEmail}
                                onChange={(e) => {
                                    setInviteEmail(e.target.value);
                                    if (inviteEmailError)
                                        setInviteEmailError('');
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSendInvite();
                                }}
                                className={cn(
                                    'bg-dashboard-surface border-dashboard-border',
                                    inviteEmailError &&
                                        'border-destructive focus-visible:ring-destructive',
                                )}
                                autoFocus
                            />
                            {inviteEmailError && (
                                <p className="text-xs text-destructive">
                                    {inviteEmailError}
                                </p>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setInviteModalOpen(false);
                                setInviteEmail('');
                                setInviteEmailError('');
                            }}
                            disabled={isSendingInvite}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSendInvite}
                            disabled={isSendingInvite || !inviteEmail.trim()}
                            className="bg-accent-blue hover:bg-accent-light text-white"
                        >
                            {isSendingInvite ? 'Sending...' : 'Send Invite'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Activity Log Dialog (#12) */}
            <Dialog open={activityLogOpen} onOpenChange={setActivityLogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-dashboard-text-muted" />
                            Activity Log
                        </DialogTitle>
                        <DialogDescription>
                            Recent activity in <strong>{project.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[360px] overflow-y-auto -mx-1 py-2">
                        {tasks.length > 0 ? (
                            tasks.slice(0, 12).map((task) => (
                                <div
                                    key={task.id}
                                    className="flex items-start gap-3 px-2 py-2.5 rounded-md hover:bg-dashboard-surface transition-colors"
                                >
                                    <div className="mt-2 h-1.5 w-1.5 rounded-full bg-accent-blue shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-dashboard-text-body">
                                            Task{' '}
                                            <strong className="font-medium">
                                                &ldquo;{task.name}&rdquo;
                                            </strong>{' '}
                                            was{' '}
                                            {task.approvalStatus === 'COMPLETED'
                                                ? 'marked complete'
                                                : task.approvalStatus ===
                                                    'IN_REVIEW'
                                                  ? 'sent for review'
                                                  : 'created'}
                                        </p>
                                        <p className="text-xs text-dashboard-text-muted mt-0.5">
                                            {new Date(
                                                task.updatedAt,
                                            ).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-10 text-center">
                                <Activity className="h-8 w-8 mx-auto text-dashboard-text-muted/30 mb-2" />
                                <p className="text-sm text-dashboard-text-muted">
                                    No activity yet
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setActivityLogOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Notification Preferences Dialog (#13) */}
            <Dialog
                open={notificationsOpen}
                onOpenChange={setNotificationsOpen}
            >
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-dashboard-text-muted" />
                            Notification Preferences
                        </DialogTitle>
                        <DialogDescription>
                            Choose what you&apos;d like to be notified about in
                            this project.
                        </DialogDescription>
                    </DialogHeader>
                    {isLoadingPrefs ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-dashboard-text-muted" />
                        </div>
                    ) : (
                        <div className="space-y-1 py-2">
                            {(
                                [
                                    {
                                        workflowKey: 'task-created',
                                        label: 'Task created',
                                        description:
                                            'When a new task is added to this project',
                                    },
                                    {
                                        workflowKey: 'task-updated',
                                        label: 'Task updated',
                                        description:
                                            'When a task is edited or its status changes',
                                    },
                                    {
                                        workflowKey: 'task-deleted',
                                        label: 'Task deleted',
                                        description:
                                            'When a task is removed from this project',
                                    },
                                    {
                                        workflowKey: 'comment-added',
                                        label: 'Comment added',
                                        description:
                                            'When someone comments on a task',
                                    },
                                ] as const
                            ).map(({ workflowKey, label, description }) => (
                                <div
                                    key={workflowKey}
                                    className="flex items-center justify-between gap-4 rounded-md px-1 py-2.5 hover:bg-dashboard-surface transition-colors"
                                >
                                    <div className="flex-1 min-w-0">
                                        <Label
                                            htmlFor={`notif-${workflowKey}`}
                                            className="text-sm font-medium text-dashboard-text-body cursor-pointer"
                                        >
                                            {label}
                                        </Label>
                                        <p className="text-xs text-dashboard-text-muted mt-0.5">
                                            {description}
                                        </p>
                                    </div>
                                    <Switch
                                        id={`notif-${workflowKey}`}
                                        checked={
                                            notifPreferences?.workflows?.[
                                                workflowKey
                                            ] !== false
                                        }
                                        onCheckedChange={(checked) =>
                                            setNotifPreferences({
                                                workflows: {
                                                    [workflowKey]: checked,
                                                },
                                            })
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setNotificationsOpen(false)}
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Permissions Dialog (#14) */}
            <Dialog open={permissionsOpen} onOpenChange={setPermissionsOpen}>
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Lock className="h-4 w-4 text-dashboard-text-muted" />
                            Project Permissions
                        </DialogTitle>
                        <DialogDescription>
                            Control who can access and edit{' '}
                            <strong>{project.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-5 py-2">
                        {/* Visibility */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-dashboard-text-body">
                                Visibility
                            </Label>
                            <RadioGroup
                                value={projectVisibility}
                                onValueChange={(v) =>
                                    setProjectVisibility(
                                        v as typeof projectVisibility,
                                    )
                                }
                                className="space-y-2"
                            >
                                {(
                                    [
                                        {
                                            value: 'private',
                                            label: 'Private',
                                            description:
                                                'Only invited members can view',
                                        },
                                        {
                                            value: 'team',
                                            label: 'Team',
                                            description:
                                                'All workspace members can view',
                                        },
                                        {
                                            value: 'public',
                                            label: 'Public',
                                            description:
                                                'Anyone with the link can view',
                                        },
                                    ] as const
                                ).map(({ value, label, description }) => (
                                    <div
                                        key={value}
                                        className={cn(
                                            'flex items-start gap-3 rounded-md border px-3 py-2.5 cursor-pointer transition-colors',
                                            projectVisibility === value
                                                ? 'border-accent-blue/50 bg-accent-subtle/40'
                                                : 'border-dashboard-border hover:bg-dashboard-surface',
                                        )}
                                        onClick={() =>
                                            setProjectVisibility(value)
                                        }
                                    >
                                        <RadioGroupItem
                                            value={value}
                                            id={`vis-${value}`}
                                            className="mt-0.5"
                                        />
                                        <div>
                                            <Label
                                                htmlFor={`vis-${value}`}
                                                className="text-sm font-medium text-dashboard-text-body cursor-pointer"
                                            >
                                                {label}
                                            </Label>
                                            <p className="text-xs text-dashboard-text-muted mt-0.5">
                                                {description}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        {/* Member roles */}
                        {(project.owners.length > 0 ||
                            project.members.length > 0) && (
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-dashboard-text-body">
                                    Member Access
                                </Label>
                                <div className="space-y-1 max-h-40 overflow-y-auto">
                                    {[
                                        ...project.owners.map((u) => ({
                                            ...u,
                                            role: 'Owner',
                                        })),
                                        ...project.members.map((u) => ({
                                            ...u,
                                            role: 'Member',
                                        })),
                                    ].map((member) => {
                                        const initials = member.firstName
                                            ? `${member.firstName[0]}${member.lastName?.[0] ?? ''}`.toUpperCase()
                                            : member.email[0].toUpperCase();
                                        const displayName = member.firstName
                                            ? `${member.firstName} ${member.lastName ?? ''}`.trim()
                                            : member.email;
                                        return (
                                            <div
                                                key={member.id}
                                                className="flex items-center gap-2.5 py-1.5 rounded-md hover:bg-dashboard-surface px-1 transition-colors"
                                            >
                                                <div className="h-7 w-7 rounded-full bg-accent-subtle border border-dashboard-border flex items-center justify-center text-[10px] font-semibold text-accent-blue shrink-0">
                                                    {initials}
                                                </div>
                                                <span className="flex-1 text-sm text-dashboard-text-body truncate min-w-0">
                                                    {displayName}
                                                </span>
                                                <span className="text-xs text-dashboard-text-muted shrink-0">
                                                    {member.role}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setPermissionsOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={() => {
                                toast.success('Permissions saved');
                                setPermissionsOpen(false);
                            }}
                            className="bg-accent-blue hover:bg-accent-light text-white"
                        >
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
