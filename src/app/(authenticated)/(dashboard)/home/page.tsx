'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { dashboardApi, type RecentItem, type DashboardTask } from '@/lib/api';
import { CustomizableDashboard } from '@/components/dashboard/CustomizableDashboard';
import { getCached, setCached } from '@/lib/pageCache';

type DashboardData = {
    recents: RecentItem[];
    tasks: DashboardTask[];
    calendar: DashboardTask[];
};

const CACHE_KEY = 'dashboard';

export default function HomePage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { user } = useUser();

    const [data, setData] = useState<DashboardData>(
        () =>
            getCached<DashboardData>(CACHE_KEY) ?? {
                recents: [],
                tasks: [],
                calendar: [],
            },
    );
    const [isLoading, setIsLoading] = useState(true);

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

                const newData: DashboardData = {
                    recents: recent.data || [],
                    tasks: tasks.data || [],
                    calendar: calendar.data || [],
                };
                setCached(CACHE_KEY, newData);
                setData(newData);
            } catch (error) {
                console.error('Dashboard error:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAll();
    }, [getToken]);

    const handleTaskClick = (task: DashboardTask) => {
        router.push(
            `/workspaces/${task.project.workspace.isPersonal ? 'my-workspace' : (task.project.workspace.slug ?? task.project.workspace.id)}/projects/${task.project.slug ?? task.project.id}?task=${task.slug ?? task.id}`,
        );
    };

    const handleRecentClick = (item: RecentItem) => {
        if (item.type === 'task' && item.workspaceId && item.parentId) {
            // parentId is the project ID for tasks
            router.push(
                `/workspaces/${item.workspaceId}/projects/${item.parentId}?task=${item.id}`,
            );
        } else if (item.type === 'project' && item.workspaceId) {
            router.push(`/workspaces/${item.workspaceId}/projects/${item.id}`);
        } else if (item.type === 'workspace') {
            router.push(`/workspaces/${item.id}`);
        }
    };

    return (
        <CustomizableDashboard
            userName={user?.firstName || 'User'}
            data={{
                tasks: data.tasks,
                recents: data.recents,
                calendar: data.calendar,
                isLoading,
                onTaskClick: handleTaskClick,
                onRecentClick: handleRecentClick,
            }}
        />
    );
}
