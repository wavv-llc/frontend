'use client'

import { useState } from 'react'
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
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { projectApi } from '@/lib/api'
import { toast } from 'sonner'

interface CreateProjectDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    workspaceId: string
    onSuccess?: () => void
}

export function CreateProjectDialog({
    open,
    onOpenChange,
    workspaceId,
    onSuccess,
}: CreateProjectDialogProps) {
    const { getToken } = useAuth()
    const [description, setDescription] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        setIsLoading(true)
        try {
            const token = await getToken()
            if (!token) {
                toast.error('You must be logged in to create a project')
                return
            }

            await projectApi.createProject(token, workspaceId, description || undefined)
            toast.success('Project created successfully')

            // Reset form
            setDescription('')
            onOpenChange(false)

            // Call success callback to refresh data
            onSuccess?.()
        } catch (error) {
            console.error('Failed to create project:', error)
            toast.error(error instanceof Error ? error.message : 'Failed to create project')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create New Project</DialogTitle>
                        <DialogDescription>
                            Create a new project within this workspace.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="description">Project Description (Optional)</Label>
                            <Textarea
                                id="description"
                                placeholder="Add a description for this project..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isLoading}
                                rows={3}
                                autoFocus
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
                            {isLoading ? 'Creating...' : 'Create Project'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
