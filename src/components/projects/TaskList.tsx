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
    Plus,
    CheckCircle2,
    MoreVertical,
    Trash2,
    Copy,
    Calendar,
    Type,
    Hash,
    User as UserIcon,
    ChevronRight,
    ChevronDown,
    Filter,
    X,
    FileText,
    CheckSquare,
    Pencil,
    ExternalLink,
    LayoutTemplate,
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
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
    customFieldApi,
    taskApi,
} from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
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
import { Switch } from '@/components/ui/switch';
import { MultiSelect } from '@/components/ui/multi-select';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

import { Checkbox } from '@/components/ui/checkbox';
import {
    StatusBadge,
    type Status as StatusBadgeStatus,
} from '@/components/dashboard/pure-steel/StatusBadge';

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
}

// Concise field types per CPA feedback
const FIELD_TYPES = [
    {
        value: 'STRING' as DataType,
        label: 'Text',
        icon: Type,
        description: 'Plain text field',
    },
    {
        value: 'NUMBER' as DataType,
        label: 'Number',
        icon: Hash,
        description: 'Numeric value',
    },
    {
        value: 'DATE' as DataType,
        label: 'Date',
        icon: Calendar,
        description: 'Date picker',
    },
    {
        value: 'USER' as DataType,
        label: 'Person',
        icon: UserIcon,
        description: 'Assign a person',
    },
    {
        value: 'TASK' as DataType,
        label: 'Task',
        icon: CheckSquare,
        description: 'Link to a task',
    },
    {
        value: 'DOCUMENT' as DataType,
        label: 'Document',
        icon: FileText,
        description: 'Link to a document',
    },
    {
        value: 'CUSTOM' as DataType,
        label: 'Status',
        icon: CheckCircle2,
        description: 'Task status',
    },
] as const;

function taskStatusToBadge(status: string): StatusBadgeStatus {
    switch (status) {
        case 'IN_REVIEW':
            return 'review';
        case 'COMPLETED':
            return 'complete';
        case 'IN_PREPARATION':
        default:
            return 'pending';
    }
}

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
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
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
                            'text-sm font-medium truncate',
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
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span
                className={cn(
                    'text-sm font-medium truncate',
                    !displayValue && 'text-muted-foreground/50 italic',
                )}
            >
                {displayValue || placeholder}
            </span>
        </div>
    );
};

