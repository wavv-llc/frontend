'use client';

import {
    useState,
    useEffect,
    useRef,
    useLayoutEffect,
    useCallback,
} from 'react';
import type { TaskListRef } from './TaskList';
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
import { ProjectCalendarView } from './ProjectCalendarView';
import { TaskDetailView } from '@/components/tasks/TaskDetailView';
import { TaskList } from './TaskList';
import { EditTaskDialog } from '@/components/dialogs/EditTaskDialog';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

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

interface ProjectDetailViewProps {
    project: Project;
    tasks: Task[];
    onRefresh: () => void;
    onCreateTask: () => void;
}

type ViewMode = 'list' | 'calendar';
type StatusFilter =
    | 'ALL'
    | 'PENDING'
    | 'IN_PROGRESS'
    | 'IN_REVIEW'
    | 'COMPLETED';

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
                        'outline-none cursor-text rounded px-1 -mx-1 py-0.5 -my-0.5 break-words',
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
            <div className={cn('flex-1 break-words min-h-[1.5em]', textStyle)}>
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
                    Status: task.status,
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

    const handleImportProject = async (
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const data = await file.arrayBuffer();
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

            toast.info(`Importing ${jsonData.length} tasks...`);

            // Process one by one for now
            // We assume column names match 'Task Name' and Custom Field names
            // This is a basic implementation

            let count = 0;
            for (const row of jsonData as Record<string, unknown>[]) {
                const taskName = row['Task Name'] || row['Name'] || row['Task'];
                if (!taskName) continue;

                // Try to map custom fields
                const customFieldsPayload: Record<string, string> = {};

                customFields.forEach((field) => {
                    if (row[field.name]) {
                        // Simplify: just take string value.
                        // For User fields, we'd need email lookup which might not be in row.
                        // For now, only string/number/date fields might import cleanly directly.
                        // Use as is.
                        customFieldsPayload[field.id] = row[field.name];
                    }
                });

                await taskApi.createTask(token, project.id, {
                    name: taskName,
                    status: 'PENDING',
                    customFields: customFieldsPayload,
                });
                count++;
            }

            toast.success(`Imported ${count} tasks`);
            onRefresh();
        } catch (error) {
            console.error('Import failed:', error);
            toast.error('Failed to import file');
        }

        // Reset input
        e.target.value = '';
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
                            status: task.status,
                            customFields: newCustomFields,
                        });
                    }),
                );
            }

            toast.success('Project copied successfully');
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
            statusFilter === 'ALL' || task.status === statusFilter;

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
        <div className="flex flex-col h-full space-y-8 animate-in fade-in duration-500 p-8">
            {/* Header Section */}
            <div className="flex flex-col gap-8">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Link href={`/workspaces/${project.workspaceId}`}>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 -ml-1 text-muted-foreground hover:text-foreground cursor-pointer"
                                    onClick={() => window.history.back()}
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Link
                                    href={`/workspaces/${project.workspaceId}`}
                                    className="hover:text-foreground hover:underline transition-colors cursor-pointer"
                                >
                                    {project.workspace.name}
                                </Link>
                                <span className="text-muted-foreground/40">
                                    /
                                </span>
                                <span className="font-medium text-foreground">
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
                                textStyle="text-3xl font-serif font-semibold tracking-tight text-foreground"
                                inputClassName="text-3xl font-serif font-semibold h-auto py-1 px-2"
                                placeholder="Project Name"
                            />
                            <EditableContent
                                value={localProject.description || ''}
                                onSave={(val) =>
                                    handleUpdateProjectField({
                                        description: val,
                                    })
                                }
                                className="w-full mt-1"
                                textStyle="text-sm text-muted-foreground"
                                inputClassName="text-sm min-h-[80px]"
                                isTextarea
                                placeholder="Add a description..."
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white p-1 rounded-lg border border-border shadow-sm mr-2">
                            <button
                                onClick={() => setView('list')}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer',
                                    view === 'list'
                                        ? 'bg-muted text-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
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
                                        ? 'bg-muted text-foreground'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
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
                                    className="h-9 w-9 bg-white border-border hover:bg-muted shadow-sm cursor-pointer"
                                    title="Project Settings"
                                >
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuItem
                                    onClick={() =>
                                        toast.info('Invite feature coming soon')
                                    }
                                >
                                    <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>Invite with email</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleExportProject}>
                                    <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>Export board to Excel</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        document
                                            .getElementById('import-file-input')
                                            ?.click()
                                    }
                                >
                                    <Upload className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>Import tasks</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCopyProject}>
                                    <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>Copy Project</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        toast.info(
                                            'Activity log feature coming soon',
                                        )
                                    }
                                >
                                    <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>Activity log</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    onClick={() =>
                                        toast.info(
                                            'Notifications feature coming soon',
                                        )
                                    }
                                >
                                    <Bell className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>Notifications</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() =>
                                        toast.info(
                                            'Permissions feature coming soon',
                                        )
                                    }
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
                                        toast.info(
                                            'Archive feature coming soon',
                                        )
                                    }
                                >
                                    <Archive className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>Archive</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        {/* Hidden import input available globally for the menu item */}
                        <input
                            id="import-file-input"
                            type="file"
                            accept=".xlsx, .xls, .csv"
                            className="hidden"
                            onChange={handleImportProject}
                        />
                    </div>
                </div>
            </div>

            {/* Content Controls */}
            {view === 'list' && (
                <div className="flex items-center justify-between pb-2">
                    <div className="flex items-center gap-2">
                        <Button
                            className="bg-blue-600 hover:bg-blue-700 text-white gap-1 rounded-md px-3 font-medium cursor-pointer shadow-sm"
                            onClick={() =>
                                toast.info('New Section feature coming soon')
                            }
                        >
                            New <Plus className="ml-1 h-4 w-4" />
                        </Button>
                        <div className="relative w-72">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search tasks..."
                                className="pl-9 bg-white border-border shadow-sm"
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
                                className="gap-2 text-muted-foreground hover:text-foreground cursor-pointer"
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
                                    className="gap-2 text-muted-foreground hover:text-foreground bg-white cursor-pointer"
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
                                    checked={statusFilter === 'PENDING'}
                                    onCheckedChange={() =>
                                        setStatusFilter('PENDING')
                                    }
                                >
                                    Pending
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === 'IN_PROGRESS'}
                                    onCheckedChange={() =>
                                        setStatusFilter('IN_PROGRESS')
                                    }
                                >
                                    In Progress
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
                                        'gap-2 text-muted-foreground hover:text-foreground bg-white cursor-pointer',
                                        groupByField &&
                                            'text-primary border-primary/50 bg-primary/5',
                                    )}
                                >
                                    <Layers className="h-3.5 w-3.5" />
                                    Group
                                    {groupByField && (
                                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-normal">
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
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-h-0 min-w-0 bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                {view === 'calendar' ? (
                    <div className="flex-1 min-h-0">
                        <ProjectCalendarView tasks={tasks} />
                    </div>
                ) : (
                    <div className="flex flex-col h-full w-full max-w-full">
                        {/* Loading state */}
                        {isLoadingCustomFields ? (
                            <div className="flex flex-col gap-2 p-4">
                                {[1, 2, 3, 4, 5].map((i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-4"
                                    >
                                        <Skeleton className="h-4 w-4 rounded-full" />
                                        <Skeleton className="h-4 flex-1" />
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-8 w-8 rounded-full" />
                                    </div>
                                ))}
                            </div>
                        ) : (
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
        </div>
    );
}
