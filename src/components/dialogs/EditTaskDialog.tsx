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
import { taskApi, type Task } from '@/lib/api'
import { toast } from 'sonner'

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

    // Update state when task changes (e.g. initial load)
    useEffect(() => {
        if (open) {
            setName(task.name)
            setDescription(task.description || '')
            setDueDate(task.dueAt ? new Date(task.dueAt) : undefined)
        }
    }, [open, task])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error('Please enter a task name')
            return
        }

        setIsLoading(true)
        try {
            const token = await getToken()
            if (!token) {
                toast.error('You must be logged in to update a task')
                return
            }

            await taskApi.updateTask(token, task.projectId, task.id, {
                name,
                description: description || undefined,
                dueAt: dueDate ? dueDate.toISOString() : undefined,
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
