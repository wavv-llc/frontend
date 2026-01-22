'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DatePicker } from '@/components/ui/date-picker'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { taskApi, customFieldApi, CustomField } from '@/lib/api'
import { toast } from 'sonner'

interface CreateTaskDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
    onSuccess?: () => void
}

export function CreateTaskDialog({
    open,
    onOpenChange,
    projectId,
    onSuccess,
}: CreateTaskDialogProps) {
    const { getToken } = useAuth()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [dueDate, setDueDate] = useState<Date | undefined>(new Date())
    const [isLoading, setIsLoading] = useState(false)
    const [customFields, setCustomFields] = useState<CustomField[]>([])
    const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({})
    const [isLoadingFields, setIsLoadingFields] = useState(false)

    // Fetch custom fields when dialog opens
    useEffect(() => {
        if (open && projectId) {
            fetchCustomFields()
        }
    }, [open, projectId])

    const fetchCustomFields = async () => {
        setIsLoadingFields(true)
        try {
            const token = await getToken()
            if (!token) return

            const response = await customFieldApi.getCustomFields(token, projectId)
            const fields = response.data || []
            setCustomFields(fields)

            // Initialize custom field values with defaults
            const initialValues: Record<string, string> = {}
            fields.forEach((field) => {
                initialValues[field.id] = field.defaultValue || ''
            })
            setCustomFieldValues(initialValues)
        } catch (error) {
            console.error('Failed to fetch custom fields:', error)
        } finally {
            setIsLoadingFields(false)
        }
    }

    const updateCustomFieldValue = (fieldId: string, value: string) => {
        setCustomFieldValues((prev) => ({
            ...prev,
            [fieldId]: value,
        }))
    }

    const validateCustomFields = (): boolean => {
        for (const field of customFields) {
            const value = customFieldValues[field.id]

            // Check required fields
            if (field.required && (!value || value.trim() === '')) {
                toast.error(`${field.name} is required`)
                return false
            }

            // Skip validation for empty non-required fields
            if (!value || value.trim() === '') continue

            // Data type validation
            switch (field.dataType) {
                case 'NUMBER':
                    if (isNaN(Number(value))) {
                        toast.error(`${field.name} must be a valid number`)
                        return false
                    }
                    break
                case 'DATE':
                    if (isNaN(Date.parse(value))) {
                        toast.error(`${field.name} must be a valid date`)
                        return false
                    }
                    break
                case 'CUSTOM':
                    if (field.customOptions && field.customOptions.length > 0) {
                        if (!field.customOptions.includes(value)) {
                            toast.error(`${field.name} must be one of the available options`)
                            return false
                        }
                    }
                    break
            }
        }
        return true
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error('Please enter a task name')
            return
        }

        // Validate custom fields
        if (!validateCustomFields()) {
            return
        }

        setIsLoading(true)
        try {
            const token = await getToken()
            if (!token) {
                toast.error('You must be logged in to create a task')
                return
            }

            // Build custom fields object for API
            const customFieldsPayload: Record<string, string | number | null> = {}
            customFields.forEach((field) => {
                const value = customFieldValues[field.id]
                if (value && value.trim() !== '') {
                    if (field.dataType === 'NUMBER') {
                        customFieldsPayload[field.id] = Number(value)
                    } else {
                        customFieldsPayload[field.id] = value
                    }
                } else {
                    customFieldsPayload[field.id] = null
                }
            })

            await taskApi.createTask(token, projectId, {
                name,
                description: description || undefined,
                dueAt: dueDate ? dueDate.toISOString() : undefined,
                status: 'PENDING',
                customFields: customFieldsPayload,
            })

            toast.success('Task created successfully')

            // Reset form
            setName('')
            setDescription('')
            setDueDate(new Date())
            setCustomFieldValues({})

            // Close dialog first
            onOpenChange(false)

            // Then refresh data after a brief delay to ensure dialog is closed
            setTimeout(() => {
                onSuccess?.()
            }, 100)
        } catch (error) {
            console.error('Failed to create task:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to create task')
        } finally {
            setIsLoading(false)
        }
    }

    const renderCustomFieldInput = (field: CustomField) => {
        const value = customFieldValues[field.id] || ''

        switch (field.dataType) {
            case 'NUMBER':
                return (
                    <Input
                        type="number"
                        value={value}
                        onChange={(e) => updateCustomFieldValue(field.id, e.target.value)}
                        disabled={isLoading}
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                    />
                )

            case 'DATE':
                return (
                    <DatePicker
                        date={value ? new Date(value) : undefined}
                        setDate={(date) =>
                            updateCustomFieldValue(field.id, date ? date.toISOString() : '')
                        }
                        disabled={isLoading}
                        placeholder={`Select ${field.name.toLowerCase()}`}
                    />
                )

            case 'CUSTOM':
                if (field.customOptions && field.customOptions.length > 0) {
                    return (
                        <Select
                            value={value}
                            onValueChange={(val) => updateCustomFieldValue(field.id, val)}
                            disabled={isLoading}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder={`Select ${field.name.toLowerCase()}`} />
                            </SelectTrigger>
                            <SelectContent>
                                {field.customOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )
                }
                return (
                    <Input
                        type="text"
                        value={value}
                        onChange={(e) => updateCustomFieldValue(field.id, e.target.value)}
                        disabled={isLoading}
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                    />
                )

            case 'STRING':
            case 'USER':
            case 'TASK':
            case 'DOCUMENT':
            default:
                return (
                    <Input
                        type="text"
                        value={value}
                        onChange={(e) => updateCustomFieldValue(field.id, e.target.value)}
                        disabled={isLoading}
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                    />
                )
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New Task</DialogTitle>
                        <DialogDescription>
                            Create a new task for this project.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                Task Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g., Review financial statements"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                disabled={isLoading}
                                autoFocus
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Add a description for this task..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isLoading}
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="dueDate">Due Date (Optional)</Label>
                            <DatePicker
                                date={dueDate}
                                setDate={setDueDate}
                                disabled={isLoading}
                                placeholder="Select a due date"
                            />
                        </div>

                        {/* Custom Fields Section */}
                        {isLoadingFields ? (
                            <div className="text-sm text-muted-foreground">
                                Loading custom fields...
                            </div>
                        ) : (
                            customFields.length > 0 && (
                                <div className="space-y-4 border-t pt-4">
                                    <div className="text-sm font-medium text-muted-foreground">
                                        Custom Fields
                                    </div>
                                    {customFields.map((field) => (
                                        <div key={field.id} className="grid gap-2">
                                            <Label htmlFor={`custom-${field.id}`}>
                                                {field.name}
                                                {field.required && (
                                                    <span className="text-destructive ml-1">*</span>
                                                )}
                                            </Label>
                                            {field.description && (
                                                <p className="text-xs text-muted-foreground">
                                                    {field.description}
                                                </p>
                                            )}
                                            {renderCustomFieldInput(field)}
                                        </div>
                                    ))}
                                </div>
                            )
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || isLoadingFields}>
                            {isLoading ? 'Creating...' : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
