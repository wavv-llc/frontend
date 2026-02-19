'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import { Plus } from 'lucide-react';
import { dashboardApi, type RecentItem, type DashboardTask } from '@/lib/api';
import { DraggableDashboard } from '@/components/dashboard/DraggableDashboard';
import { Button } from '@/components/ui/button';

export default function HomePage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const { user } = useUser();
    const [greeting, setGreeting] = useState('');

    // Data State
    const [data, setData] = useState<{
        recents: RecentItem[];
        tasks: DashboardTask[];
        calendar: DashboardTask[];
    }>({ recents: [], tasks: [], calendar: [] });

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting('Good morning');
        else if (hour < 17) setGreeting('Good afternoon');
        else setGreeting('Good evening');
    }, []);

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
    const handleRecentClick = (item: RecentItem) => {
        if (item.type === 'workspace') router.push(`/workspaces/${item.id}`);
        if (item.type === 'project')
            router.push(`/workspaces/${item.workspaceId}/projects/${item.id}`);
        if (item.type === 'task')
            router.push(
                `/workspaces/${item.workspaceId}/projects/${item.parentId}?task=${item.id}`,
            );
    };

    const handleTaskClick = (t: DashboardTask) => {
        router.push(
            `/workspaces/${t.project.workspace.id}/projects/${t.project.id}?task=${t.id}`,
        );
    };

    return (
        <div className="h-full w-full bg-background selection:bg-primary/20 overflow-hidden flex flex-col">
            <div className="flex-1 p-6 flex flex-col gap-6 min-h-0">
                {/* Header */}
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-serif font-semibold tracking-tight text-foreground">
                            {greeting}, {user?.firstName}
                        </h1>
                    </div>

                    <Button variant="outline" size="sm" className="gap-2">
                        <Plus className="w-4 h-4" />
                        Add card
                    </Button>
                </div>

                {/* Draggable Dashboard */}
                <div className="flex-1 min-h-0">
                    <DraggableDashboard
                        data={{
                            ...data,
                            loading,
                            onTaskClick: handleTaskClick,
                            onRecentClick: handleRecentClick,
                        }}
                    />
                </div>
            </div>
        </div>
    );
}
