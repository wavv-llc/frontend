'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { ProjectDetailView } from '@/components/projects/ProjectDetailView';
import { projectApi, taskApi, type Project, type Task } from '@/lib/api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { getCached, setCached } from '@/lib/pageCache';

type ProjectPageData = { project: Project; tasks: Task[] };

export default function ProjectPage() {
    const params = useParams();
    const { getToken } = useAuth();
    const projectId = params.projectId as string;
    const cacheKey = `project:${projectId}`;

    const [project, setProject] = useState<Project | null>(
        () => getCached<ProjectPageData>(cacheKey)?.project ?? null,
    );
    const [tasks, setTasks] = useState<Task[]>(
        () => getCached<ProjectPageData>(cacheKey)?.tasks ?? [],
    );
    const [isLoading, setIsLoading] = useState(() => !getCached(cacheKey));

    const fetchData = async () => {
        try {
            const token = await getToken();
            if (!token) {
                // toast.error('You must be logged in')
                return;
            }

            // Fetch project details
            const projectResponse = await projectApi.getProject(
                token,
                projectId,
            );
            if (!projectResponse.data) {
                notFound();
                return;
            }
            const fetchedProject = projectResponse.data;
            setProject(fetchedProject);

            // Fetch tasks for this project
            const tasksResponse = await taskApi.getTasksByProject(
                token,
                projectId,
            );
            const fetchedTasks = tasksResponse.data || [];
            setTasks(fetchedTasks);
            setCached(cacheKey, {
                project: fetchedProject,
                tasks: fetchedTasks,
            });
        } catch (error) {
            console.error('Failed to fetch project data:', error);
            toast.error('Failed to load project data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (projectId) {
            fetchData();
        }
    }, [projectId]);

    if (isLoading) {
        return (
            <div className="flex flex-col h-full bg-dashboard-bg overflow-hidden">
                {/* Header skeleton */}
                <div className="sticky top-0 z-10 border-b border-dashboard-border px-6 py-4 flex items-center justify-between shrink-0 bg-white/95">
                    <div className="flex flex-col gap-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-7 w-56" />
                    </div>
                    <div className="flex gap-2">
                        <Skeleton className="h-8 w-20 rounded-lg" />
                        <Skeleton className="h-8 w-24 rounded-lg" />
                    </div>
                </div>
                {/* Toolbar skeleton */}
                <div className="px-6 py-3 flex items-center gap-2 shrink-0 border-b border-dashboard-border">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
                {/* Content skeleton — task rows */}
                <div className="flex-1 overflow-auto px-6 pb-6 pt-4 space-y-2">
                    {[...Array(8)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full rounded-lg" />
                    ))}
                </div>
            </div>
        );
    }

    if (!project) {
        notFound();
        return null;
    }

    return (
        <ProjectDetailView
            project={project}
            tasks={tasks}
            onRefresh={fetchData}
            onCreateTask={() => {}} // No longer used, but keeping for interface compatibility
        />
    );
}
