'use client'

import { useState, useRef, useEffect, useImperativeHandle, forwardRef, useLayoutEffect } from 'react'
import {
    Plus,
    CheckCircle2,
    Circle,
    AlertCircle,
    MoreVertical,
    Edit2,
    Trash2,
    Copy,
    Calendar,
    Type,
    Hash,
    User,
    FileText,
} from 'lucide-react'
import { type Task, type CustomField, type DataType, customFieldApi, taskApi, userApi } from '@/lib/api'
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
import { Label } from '@/components/ui/label'
import { useAuth, useUser } from '@clerk/nextjs'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Pencil } from 'lucide-react'

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
}

// Concise field types per CPA feedback
const FIELD_TYPES = [
    { value: 'STRING' as DataType, label: 'Text', icon: Type, description: 'Plain text field' },
    { value: 'NUMBER' as DataType, label: 'Number', icon: Hash, description: 'Numeric value' },
    { value: 'DATE' as DataType, label: 'Date', icon: Calendar, description: 'Date picker' },
    { value: 'USER' as DataType, label: 'Person', icon: User, description: 'Assign a person' },
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
    const [editEmpty, setEditEmpty] = useState(false)
    const ref = useRef<HTMLDivElement>(null)
    const discardOnBlurRef = useRef(false)

    useEffect(() => {
        if (!isEditing) setDisplayValue(value)
    }, [value, isEditing])

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
        setEditEmpty(!displayValue.trim())
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
            ;(e.target as HTMLDivElement).blur()
        }
        if (e.key === 'Escape') {
            discardOnBlurRef.current = true
            if (ref.current) ref.current.textContent = displayValue
            ;(e.target as HTMLDivElement).blur()
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault()
        const text = e.clipboardData.getData('text/plain')
        document.execCommand('insertText', false, text)
        // Update empty state after paste (execCommand is sync but DOM updates after)
        queueMicrotask(handleInput)
    }

    const handleClick = () => {
        if (!isEditing) setIsEditing(true)
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
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleClick() } }}
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
}, ref) => {
    const { getToken } = useAuth()
    const { user } = useUser()
    const [isCreatingField, setIsCreatingField] = useState(false)
    const [fieldName, setFieldName] = useState('')
    const [fieldType, setFieldType] = useState<DataType>('STRING')
    const [showRoleSelection, setShowRoleSelection] = useState(false)
    const [selectedRole, setSelectedRole] = useState<string>('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    
    // Inline task creation
    const [isCreatingTask, setIsCreatingTask] = useState(false)
    const [newTaskName, setNewTaskName] = useState('')
    const [editingTaskId, setEditingTaskId] = useState<string | null>(null)

    // Expose method to start creating task from parent
    useImperativeHandle(ref, () => ({
        startCreatingTask: () => {
            setIsCreatingTask(true)
            setNewTaskName('')
        }
    }))

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
                        // This shouldn't happen for required fields, but handle it
                        if (field.dataType === 'NUMBER') {
                            customFieldsPayload[field.id] = 0
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

    const getCustomFieldValue = (task: Task, field: CustomField) => {
        // TODO: Once Task type includes customFieldValues, access it here
        // For now return empty/placeholder
        return '-'
    }

    const handleFieldTypeSelect = (type: DataType) => {
        setFieldType(type)
        if (type === 'USER') {
            // Show role selection for Person field
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

            // For Person fields, store the role in customOptions
            const customOptions = fieldType === 'USER' && selectedRole ? [selectedRole] : undefined
            
            // For Status fields, set default options
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

    return (
        <div className="w-full border border-border rounded-lg overflow-hidden bg-card">
            {/* Table Header */}
            <div className="flex border-b border-border bg-muted/30 min-w-max">
                {/* Task Name Column */}
                <div className="w-[300px] shrink-0 px-4 py-3 border-r border-border">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Type className="h-4 w-4" />
                        Task name
                    </div>
                </div>

                {/* Custom Field Columns */}
                {customFields.map((field) => (
                    <div key={field.id} className="w-[150px] shrink-0 px-4 py-3 border-r border-border">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            {field.dataType === 'DATE' && <Calendar className="h-4 w-4" />}
                            {field.dataType === 'NUMBER' && <Hash className="h-4 w-4" />}
                            {field.dataType === 'USER' && <User className="h-4 w-4" />}
                            {field.dataType === 'STRING' && <Type className="h-4 w-4" />}
                            {field.dataType === 'CUSTOM' && <CheckCircle2 className="h-4 w-4" />}
                            {field.name}
                        </div>
                    </div>
                ))}

                {/* Add Column Button */}
                <div className="w-[150px] shrink-0 px-4 py-3">
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
                        <PopoverContent className="w-80" align="start" onOpenAutoFocus={(e) => e.preventDefault()}>
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

            {/* Table Body with Horizontal Scroll */}
            <div className="overflow-x-auto">
                <div className="min-w-max">
                    {tasks.length === 0 && !isCreatingTask && (
                        <div className="flex flex-col items-center justify-center h-32 text-center px-8">
                            <p className="text-muted-foreground text-sm">
                                No tasks yet
                            </p>
                        </div>
                    )}
                    {tasks.map((task) => (
                            <div
                                key={task.id}
                                className="flex border-b border-border hover:bg-muted/30 transition-colors group min-w-max"
                            >
                                {/* Task Name */}
                                <div
                                    className="w-[300px] shrink-0 px-4 py-4 border-r border-border"
                                    onClick={(e) => {
                                        if (editingTaskId !== task.id) {
                                            onTaskClick(task)
                                        }
                                    }}
                                >
                                    {editingTaskId === task.id ? (
                                        <EditableContent
                                            value={task.name}
                                            onSave={(name) => handleSaveTaskName(task.id, name)}
                                            placeholder="Task name..."
                                            textStyle="text-sm font-medium"
                                            autoFocus
                                        />
                                    ) : (
                                        <div
                                            className="font-medium text-sm text-foreground group-hover:text-primary transition-colors cursor-pointer"
                                            onDoubleClick={(e) => {
                                                e.stopPropagation()
                                                setEditingTaskId(task.id)
                                            }}
                                        >
                                            {task.name}
                                        </div>
                                    )}
                                </div>

                                {/* Custom Field Values */}
                                {customFields.map((field) => (
                                    <div
                                        key={field.id}
                                        className="w-[150px] shrink-0 px-4 py-4 border-r border-border flex items-center"
                                    >
                                        <span className="text-sm text-muted-foreground truncate w-full">
                                            {getCustomFieldValue(task, field)}
                                        </span>
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

                    {/* New Task Row - Only shown when creating */}
                    {isCreatingTask && (
                        <div className="flex border-b border-border bg-muted/20 min-w-max">
                            <div className="w-[300px] shrink-0 px-4 py-4 border-r border-border">
                                <EditableContent
                                    value={newTaskName}
                                    onSave={(name) => handleCreateTask(name)}
                                    placeholder="Task name..."
                                    textStyle="text-sm font-medium"
                                    autoFocus
                                />
                            </div>
                            {customFields.map((field) => (
                                <div key={field.id} className="w-[150px] shrink-0 px-4 py-4 border-r border-border" />
                            ))}
                            <div className="w-[150px] shrink-0 px-4 py-4" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
})

TaskList.displayName = 'TaskList'