export const TaskList = forwardRef<TaskListRef, TaskListProps>(
    (
        {
            tasks,
            customFields,
            onTaskClick,
            onTaskEdit: _onTaskEdit,
            onTaskDelete,
            onTaskCopy,
            onCustomFieldCreated,
            onTaskCreated,
            projectId,
            workspaceId,
            members,
            documents = [],
            groupByField,
            columnFilters,
            onColumnFilterChange,
        },
        ref,
    ) => {
        const { getToken } = useAuth();
        const { saveTemplateFromTask } = useCustomFieldTemplates(workspaceId);
        const [isCreatingField, setIsCreatingField] = useState(false);
        const [fieldName, setFieldName] = useState('');
        const [fieldType, setFieldType] = useState<DataType>('STRING');
        const [showRoleSelection, setShowRoleSelection] = useState(false);
        const [roleName, setRoleName] = useState<string>('');
        const [selectedApprovalRole, setSelectedApprovalRole] = useState<
            'NONE' | 'PREPARER' | 'REVIEWER'
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

        // Filter popover state - tracks which field's filter is open
        const [activeFilterFieldId, setActiveFilterFieldId] = useState<
            string | null
        >(null);

        // Save-as-template state
        const [templateTask, setTemplateTask] = useState<Task | null>(null);
        const [templateName, setTemplateName] = useState('');

        // Optimistic updates: store pending field value changes
        // Key format: "taskId:fieldId" -> value
        const [optimisticUpdates, setOptimisticUpdates] = useState<
            Record<string, string>
        >({});

        // Deduplicate members to avoid key collision errors
        const uniqueMembers = useMemo(() => {
            return Array.from(new Map(members.map((m) => [m.id, m])).values());
        }, [members]);

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

        // Inline task creation
        const [isCreatingTask, setIsCreatingTask] = useState(false);
        const [newTaskName, setNewTaskName] = useState('');
        const [collapsedGroups, setCollapsedGroups] = useState<
            Record<string, boolean>
        >({});

        const toggleGroup = (groupValue: string) => {
            setCollapsedGroups((prev) => ({
                ...prev,
                [groupValue]: !prev[groupValue],
            }));
        };

        // Bulk selection state
        const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
            new Set(),
        );
        const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
        const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
            try {
                setIsBulkDeleting(true);
                const token = await getToken();
                if (!token) return;

                const promises = Array.from(selectedTaskIds).map((id) =>
                    taskApi.deleteTask(token, projectId, id),
                );

                await Promise.all(promises);

                toast.success(
                    `Deleted ${selectedTaskIds.size} task${selectedTaskIds.size !== 1 ? 's' : ''}`,
                );
                setSelectedTaskIds(new Set());
                setBulkDeleteDialogOpen(false);
                onTaskCreated();
            } catch (error) {
                console.error('Failed to bulk delete:', error);
                toast.error('Failed to delete some tasks');
            } finally {
                setIsBulkDeleting(false);
            }
        };

        // Expose method to start creating task from parent
        useImperativeHandle(ref, () => ({
            startCreatingTask: () => {
                setIsCreatingTask(true);
                setNewTaskName('');
            },
        }));

        // Sort fields by creation date (oldest first) so new fields appear at the end
        // Then limit to 5
        const displayedFields = [...customFields].sort(
            (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
        );

        const handleCreateTask = async (name: string) => {
            if (!name.trim()) {
                setIsCreatingTask(false);
                setNewTaskName('');
                return;
            }

            try {
                const token = await getToken();
                if (!token) {
                    toast.error('Authentication required');
                    return;
                }

                // Only task name is required — all other fields are optional
                await taskApi.createTask(token, projectId, {
                    name: name.trim(),
                    status: 'PENDING',
                    customFields: {},
                });

                setNewTaskName('');
                setIsCreatingTask(false);
                onTaskCreated();
            } catch (error) {
                console.error('Failed to create task:', error);
                const errorMessage =
                    error instanceof Error
                        ? error.message
                        : 'Failed to create task';
                toast.error(errorMessage);
            }
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
            } else {
                setShowRoleSelection(false);
                setRoleName('');
            }
        };

        const handleCreateField = async () => {
            if (!fieldName.trim()) {
                toast.error('Field name is required');
                return;
            }

            if (fieldType === 'USER' && !roleName.trim()) {
                toast.error('Please enter a role name for the Person field');
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
                    fieldType === 'USER' && roleName.trim()
                        ? [roleName.trim()]
                        : undefined;
                const statusOptions =
                    fieldType === 'CUSTOM'
                        ? ['ToDo', 'In Progress', 'Done']
                        : undefined;

                await customFieldApi.createCustomField(token, projectId, {
                    name: fieldName.trim(),
                    dataType: fieldType,
                    customOptions: customOptions || statusOptions,
                    multiple:
                        MULTIPLE_SUPPORTED_TYPES.includes(fieldType) &&
                        selectedApprovalRole === 'NONE'
                            ? allowMultiple
                            : false,
                    ...(fieldType === 'USER' &&
                        selectedApprovalRole !== 'NONE' && {
                            approvalRole: selectedApprovalRole,
                        }),
                });

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
            try {
                setIsDeletingField(true);
                const token = await getToken();
                if (!token) return;
                await customFieldApi.deleteCustomField(
                    token,
                    projectId,
                    fieldToDelete.id,
                );
                toast.success(`"${fieldToDelete.name}" field deleted`);
                setFieldToDelete(null);
                onCustomFieldCreated();
            } catch (error) {
                console.error('Failed to delete custom field:', error);
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

            try {
                const token = await getToken();
                if (!token) {
                    toast.error('Authentication required');
                    return;
                }

                await customFieldApi.updateCustomField(
                    token,
                    projectId,
                    fieldId,
                    {
                        name: trimmedName,
                    },
                );

                toast.success('Field name updated');
                onCustomFieldCreated(); // Refresh fields
            } catch (error) {
                console.error('Failed to update field name:', error);
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
                // Status dropdown (single)
                return (
                    <Select
                        value={value || ''}
                        onValueChange={(val) =>
                            handleUpdateCustomField(task, field.id, val)
                        }
                    >
                        <SelectTrigger className="h-7 w-full border-none shadow-none bg-transparent hover:bg-muted/50 p-0 px-2 focus:ring-0 cursor-pointer">
                            <SelectValue placeholder="-" />
                        </SelectTrigger>
                        <SelectContent>
                            {(field.customOptions || []).length > 0 ? (
                                (field.customOptions || []).map((opt) => (
                                    <SelectItem key={opt} value={opt}>
                                        {opt}
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                                    No options available
                                </div>
                            )}
                        </SelectContent>
                    </Select>
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
                                            <span className="truncate max-w-[200px]">
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
                                            <span className="truncate max-w-[200px]">
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

            // Text/Number/Date/String fallback
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
                            <AlertDialogCancel disabled={isBulkDeleting}>
                                Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                                onClick={confirmBulkDelete}
                                disabled={isBulkDeleting}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                {isBulkDeleting
                                    ? 'Deleting...'
                                    : `Delete ${selectedTaskIds.size} task${selectedTaskIds.size !== 1 ? 's' : ''}`}
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

                <div className="flex-1 overflow-auto relative scroll-smooth">
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
                            <div className="sticky left-0 z-40 w-[300px] shrink-0 px-4 py-2.5 border-r border-dashboard-border bg-[#f8f9fb] flex items-center justify-between shadow-[1px_0_0_0_theme(colors.dashboard-border)] group">
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
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn(
                                                'h-5 w-5 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity hover:bg-dashboard-bg rounded',
                                                columnFilters['name'] &&
                                                    'opacity-100 text-accent-blue',
                                            )}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Filter className="h-3 w-3" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-2">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-xs text-muted-foreground">
                                                    Filter Task Name
                                                </h4>
                                                {columnFilters['name'] && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4"
                                                        onClick={() =>
                                                            onColumnFilterChange(
                                                                'name',
                                                                '',
                                                            )
                                                        }
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            <input
                                                className="w-full px-2 py-1 text-sm border border-border rounded-md"
                                                placeholder="Contains..."
                                                value={
                                                    columnFilters['name']
                                                        ?.value || ''
                                                }
                                                onChange={(e) =>
                                                    onColumnFilterChange(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                                autoFocus
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Status Column Header */}
                            <div className="w-35 shrink-0 px-4 py-2.5 border-r border-dashboard-border bg-[#f8f9fb] flex items-center gap-1.5">
                                <CheckCircle2 className="h-3.5 w-3.5 text-dashboard-text-muted" />
                                <span className="text-[11px] font-medium tracking-wide text-dashboard-text-muted uppercase">
                                    Status
                                </span>
                            </div>

                            {/* Custom Field Columns Headers */}
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

                                // USER fields don't get a filter — assignment is managed per-task
                                const showFilter = field.dataType !== 'USER';

                                return (
                                    <div
                                        key={field.id}
                                        className="w-[150px] shrink-0 px-4 py-2.5 border-r border-dashboard-border flex items-center gap-2 bg-[#f8f9fb] group relative"
                                    >
                                        <div className="flex flex-col min-w-0 flex-1 overflow-visible">
                                            <div className="min-w-0 overflow-visible">
                                                <EditableHeader
                                                    initialValue={field.name}
                                                    icon={getFieldIcon()}
                                                    onSave={(newName) =>
                                                        handleUpdateFieldName(
                                                            field.id,
                                                            newName,
                                                        )
                                                    }
                                                    placeholder="Field name..."
                                                />
                                            </div>
                                            {field.dataType === 'USER' &&
                                            field.approvalRole &&
                                            field.approvalRole !== 'NONE' ? (
                                                <span className="text-[10px] text-blue-500/80 pl-5 truncate font-normal mt-0.5">
                                                    {field.approvalRole ===
                                                    'PREPARER'
                                                        ? 'Preparer'
                                                        : field.reviewerOrder !==
                                                            null
                                                          ? `Reviewer ${field.reviewerOrder}`
                                                          : 'Reviewer'}
                                                </span>
                                            ) : field.dataType === 'USER' &&
                                              field.customOptions?.[0] ? (
                                                <span className="text-[10px] text-muted-foreground/70 pl-5 truncate font-normal mt-0.5">
                                                    {field.customOptions[0]}
                                                </span>
                                            ) : null}
                                        </div>

                                        {/* Single actions dropdown — replaces crowded filter+delete+pencil */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className={cn(
                                                        'h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity hover:bg-dashboard-bg rounded',
                                                        columnFilters[
                                                            field.id
                                                        ] &&
                                                            'opacity-100 text-accent-blue',
                                                    )}
                                                    onClick={(e) =>
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
                                                {showFilter && (
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            setActiveFilterFieldId(
                                                                field.id,
                                                            )
                                                        }
                                                    >
                                                        <Filter className="h-3.5 w-3.5 mr-2" />
                                                        Filter
                                                        {columnFilters[
                                                            field.id
                                                        ] && (
                                                            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[#5a7f9a] shrink-0" />
                                                        )}
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                                    onSelect={() =>
                                                        setFieldToDelete(field)
                                                    }
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                                    Delete field
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>

                                        {/* Controlled filter popover anchored to this header cell */}
                                        {showFilter && (
                                            <Popover
                                                open={
                                                    activeFilterFieldId ===
                                                    field.id
                                                }
                                                onOpenChange={(open) => {
                                                    if (!open)
                                                        setActiveFilterFieldId(
                                                            null,
                                                        );
                                                }}
                                            >
                                                <PopoverTrigger asChild>
                                                    <span className="absolute inset-0 pointer-events-none" />
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-56 p-2"
                                                    align="end"
                                                    side="bottom"
                                                >
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <h4 className="font-medium text-xs text-muted-foreground">
                                                                Filter{' '}
                                                                {field.name}
                                                            </h4>
                                                            {columnFilters[
                                                                field.id
                                                            ] && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-4 w-4"
                                                                    onClick={() =>
                                                                        onColumnFilterChange(
                                                                            field.id,
                                                                            '',
                                                                        )
                                                                    }
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                </Button>
                                                            )}
                                                        </div>
                                                        <input
                                                            className="w-full px-2 py-1 text-sm border border-border rounded-md"
                                                            placeholder={
                                                                field.dataType ===
                                                                'DATE'
                                                                    ? 'YYYY-MM-DD'
                                                                    : 'Contains...'
                                                            }
                                                            value={
                                                                columnFilters[
                                                                    field.id
                                                                ]?.value || ''
                                                            }
                                                            onChange={(e) =>
                                                                onColumnFilterChange(
                                                                    field.id,
                                                                    e.target
                                                                        .value,
                                                                    field.dataType ===
                                                                        'DATE'
                                                                        ? 'date'
                                                                        : 'text',
                                                                )
                                                            }
                                                            autoFocus
                                                        />
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Add Column Button */}
                            <div className="w-[150px] shrink-0 px-4 py-3 bg-[#f8f9fb] border-r border-dashboard-border">
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
                                        className="w-80 max-h-[400px] overflow-y-auto"
                                        align="start"
                                        sideOffset={5}
                                        collisionPadding={20}
                                        onOpenAutoFocus={(e) =>
                                            e.preventDefault()
                                        }
                                    >
                                        <div className="space-y-4">
                                            <div>
                                                <Label htmlFor="field-name">
                                                    Type property name
                                                </Label>
                                                <div className="mt-2">
                                                    <input
                                                        type="text"
                                                        value={fieldName}
                                                        onChange={(e) =>
                                                            setFieldName(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Field name..."
                                                        className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:border-ring"
                                                        autoFocus
                                                        onKeyDown={(e) => {
                                                            if (
                                                                e.key ===
                                                                    'Enter' &&
                                                                fieldName.trim() &&
                                                                !showRoleSelection
                                                            ) {
                                                                if (
                                                                    fieldType ===
                                                                    'USER'
                                                                ) {
                                                                    setShowRoleSelection(
                                                                        true,
                                                                    );
                                                                } else {
                                                                    handleCreateField();
                                                                }
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            {!showRoleSelection ? (
                                                <>
                                                    <div>
                                                        <Label>
                                                            Select type
                                                        </Label>
                                                        <div className="relative">
                                                            <div className="max-h-[180px] overflow-y-auto space-y-0.5 pr-1 scrollbar-thin scrollbar-thumb-dashboard-border scrollbar-track-transparent">
                                                                {FIELD_TYPES.map(
                                                                    (type) => {
                                                                        const Icon =
                                                                            type.icon;
                                                                        return (
                                                                            <button
                                                                                key={
                                                                                    type.value
                                                                                }
                                                                                onClick={() =>
                                                                                    handleFieldTypeSelect(
                                                                                        type.value,
                                                                                    )
                                                                                }
                                                                                className={cn(
                                                                                    'w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-muted transition-colors cursor-pointer',
                                                                                    fieldType ===
                                                                                        type.value &&
                                                                                        'bg-muted',
                                                                                )}
                                                                            >
                                                                                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                                                                                <div className="flex-1">
                                                                                    <div className="text-sm font-medium">
                                                                                        {
                                                                                            type.label
                                                                                        }
                                                                                    </div>
                                                                                    <div className="text-xs text-muted-foreground">
                                                                                        {
                                                                                            type.description
                                                                                        }
                                                                                    </div>
                                                                                </div>
                                                                            </button>
                                                                        );
                                                                    },
                                                                )}
                                                            </div>
                                                            {/* Scroll fade indicator */}
                                                            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-popover to-transparent" />
                                                        </div>
                                                    </div>

                                                    {MULTIPLE_SUPPORTED_TYPES.includes(
                                                        fieldType,
                                                    ) && (
                                                        <div className="flex items-center justify-between py-2 border-t">
                                                            <Label
                                                                htmlFor="allow-multiple"
                                                                className="text-sm font-normal cursor-pointer"
                                                            >
                                                                Allow multiple
                                                                values
                                                            </Label>
                                                            <Switch
                                                                id="allow-multiple"
                                                                checked={
                                                                    allowMultiple
                                                                }
                                                                onCheckedChange={
                                                                    setAllowMultiple
                                                                }
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex gap-2 pt-2">
                                                        <Button
                                                            onClick={() => {
                                                                if (
                                                                    fieldType ===
                                                                    'USER'
                                                                ) {
                                                                    setShowRoleSelection(
                                                                        true,
                                                                    );
                                                                } else {
                                                                    handleCreateField();
                                                                }
                                                            }}
                                                            disabled={
                                                                !fieldName.trim() ||
                                                                isSubmitting
                                                            }
                                                            className="flex-1"
                                                        >
                                                            {isSubmitting
                                                                ? 'Creating...'
                                                                : fieldType ===
                                                                    'USER'
                                                                  ? 'Next'
                                                                  : 'Create'}
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={
                                                                handleCancelFieldCreation
                                                            }
                                                            disabled={
                                                                isSubmitting
                                                            }
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <div>
                                                    <Label htmlFor="role-name">
                                                        Display label
                                                    </Label>
                                                    <p className="text-xs text-muted-foreground mt-1 mb-2">
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
                                                                handleCreateField();
                                                            }
                                                        }}
                                                    />
                                                    <div className="mt-4">
                                                        <Label className="text-xs">
                                                            Approval role
                                                        </Label>
                                                        <p className="text-xs text-muted-foreground mt-1 mb-2">
                                                            Link to approval
                                                            workflow (optional)
                                                        </p>
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {(
                                                                [
                                                                    {
                                                                        value: 'NONE',
                                                                        label: 'None',
                                                                    },
                                                                    {
                                                                        value: 'PREPARER',
                                                                        label: 'Preparer',
                                                                    },
                                                                    {
                                                                        value: 'REVIEWER',
                                                                        label: 'Reviewer',
                                                                    },
                                                                ] as const
                                                            ).map((opt) => (
                                                                <button
                                                                    key={
                                                                        opt.value
                                                                    }
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setSelectedApprovalRole(
                                                                            opt.value,
                                                                        )
                                                                    }
                                                                    className={`px-2.5 py-1 text-xs rounded-full border transition-colors ${
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
                                                    <div className="flex gap-2 pt-4">
                                                        <Button
                                                            onClick={
                                                                handleCreateField
                                                            }
                                                            disabled={
                                                                !fieldName.trim() ||
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
                                                            onClick={() => {
                                                                setShowRoleSelection(
                                                                    false,
                                                                );
                                                                setRoleName('');
                                                            }}
                                                            disabled={
                                                                isSubmitting
                                                            }
                                                        >
                                                            Back
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={
                                                                handleCancelFieldCreation
                                                            }
                                                            disabled={
                                                                isSubmitting
                                                            }
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
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
                                      tasks.forEach((task) => {
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
                                                      <div className="sticky left-0 min-w-full bg-[#f0f2f5] border-y border-dashboard-border px-4 py-2 flex items-center gap-2 font-medium text-sm text-dashboard-text-body">
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
                                                                      <div className="sticky left-0 z-20 w-[300px] shrink-0 px-4 py-3.5 border-r border-dashboard-border bg-dashboard-surface group-hover:bg-accent-row-hover transition-colors shadow-[1px_0_0_0_var(--dashboard-border)] flex items-center gap-3">
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
                                                                          <button
                                                                              className="flex-1 min-w-0 text-left cursor-pointer group/name"
                                                                              onClick={() =>
                                                                                  onTaskClick(
                                                                                      task,
                                                                                  )
                                                                              }
                                                                          >
                                                                              <span className="text-sm font-medium text-dashboard-text-primary truncate block group-hover/name:underline decoration-dashboard-text-muted/40 underline-offset-2">
                                                                                  {task.name || (
                                                                                      <span className="text-muted-foreground/50 italic font-normal">
                                                                                          Untitled
                                                                                      </span>
                                                                                  )}
                                                                              </span>
                                                                          </button>
                                                                          <button
                                                                              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0 ml-1 text-dashboard-text-muted hover:text-accent-blue"
                                                                              onClick={(
                                                                                  e,
                                                                              ) => {
                                                                                  e.stopPropagation();
                                                                                  onTaskClick(
                                                                                      task,
                                                                                  );
                                                                              }}
                                                                              title="Open task"
                                                                          >
                                                                              <ExternalLink className="h-3 w-3" />
                                                                          </button>
                                                                      </div>

                                                                      {/* Status Cell */}
                                                                      <div className="w-35 shrink-0 px-4 py-3.5 border-r border-dashboard-border flex items-center">
                                                                          <StatusBadge
                                                                              status={taskStatusToBadge(
                                                                                  task.approvalStatus,
                                                                              )}
                                                                              size="sm"
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
                                                                                  className="w-[150px] shrink-0 px-4 py-3.5 border-r border-dashboard-border flex items-center"
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
                                                                      <div className="w-[150px] shrink-0 px-4 py-4 flex items-center justify-end">
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
                                                                                          onTaskCopy(
                                                                                              task,
                                                                                          );
                                                                                      }}
                                                                                  >
                                                                                      <Copy className="h-4 w-4 mr-2" />
                                                                                      Copy
                                                                                      Task
                                                                                  </DropdownMenuItem>
                                                                                  <DropdownMenuItem
                                                                                      onClick={(
                                                                                          e,
                                                                                      ) => {
                                                                                          e.stopPropagation();
                                                                                          setTemplateTask(
                                                                                              task,
                                                                                          );
                                                                                          setTemplateName(
                                                                                              '',
                                                                                          );
                                                                                      }}
                                                                                  >
                                                                                      <LayoutTemplate className="h-4 w-4 mr-2" />
                                                                                      Save
                                                                                      as
                                                                                      Template
                                                                                  </DropdownMenuItem>
                                                                                  <DropdownMenuSeparator />
                                                                                  <DropdownMenuItem
                                                                                      onClick={(
                                                                                          e,
                                                                                      ) => {
                                                                                          e.stopPropagation();
                                                                                          onTaskDelete(
                                                                                              task.id,
                                                                                          );
                                                                                      }}
                                                                                      className="text-destructive focus:text-destructive"
                                                                                  >
                                                                                      <Trash2 className="h-4 w-4 mr-2" />
                                                                                      Delete
                                                                                      Task
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
                                : // Render Flat List
                                  tasks.map((task) => (
                                      <div
                                          key={task.id}
                                          className="flex border-b border-dashboard-border hover:bg-accent-row-hover transition-colors group min-w-max"
                                      >
                                          {/* Task Name - Sticky */}
                                          <div className="sticky left-0 z-20 w-[300px] shrink-0 px-4 py-3.5 border-r border-dashboard-border bg-dashboard-surface group-hover:bg-accent-row-hover transition-colors shadow-[1px_0_0_0_var(--dashboard-border)] flex items-center gap-3">
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
                                              {/* Task name — Notion-style link */}
                                              <button
                                                  className="flex-1 min-w-0 text-left cursor-pointer group/name"
                                                  onClick={() =>
                                                      onTaskClick(task)
                                                  }
                                              >
                                                  <span className="text-sm font-medium text-dashboard-text-primary truncate block group-hover/name:underline decoration-dashboard-text-muted/40 underline-offset-2">
                                                      {task.name || (
                                                          <span className="text-muted-foreground/50 italic font-normal">
                                                              Untitled
                                                          </span>
                                                      )}
                                                  </span>
                                              </button>
                                              <button
                                                  className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0 ml-1 text-dashboard-text-muted hover:text-accent-blue"
                                                  onClick={(e) => {
                                                      e.stopPropagation();
                                                      onTaskClick(task);
                                                  }}
                                                  title="Open task"
                                              >
                                                  <ExternalLink className="h-3 w-3" />
                                              </button>
                                          </div>

                                          {/* Status Cell */}
                                          <div className="w-35 shrink-0 px-4 py-3.5 border-r border-dashboard-border flex items-center">
                                              <StatusBadge
                                                  status={taskStatusToBadge(
                                                      task.approvalStatus,
                                                  )}
                                                  size="sm"
                                              />
                                          </div>

                                          {/* Custom Field Values */}
                                          {displayedFields.map((field) => (
                                              <div
                                                  key={field.id}
                                                  className="w-[150px] shrink-0 px-4 py-3.5 border-r border-dashboard-border flex items-center"
                                              >
                                                  <div className="w-full">
                                                      {renderCustomFieldCell(
                                                          task,
                                                          field,
                                                      )}
                                                  </div>
                                              </div>
                                          ))}

                                          {/* Actions Column */}
                                          <div className="w-[150px] shrink-0 px-4 py-4 flex items-center justify-end">
                                              <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                      <Button
                                                          variant="ghost"
                                                          size="icon"
                                                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                          onClick={(e) =>
                                                              e.stopPropagation()
                                                          }
                                                      >
                                                          <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                      </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end">
                                                      <DropdownMenuItem
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              onTaskCopy(task);
                                                          }}
                                                      >
                                                          <Copy className="h-4 w-4 mr-2" />
                                                          Copy Task
                                                      </DropdownMenuItem>
                                                      <DropdownMenuItem
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              setTemplateTask(
                                                                  task,
                                                              );
                                                              setTemplateName(
                                                                  '',
                                                              );
                                                          }}
                                                      >
                                                          <LayoutTemplate className="h-4 w-4 mr-2" />
                                                          Save as Template
                                                      </DropdownMenuItem>
                                                      <DropdownMenuSeparator />
                                                      <DropdownMenuItem
                                                          onClick={(e) => {
                                                              e.stopPropagation();
                                                              onTaskDelete(
                                                                  task.id,
                                                              );
                                                          }}
                                                          className="text-destructive focus:text-destructive"
                                                      >
                                                          <Trash2 className="h-4 w-4 mr-2" />
                                                          Delete Task
                                                      </DropdownMenuItem>
                                                  </DropdownMenuContent>
                                              </DropdownMenu>
                                          </div>
                                      </div>
                                  ))}

                            {/* New Task Row / Add Task - always directly after tasks */}
                            {isCreatingTask ? (
                                <div className="flex border-b border-dashboard-border bg-accent-subtle/50 min-w-max animate-in fade-in slide-in-from-top-1 duration-150">
                                    <div className="sticky left-0 z-20 w-[300px] shrink-0 px-4 py-3.5 border-r border-dashboard-border bg-accent-subtle/50 shadow-[1px_0_0_0_var(--dashboard-border)]">
                                        <EditableContent
                                            value={newTaskName}
                                            onSave={(name) =>
                                                handleCreateTask(name)
                                            }
                                            placeholder="Task name..."
                                            textStyle="text-sm font-medium"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="w-35 shrink-0 border-r border-dashboard-border" />
                                    {displayedFields.map((field) => (
                                        <div
                                            key={field.id}
                                            className="w-[150px] shrink-0 px-4 py-4 border-r border-dashboard-border"
                                        />
                                    ))}
                                    <div className="w-[150px] shrink-0 px-4 py-4" />
                                </div>
                            ) : (
                                <div
                                    className="flex border-b border-dashboard-border hover:bg-accent-subtle/30 transition-colors group min-w-max cursor-pointer"
                                    onClick={() => {
                                        setIsCreatingTask(true);
                                        setNewTaskName('');
                                    }}
                                >
                                    <div className="sticky left-0 z-20 w-[300px] shrink-0 px-4 py-3 border-r border-dashboard-border bg-dashboard-surface group-hover:bg-accent-subtle/30 transition-colors shadow-[1px_0_0_0_var(--dashboard-border)] flex items-center gap-2 text-[13px] text-dashboard-text-muted group-hover:text-accent-blue">
                                        <Plus className="h-3.5 w-3.5" />
                                        Add task
                                    </div>
                                    <div className="w-35 shrink-0 border-r border-dashboard-border" />
                                    {/* Empty cells for alignment */}
                                    {displayedFields.map((field) => (
                                        <div
                                            key={field.id}
                                            className="w-[150px] shrink-0 border-r border-dashboard-border"
                                        />
                                    ))}
                                    <div className="w-[150px] shrink-0" />
                                </div>
                            )}

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
