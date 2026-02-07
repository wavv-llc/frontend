'use client'

import { useState, useRef, useImperativeHandle, forwardRef, useLayoutEffect, useMemo } from 'react'
import {
    Plus,
    CheckCircle2,
    MoreVertical,
    Edit2,
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
    Square,
} from 'lucide-react'
import { type Task, type CustomField, type DataType, type User as ApiUser, type OrganizationDocument, customFieldApi, taskApi, userApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

import { Checkbox } from '@/components/ui/checkbox'

export interface TaskListRef {
    startCreatingTask: () => void
}

interface TaskListProps {
    tasks: Task[]
    customFields: CustomField[]
    onTaskClick: (task: Task) => void
    onTaskEdit: (task: Task) => void
    onTaskDelete: (taskId: string) => void
    onTaskCopy: (task: Task) => void
    onCustomFieldCreated: () => void
    onTaskCreated: () => void
    projectId: string
    members: ApiUser[]
    documents?: OrganizationDocument[]
    groupByField: string | null
    columnFilters: Record<string, { value: string, type: 'text' | 'date' }>
    onColumnFilterChange: (fieldId: string, value: string, type?: 'text' | 'date') => void
}

// Concise field types per CPA feedback
const FIELD_TYPES = [
    { value: 'STRING' as DataType, label: 'Text', icon: Type, description: 'Plain text field' },
    { value: 'NUMBER' as DataType, label: 'Number', icon: Hash, description: 'Numeric value' },
    { value: 'DATE' as DataType, label: 'Date', icon: Calendar, description: 'Date picker' },
    { value: 'USER' as DataType, label: 'Person', icon: UserIcon, description: 'Assign a person' },
    { value: 'TASK' as DataType, label: 'Task', icon: CheckSquare, description: 'Link to a task' },
    { value: 'DOCUMENT' as DataType, label: 'Document', icon: FileText, description: 'Link to a document' },
    { value: 'CUSTOM' as DataType, label: 'Status', icon: CheckCircle2, description: 'Task status' },
] as const

const PERSON_ROLES = [
    'Preparer',
    '1st-level Reviewer',
    '2nd-level Reviewer',
] as const

interface EditableContentProps {
    value: string
    onSave: (value: string) => void
    placeholder?: string
    className?: string
    inputClassName?: string
    textStyle?: string
    autoFocus?: boolean
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
    const [isEditing, setIsEditing] = useState(false)
    const [displayValue, setDisplayValue] = useState(value)
    const [prevValue, setPrevValue] = useState(value)
    // Derived state pattern to sync value from props when not editing
    if (value !== prevValue && !isEditing) {
        setPrevValue(value)
        setDisplayValue(value)
    }

    const [editEmpty, setEditEmpty] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const discardOnBlurRef = useRef(false)

    useLayoutEffect(() => {
        if (!isEditing || !ref.current) return
        const el = ref.current
        if (autoFocus) {
            el.focus()
        }
        // Clear first to avoid appending to any residual content (e.g. <br> from browser)
        el.textContent = ''
        el.textContent = displayValue
        placeCaretAtEnd(el)
    }, [isEditing, displayValue, autoFocus])

    const handleBlur = () => {
        if (discardOnBlurRef.current) {
            discardOnBlurRef.current = false
            setDisplayValue(value)
            setIsEditing(false)
            return
        }
        const el = ref.current
        const raw = el?.textContent ?? ''
        const trimmed = raw.trim()
        if (trimmed !== value) onSave(trimmed)
        setDisplayValue(trimmed || value)
        setIsEditing(false)
    }

    const handleInput = () => {
        const raw = ref.current?.textContent ?? ''
        setEditEmpty(!raw.trim())
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
                ; (e.target as HTMLDivElement).blur()
        }
        if (e.key === 'Escape') {
            discardOnBlurRef.current = true
            if (ref.current) ref.current.textContent = displayValue
                ; (e.target as HTMLDivElement).blur()
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, text)
        // Update empty state after paste (execCommand is sync but DOM updates after)
        queueMicrotask(handleInput)
    }

    const handleClick = (e: React.MouseEvent | React.KeyboardEvent) => {
        // Prevent row selection or opening side panel
        e.stopPropagation()
        if (!isEditing) {
            setIsEditing(true)
            setEditEmpty(!displayValue.trim())
        }
    }

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
                        'outline-none cursor-text rounded px-1 -mx-1 py-0.5 -my-0.5',
                        'bg-muted/30 focus:bg-muted/40 transition-colors duration-150',
                        'min-h-[1.5em]',
                        textStyle,
                        inputClassName
                    )}
                />
                {/* Placeholder overlay when empty */}
                {editEmpty && (
                    <div
                        className={cn(
                            'pointer-events-none absolute left-0 top-0 px-1 py-0.5 text-muted-foreground/50 italic',
                            'min-h-[1.5em]',
                            textStyle
                        )}
                        aria-hidden
                    >
                        {placeholder}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick(e) } }}
            className={cn(
                'group cursor-pointer rounded -ml-1 pl-1 pr-1 border border-transparent',
                'hover:bg-muted/30 active:bg-muted/40 transition-colors duration-150',
                'flex items-center gap-2',
                className
            )}
            title="Click to edit"
        >
            <div className={cn('flex-1 min-h-[1.5em]', textStyle)}>
                {displayValue || <span className="text-muted-foreground/50 italic">{placeholder}</span>}
            </div>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>
    )
}

