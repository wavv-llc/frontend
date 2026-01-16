'use client'

import { useState, useEffect } from 'react'
import { useParams, notFound } from 'next/navigation'
import { useAuth } from '@clerk/nextjs'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { ProjectDetailView } from '@/components/projects/ProjectDetailView'
import { Loader2 } from 'lucide-react'
import { projectApi, taskApi, type Project, type Task } from '@/lib/api'
import { toast } from 'sonner'
import { CreateTaskDialog } from '@/components/dialogs/CreateTaskDialog'

export default function ProjectPage() {
    const params = useParams()
    const { getToken } = useAuth()
    const [project, setProject] = useState<Project | null>(null)
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showCreateTaskDialog, setShowCreateTaskDialog] = useState(false)

    const projectId = params.projectId as string

    const fetchData = async () => {
        try {
            const token = await getToken()
            if (!token) {
                // toast.error('You must be logged in')
                return
            }

            // Fetch project details
            const projectResponse = await projectApi.getProject(token, projectId)
            if (!projectResponse.data) {
                notFound()
                return
            }
            setProject(projectResponse.data)

            // Fetch tasks for this project
            const tasksResponse = await taskApi.getTasksByProject(token, projectId)
            setTasks(tasksResponse.data || [])

        } catch (error) {
            console.error('Failed to fetch project data:', error)
            toast.error('Failed to load project data')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (projectId) {
            fetchData()
        }
    }, [projectId])

    const handleCreateTask = () => {
        setShowCreateTaskDialog(true)
    }

    const handleSuccess = () => {
        fetchData()
    }

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </DashboardLayout>
        )
    }

    if (!project) {
        notFound()
        return null
    }

    return (
        <DashboardLayout>
            <ProjectDetailView
                project={project}
                tasks={tasks}
                onRefresh={fetchData}
                onCreateTask={handleCreateTask}
            />

            <CreateTaskDialog
                open={showCreateTaskDialog}
                onOpenChange={setShowCreateTaskDialog}
                projectId={projectId}
                onSuccess={handleSuccess}
            />
        </DashboardLayout>
    )
}
