'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@clerk/nextjs'
import { Folder, User, FileText, Plus, MoreVertical, Loader2, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkspaceListSkeleton } from '@/components/skeletons/WorkspaceListSkeleton'
import Link from 'next/link'
import { workspaceApi, type Workspace } from '@/lib/api'
import { CreateWorkspaceDialog } from '@/components/dialogs/CreateWorkspaceDialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'

export default function WorkspacesPage() {
    const { getToken } = useAuth()
    const [workspaces, setWorkspaces] = useState<Workspace[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showSkeleton, setShowSkeleton] = useState(false)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const fetchWorkspaces = async () => {
        try {
            const token = await getToken()
            if (!token) {
                toast.error('You must be logged in to view workspaces')
                return
            }

            const response = await workspaceApi.getWorkspaces(token)
            setWorkspaces(response.data || [])
        } catch (error) {
            console.error('Failed to fetch workspaces:', error)
            toast.error('Failed to load workspaces')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchWorkspaces()
    }, [])

    useEffect(() => {
        const timer = setTimeout(() => setShowSkeleton(true), 150)
        return () => clearTimeout(timer)
    }, [])

    const handleCreateSuccess = () => {
        fetchWorkspaces()
    }

    const handleDelete = async (workspaceId: string, e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
            return
        }

        setDeletingId(workspaceId)
        try {
            const token = await getToken()
            if (!token) {
                toast.error('You must be logged in')
                return
            }

            await workspaceApi.deleteWorkspace(token, workspaceId)
            toast.success('Workspace deleted successfully')
            fetchWorkspaces()
        } catch (error) {
            console.error('Failed to delete workspace:', error)
            toast.error('Failed to delete workspace')
        } finally {
            setDeletingId(null)
        }
    }

    return (
        <>
            <div className="h-full bg-background p-8 overflow-y-auto animate-in fade-in duration-300">
                {/* Header */}
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight mb-2">Workspaces</h1>
                            <p className="text-muted-foreground">Manage your tax projects and folders.</p>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading ? (
                        showSkeleton ? <WorkspaceListSkeleton /> : null
                    ) : (
                        /* Grid */
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {workspaces.map((workspace) => (
                                <Link key={workspace.id} href={`/workspaces/${workspace.id}`} className="block h-full">
                                    <div
                                        className="group relative bg-card border border-border rounded-xl p-6 hover:bg-muted/30 transition-colors cursor-pointer h-full flex flex-col"
                                    >
                                        {/* Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="h-12 w-12 bg-primary/5 rounded-lg flex items-center justify-center text-primary">
                                                <Folder className="h-6 w-6" />
                                            </div>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button
                                                        className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                        }}
                                                    >
                                                        <MoreVertical className="h-5 w-5" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                                                    <DropdownMenuItem
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            toast.info('Edit functionality coming soon!')
                                                        }}
                                                    >
                                                        <Pencil className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive focus:text-destructive"
                                                        onClick={(e) => handleDelete(workspace.id, e)}
                                                        disabled={deletingId === workspace.id}
                                                    >
                                                        {deletingId === workspace.id ? (
                                                            <>
                                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                                Deleting...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Delete
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        {/* Content */}
                                        <h3 className="font-semibold text-lg mb-2 group-hover:underline decoration-muted-foreground/30 underline-offset-4">{workspace.name}</h3>
                                        <p className="text-sm text-muted-foreground mb-6 line-clamp-2 flex-1">
                                            {workspace.description || 'No description'}
                                        </p>

                                        {/* Progress */}
                                        <div className="mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary transition-all duration-500 rounded-full"
                                                        style={{ width: `${workspace.progress || 0}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-muted-foreground w-10 text-right font-medium">
                                                    {workspace.progress || 0}%
                                                </span>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <div className="flex items-center gap-1.5">
                                                <User className="h-4 w-4" />
                                                <span>{workspace.members.length} members</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}

                            {/* Create New Card */}
                            <button
                                onClick={() => setShowCreateDialog(true)}
                                className="cursor-pointer flex flex-col items-center justify-center h-full min-h-[280px] rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/30 transition-all group"
                            >
                                <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                                    <Plus className="h-6 w-6 text-muted-foreground group-hover:text-primary" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground">Create New Workspace</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <CreateWorkspaceDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onSuccess={handleCreateSuccess}
            />
        </>
    )
}
