'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { dashboardApi, type RecentItem, type DashboardTask } from '@/lib/api';
import {
    DashboardContent,
    DashboardLoading,
    type Task,
    type CalendarEvent,
    type ActivityItem,
    type ActivityStat,
} from '@/components/dashboard/pure-steel';

export default function HomePage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { user } = useUser();

    // Data State
    const [data, setData] = useState<{
        recents: RecentItem[];
        tasks: DashboardTask[];
        calendar: DashboardTask[];
    }>({ recents: [], tasks: [], calendar: [] });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const token = await getToken();
                if (!token) return;

                const [recent, tasks, calendar] = await Promise.all([
                    dashboardApi.getRecentItems(token, 10),
                    dashboardApi.getMyTasks(token),
                    dashboardApi.getCalendarTasks(token),
                ]);

                setData({
                    recents: recent.data || [],
                    tasks: tasks.data || [],
                    calendar: calendar.data || [],
                });
            } catch (error) {
                console.error('Dashboard error:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [getToken]);

    // Routing Handlers
    const handleTaskClick = (task: Task) => {
        // Find the original DashboardTask to get workspace/project IDs
        const originalTask = data.tasks.find((t) => t.id === task.id);
        if (originalTask) {
            router.push(
                `/workspaces/${originalTask.project.workspace.id}/projects/${originalTask.project.id}?task=${originalTask.id}`,
            );
        }
    };

    const handleEventClick = (event: CalendarEvent) => {
        // Find the original task for the calendar event
        const originalTask = data.calendar.find((t) => t.id === event.id);
        if (originalTask) {
            router.push(
                `/workspaces/${originalTask.project.workspace.id}/projects/${originalTask.project.id}?task=${originalTask.id}`,
            );
        }
    };

    // Map API data to Pure Steel Light interfaces
    const mappedTasks = useMemo<Task[]>(() => {
        return data.tasks.map((task) => ({
            id: task.id,
            clientName: task.project.name,
            formType: task.taskType || 'Task',
            priority:
                (task.priority?.toLowerCase() as 'high' | 'medium' | 'low') ||
                'medium',
            status:
                (task.status
                    ?.toLowerCase()
                    .replace(' ', '-') as Task['status']) || 'pending',
            dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
        }));
    }, [data.tasks]);

    const mappedEvents = useMemo<CalendarEvent[]>(() => {
        return data.calendar.map((task) => ({
            id: task.id,
            title: task.name || task.project.name,
            date: task.dueDate ? new Date(task.dueDate) : new Date(),
            type: task.taskType === 'Deadline' ? 'deadline' : 'task',
            status: task.status
                ?.toLowerCase()
                .replace(' ', '-') as CalendarEvent['status'],
        }));
    }, [data.calendar]);

    const mappedActivities = useMemo<ActivityItem[]>(() => {
        return data.recents.slice(0, 8).map((item) => ({
            id: item.id,
            type: item.type === 'task' ? 'assignment' : 'review',
            title: item.name,
            description: `${item.name}${item.parentName ? ` in ${item.parentName}` : ''}`,
            user: {
                name: item.userName || 'Unknown',
            },
            timestamp: item.lastModified
                ? new Date(item.lastModified)
                : new Date(),
        }));
    }, [data.recents]);

    const stats = useMemo<ActivityStat[]>(() => {
        return [
            {
                label: 'Active Tasks',
                value: data.tasks.length,
                subLabel: 'Total',
            },
            {
                label: 'This Week',
                value: data.calendar.length,
                subLabel: 'Due items',
            },
        ];
    }, [data.tasks.length, data.calendar.length]);

    if (loading) {
        return <DashboardLoading />;
    }

    return (
        <DashboardContent
            userName={user?.firstName || 'User'}
            tasks={mappedTasks}
            events={mappedEvents}
            activities={mappedActivities}
            stats={stats}
            onTaskClick={handleTaskClick}
            onEventClick={handleEventClick}
        />
    );
}
