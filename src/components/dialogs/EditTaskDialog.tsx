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
import { taskApi, categoryApi, type Category, type Task } from '@/lib/api'
import { toast } from 'sonner'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface EditTaskDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    task: Task
    onSuccess?: () => void
}

export function EditTaskDialog({
    open,
    onOpenChange,
    task,
    onSuccess,
}: EditTaskDialogProps) {
    const { getToken } = useAuth()
    const [name, setName] = useState(task.name)
    const [description, setDescription] = useState(task.description || '')
    const [dueDate, setDueDate] = useState<Date | undefined>(task.dueAt ? new Date(task.dueAt) : undefined)
    const [isLoading, setIsLoading] = useState(false)
    const [categories, setCategories] = useState<Category[]>([])
    const [selectedCategoryId, setSelectedCategoryId] = useState<string>(task.categoryId || '')
    const [isLoadingCategories, setIsLoadingCategories] = useState(false)

    // Fetch categories when dialog opens
    useEffect(() => {
        if (open && task.projectId) {
            const fetchCategories = async () => {
                try {
                    setIsLoadingCategories(true)
                    const token = await getToken()
                    if (token) {
                        const response = await categoryApi.getCategoriesByProject(token, task.projectId)
                        if (response.data && Array.isArray(response.data)) {
                            setCategories(response.data)
                        }
                    }
                } catch (error) {
                    console.error('Failed to fetch categories:', error)
                    toast.error('Failed to load categories')
                } finally {
                    setIsLoadingCategories(false)
                }
            }
            fetchCategories()
        }
    }, [open, task.projectId, getToken])

    // Update state when task changes (e.g. initial load)
    useEffect(() => {
        if (open) {
            setName(task.name)
            setDescription(task.description || '')
            setDueDate(task.dueAt ? new Date(task.dueAt) : undefined)
            setSelectedCategoryId(task.categoryId || '')
        }
    }, [open, task])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error('Please enter a task name')
            return
        }

        if (!selectedCategoryId) {
            toast.error('Please select a category')
            return
        }

        setIsLoading(true)
        try {
            const token = await getToken()
            if (!token) {
                toast.error('You must be logged in to update a task')
                return
            }

            // We need to pass the categoryId in the update payload.
            // Assuming taskApi.updateTask supports categoryId.
            // If not, we might need to check api.ts again or update it.
            // Looking at previous interactions, CreateTask uses categoryId, so typically UpdateTask should too.
            // However, the api.ts viewing earlier didn't explicitly show updateTask payload type fully expanded but normally it mirrors create/Task model.

            await taskApi.updateTask(token, task.projectId, task.id, {
                name,
                description: description || undefined,
                dueAt: dueDate ? dueDate.toISOString() : undefined,
                categoryId: selectedCategoryId,
                // Preserve status unless we add a field for it here
            })

            toast.success('Task updated successfully')
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error('Failed to update task:', error)
            toast.error('Failed to update task')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Edit Task</DialogTitle>
                        <DialogDescription>
                            Update task details and assignments.
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
                            <Label htmlFor="category">
                                Category <span className="text-destructive">*</span>
                            </Label>
                            <Select
                                value={selectedCategoryId}
                                onValueChange={setSelectedCategoryId}
                                disabled={isLoading || isLoadingCategories}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={isLoadingCategories ? "Loading categories..." : "Select a category"} />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground text-center">
                                            No categories found.
                                        </div>
                                    ) : (
                                        categories.map((category) => (
                                            <SelectItem key={category.id} value={category.id}>
                                                <div className="flex items-center gap-2">
                                                    {category.color && (
                                                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                                                    )}
                                                    {category.name}
                                                </div>
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
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
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
