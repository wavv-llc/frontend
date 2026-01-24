'use client'

import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import type { TaskListRef } from './TaskList'
import { useRouter, useSearchParams } from 'next/navigation'
import {
    Calendar as CalendarIcon,
    List as ListIcon,
    Plus,
    CheckCircle2,
    Circle,
    AlertCircle,
    Search,
    Filter,
    ArrowLeft,
    Settings,
    Trash2,
    X,
    Loader2,
    Copy,
    Check,
    Pencil
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { type Project, type Task, type CustomField, type DataType, projectApi, taskApi, customFieldApi } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { ProjectCalendarView } from './ProjectCalendarView'
import { TaskDetailView } from '@/components/tasks/TaskDetailView'
import { TaskRow } from './TaskRow'
import { TaskList } from './TaskList'
import { EditTaskDialog } from '@/components/dialogs/EditTaskDialog'
import { Input } from '@/components/ui/input'
import Link from 'next/link'

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
    DropdownMenuCheckboxItem,
    DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'sonner'

const DATA_TYPES: { value: DataType; label: string }[] = [
    { value: 'STRING', label: 'Text' },
    { value: 'NUMBER', label: 'Number' },
    { value: 'DATE', label: 'Date' },
    { value: 'USER', label: 'User' },
    { value: 'TASK', label: 'Task' },
    { value: 'DOCUMENT', label: 'Document' },
    { value: 'CUSTOM', label: 'Custom' },
]

interface ProjectDetailViewProps {
    project: Project
    tasks: Task[]
    onRefresh: () => void
    onCreateTask: () => void
}

type ViewMode = 'list' | 'calendar'
type StatusFilter = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'IN_REVIEW' | 'COMPLETED'

interface EditableContentProps {
    value: string
    onSave: (value: string) => void
    placeholder?: string
    className?: string
    inputClassName?: string
    isTextarea?: boolean
    textStyle?: string
}

/** Notion-style inline editable: single contentEditable div, no visible box. */
const EditableContent = ({
    value,
    onSave,
    placeholder = 'Click to edit',
    className = '',
    inputClassName = '',
    isTextarea = false,
    textStyle = ''
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
        el.focus()
        // Clear first to avoid appending to any residual content (e.g. <br> from browser)
        el.textContent = ''
        el.textContent = displayValue
        placeCaretAtEnd(el)
        setEditEmpty(!displayValue.trim())
    }, [isEditing, displayValue])

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
        if (e.key === 'Enter' && !isTextarea) {
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
                        'outline-none cursor-text rounded px-1 -mx-1 py-0.5 -my-0.5 break-words',
                        'bg-muted/30 focus:bg-muted/40 transition-colors duration-150',
                        'min-h-[1.5em]',
                        isTextarea && 'min-h-[80px] whitespace-pre-wrap',
                        textStyle,
                        inputClassName
                    )}
                />
                {/* Placeholder overlay when empty – avoid ::before on contentEditable (causes duplicate text) */}
                {editEmpty && (
                    <div
                        className={cn(
                            'pointer-events-none absolute left-0 top-0 px-1 py-0.5 text-muted-foreground/50 italic',
                            'min-h-[1.5em]',
                            textStyle,
                            isTextarea && 'min-h-[80px]'
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
                'flex items-start gap-2',
                className
            )}
            title="Click to edit"
        >
            <div className={cn('flex-1 break-words min-h-[1.5em]', textStyle)}>
                {displayValue || <span className="text-muted-foreground/50 italic">{placeholder}</span>}
            </div>
            <Pencil className="h-3.5 w-3.5 mt-1.5 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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

export function ProjectDetailView({
    project,
    tasks,
    onRefresh,
    onCreateTask
}: ProjectDetailViewProps) {
    const { getToken } = useAuth()
    const [view, setView] = useState<ViewMode>('list')
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [editTaskOpen, setEditTaskOpen] = useState(false)
    const [taskToEdit, setTaskToEdit] = useState<Task | null>(null)

    // Local project state for optimistic updates
    const [localProject, setLocalProject] = useState(project)
    const [editProjectName, setEditProjectName] = useState(project.name || project.description || '')
    const [editProjectDescription, setEditProjectDescription] = useState(project.description || '')
    const [isSubmitting, setIsSubmitting] = useState(false)

    useEffect(() => {
        setLocalProject(project)
    }, [project])

    // Settings modal state
    const [settingsDialogOpen, setSettingsDialogOpen] = useState(false)
    const [settingsModalPage, setSettingsModalPage] = useState<'settings' | 'createField' | 'editField'>('settings')
    const [customFields, setCustomFields] = useState<CustomField[]>([])
    const [isLoadingCustomFields, setIsLoadingCustomFields] = useState(false)
    const [newFieldName, setNewFieldName] = useState('')
    const [newFieldDescription, setNewFieldDescription] = useState('')
    const [newFieldDefaultValue, setNewFieldDefaultValue] = useState('')
    const [newFieldDataType, setNewFieldDataType] = useState<DataType>('STRING')
    const [newFieldColor, setNewFieldColor] = useState('')
    const [newFieldRequired, setNewFieldRequired] = useState(false)
    const [isCreatingField, setIsCreatingField] = useState(false)

    // Edit field state
    const [editingField, setEditingField] = useState<CustomField | null>(null)
    const [editFieldName, setEditFieldName] = useState('')
    const [editFieldDescription, setEditFieldDescription] = useState('')
    const [editFieldDefaultValue, setEditFieldDefaultValue] = useState('')
    const [editFieldDataType, setEditFieldDataType] = useState<DataType>('STRING')
    const [editFieldColor, setEditFieldColor] = useState('')
    const [editFieldRequired, setEditFieldRequired] = useState(false)
    const [isUpdatingField, setIsUpdatingField] = useState(false)
    const [isDeletingField, setIsDeletingField] = useState(false)
    const [isCopyingProject, setIsCopyingProject] = useState(false)
    const taskListRef = useRef<TaskListRef>(null)


    const handleUpdateProjectField = async (updates: Partial<Project>) => {
        // Optimistic update
        setLocalProject(prev => ({ ...prev, ...updates }))

        try {
            const token = await getToken()
            if (!token) return

            await projectApi.updateProject(token, project.id, updates)
            toast.success('Project updated')
            onRefresh()
        } catch (error) {
            console.error('Failed to update project:', error)
            toast.error('Failed to update project')
            // Revert on error
            setLocalProject(project)
        }
    }

    const handleEditProject = async () => {
        try {
            setIsSubmitting(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await projectApi.updateProject(token, project.id, {
                name: editProjectName,
                description: editProjectDescription
            })

            toast.success('Project updated successfully')
            onRefresh()
        } catch (error) {
            console.error('Failed to update project:', error)
            toast.error('Failed to update project')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDeleteProject = async () => {
        try {
            setIsSubmitting(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await projectApi.deleteProject(token, project.id)
            toast.success('Project deleted successfully')
            setDeleteDialogOpen(false)
            window.history.back()
        } catch (error) {
            console.error('Failed to delete project:', error)
            toast.error('Failed to delete project')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleCopyProject = async () => {
        try {
            setIsCopyingProject(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await projectApi.copyProject(token, project.id)
            toast.success('Project copied successfully')
            setSettingsDialogOpen(false)
            onRefresh()
        } catch (error) {
            console.error('Failed to copy project:', error)
            toast.error('Failed to copy project')
        } finally {
            setIsCopyingProject(false)
        }
    }

    const handleDeleteTask = async (taskId: string) => {
        try {
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await taskApi.deleteTask(token, project.id, taskId)
            toast.success('Task deleted successfully')
            onRefresh()
        } catch (error) {
            console.error('Failed to delete task:', error)
            toast.error('Failed to delete task')
        }
    }

    const handleCopyTask = async (task: Task) => {
        try {
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await taskApi.copyTask(token, project.id, task.id)
            toast.success('Task copied successfully')
            onRefresh()
        } catch (error) {
            console.error('Failed to copy task:', error)
            toast.error('Failed to copy task')
        }
    }

    const fetchCustomFields = async () => {
        try {
            setIsLoadingCustomFields(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            const response = await customFieldApi.getCustomFields(token, project.id)
            setCustomFields(response.data || [])
        } catch (error) {
            console.error('Failed to fetch custom fields:', error)
            toast.error('Failed to load custom fields')
        } finally {
            setIsLoadingCustomFields(false)
        }
    }

    const handleCreateCustomField = async () => {
        if (!newFieldName.trim()) {
            toast.error('Name is required')
            return
        }

        try {
            setIsCreatingField(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await customFieldApi.createCustomField(token, project.id, {
                name: newFieldName.trim(),
                description: newFieldDescription.trim() || undefined,
                defaultValue: newFieldDefaultValue.trim() || undefined,
                dataType: newFieldDataType,
                color: newFieldColor.trim() || undefined,
                required: newFieldRequired
            })

            toast.success('Custom field created successfully')
            resetNewFieldForm()
            fetchCustomFields()
        } catch (error) {
            console.error('Failed to create custom field:', error)
            toast.error('Failed to create custom field')
        } finally {
            setIsCreatingField(false)
        }
    }

    const handleOpenEditField = (field: CustomField) => {
        setEditingField(field)
        setEditFieldName(field.name)
        setEditFieldDescription(field.description || '')
        setEditFieldDefaultValue(field.defaultValue || '')
        setEditFieldDataType(field.dataType)
        setEditFieldColor(field.color || '')
        setEditFieldRequired(field.required)
        setSettingsModalPage('editField')
    }

    const handleUpdateCustomField = async () => {
        if (!editingField || !editFieldName.trim()) {
            toast.error('Name is required')
            return
        }

        try {
            setIsUpdatingField(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await customFieldApi.updateCustomField(token, project.id, editingField.id, {
                name: editFieldName.trim(),
                description: editFieldDescription.trim() || undefined,
                defaultValue: editFieldDefaultValue.trim() || undefined,
                dataType: editFieldDataType,
                color: editFieldColor.trim() || undefined,
                required: editFieldRequired
            })

            toast.success('Custom field updated successfully')
            resetEditFieldForm()
            fetchCustomFields()
        } catch (error) {
            console.error('Failed to update custom field:', error)
            toast.error('Failed to update custom field')
        } finally {
            setIsUpdatingField(false)
        }
    }

    const handleDeleteCustomField = async () => {
        if (!editingField) return

        try {
            setIsDeletingField(true)
            const token = await getToken()
            if (!token) {
                toast.error('Authentication required')
                return
            }

            await customFieldApi.deleteCustomField(token, project.id, editingField.id)
            toast.success('Custom field deleted successfully')
            resetEditFieldForm()
            fetchCustomFields()
        } catch (error) {
            console.error('Failed to delete custom field:', error)
            toast.error('Failed to delete custom field')
        } finally {
            setIsDeletingField(false)
        }
    }

    const resetEditFieldForm = () => {
        setEditingField(null)
        setEditFieldName('')
        setEditFieldDescription('')
        setEditFieldDefaultValue('')
        setEditFieldDataType('STRING')
        setEditFieldColor('')
        setEditFieldRequired(false)
        setSettingsModalPage('settings')
    }

    const resetNewFieldForm = () => {
        setNewFieldName('')
        setNewFieldDescription('')
        setNewFieldDefaultValue('')
        setNewFieldDataType('STRING')
        setNewFieldColor('')
        setNewFieldRequired(false)
        setSettingsModalPage('settings')
    }


    const handleOpenSettings = () => {
        setEditProjectName(project.name || '')
        setEditProjectDescription(project.description || '')
        setSettingsDialogOpen(true)
        fetchCustomFields()
    }

    const getStatusIcon = (status: Task['status']) => {
        switch (status) {
            case 'COMPLETED': return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            case 'IN_PROGRESS': return <Circle className="h-4 w-4 text-blue-600" />
            case 'IN_REVIEW': return <AlertCircle className="h-4 w-4 text-amber-600" />
            default: return <Circle className="h-4 w-4 text-muted-foreground/30" />
        }
    }

    const getStatusLabel = (status: Task['status']) => {
        switch (status) {
            case 'COMPLETED': return 'Completed'
            case 'IN_PROGRESS': return 'In Progress'
            case 'IN_REVIEW': return 'In Review'
            default: return 'Pending'
        }
    }

    // Filter tasks
    const filteredTasks = tasks.filter(task => {
        const matchesSearch = task.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter
        return matchesSearch && matchesStatus
    })


    const router = useRouter()
    const searchParams = useSearchParams()

    // Fetch custom fields on mount
    useEffect(() => {
        fetchCustomFields()
    }, [project.id])

    // Sync URL with selected task
    useEffect(() => {
        const taskId = searchParams.get('taskId')
        if (taskId && tasks.length > 0) {
            const task = tasks.find(t => t.id === taskId)
            if (task) {
                setSelectedTask(task)
            } else {
                // Task in URL not found in current list (maybe separate fetch needed if pagination, but likely just wait for tasks)
                // If tasks are loaded and task not found, maybe clear param?
                // For now, let's trust tasks list is complete for the project
            }
        } else if (!taskId) {
            setSelectedTask(null)
        }
    }, [searchParams, tasks])

    const handleTaskSelect = (task: Task) => {
        const params = new URLSearchParams(searchParams.toString())
        params.set('taskId', task.id)
        router.push(`?${params.toString()}`, { scroll: false })
    }

    const handleTaskClose = () => {
        const params = new URLSearchParams(searchParams.toString())
        params.delete('taskId')
        router.push(`?${params.toString()}`, { scroll: false })
    }

    // Refresh handler that keeps task selected
    const handleRefresh = async () => {
        await onRefresh()
        // If selected task exists, checking for updates is handled by task list update
        // But if we need to update the detail view specifically, that's done inside TaskDetailView via its own refresh
    }

    if (selectedTask) {
        return (
            <TaskDetailView
                task={selectedTask}
                onBack={handleTaskClose}
                onUpdate={handleRefresh}
                onDelete={() => {
                    handleTaskClose()
                    handleRefresh()
                }}
                workspaceName={project.workspace?.name}
                workspaceId={project.workspaceId}
                projectName={project.name}
                projectId={project.id}
            />
        )
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
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Link href={`/workspaces/${project.workspaceId}`} className="hover:text-foreground hover:underline transition-colors cursor-pointer">
                                    {project.workspace.name}
                                </Link>
                                <span className="text-muted-foreground/40">/</span>
                                <span className="font-medium text-foreground">{project.name}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 max-w-2xl">
                            <EditableContent
                                value={localProject.name}
                                onSave={(val) => handleUpdateProjectField({ name: val })}
                                className="w-fit"
                                textStyle="text-3xl font-semibold tracking-tight text-foreground"
                                inputClassName="text-3xl font-semibold h-auto py-1 px-2"
                                placeholder="Project Name"
                            />
                            <EditableContent
                                value={localProject.description || ''}
                                onSave={(val) => handleUpdateProjectField({ description: val })}
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
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer",
                                    view === 'list'
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <ListIcon className="h-4 w-4" />
                                List
                            </button>
                            <button
                                onClick={() => setView('calendar')}
                                className={cn(
                                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer",
                                    view === 'calendar'
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                )}
                            >
                                <CalendarIcon className="h-4 w-4" />
                                Calendar
                            </button>
                        </div>

                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 bg-white border-border hover:bg-muted shadow-sm cursor-pointer"
                            onClick={handleOpenSettings}
                            title="Project Settings"
                        >
                            <Settings className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 bg-white border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 shadow-sm cursor-pointer"
                            onClick={() => setDeleteDialogOpen(true)}
                            title="Delete Project"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-6 bg-border mx-1" />
                        <Button 
                            onClick={() => {
                                if (taskListRef.current) {
                                    taskListRef.current.startCreatingTask()
                                }
                            }} 
                            className="gap-2 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        >
                            <Plus className="h-4 w-4" />
                            New Task
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Controls */}
            {view === 'list' && (
                <div className="flex items-center justify-between pb-2">
                    <div className="relative w-72">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tasks..."
                            className="pl-9 bg-white border-border shadow-sm"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
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
                                <Button variant="outline" size="sm" className="gap-2 text-muted-foreground hover:text-foreground bg-white cursor-pointer">
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
                                <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === 'ALL'}
                                    onCheckedChange={() => setStatusFilter('ALL')}
                                >
                                    All Tasks
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === 'PENDING'}
                                    onCheckedChange={() => setStatusFilter('PENDING')}
                                >
                                    Pending
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === 'IN_PROGRESS'}
                                    onCheckedChange={() => setStatusFilter('IN_PROGRESS')}
                                >
                                    In Progress
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === 'IN_REVIEW'}
                                    onCheckedChange={() => setStatusFilter('IN_REVIEW')}
                                >
                                    In Review
                                </DropdownMenuCheckboxItem>
                                <DropdownMenuCheckboxItem
                                    checked={statusFilter === 'COMPLETED'}
                                    onCheckedChange={() => setStatusFilter('COMPLETED')}
                                >
                                    Completed
                                </DropdownMenuCheckboxItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                {view === 'calendar' ? (
                    <div className="flex-1 min-h-0">
                        <ProjectCalendarView tasks={tasks} />
                    </div>
                ) : (
                    <div className="flex flex-col h-full w-full max-w-full">
                        {/* Loading state */}
                        {isLoadingCustomFields ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="flex-1 overflow-hidden">
                                <TaskList
                                    ref={taskListRef}
                                    tasks={filteredTasks}
                                    customFields={customFields}
                                    onTaskClick={handleTaskSelect}
                                    onTaskEdit={(task) => {
                                        setTaskToEdit(task)
                                        setEditTaskOpen(true)
                                    }}
                                    onTaskDelete={handleDeleteTask}
                                    onTaskCopy={handleCopyTask}
                                    onCustomFieldCreated={fetchCustomFields}
                                    onTaskCreated={onRefresh}
                                    projectId={project.id}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Project Settings Dialog */}
            <Dialog open={settingsDialogOpen} onOpenChange={(open) => {
                setSettingsDialogOpen(open)
                if (!open) {
                    resetNewFieldForm()
                }
            }}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    {settingsModalPage === 'settings' ? (
                        <>
                            <DialogHeader>
                                <DialogTitle>Project Settings</DialogTitle>
                                <DialogDescription>
                                    Manage project details and custom fields
                                </DialogDescription>
                            </DialogHeader>

                            {/* Project Details Section */}
                            <div className="space-y-4 py-4">
                                <div className="space-y-4">
                                    <h3 className="text-sm font-semibold text-foreground">Project Details</h3>
                                    <div className="space-y-2">
                                        <Label htmlFor="settings-project-name">Project Name</Label>
                                        <Input
                                            id="settings-project-name"
                                            value={editProjectName}
                                            onChange={(e) => setEditProjectName(e.target.value)}
                                            placeholder="Enter project name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="settings-project-description">Description</Label>
                                        <Textarea
                                            id="settings-project-description"
                                            value={editProjectDescription}
                                            onChange={(e) => setEditProjectDescription(e.target.value)}
                                            placeholder="Enter project description"
                                            rows={3}
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={handleEditProject}
                                            disabled={isSubmitting || !editProjectName.trim()}
                                            size="sm"
                                        >
                                            {isSubmitting ? 'Saving...' : 'Update Project'}
                                        </Button>
                                        <Button
                                            onClick={handleCopyProject}
                                            disabled={isCopyingProject}
                                            size="sm"
                                            variant="outline"
                                            className="gap-1"
                                        >
                                            {isCopyingProject ? (
                                                <>
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                    Copying...
                                                </>
                                            ) : (
                                                <>
                                                    <Copy className="h-3.5 w-3.5" />
                                                    Copy Project
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                <div className="border-t border-border my-6" />

                                {/* Custom Fields Section */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-semibold text-foreground">Custom Fields</h3>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSettingsModalPage('createField')}
                                            className="gap-1"
                                        >
                                            <Plus className="h-3.5 w-3.5" />
                                            Add Field
                                        </Button>
                                    </div>

                                    {/* Custom Fields List */}
                                    {isLoadingCustomFields ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                        </div>
                                    ) : customFields.length === 0 ? (
                                        <div className="text-center py-8 text-muted-foreground">
                                            <p className="text-sm">No custom fields defined yet.</p>
                                            <p className="text-xs mt-1">Click "Add Field" to create your first custom field.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {customFields.map((field) => (
                                                <div
                                                    key={field.id}
                                                    onClick={() => handleOpenEditField(field)}
                                                    className="flex items-center justify-between p-3 border border-border rounded-lg bg-white hover:bg-muted/30 transition-colors cursor-pointer"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        {field.color && (
                                                            <div
                                                                className="h-3 w-3 rounded-full"
                                                                style={{ backgroundColor: field.color }}
                                                            />
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-medium">{field.name}</p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {DATA_TYPES.find(t => t.value === field.dataType)?.label || field.dataType}
                                                                {field.required && ' • Required'}
                                                                {field.description && ` • ${field.description}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Default: {field.defaultValue}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSettingsDialogOpen(false)}>
                                    Close
                                </Button>
                            </DialogFooter>
                        </>
                    ) : settingsModalPage === 'createField' ? (
                        <>
                            {/* Create Custom Field Page */}
                            <DialogHeader>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 -ml-2"
                                        onClick={resetNewFieldForm}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <div>
                                        <DialogTitle>Create Custom Field</DialogTitle>
                                        <DialogDescription>
                                            Add a new custom field to this project
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="field-name">Name *</Label>
                                        <Input
                                            id="field-name"
                                            value={newFieldName}
                                            onChange={(e) => setNewFieldName(e.target.value)}
                                            placeholder="Field name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="field-type">Data Type *</Label>
                                        <Select value={newFieldDataType} onValueChange={(value: DataType) => setNewFieldDataType(value)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DATA_TYPES.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="field-description">Description</Label>
                                    <Input
                                        id="field-description"
                                        value={newFieldDescription}
                                        onChange={(e) => setNewFieldDescription(e.target.value)}
                                        placeholder="Optional description"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="field-default">Default Value</Label>
                                        <Input
                                            id="field-default"
                                            value={newFieldDefaultValue}
                                            onChange={(e) => setNewFieldDefaultValue(e.target.value)}
                                            placeholder="Default value"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="field-color">Color</Label>
                                        <Input
                                            id="field-color"
                                            value={newFieldColor}
                                            onChange={(e) => setNewFieldColor(e.target.value)}
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="field-required"
                                        checked={newFieldRequired}
                                        onCheckedChange={(checked) => setNewFieldRequired(checked === true)}
                                    />
                                    <Label htmlFor="field-required" className="text-sm font-normal cursor-pointer">
                                        Required field
                                    </Label>
                                </div>
                            </div>

                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={resetNewFieldForm}
                                    disabled={isCreatingField}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateCustomField}
                                    disabled={isCreatingField || !newFieldName.trim()}
                                >
                                    {isCreatingField ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        'Create Field'
                                    )}
                                </Button>
                            </DialogFooter>
                        </>
                    ) : (
                        <>
                            {/* Edit Custom Field Page */}
                            <DialogHeader>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 -ml-2"
                                        onClick={resetEditFieldForm}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </Button>
                                    <div>
                                        <DialogTitle>Edit Custom Field</DialogTitle>
                                        <DialogDescription>
                                            Update or delete this custom field
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <div className="space-y-4 py-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-field-name">Name *</Label>
                                        <Input
                                            id="edit-field-name"
                                            value={editFieldName}
                                            onChange={(e) => setEditFieldName(e.target.value)}
                                            placeholder="Field name"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-field-type">Data Type *</Label>
                                        <Select value={editFieldDataType} onValueChange={(value: DataType) => setEditFieldDataType(value)}>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select type" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {DATA_TYPES.map((type) => (
                                                    <SelectItem key={type.value} value={type.value}>
                                                        {type.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="edit-field-description">Description</Label>
                                    <Input
                                        id="edit-field-description"
                                        value={editFieldDescription}
                                        onChange={(e) => setEditFieldDescription(e.target.value)}
                                        placeholder="Optional description"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-field-default">Default Value</Label>
                                        <Input
                                            id="edit-field-default"
                                            value={editFieldDefaultValue}
                                            onChange={(e) => setEditFieldDefaultValue(e.target.value)}
                                            placeholder="Default value"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="edit-field-color">Color</Label>
                                        <Input
                                            id="edit-field-color"
                                            value={editFieldColor}
                                            onChange={(e) => setEditFieldColor(e.target.value)}
                                            placeholder="#000000"
                                        />
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="edit-field-required"
                                        checked={editFieldRequired}
                                        onCheckedChange={(checked) => setEditFieldRequired(checked === true)}
                                    />
                                    <Label htmlFor="edit-field-required" className="text-sm font-normal cursor-pointer">
                                        Required field
                                    </Label>
                                </div>
                            </div>

                            <DialogFooter className="flex justify-between sm:justify-between">
                                <Button
                                    variant="destructive"
                                    onClick={handleDeleteCustomField}
                                    disabled={isUpdatingField || isDeletingField}
                                >
                                    {isDeletingField ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Deleting...
                                        </>
                                    ) : (
                                        <>
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </>
                                    )}
                                </Button>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={resetEditFieldForm}
                                        disabled={isUpdatingField || isDeletingField}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={handleUpdateCustomField}
                                        disabled={isUpdatingField || isDeletingField || !editFieldName.trim()}
                                    >
                                        {isUpdatingField ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            'Save Changes'
                                        )}
                                    </Button>
                                </div>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Project Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Project</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this project? This will also delete all tasks in this project. This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteProject} disabled={isSubmitting}>
                            {isSubmitting ? 'Deleting...' : 'Delete Project'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {
                taskToEdit && (
                    <EditTaskDialog
                        open={editTaskOpen}
                        onOpenChange={setEditTaskOpen}
                        task={taskToEdit}
                        onSuccess={onRefresh}
                    />
                )
            }
        </div >
    )
}
