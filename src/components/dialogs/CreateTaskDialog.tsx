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
import { taskApi } from '@/lib/api'
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
                toast.error('You must be logged in to create a task')
                return
            }

            await taskApi.createTask(token, projectId, {
                name,
                description: description || undefined,
                dueAt: dueDate ? dueDate.toISOString() : undefined,
                status: 'PENDING',
            })

            toast.success('Task created successfully')

            // Reset form
            setName('')
            setDescription('')
            setDueDate(new Date())

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
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
                            {isLoading ? 'Creating...' : 'Create Task'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
