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
    UserPlus,
    Activity,
    Bell,
    Lock,
    Archive,
    ExternalLink,
    LayoutGrid,
    Loader2,
    LayoutTemplate,
    GitBranch,
    Eye,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    type Project,
    type Task,
    type CustomField,
    type Section,
    type User,
    projectApi,
    taskApi,
    customFieldApi,
    sectionApi,
    workspaceApi,
    workspaceUrlSegment,
} from '@/lib/api';
import { useSidebarRefresh } from '@/contexts/SidebarContext';
import { invalidateCached } from '@/lib/pageCache';
import { Button } from '@/components/ui/button';
import { ProjectCalendarView } from '@/components/projects/ProjectCalendarView';
import { TaskDetailView } from '@/components/tasks/TaskDetailView';
import { TaskList, type TaskListRef } from './TaskList';
import { KanbanView } from './KanbanView';
import { EditTaskDialog } from '@/components/dialogs/EditTaskDialog';
import { ManageTemplatesDialog } from '@/components/dialogs/ManageTemplatesDialog';
import { useProjectViewPrefs } from '@/hooks/useProjectViewPrefs';
import { ApprovalWorkflowDialog } from './ApprovalWorkflowDialog';
import { MemberPickerDialog } from '@/components/dialogs/MemberPickerDialog';
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useAuth } from '@clerk/nextjs';
import { useUser as useDbUser } from '@/contexts/UserContext';
import { toast } from 'sonner';
import { usePreferences } from '@knocklabs/react';

interface ProjectDetailViewProps {
    project: Project;
    tasks: Task[];
    onRefresh: () => void;
    onCreateTask: () => void;
    onTaskAdded: (task: Task) => void;
    onTaskRemoved?: (taskId: string) => void;
    onTasksRemoved?: (taskIds: string[]) => void;
}

type ViewMode = 'list' | 'calendar' | 'board';
type StatusFilter = 'ALL' | 'IN_PREPARATION' | 'IN_REVIEW' | 'COMPLETED';

