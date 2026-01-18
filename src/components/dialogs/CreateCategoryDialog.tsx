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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { categoryApi } from '@/lib/api'
import { toast } from 'sonner'

interface CreateCategoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    projectId: string
    onSuccess?: () => void
}

export function CreateCategoryDialog({
    open,
    onOpenChange,
    projectId,
    onSuccess,
}: CreateCategoryDialogProps) {
    const { getToken } = useAuth()
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [color, setColor] = useState('#3b82f6') // Default to blue
    const [isLoading, setIsLoading] = useState(false)

    const colors = [
        '#ef4444', // red
        '#f97316', // orange
        '#f59e0b', // amber
        '#84cc16', // lime
        '#22c55e', // green
        '#10b981', // emerald
        '#06b6d4', // cyan
        '#3b82f6', // blue
        '#6366f1', // indigo
        '#8b5cf6', // violet
        '#d946ef', // fuchsia
        '#ec4899', // pink
    ]

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!name.trim()) {
            toast.error('Please enter a category name')
            return
        }

        setIsLoading(true)
        try {
            const token = await getToken()
            if (!token) {
                toast.error('You must be logged in to create a category')
                return
            }

            await categoryApi.createCategory(token, projectId, {
                name,
                description: description || undefined,
                color,
            })

            toast.success('Category created successfully')

            // Reset form
            setName('')
            setDescription('')
            setColor('#3b82f6')

            // Close dialog
            onOpenChange(false)
            onSuccess?.()
        } catch (error) {
            console.error('Failed to create category:', error)
            toast.error('Failed to create category')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Create Category</DialogTitle>
                        <DialogDescription>
                            Create a new category to organize your tasks.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">
                                Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="e.g., Development"
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
                                placeholder="Describe this category..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isLoading}
                                rows={3}
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {colors.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        className={`w-6 h-6 rounded-full border border-border shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring ${color === c ? 'ring-2 ring-offset-2 ring-ring scale-110' : ''
                                            }`}
                                        style={{ backgroundColor: c }}
                                        onClick={() => setColor(c)}
                                        disabled={isLoading}
                                    />
                                ))}
                            </div>
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
                            {isLoading ? 'Creating...' : 'Create Category'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