function placeCaretAtEnd(el: HTMLElement) {
    el.focus()
    const range = document.createRange()
    range.selectNodeContents(el)
    range.collapse(false)
    const sel = window.getSelection()
    sel?.removeAllRanges()
    sel?.addRange(range)
}



export const TaskList = forwardRef<TaskListRef, TaskListProps>(({
    tasks,
    customFields,
    onTaskClick,
    onTaskEdit,
    onTaskDelete,
    onTaskCopy,
    onCustomFieldCreated,
    onTaskCreated,
    projectId,
    members,
    documents = [],
    groupByField,
    columnFilters,
    onColumnFilterChange,
}, ref) => {
    const { getToken } = useAuth()
    const [isCreatingField, setIsCreatingField] = useState(false)
    const [fieldName, setFieldName] = useState('')
    const [fieldType, setFieldType] = useState<DataType>('STRING')
    const [showRoleSelection, setShowRoleSelection] = useState(false)
    const [selectedRole, setSelectedRole] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Optimistic updates: store pending field value changes
    // Key format: "taskId:fieldId" -> value
    const [optimisticUpdates, setOptimisticUpdates] = useState<Record<string, string>>({})

    // Deduplicate members to avoid key collision errors
    const uniqueMembers = useMemo(() => {
        return Array.from(new Map(members.map(m => [m.id, m])).values())
    }, [members])

    // Clear optimistic updates when tasks change (e.g., after successful refresh)
    // This prevents stale optimistic updates from persisting
    useLayoutEffect(() => {
        if (Object.keys(optimisticUpdates).length > 0) {
            // Only clear optimistic updates that are now reflected in the actual data
            setOptimisticUpdates(prev => {
                const next = { ...prev }
                let hasChanges = false

                Object.keys(next).forEach(key => {
                    const [taskId, fieldId] = key.split(':')
                    const task = tasks.find(t => t.id === taskId)
                    const actualValue = task?.customFieldValues?.find(v => v.customFieldId === fieldId)?.value
                    const optimisticValue = next[key]

                    // Clear the optimistic update if:
                    // 1. The actual value matches the optimistic value exactly
                    // 2. Both are "empty" (undefined, null, or empty string)
                    const actualIsEmpty = !actualValue || actualValue === ''
                    const optimisticIsEmpty = !optimisticValue || optimisticValue === ''

                    if (actualValue === optimisticValue || (actualIsEmpty && optimisticIsEmpty)) {
                        delete next[key]
                        hasChanges = true
                    }
                })

                return hasChanges ? next : prev
            })
        }
    }, [tasks, optimisticUpdates])

    // Inline task creation
    const [isCreatingTask, setIsCreatingTask] = useState(false)
    const [newTaskName, setNewTaskName] = useState('')
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

    const toggleGroup = (groupValue: string) => {
        setCollapsedGroups(prev => ({
            ...prev,
            [groupValue]: !prev[groupValue]
        }))
    }

    // Bulk selection state
    const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set())

    const toggleTaskSelection = (taskId: string, selected: boolean) => {
        setSelectedTaskIds(prev => {
            const next = new Set(prev)
            if (selected) next.add(taskId)
            else next.delete(taskId)
            return next
        })
    }

    const toggleAllTasks = (selected: boolean) => {
        if (selected) {
            setSelectedTaskIds(new Set(tasks.map(t => t.id)))
        } else {
            setSelectedTaskIds(new Set())
        }
    }

    const handleBulkDelete = async () => {
        if (selectedTaskIds.size === 0) return
        if (!confirm(`Are you sure you want to delete ${selectedTaskIds.size} task(s)?`)) return

        try {
            const token = await getToken()
            if (!token) return

            // Delete one by one for now as API might not support bulk
            // Ideally we'd have bulk delete API
            const promises = Array.from(selectedTaskIds).map(id =>
                taskApi.deleteTask(token, projectId, id)
            )

            await Promise.all(promises)

            toast.success(`Deleted ${selectedTaskIds.size} tasks`)
            setSelectedTaskIds(new Set())
            onTaskCreated() // Refresh text
        } catch (error) {
            console.error('Failed to bulk delete:', error)
            toast.error('Failed to delete some tasks')
        }
    }

    // Expose method to start creating task from parent
    useImperativeHandle(ref, () => ({
        startCreatingTask: () => {
            setIsCreatingTask(true)
            setNewTaskName('')
        }
    }))

    // Sort fields by creation date (oldest first) so new fields appear at the end
    // Then limit to 5
    const displayedFields = [...customFields]
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())


    const handleCreateTask = async (name: string) => {
        if (!name.trim()) {
            setIsCreatingTask(false)
            setNewTaskName('')
            return
        }

        try {
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            // Get current user ID for USER type fields
            const userResponse = await userApi.getMe(token)
            const currentUserId = userResponse.data?.id

            if (!currentUserId) {
                toast.error('Unable to get user information')
                return
            }

            // Build customFields object with default values for required fields
            const customFieldsPayload: Record<string, string | number | null> = {}

            for (const field of customFields) {
                if (field.required) {
                    if (field.dataType === 'CUSTOM' && field.customOptions && field.customOptions.length > 0) {
                        // For Status/CUSTOM fields, use the first option
                        customFieldsPayload[field.id] = field.customOptions[0]
                    } else if (field.dataType === 'USER') {
                        // For USER fields, use current user ID
                        customFieldsPayload[field.id] = currentUserId
                    } else if (field.defaultValue) {
                        // Use default value if available
                        customFieldsPayload[field.id] = field.defaultValue
                    } else {
                        // For other required fields, we need a value
                        if (field.dataType === 'NUMBER') {
                            customFieldsPayload[field.id] = '0'
                        } else {
                            customFieldsPayload[field.id] = ''
                        }
                    }
                }
            }

            await taskApi.createTask(token, projectId, {
                name: name.trim(),
                status: 'PENDING',
                customFields: customFieldsPayload,
            })

            setNewTaskName('')
            setIsCreatingTask(false)
            onTaskCreated()
        } catch (error) {
            console.error('Failed to create task:', error)
            const errorMessage = error instanceof Error ? error.message : 'Failed to create task'
            toast.error(errorMessage)
        }
    }

    const handleSaveTaskName = async (taskId: string, name: string) => {
        const trimmedName = name.trim()
        if (!trimmedName) {
            setEditingTaskId(null)
            return
        }

        const task = tasks.find(t => t.id === taskId)
        if (!task || task.name === trimmedName) {
            setEditingTaskId(null)
            return
        }

        try {
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await taskApi.updateTask(token, projectId, taskId, {
                name: trimmedName,
            })

            setEditingTaskId(null)
            onTaskCreated()
        } catch (error) {
            console.error('Failed to update task:', error)
            toast.error('Failed to update task')
            setEditingTaskId(null)
        }
    }

    const handleUpdateCustomField = async (task: Task, fieldId: string, value: string) => {
        const optimisticKey = `${task.id}:${fieldId}`

        // Check against current value (including any pending optimistic update)
        const currentValue = optimisticUpdates[optimisticKey] ?? task.customFieldValues?.find(v => v.customFieldId === fieldId)?.value
        if (currentValue === value) return

        // Apply optimistic update immediately
        setOptimisticUpdates(prev => ({
            ...prev,
            [optimisticKey]: value
        }))

        try {
            const token = await getToken()
            if (!token) {
                // Revert optimistic update on auth failure
                setOptimisticUpdates(prev => {
                    const next = { ...prev }
                    delete next[optimisticKey]
                    return next
                })
                return
            }

            await taskApi.updateTask(token, projectId, task.id, {
                customFields: { [fieldId]: value }
            })

            // DON'T clear the optimistic update here - let it persist until the refresh completes
            // The cleanup effect will clear it once the new data arrives

            // Refresh list to get the authoritative data from server
            onTaskCreated()
        } catch (error) {
            console.error('Failed to update field:', error)
            toast.error('Failed to update field')

            // Revert optimistic update on error
            setOptimisticUpdates(prev => {
                const next = { ...prev }
                delete next[optimisticKey]
                return next
            })
        }
    }

    const getCustomFieldValue = (task: Task, field: CustomField) => {
        // Check for optimistic update first
        const optimisticKey = `${task.id}:${field.id}`
        if (optimisticKey in optimisticUpdates) {
            return optimisticUpdates[optimisticKey]
        }

        // Fall back to actual task data
        const val = task.customFieldValues?.find(v => v.customFieldId === field.id)?.value
        if (!val) return null
        return val
    }

    const handleFieldTypeSelect = (type: DataType) => {
        setFieldType(type)
        if (type === 'USER') {
            setShowRoleSelection(true)
        } else {
            setShowRoleSelection(false)
            setSelectedRole('')
        }
    }

    const handleCreateField = async () => {
        if (!fieldName.trim()) {
            toast.error('Field name is required')
            return
        }

        if (fieldType === 'USER' && !selectedRole) {
            toast.error('Please select a role for the Person field')
            return
        }

        try {
            setIsSubmitting(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            const customOptions = fieldType === 'USER' && selectedRole ? [selectedRole] : undefined
            const statusOptions = fieldType === 'CUSTOM' ? ['ToDo', 'In Progress', 'Done'] : undefined

            await customFieldApi.createCustomField(token, projectId, {
                name: fieldName.trim(),
                dataType: fieldType,
                customOptions: customOptions || statusOptions,
            })

            toast.success('Custom field created successfully')
            setFieldName('')
            setFieldType('STRING')
            setSelectedRole('')
            setShowRoleSelection(false)
            setIsCreatingField(false)
            onCustomFieldCreated()
        } catch (error) {
            console.error('Failed to create custom field:', error)
            toast.error('Failed to create custom field')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCancelFieldCreation = () => {
        setFieldName('')
        setFieldType('STRING')
        setSelectedRole('')
        setShowRoleSelection(false)
        setIsCreatingField(false)
    }

    const renderCustomFieldCell = (task: Task, field: CustomField) => {
        const value = getCustomFieldValue(task, field)

        if (field.dataType === 'CUSTOM') {
            // Status dropdown
            return (
                <Select
                    value={value || ''}
                    onValueChange={(val) => handleUpdateCustomField(task, field.id, val)}
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
            )
        }

        if (field.dataType === 'USER') {
            // User dropdown
            const selectedMember = uniqueMembers.find(m => m.id === value)

            return (
                <Select
                    value={value || ''}
                    onValueChange={(val) => handleUpdateCustomField(task, field.id, val)}
                >
                    <SelectTrigger className="h-7 w-full border-none shadow-none bg-transparent hover:bg-muted/50 p-0 px-2 focus:ring-0 cursor-pointer">
                        <SelectValue placeholder="-">
                            {value ? (
                                selectedMember ? (
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Avatar className="h-4 w-4">
                                            <AvatarFallback className="text-[10px]">
                                                {(selectedMember.firstName?.[0] || selectedMember.email[0]).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span className="truncate text-xs">
                                            {selectedMember.firstName ? `${selectedMember.firstName} ${selectedMember.lastName || ''}` : selectedMember.email}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Unknown ({value.slice(0, 8)}...)</span>
                                )
                            ) : null}
                        </SelectValue>
                    </SelectTrigger>

                    <SelectContent>
                        {uniqueMembers.length > 0 ? (
                            uniqueMembers.map((member) => (
                                <SelectItem key={member.id} value={member.id}>
                                    <div className="flex items-center gap-2">
                                        <Avatar className="h-4 w-4">
                                            <AvatarFallback className="text-[10px]">
                                                {(member.firstName?.[0] || member.email[0]).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <span>
                                            {member.firstName ? `${member.firstName} ${member.lastName || ''}` : member.email}
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
            )
        }

        if (field.dataType === 'TASK') {
            // Task dropdown
            const selectedTask = tasks.find(t => t.id === value)

            return (
                <Select
                    value={value || ''}
                    onValueChange={(val) => handleUpdateCustomField(task, field.id, val)}
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
                                    <span className="text-xs text-muted-foreground">Unknown task ({value.slice(0, 8)}...)</span>
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
                                        <span className="truncate max-w-[200px]">{t.name}</span>
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
            )
        }

        if (field.dataType === 'DOCUMENT') {
            // Document dropdown
            const selectedDoc = documents.find(d => d.id === value)

            return (
                <Select
                    value={value || ''}
                    onValueChange={(val) => handleUpdateCustomField(task, field.id, val)}
                >
                    <SelectTrigger className="h-7 w-full border-none shadow-none bg-transparent hover:bg-muted/50 p-0 px-2 focus:ring-0 cursor-pointer">
                        <SelectValue placeholder="-">
                            {value ? (
                                selectedDoc ? (
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span className="truncate text-xs">
                                            {selectedDoc.originalName || selectedDoc.filename}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-muted-foreground">Unknown document ({value.slice(0, 8)}...)</span>
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
                                        <span className="truncate max-w-[200px]">{doc.originalName || doc.filename}</span>
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
            )
        }

        // Text/Number/Date/String fallback
        return (
            <EditableContent
                value={value || ''}
                onSave={(val) => handleUpdateCustomField(task, field.id, val)}
                placeholder="-"
                textStyle="text-sm text-muted-foreground truncate"
            />
        )
    }

    return (
        <div className="w-full h-full border border-border rounded-lg bg-card overflow-hidden flex flex-col min-w-0">
            <div className="flex-1 overflow-auto relative scroll-smooth">
                <div className="min-w-max h-full">
                    {/* Table Header - Sticky Top */}
                    <div className="sticky top-0 z-30 flex border-b border-border bg-muted">
                        {/* Bulk Action Bar Overlay */}
                        {selectedTaskIds.size > 0 && (
                            <div className="absolute inset-0 z-50 bg-primary/10 backdrop-blur-sm flex items-center justify-between px-4 border-b border-primary/20">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        checked={true}
                                        onCheckedChange={() => toggleAllTasks(false)}
                                        aria-label="Deselect all"
                                    />
                                    <span className="text-sm font-medium text-primary">
                                        {selectedTaskIds.size} selected
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleBulkDelete}
                                        className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10 gap-2"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                    <div className="h-4 w-px bg-primary/20 mx-2" />
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedTaskIds(new Set())}
                                        className="h-8 text-muted-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                        {/* Task Name Column Header - Sticky Left & Top */}
                        <div className="sticky left-0 z-40 w-[300px] shrink-0 px-4 py-3 border-r border-border bg-muted flex items-center justify-between text-sm font-medium text-muted-foreground shadow-[1px_0_0_0_hsl(var(--border,_theme(colors.border)))] group">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                                    <Checkbox
                                        checked={tasks.length > 0 && selectedTaskIds.size === tasks.length}
                                        onCheckedChange={(checked) => toggleAllTasks(!!checked)}
                                        aria-label="Select all"
                                        className="translate-y-[1px]"
                                    />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Type className="h-4 w-4" />
                                    Task name
                                </div>
                            </div>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={cn("h-6 w-6 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity hover:bg-muted-foreground/10", columnFilters['name'] && "opacity-100 text-primary")}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Filter className="h-3 w-3" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-56 p-2">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-medium text-xs text-muted-foreground">Filter Task Name</h4>
                                            {columnFilters['name'] && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-4 w-4"
                                                    onClick={() => onColumnFilterChange('name', '')}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                        <input
                                            className="w-full px-2 py-1 text-sm border border-border rounded-md"
                                            placeholder="Contains..."
                                            value={columnFilters['name']?.value || ''}
                                            onChange={(e) => onColumnFilterChange('name', e.target.value)}
                                            autoFocus
                                        />
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Custom Field Columns Headers */}
                        {displayedFields.map((field) => (
                            <div key={field.id} className="w-[150px] shrink-0 px-4 py-3 border-r border-border flex items-center justify-between text-sm font-medium text-muted-foreground bg-muted group">
                                <div className="flex flex-col truncate">
                                    <div className="flex items-center gap-2 truncate">
                                        {field.dataType === 'DATE' && <Calendar className="h-4 w-4" />}
                                        {field.dataType === 'NUMBER' && <Hash className="h-4 w-4" />}
                                        {field.dataType === 'USER' && <UserIcon className="h-4 w-4" />}
                                        {field.dataType === 'TASK' && <CheckSquare className="h-4 w-4" />}
                                        {field.dataType === 'DOCUMENT' && <FileText className="h-4 w-4" />}
                                        {field.dataType === 'STRING' && <Type className="h-4 w-4" />}
                                        {field.dataType === 'CUSTOM' && <CheckCircle2 className="h-4 w-4" />}
                                        <span className="truncate">{field.name}</span>
                                    </div>
                                    {field.dataType === 'USER' && field.customOptions?.[0] && (
                                        <span className="text-[10px] text-muted-foreground/70 pl-6 truncate font-normal">
                                            {field.customOptions[0]}
                                        </span>
                                    )}
                                </div>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className={cn("h-6 w-6 opacity-0 group-hover:opacity-100 data-[state=open]:opacity-100 transition-opacity hover:bg-muted-foreground/10", columnFilters[field.id] && "opacity-100 text-primary")}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <Filter className="h-3 w-3" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-56 p-2">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-medium text-xs text-muted-foreground">Filter {field.name}</h4>
                                                {columnFilters[field.id] && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4"
                                                        onClick={() => onColumnFilterChange(field.id, '')}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                )}
                                            </div>
                                            <input
                                                className="w-full px-2 py-1 text-sm border border-border rounded-md"
                                                placeholder={field.dataType === 'DATE' ? 'YYYY-MM-DD' : "Contains..."}
                                                value={columnFilters[field.id]?.value || ''}
                                                onChange={(e) => onColumnFilterChange(field.id, e.target.value, field.dataType === 'DATE' ? 'date' : 'text')}
                                                autoFocus
                                            />
                                        </div>
                                    </PopoverContent>
                                </Popover>
                            </div>
                        ))}

                        {/* Add Column Button */}
                        <div className="w-[150px] shrink-0 px-4 py-3 bg-muted">
                            <Popover open={isCreatingField} onOpenChange={setIsCreatingField}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full justify-start text-muted-foreground hover:text-foreground"
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
                                    onOpenAutoFocus={(e) => e.preventDefault()}
                                >
                                    <div className="space-y-4">
                                        <div>
                                            <Label htmlFor="field-name">Type property name</Label>
                                            <div className="mt-2">
                                                <input
                                                    type="text"
                                                    value={fieldName}
                                                    onChange={(e) => setFieldName(e.target.value)}
                                                    placeholder="Field name..."
                                                    className="w-full px-2 py-1.5 text-sm border border-border rounded-md bg-background outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus:border-ring"
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && fieldName.trim() && !showRoleSelection) {
                                                            if (fieldType === 'USER') {
                                                                setShowRoleSelection(true)
                                                            } else {
                                                                handleCreateField()
                                                            }
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        {!showRoleSelection ? (
                                            <>
                                                <div>
                                                    <Label>Select type</Label>
                                                    <div className="mt-2 space-y-1">
                                                        {FIELD_TYPES.map((type) => {
                                                            const Icon = type.icon
                                                            return (
                                                                <button
                                                                    key={type.value}
                                                                    onClick={() => handleFieldTypeSelect(type.value)}
                                                                    className={cn(
                                                                        "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-muted transition-colors",
                                                                        fieldType === type.value && "bg-muted"
                                                                    )}
                                                                >
                                                                    <Icon className="h-4 w-4 text-muted-foreground" />
                                                                    <div className="flex-1">
                                                                        <div className="text-sm font-medium">{type.label}</div>
                                                                        <div className="text-xs text-muted-foreground">{type.description}</div>
                                                                    </div>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        onClick={() => {
                                                            if (fieldType === 'USER') {
                                                                setShowRoleSelection(true)
                                                            } else {
                                                                handleCreateField()
                                                            }
                                                        }}
                                                        disabled={!fieldName.trim() || isSubmitting}
                                                        className="flex-1"
                                                    >
                                                        {isSubmitting ? 'Creating...' : fieldType === 'USER' ? 'Next' : 'Create'}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={handleCancelFieldCreation}
                                                        disabled={isSubmitting}
                                                    >
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <div>
                                                <Label>Select role</Label>
                                                <div className="mt-2 space-y-1">
                                                    {PERSON_ROLES.map((role) => (
                                                        <button
                                                            key={role}
                                                            onClick={() => setSelectedRole(role)}
                                                            className={cn(
                                                                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left hover:bg-muted transition-colors",
                                                                selectedRole === role && "bg-muted"
                                                            )}
                                                        >
                                                            <div className="text-sm font-medium">{role}</div>
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex gap-2 pt-4">
                                                    <Button
                                                        onClick={handleCreateField}
                                                        disabled={!fieldName.trim() || !selectedRole || isSubmitting}
                                                        className="flex-1"
                                                    >
                                                        {isSubmitting ? 'Creating...' : 'Create'}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={() => {
                                                            setShowRoleSelection(false)
                                                            setSelectedRole('')
                                                        }}
                                                        disabled={isSubmitting}
                                                    >
                                                        Back
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        onClick={handleCancelFieldCreation}
                                                        disabled={isSubmitting}
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
                        {tasks.length === 0 && !isCreatingTask && (
                            <div className="flex flex-col items-center justify-center h-32 text-center px-8 sticky left-0 w-full min-w-[300px]">
                                <p className="text-muted-foreground text-sm">
                                    No tasks found
                                </p>
                            </div>
                        )}

                        {groupByField ? (
                            // Render Grouped Tasks
                            (() => {
                                // Group tasks
                                const groups: Record<string, Task[]> = {}
                                tasks.forEach(task => {
                                    let key = 'Unassigned'
                                    if (groupByField === 'status') {
                                        key = task.status || 'Unassigned'
                                    } else {
                                        const field = customFields.find(f => f.id === groupByField)
                                        if (field) {
                                            const val = task.customFieldValues?.find(v => v.customFieldId === groupByField)?.value

                                            if (field.dataType === 'USER') {
                                                const u = uniqueMembers.find(m => m.id === val)
                                                key = u ? (u.firstName ? `${u.firstName} ${u.lastName || ''}` : u.email) : 'Unassigned'
                                            } else {
                                                key = val || 'Empty'
                                            }
                                        }
                                    }
                                    if (!groups[key]) groups[key] = []
                                    groups[key].push(task)
                                })

                                return Object.entries(groups).map(([groupName, groupTasks]) => {
                                    const isCollapsed = collapsedGroups[groupName]

                                    return (
                                        <div key={groupName}>
                                            {/* Group Header */}
                                            <div className="sticky left-0 min-w-full bg-secondary/30 border-y border-border px-4 py-2 flex items-center gap-2 font-medium text-sm text-foreground">
                                                <button
                                                    onClick={() => toggleGroup(groupName)}
                                                    className="p-0.5 hover:bg-muted rounded cursor-pointer"
                                                >
                                                    {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                                </button>
                                                <span className="truncate">{groupName}</span>
                                                <span className="text-muted-foreground text-xs ml-1 bg-muted px-1.5 py-0.5 rounded-full">
                                                    {groupTasks.length}
                                                </span>
                                            </div>

                                            {/* Tasks in Group */}
                                            {!isCollapsed && groupTasks.map(task => (
                                                <div
                                                    key={task.id}
                                                    className="flex border-b border-border hover:bg-muted/30 transition-colors group min-w-max relative"
                                                >
                                                    {/* Same Task Row Content as below, duplicate logic or extract component? 
                                                        For minimal edits, I will inline or use the existing mapping if possible but structure text differs. 
                                                        Let's just duplicate the row markup for now to access closures.
                                                    */}
                                                    <div
                                                        className="sticky left-0 z-20 w-[300px] shrink-0 px-4 py-4 border-r border-border bg-card group-hover:bg-[hsl(35,15%,97%)] transition-colors shadow-[1px_0_0_0_hsl(var(--border,_theme(colors.border)))] flex items-center gap-3"
                                                        onClick={() => {
                                                            // Open side panel
                                                            onTaskClick(task)
                                                        }}
                                                    >
                                                        <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                                                            <Checkbox
                                                                checked={selectedTaskIds.has(task.id)}
                                                                onCheckedChange={(checked) => toggleTaskSelection(task.id, !!checked)}
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <EditableContent
                                                                value={task.name}
                                                                onSave={(name) => handleSaveTaskName(task.id, name)}
                                                                placeholder="Task name..."
                                                                textStyle="text-sm font-medium"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Custom Field Values */}
                                                    {displayedFields.map((field) => (
                                                        <div
                                                            key={field.id}
                                                            className="w-[150px] shrink-0 px-4 py-4 border-r border-border flex items-center"
                                                        >
                                                            <div className="w-full">
                                                                {renderCustomFieldCell(task, field)}
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
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    onTaskEdit(task)
                                                                }}>
                                                                    <Edit2 className="h-4 w-4 mr-2" />
                                                                    Edit Task
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    onTaskCopy(task)
                                                                }}>
                                                                    <Copy className="h-4 w-4 mr-2" />
                                                                    Copy Task
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={(e) => {
                                                                        e.stopPropagation()
                                                                        onTaskDelete(task.id)
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
                                        </div>
                                    )
                                })
                            })()
                        ) : (
                            // Render Flat List
                            tasks.map((task) => (
                                <div
                                    key={task.id}
                                    className="flex border-b border-border hover:bg-muted/30 transition-colors group min-w-max"
                                >
                                    {/* Task Name - Sticky */}
                                    <div
                                        className="sticky left-0 z-20 w-[300px] shrink-0 px-4 py-4 border-r border-border bg-card group-hover:bg-[hsl(35,15%,97%)] transition-colors shadow-[1px_0_0_0_hsl(var(--border,_theme(colors.border)))] flex items-center gap-3"
                                        onClick={() => {
                                            onTaskClick(task)
                                        }}
                                    >
                                        <div onClick={(e) => e.stopPropagation()} className="flex items-center">
                                            <Checkbox
                                                checked={selectedTaskIds.has(task.id)}
                                                onCheckedChange={(checked) => toggleTaskSelection(task.id, !!checked)}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <EditableContent
                                                value={task.name}
                                                onSave={(name) => handleSaveTaskName(task.id, name)}
                                                placeholder="Task name..."
                                                textStyle="text-sm font-medium"
                                            />
                                        </div>
                                    </div>

                                    {/* Custom Field Values */}
                                    {displayedFields.map((field) => (
                                        <div
                                            key={field.id}
                                            className="w-[150px] shrink-0 px-4 py-4 border-r border-border flex items-center"
                                        >
                                            <div className="w-full">
                                                {renderCustomFieldCell(task, field)}
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
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation()
                                                    onTaskEdit(task)
                                                }}>
                                                    <Edit2 className="h-4 w-4 mr-2" />
                                                    Edit Task
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation()
                                                    onTaskCopy(task)
                                                }}>
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Copy Task
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        onTaskDelete(task.id)
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
                            ))
                        )}

                        {/* New Task Row - Only shown when creating */}
                        {isCreatingTask ? (
                            <div className="flex border-b border-border bg-muted/20 min-w-max">
                                <div className="sticky left-0 z-20 w-[300px] shrink-0 px-4 py-4 border-r border-border bg-muted shadow-[1px_0_0_0_hsl(var(--border,_theme(colors.border)))]">
                                    <EditableContent
                                        value={newTaskName}
                                        onSave={(name) => handleCreateTask(name)}
                                        placeholder="Task name..."
                                        textStyle="text-sm font-medium"
                                        autoFocus
                                    />
                                </div>
                                {displayedFields.map((field) => (
                                    <div key={field.id} className="w-[150px] shrink-0 px-4 py-4 border-r border-border" />
                                ))}
                                <div className="w-[150px] shrink-0 px-4 py-4" />
                            </div>
                        ) : (
                            <div
                                className="flex border-b border-border hover:bg-muted/30 transition-colors group min-w-max cursor-pointer"
                                onClick={() => {
                                    setIsCreatingTask(true)
                                    setNewTaskName('')
                                }}
                            >
                                <div className="sticky left-0 z-20 w-[300px] shrink-0 px-4 py-3 border-r border-border bg-card group-hover:bg-muted/30 transition-colors shadow-[1px_0_0_0_hsl(var(--border,_theme(colors.border)))] flex items-center gap-2 text-sm text-muted-foreground group-hover:text-foreground">
                                    <Plus className="h-4 w-4" />
                                    Add task
                                </div>
                                {/* Empty cells for alignment */}
                                {displayedFields.map((field) => (
                                    <div key={field.id} className="w-[150px] shrink-0 border-r border-border" />
                                ))}
                                <div className="w-[150px] shrink-0" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
})

TaskList.displayName = 'TaskList'