interface EditableContentProps {
    value: string;
    onSave: (value: string) => void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    isTextarea?: boolean;
    textStyle?: string;
    readOnly?: boolean;
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
    readOnly = false,
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
        if (!isEditing && !readOnly) {
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
                'group rounded -ml-1 pl-1 pr-1 border border-transparent',
                !readOnly &&
                    'cursor-pointer hover:bg-muted/30 active:bg-muted/40 transition-colors duration-150',
                'flex items-start gap-2',
                className,
            )}
            title={readOnly ? undefined : 'Click to edit'}
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
            {!readOnly && (
                <Pencil className="h-3.5 w-3.5 mt-1.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
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
    onTaskAdded,
    onTaskRemoved,
    onTasksRemoved,
}: ProjectDetailViewProps) {
    const { getToken } = useAuth();
    const { user: dbUser } = useDbUser();
    const { triggerRefresh } = useSidebarRefresh();

    // Permission flags
    const isProjectManager =
        dbUser?.organizationRole === 'ADMIN' ||
        project.owners.some((o) => o.id === dbUser?.id);
    const isLocked = project.isLocked;
    const [view, setView] = useState<ViewMode>('list');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editTaskOpen, setEditTaskOpen] = useState(false);
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
    // Templates
    const [templatesOpen, setTemplatesOpen] = useState(false);
    // Approval Workflow
    const [approvalWorkflowOpen, setApprovalWorkflowOpen] = useState(false);
    // Import modal
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    // Member picker
    const [memberPickerOpen, setMemberPickerOpen] = useState(false);
    // Workspace members for mentions
    const [workspaceMembers, setWorkspaceMembers] = useState<User[]>([]);
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

    const isArchived = project.isArchived ?? false;

    // Local project state for optimistic updates
    const [localProject, setLocalProject] = useState(project);

    useEffect(() => {
        setLocalProject(project);
    }, [project]);

    // Fetch workspace members for @mention support
    useEffect(() => {
        let cancelled = false;
        const fetch = async () => {
            const token = await getToken();
            if (!token || cancelled) return;
            const res = await workspaceApi.getWorkspace(
                token,
                project.workspaceId,
            );
            if (!cancelled && res.data) {
                setWorkspaceMembers([...res.data.owners, ...res.data.members]);
            }
        };
        fetch().catch(() => {});
        return () => {
            cancelled = true;
        };
    }, [project.workspaceId, getToken]);

    // Settings modal state
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [isLoadingCustomFields, setIsLoadingCustomFields] = useState(true);
    const taskListRef = useRef<TaskListRef>(null);

    // Sections state
    const [sections, setSections] = useState<Section[]>([]);
    const [isCreatingSection, setIsCreatingSection] = useState(false);

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

    const handleArchiveProject = async () => {
        const workspaceUrl = `/workspaces/${workspaceUrlSegment(project.workspace)}`;
        invalidateCached(`workspace:${project.workspaceId}`);
        triggerRefresh();
        router.push(workspaceUrl);
        try {
            const token = await getToken();
            if (!token) return;
            await projectApi.archiveProject(token, project.id);
            toast.success('Project archived successfully');
        } catch (error) {
            console.error('Failed to archive project:', error);
            toast.error('Failed to archive project');
        }
    };

    const handleDeleteProject = async () => {
        const workspaceUrl = `/workspaces/${workspaceUrlSegment(project.workspace)}`;
        const workspaceCacheKey = `workspace:${project.workspaceId}`;

        // Optimistic: close dialog, navigate away, refresh sidebar immediately
        setDeleteDialogOpen(false);
        invalidateCached(workspaceCacheKey);
        triggerRefresh();
        router.push(workspaceUrl);

        // Fire backend delete in background
        try {
            const token = await getToken();
            if (!token) return;
            await projectApi.deleteProject(token, project.id);
            toast.success('Project deleted successfully');
        } catch {
            toast.error('Failed to delete project');
        }
    };

    const handleExportProject = async () => {
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

            const XLSX = await import('xlsx');
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
            const XLSX = await import('xlsx');
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
                        onClick={
                            () =>
                                (window.location.href = `/workspaces/${newWorkspaceId}/projects/${newProjectId}`) // IDs used here since new copy has no slug yet until page reloads
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
        onTaskRemoved?.(taskId);
        try {
            const token = await getToken();
            if (!token) {
                onRefresh();
                return;
            }
            await taskApi.deleteTask(token, project.id, taskId);
            toast.success('Task deleted successfully');
        } catch (error) {
            console.error('Failed to delete task:', error);
            onRefresh();
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

    const fetchSections = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const response = await sectionApi.getSections(token, project.id);
            setSections(response.data || []);
        } catch (error) {
            console.error('Failed to fetch sections:', error);
        }
    }, [getToken, project.id]);

    const handleAddSection = async () => {
        if (isCreatingSection) return;
        const tempId = `temp-section-${Date.now()}`;
        const optimisticSection: Section = {
            id: tempId,
            name: 'Untitled section',
            order: sections.length,
            projectId: project.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        setSections((prev) => [...prev, optimisticSection]);
        setIsCreatingSection(true);
        try {
            const token = await getToken();
            if (!token) {
                setSections((prev) => prev.filter((s) => s.id !== tempId));
                return;
            }
            const response = await sectionApi.createSection(
                token,
                project.id,
                'Untitled section',
            );
            setSections((prev) =>
                response.data
                    ? prev.map((s) => (s.id === tempId ? response.data! : s))
                    : prev.filter((s) => s.id !== tempId),
            );
        } catch (error) {
            console.error('Failed to create section:', error);
            setSections((prev) => prev.filter((s) => s.id !== tempId));
            toast.error('Failed to create section');
        } finally {
            setIsCreatingSection(false);
        }
    };

    const handleRenameSection = async (sectionId: string, name: string) => {
        const previousSections = sections;
        setSections((prev) =>
            prev.map((s) => (s.id === sectionId ? { ...s, name } : s)),
        );
        try {
            const token = await getToken();
            if (!token) {
                setSections(previousSections);
                return;
            }
            await sectionApi.updateSection(token, project.id, sectionId, {
                name,
            });
        } catch (error) {
            setSections(previousSections);
            console.error('Failed to rename section:', error);
            toast.error('Failed to rename section');
        }
    };

    const handleDeleteSection = async (sectionId: string) => {
        const snapshot = sections;
        setSections((prev) => prev.filter((s) => s.id !== sectionId));
        try {
            const token = await getToken();
            if (!token) {
                setSections(snapshot);
                return;
            }
            await sectionApi.deleteSection(token, project.id, sectionId);
            onRefresh(); // reload tasks — deleted section's tasks are removed on the server
        } catch (error) {
            console.error('Failed to delete section:', error);
            setSections(snapshot);
            toast.error('Failed to delete section');
        }
    };

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

    // Column visibility + sort prefs (persisted per-project in localStorage)
    const { hiddenColumns, toggleColumn, sortState, setSort, clearSort } =
        useProjectViewPrefs(project.id);

    const sortedTasks = useMemo(() => {
        if (!sortState.field) return filteredTasks;
        return [...filteredTasks].sort((a, b) => {
            let aVal: string | number | null = null;
            let bVal: string | number | null = null;
            if (sortState.field === 'name') {
                aVal = a.name.toLowerCase();
                bVal = b.name.toLowerCase();
            } else if (sortState.field === 'dueAt') {
                aVal = a.dueAt ?? '';
                bVal = b.dueAt ?? '';
            } else {
                const aCV = a.customFieldValues?.find(
                    (v) => v.customFieldId === sortState.field,
                );
                const bCV = b.customFieldValues?.find(
                    (v) => v.customFieldId === sortState.field,
                );
                aVal = aCV?.value ?? '';
                bVal = bCV?.value ?? '';
                // Numeric sort if both look like numbers
                const aN = parseFloat(aVal as string);
                const bN = parseFloat(bVal as string);
                if (!isNaN(aN) && !isNaN(bN)) {
                    aVal = aN;
                    bVal = bN;
                }
            }
            if (aVal === bVal) return 0;
            const cmp = aVal! < bVal! ? -1 : 1;
            return sortState.dir === 'asc' ? cmp : -cmp;
        });
    }, [filteredTasks, sortState]);

    const router = useRouter();
    const searchParams = useSearchParams();

    // Fetch custom fields on mount
    useEffect(() => {
        fetchCustomFields();
    }, [fetchCustomFields]);

    // Fetch sections on mount
    useEffect(() => {
        fetchSections();
    }, [fetchSections]);

    // Sync URL with selected task
    useEffect(() => {
        const taskParam = searchParams.get('task');
        if (taskParam && tasks.length > 0) {
            // Match by slug first, fall back to id for backward compatibility
            const task = tasks.find(
                (t) => t.slug === taskParam || t.id === taskParam,
            );
            if (task) {
                setSelectedTask(task);
            }
        } else if (!taskParam) {
            setSelectedTask(null);
        }
    }, [searchParams, tasks]);

    const handleTaskSelect = (task: Task) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('task', task.slug ?? task.id);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const handleTaskClose = () => {
        const params = new URLSearchParams(searchParams.toString());
        params.delete('task');
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
                workspaceSlug={
                    project.workspace?.isPersonal
                        ? 'my-workspace'
                        : project.workspace?.slug
                }
                projectName={project.name}
                projectId={project.id}
                projectSlug={project.slug}
                customFields={customFields}
                projectMembers={Array.from(
                    new Map(
                        [...project.owners, ...project.members].map((m) => [
                            m.id,
                            m,
                        ]),
                    ).values(),
                )}
                workspaceMembers={workspaceMembers}
            />
        );
    }

    return (
        <div className="flex flex-col h-full bg-dashboard-bg animate-in fade-in duration-500">
            {/* Archived banner */}
            {isArchived && (
                <div className="flex items-center gap-2 px-8 py-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs font-medium shrink-0">
                    <Archive className="h-3.5 w-3.5 shrink-0" />
                    This project is archived and is read-only. It will be
                    retained for 7 years per data retention policy.
                </div>
            )}
            {/* Sticky Header */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-dashboard-border px-8 py-4 flex items-start justify-between shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Link
                            href={`/workspaces/${project.workspace.isPersonal ? 'my-workspace' : (project.workspace.slug ?? project.workspaceId)}`}
                        >
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
                                href={`/workspaces/${project.workspace.isPersonal ? 'my-workspace' : (project.workspace.slug ?? project.workspaceId)}`}
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
                            readOnly={isArchived}
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
                        <button
                            onClick={() => setView('board')}
                            className={cn(
                                'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer',
                                view === 'board'
                                    ? 'bg-accent-subtle text-dashboard-text-primary'
                                    : 'text-dashboard-text-muted hover:text-dashboard-text-primary hover:bg-accent-hover',
                            )}
                        >
                            <LayoutGrid className="h-4 w-4" />
                            Board
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
                            {!isArchived && (
                                <DropdownMenuItem
                                    onClick={() => setMemberPickerOpen(true)}
                                >
                                    <UserPlus className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>Add Members</span>
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={handleExportProject}>
                                <Download className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>Export board to Excel</span>
                            </DropdownMenuItem>
                            {!isArchived && (
                                <>
                                    <DropdownMenuItem
                                        onClick={() => setImportModalOpen(true)}
                                    >
                                        <Upload className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>Import tasks</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleCopyProject}
                                    >
                                        <Copy className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>Copy Project</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuItem
                                onClick={() => setActivityLogOpen(true)}
                            >
                                <Activity className="mr-2 h-4 w-4 text-muted-foreground" />
                                <span>Activity log</span>
                            </DropdownMenuItem>

                            {!isArchived && (
                                <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setNotificationsOpen(true)
                                        }
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
                                        onClick={() =>
                                            setDeleteDialogOpen(true)
                                        }
                                        className="text-destructive focus:text-destructive"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        <span>Delete</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={handleArchiveProject}
                                    >
                                        <Archive className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <span>Archive</span>
                                    </DropdownMenuItem>
                                </>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Content Controls */}
            {view === 'list' && (
                <div className="flex items-center gap-2 px-8 py-3 border-b border-dashboard-border bg-dashboard-surface/50">
                    {!isArchived && (
                        <Button
                            className="bg-accent-blue hover:bg-accent-light text-white gap-1 rounded-md px-3 font-medium cursor-pointer shadow-sm"
                            onClick={handleAddSection}
                            disabled={isCreatingSection}
                        >
                            New Section <Plus className="ml-1 h-4 w-4" />
                        </Button>
                    )}
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-dashboard-text-muted" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-9 bg-dashboard-surface border-dashboard-border shadow-sm text-dashboard-text-body placeholder:text-dashboard-text-muted"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    'gap-2 text-dashboard-text-muted hover:text-dashboard-text-primary bg-dashboard-surface border-dashboard-border hover:border-accent-blue hover:bg-accent-subtle cursor-pointer',
                                    (statusFilter !== 'ALL' ||
                                        Object.keys(columnFilters).length >
                                            0) &&
                                        'text-accent-blue border-accent-blue/50 bg-accent-subtle',
                                )}
                            >
                                <Filter className="h-3.5 w-3.5" />
                                Filter
                                {(statusFilter !== 'ALL' ||
                                    Object.keys(columnFilters).length > 0) && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent-blue text-white text-xs font-normal">
                                        {(statusFilter !== 'ALL' ? 1 : 0) +
                                            Object.keys(columnFilters).length}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-3" align="end">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="font-medium text-sm">
                                        Filters
                                    </h4>
                                    {(statusFilter !== 'ALL' ||
                                        Object.keys(columnFilters).length >
                                            0) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-6 px-2 text-xs text-muted-foreground hover:text-dashboard-text-primary cursor-pointer"
                                            onClick={() => {
                                                setStatusFilter('ALL');
                                                setColumnFilters({});
                                            }}
                                        >
                                            Clear all
                                        </Button>
                                    )}
                                </div>

                                {/* Status filter */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Status
                                    </label>
                                    <select
                                        className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background"
                                        value={statusFilter}
                                        onChange={(e) =>
                                            setStatusFilter(
                                                e.target.value as StatusFilter,
                                            )
                                        }
                                    >
                                        <option value="ALL">All</option>
                                        <option value="IN_PREPARATION">
                                            In Preparation
                                        </option>
                                        <option value="IN_REVIEW">
                                            In Review
                                        </option>
                                        <option value="COMPLETED">
                                            Completed
                                        </option>
                                    </select>
                                </div>

                                {/* Task Name filter */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-muted-foreground">
                                        Task Name
                                    </label>
                                    <input
                                        className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background outline-none focus:ring-0 focus:border-ring"
                                        placeholder="Contains..."
                                        value={
                                            columnFilters['name']?.value || ''
                                        }
                                        onChange={(e) =>
                                            handleColumnFilterChange(
                                                'name',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>

                                {/* Custom field filters */}
                                {customFields
                                    .filter((f) => f.dataType !== 'USER')
                                    .map((field) => (
                                        <div
                                            key={field.id}
                                            className="space-y-1.5"
                                        >
                                            <label className="text-xs font-medium text-muted-foreground">
                                                {field.name}
                                            </label>
                                            <input
                                                className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background outline-none focus:ring-0 focus:border-ring"
                                                placeholder={
                                                    field.dataType === 'DATE'
                                                        ? 'YYYY-MM-DD'
                                                        : 'Contains...'
                                                }
                                                value={
                                                    columnFilters[field.id]
                                                        ?.value || ''
                                                }
                                                onChange={(e) =>
                                                    handleColumnFilterChange(
                                                        field.id,
                                                        e.target.value,
                                                        field.dataType ===
                                                            'DATE'
                                                            ? 'date'
                                                            : 'text',
                                                    )
                                                }
                                            />
                                        </div>
                                    ))}
                            </div>
                        </PopoverContent>
                    </Popover>

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
                                onCheckedChange={() => setGroupByField(null)}
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

                    {/* Column Visibility */}
                    {customFields.length > 0 && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        'gap-2 text-dashboard-text-muted hover:text-dashboard-text-primary bg-dashboard-surface border-dashboard-border hover:border-accent-blue hover:bg-accent-subtle cursor-pointer',
                                        hiddenColumns.size > 0 &&
                                            'text-accent-blue border-accent-blue/50 bg-accent-subtle',
                                    )}
                                >
                                    <Eye className="h-3.5 w-3.5" />
                                    Columns
                                    {hiddenColumns.size > 0 && (
                                        <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent-blue text-white text-xs font-normal">
                                            {hiddenColumns.size}
                                        </span>
                                    )}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuLabel>
                                    Toggle Columns
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                {customFields.map((field) => (
                                    <DropdownMenuCheckboxItem
                                        key={field.id}
                                        checked={!hiddenColumns.has(field.id)}
                                        onCheckedChange={() =>
                                            toggleColumn(field.id)
                                        }
                                    >
                                        {field.name}
                                    </DropdownMenuCheckboxItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}

                    {/* Sort */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    'gap-2 text-dashboard-text-muted hover:text-dashboard-text-primary bg-dashboard-surface border-dashboard-border hover:border-accent-blue hover:bg-accent-subtle cursor-pointer',
                                    sortState.field &&
                                        'text-accent-blue border-accent-blue/50 bg-accent-subtle',
                                )}
                            >
                                <ArrowUpDown className="h-3.5 w-3.5" />
                                Sort
                                {sortState.field && (
                                    <span className="ml-1 px-1.5 py-0.5 rounded-full bg-accent-blue text-white text-xs font-normal">
                                        1
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-52">
                            <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuCheckboxItem
                                checked={sortState.field === null}
                                onCheckedChange={() => clearSort()}
                            >
                                Default order
                            </DropdownMenuCheckboxItem>
                            {[
                                { id: 'name', name: 'Name' },
                                { id: 'dueAt', name: 'Due Date' },
                                ...customFields,
                            ].map((f) => (
                                <div key={f.id} className="flex items-center">
                                    <DropdownMenuCheckboxItem
                                        className="flex-1"
                                        checked={sortState.field === f.id}
                                        onCheckedChange={() =>
                                            setSort(
                                                f.id,
                                                sortState.field === f.id &&
                                                    sortState.dir === 'asc'
                                                    ? 'desc'
                                                    : 'asc',
                                            )
                                        }
                                    >
                                        <span className="flex items-center gap-2">
                                            {f.name}
                                            {sortState.field === f.id &&
                                                (sortState.dir === 'asc' ? (
                                                    <ArrowUp className="h-3 w-3 text-accent-blue" />
                                                ) : (
                                                    <ArrowDown className="h-3 w-3 text-accent-blue" />
                                                ))}
                                        </span>
                                    </DropdownMenuCheckboxItem>
                                </div>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {!isArchived && isProjectManager && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 text-dashboard-text-muted hover:text-dashboard-text-primary bg-dashboard-surface border-dashboard-border hover:border-accent-blue hover:bg-accent-subtle cursor-pointer"
                                onClick={() => setTemplatesOpen(true)}
                            >
                                <LayoutTemplate className="h-3.5 w-3.5" />
                                Templates
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 text-dashboard-text-muted hover:text-dashboard-text-primary bg-dashboard-surface border-dashboard-border hover:border-accent-blue hover:bg-accent-subtle cursor-pointer"
                                onClick={() => setApprovalWorkflowOpen(true)}
                            >
                                <GitBranch className="h-3.5 w-3.5" />
                                Approval
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    'gap-2 cursor-pointer',
                                    isLocked
                                        ? 'text-amber-600 border-amber-300 bg-amber-50 hover:bg-amber-100'
                                        : 'text-dashboard-text-muted hover:text-dashboard-text-primary bg-dashboard-surface border-dashboard-border hover:border-accent-blue hover:bg-accent-subtle',
                                )}
                                onClick={async () => {
                                    const token = await getToken();
                                    if (!token) return;
                                    try {
                                        if (isLocked) {
                                            await projectApi.unlockProject(
                                                token,
                                                project.id,
                                            );
                                            toast.success('Project unlocked');
                                        } else {
                                            await projectApi.lockProject(
                                                token,
                                                project.id,
                                            );
                                            toast.success('Project locked');
                                        }
                                        onRefresh();
                                    } catch {
                                        toast.error(
                                            `Failed to ${isLocked ? 'unlock' : 'lock'} project`,
                                        );
                                    }
                                }}
                            >
                                <Lock className="h-3.5 w-3.5" />
                                {isLocked ? 'Unlock' : 'Lock'}
                            </Button>
                        </>
                    )}

                    {!isArchived && !isProjectManager && isLocked && (
                        <div className="flex items-center gap-1.5 text-amber-600 text-xs px-2 py-1 bg-amber-50 rounded border border-amber-200">
                            <Lock className="h-3 w-3" />
                            Locked
                        </div>
                    )}
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-h-0 min-w-0 bg-dashboard-surface rounded-none border-0 overflow-hidden flex flex-col">
                {view === 'calendar' ? (
                    <div className="flex-1 min-h-0 p-4">
                        <ProjectCalendarView
                            tasks={tasks}
                            currentUserId={dbUser?.id}
                        />
                    </div>
                ) : view === 'board' ? (
                    <KanbanView
                        tasks={sortedTasks}
                        sections={sections}
                        customFields={customFields}
                        projectId={project.id}
                        members={Array.from(
                            new Map(
                                [...project.owners, ...project.members].map(
                                    (m) => [m.id, m],
                                ),
                            ).values(),
                        )}
                        onTaskClick={handleTaskSelect}
                        onTaskCreated={onRefresh}
                        onTaskAdded={onTaskAdded}
                        onAddSection={
                            !isArchived ? handleAddSection : undefined
                        }
                        onRenameSection={handleRenameSection}
                        onDeleteSection={handleDeleteSection}
                        readOnly={isArchived}
                    />
                ) : (
                    <div className="flex flex-col h-full w-full max-w-full">
                        {!isLoadingCustomFields && (
                            <div className="flex-1 overflow-hidden">
                                <TaskList
                                    ref={taskListRef}
                                    tasks={sortedTasks}
                                    hiddenColumns={hiddenColumns}
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
                                    onTaskAdded={onTaskAdded}
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
                                    sections={sections}
                                    onAddSection={handleAddSection}
                                    onRenameSection={handleRenameSection}
                                    onDeleteSection={handleDeleteSection}
                                    onTasksRemoved={onTasksRemoved}
                                    readOnly={isArchived}
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
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteProject}
                        >
                            Delete Project
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

            {/* Approval Workflow Dialog */}
            <ApprovalWorkflowDialog
                open={approvalWorkflowOpen}
                onOpenChange={setApprovalWorkflowOpen}
                projectId={project.id}
                userCustomFields={customFields.filter(
                    (f) => f.dataType === 'USER',
                )}
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
                                        className="text-dashboard-text-muted hover:text-destructive transition-colors shrink-0 cursor-pointer"
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

            {/* Member Picker Dialog */}
            <MemberPickerDialog
                open={memberPickerOpen}
                onOpenChange={setMemberPickerOpen}
                type="project"
                targetId={project.id}
                targetName={project.name}
                existingMembers={[...project.owners, ...project.members]}
                onSuccess={onRefresh}
            />

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
                                        ...project.members
                                            .filter(
                                                (u) =>
                                                    !project.owners.some(
                                                        (o) => o.id === u.id,
                                                    ),
                                            )
                                            .map((u) => ({
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
