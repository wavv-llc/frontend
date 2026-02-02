'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth, useUser } from '@clerk/nextjs'
import {
    CheckCircle2,
    Circle,
    FileText,
    FolderOpen,
    Layers,
    Clock,
    Calendar as CalendarIcon,
    ArrowUpRight,
    Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { dashboardApi, type RecentItem, type DashboardTask } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectCalendarView } from '@/components/projects/ProjectCalendarView'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'

// Status icons
function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'COMPLETED':
            return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        case 'IN_PROGRESS':
            return <Circle className="h-4 w-4 text-primary fill-primary/20" />
        case 'IN_REVIEW':
            return <Circle className="h-4 w-4 text-amber-500 fill-amber-500/20" />
        default:
            return <Circle className="h-4 w-4 text-muted-foreground" />
    }
}

// Item type icons
function ItemIcon({ type }: { type: string }) {
    switch (type) {
        case 'workspace':
            return <Layers className="h-4 w-4 text-primary" />
        case 'project':
            return <FolderOpen className="h-4 w-4 text-blue-500" />
        default:
            return <FileText className="h-4 w-4 text-muted-foreground" />
    }
}

function RecentsSection({ items, isLoading, onItemClick }: {
    items: RecentItem[]
    isLoading: boolean
    onItemClick: (item: RecentItem) => void
}) {
    if (isLoading) {
        return <Skeleton className="h-[300px] w-full rounded-xl" />
    }

    return (
        <Card className="h-full bg-background/60 backdrop-blur-xl border-border/50 shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/20 py-3 px-4 shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Recent Activity
                    </CardTitle>
                </div>
            </CardHeader>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                            <Clock className="w-6 h-6 mb-2 opacity-20" />
                            <p className="text-xs">No recent items</p>
                        </div>
                    ) : (
                        items.slice(0, 10).map((item) => (
                            <button
                                key={`${item.type}-${item.id}`}
                                onClick={() => onItemClick(item)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 hover:border-primary/10 border border-transparent transition-all group text-left"
                            >
                                <div className="p-1.5 rounded-md bg-muted/40 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <ItemIcon type={item.type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-medium text-foreground truncate block group-hover:text-primary transition-colors">
                                        {item.name}
                                    </span>
                                    {item.parentName && (
                                        <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                                            in {item.parentName}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </ScrollArea>
        </Card>
    )
}

function MyWorkSection({ tasks, isLoading, onTaskClick }: {
    tasks: DashboardTask[]
    isLoading: boolean
    onTaskClick: (task: DashboardTask) => void
}) {
    const [activeTab, setActiveTab] = useState<'todo' | 'done'>('todo')

    // Memoized filters
    const displayTasks = useMemo(() => {
        if (activeTab === 'done') {
            return tasks.filter(t => t.status === 'COMPLETED')
        }
        return tasks.filter(t => t.status !== 'COMPLETED').sort((a, b) => {
            if (!a.dueAt) return 1
            if (!b.dueAt) return -1
            return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
        })
    }, [tasks, activeTab])

    if (isLoading) {
        return <Skeleton className="h-full w-full rounded-xl" />
    }

    return (
        <Card className="h-full bg-background/60 backdrop-blur-xl border-border/50 shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="pb-0 border-b border-border/40 bg-muted/20 py-3 px-4 mb-0 shrink-0">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        My Tasks
                    </CardTitle>
                    <div className="flex p-0.5 bg-muted/50 rounded-lg border border-border/20">
                        <button
                            onClick={() => setActiveTab('todo')}
                            className={cn(
                                "text-[10px] font-medium px-2 py-1 rounded-sm transition-all",
                                activeTab === 'todo' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            To Do
                        </button>
                        <button
                            onClick={() => setActiveTab('done')}
                            className={cn(
                                "text-[10px] font-medium px-2 py-1 rounded-sm transition-all",
                                activeTab === 'done' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </CardHeader>
            <ScrollArea className="flex-1">
                <div className="p-0 space-y-0 divide-y divide-border/20">
                    {displayTasks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                            <Sparkles className="w-10 h-10 mb-3 opacity-20 text-primary" />
                            <p className="text-sm font-medium">All caught up!</p>
                            <p className="text-xs opacity-70">No tasks on your plate right now.</p>
                        </div>
                    ) : (
                        displayTasks.map(task => {
                            const dueDate = task.dueAt ? new Date(task.dueAt) : null
                            const isOverdue = dueDate && dueDate < new Date() && task.status !== 'COMPLETED'

                            return (
                                <button
                                    key={task.id}
                                    onClick={() => onTaskClick(task)}
                                    className="w-full flex items-center gap-4 px-4 py-3 hover:bg-muted/30 transition-all group text-left relative"
                                >
                                    <div className="shrink-0">
                                        <StatusIcon status={task.status} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className={cn(
                                            "text-sm font-medium truncate block transition-colors",
                                            task.status === 'COMPLETED' ? "text-muted-foreground line-through" : "text-foreground group-hover:text-primary"
                                        )}>
                                            {task.name}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                                        <span className="flex items-center gap-1.5 opacity-70">
                                            <FolderOpen className="w-3 h-3" />
                                            <span className="truncate max-w-[100px]">{task.project.name}</span>
                                        </span>

                                        {dueDate && (
                                            <span className={cn(
                                                "flex items-center gap-1.5 transition-colors",
                                                isOverdue
                                                    ? "text-red-500 font-medium"
                                                    : "opacity-70"
                                            )}>
                                                <CalendarIcon className="w-3 h-3" />
                                                {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </span>
                                        )}
                                    </div>

                                    <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                                        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
            </ScrollArea>
        </Card>
    )
}

export default function HomePage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const { user } = useUser()
    const [greeting, setGreeting] = useState('')

    // Data State
    const [data, setData] = useState<{
        recents: RecentItem[],
        tasks: DashboardTask[],
        calendar: DashboardTask[]
    }>({ recents: [], tasks: [], calendar: [] })

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Good morning')
        else if (hour < 17) setGreeting('Good afternoon')
        else setGreeting('Good evening')
    }, [])

    useEffect(() => {
        const fetchAll = async () => {
            try {
                const token = await getToken()
                if (!token) return

                const [recent, tasks, calendar] = await Promise.all([
                    dashboardApi.getRecentItems(token, 10),
                    dashboardApi.getMyTasks(token),
                    dashboardApi.getCalendarTasks(token)
                ])

                setData({
                    recents: recent.data || [],
                    tasks: tasks.data || [],
                    calendar: calendar.data || [],
                })
            } catch (error) {
                console.error("Dashboard error:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchAll()
    }, [getToken])

    // Routing Handlers
    const handleRecentClick = (item: RecentItem) => {
        if (item.type === 'workspace') router.push(`/workspaces/${item.id}`)
        if (item.type === 'project') router.push(`/workspaces/${item.workspaceId}/projects/${item.id}`)
        if (item.type === 'task') router.push(`/workspaces/${item.workspaceId}/projects/${item.parentId}?task=${item.id}`)
    }

    return (
        <div className="h-full w-full bg-background selection:bg-primary/20 overflow-hidden flex flex-col">

            <div className="flex-1 p-6 flex flex-col gap-6 min-h-0">

                {/* Header */}
                <div className="flex items-center justify-between shrink-0">
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                            {greeting}, {user?.firstName}
                        </h1>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">
                    {/* Left Column: My Tasks - Takes full height */}
                    <div className="lg:col-span-8 h-full min-h-0">
                        <MyWorkSection
                            tasks={data.tasks}
                            isLoading={loading}
                            onTaskClick={(t) => router.push(`/workspaces/${t.project.workspace.id}/projects/${t.project.id}?task=${t.id}`)}
                        />
                    </div>

                    {/* Right Column: Recents & Calendar - Takes full height, scrollable if needed */}
                    <div className="lg:col-span-4 h-full flex flex-col gap-6 min-h-0">
                        <div className="h-1/3 min-h-[200px] shrink-0">
                            <RecentsSection
                                items={data.recents}
                                isLoading={loading}
                                onItemClick={handleRecentClick}
                            />
                        </div>
                        <div className="flex-1 min-h-0 bg-background/60 backdrop-blur-xl border border-border/50 shadow-sm rounded-xl overflow-hidden flex flex-col">
                            <div className="border-b border-border/40 bg-muted/20 py-3 px-4 shrink-0">
                                <span className="text-sm font-semibold flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4 text-primary" />
                                    Smart Schedule
                                </span>
                            </div>
                            <div className="flex-1 min-h-0 overflow-y-auto">
                                <ProjectCalendarView tasks={data.calendar} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
