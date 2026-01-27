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
    ChevronDown,
    ChevronRight,
    Search,
    Clock,
    Calendar as CalendarIcon,
    ArrowUpRight,
    Sparkles,
    LayoutGrid,
    ListFilter,
    MoreHorizontal
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { dashboardApi, type RecentItem, type DashboardTask } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectCalendarView } from '@/components/projects/ProjectCalendarView'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'

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

interface StatCardProps {
    title: string
    value: string | number
    icon: React.ReactNode
    trend?: string
    colorClass?: string
}

function StatCard({ title, value, icon, trend, colorClass = "bg-primary/10 text-primary" }: StatCardProps) {
    return (
        <Card className="group relative overflow-hidden bg-background/60 backdrop-blur-xl border-border/50 shadow-sm hover:border-primary/20 hover:shadow-md transition-all duration-300">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-6 relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={cn("p-2.5 rounded-xl transition-transform duration-300 group-hover:scale-110", colorClass)}>
                        {icon}
                    </div>
                    {trend && (
                        <div className="text-xs font-medium text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                            {trend}
                        </div>
                    )}
                </div>
                <div className="space-y-1">
                    <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
                    <div className="text-3xl font-bold text-foreground tracking-tight">{value}</div>
                </div>
            </CardContent>
        </Card>
    )
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
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/20">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Recent Activity
                    </CardTitle>
                </div>
            </CardHeader>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                            <Clock className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm">No recent items</p>
                        </div>
                    ) : (
                        items.slice(0, 10).map((item) => (
                            <button
                                key={`${item.type}-${item.id}`}
                                onClick={() => onItemClick(item)}
                                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 hover:border-primary/10 border border-transparent transition-all group text-left"
                            >
                                <div className="p-2 rounded-md bg-muted/40 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <ItemIcon type={item.type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-sm font-medium text-foreground truncate block group-hover:text-primary transition-colors">
                                        {item.name}
                                    </span>
                                    {item.parentName && (
                                        <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                                            in {item.parentName}
                                        </span>
                                    )}
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
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
        return <Skeleton className="h-[400px] w-full rounded-xl" />
    }

    return (
        <Card className="h-full bg-background/60 backdrop-blur-xl border-border/50 shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="pb-0 border-b border-border/40 bg-muted/20 pt-4 px-6 md:px-6 mb-2">
                <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        My Tasks
                    </CardTitle>
                    <div className="flex p-1 bg-muted/50 rounded-lg border border-border/20">
                        <button
                            onClick={() => setActiveTab('todo')}
                            className={cn(
                                "text-xs font-medium px-3 py-1.5 rounded-md transition-all",
                                activeTab === 'todo' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            To Do
                        </button>
                        <button
                            onClick={() => setActiveTab('done')}
                            className={cn(
                                "text-xs font-medium px-3 py-1.5 rounded-md transition-all",
                                activeTab === 'done' ? "bg-background shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Done
                        </button>
                    </div>
                </div>
            </CardHeader>
            <ScrollArea className="flex-1 -mx-2 px-2">
                <div className="p-4 pt-0 space-y-2">
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
                                    className="w-full flex items-start gap-4 p-3 rounded-xl hover:bg-muted/40 border border-transparent hover:border-primary/10 transition-all group text-left relative overflow-hidden"
                                >
                                    <div className="mt-1 shrink-0">
                                        <StatusIcon status={task.status} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className={cn(
                                            "text-sm font-medium truncate block transition-colors mb-1",
                                            task.status === 'COMPLETED' ? "text-muted-foreground line-through" : "text-foreground group-hover:text-primary"
                                        )}>
                                            {task.name}
                                        </span>
                                        <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/50 group-hover:bg-background transition-colors">
                                                <FolderOpen className="w-3 h-3" />
                                                <span className="truncate max-w-[120px]">{task.project.name}</span>
                                            </span>

                                            {dueDate && (
                                                <span className={cn(
                                                    "px-2 py-0.5 rounded-md border flex items-center gap-1.5 transition-colors",
                                                    isOverdue
                                                        ? "bg-red-500/10 text-red-600 border-red-500/20"
                                                        : "bg-muted/30 text-muted-foreground border-transparent"
                                                )}>
                                                    <CalendarIcon className="w-3 h-3" />
                                                    {dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0">
                                        <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
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

    const stats = useMemo(() => {
        const totalTasks = data.tasks.filter(t => t.status !== 'COMPLETED').length
        const overdue = data.tasks.filter(t => t.dueAt && new Date(t.dueAt) < new Date() && t.status !== 'COMPLETED').length
        const upcoming = data.tasks.filter(t => t.dueAt && new Date(t.dueAt) > new Date() && t.status !== 'COMPLETED').length
        return { totalTasks, overdue, upcoming }
    }, [data.tasks])

    return (
        <div className="relative h-full w-full bg-background selection:bg-primary/20 overflow-y-auto overflow-x-hidden">
            {/* Dynamic Background Mesh */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[120px] animate-pulse-slow" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
                <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] bg-purple-500/10 rounded-full blur-[100px] animate-pulse-slow delay-700" />
            </div>

            <div className="relative z-10 max-w-[1600px] mx-auto p-6 md:p-8 space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">

                {/* Hero Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/40">
                    <div>
                        <h1 className="text-4xl font-bold tracking-tight text-foreground font-serif">
                            {greeting}, {user?.firstName}
                        </h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Your intelligence hub is ready.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/50 backdrop-blur-md border border-border shadow-sm">
                            <CalendarIcon className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">
                                {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Focus Tasks"
                        value={stats.totalTasks}
                        icon={<ListFilter className="w-6 h-6 text-primary" />}
                        colorClass="bg-primary/10 text-primary"
                        trend="On Track"
                    />
                    <StatCard
                        title="Attention Needed"
                        value={stats.overdue}
                        icon={<Clock className="w-6 h-6 text-red-500" />}
                        colorClass="bg-red-500/10 text-red-500"
                    />
                    <StatCard
                        title="Recent Projects"
                        value={data.recents.filter(r => r.type === 'project').length}
                        icon={<FolderOpen className="w-6 h-6 text-blue-500" />}
                        colorClass="bg-blue-500/10 text-blue-500"
                    />
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[500px]">
                    <div className="lg:col-span-8 h-full flex flex-col gap-6">
                        <MyWorkSection
                            tasks={data.tasks}
                            isLoading={loading}
                            onTaskClick={(t) => router.push(`/workspaces/${t.project.workspace.id}/projects/${t.project.id}?task=${t.id}`)}
                        />
                    </div>
                    <div className="lg:col-span-4 h-full flex flex-col gap-6">
                        <RecentsSection
                            items={data.recents}
                            isLoading={loading}
                            onItemClick={handleRecentClick}
                        />
                    </div>
                </div>

                {/* Calendar Section */}
                <Card className="border-border/50 shadow-sm overflow-hidden bg-background/60 backdrop-blur-xl">
                    <CardHeader className="border-b border-border/40 pb-4 bg-muted/20">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base font-semibold flex items-center gap-2">
                                <CalendarIcon className="w-4 h-4 text-primary" />
                                Smart Schedule
                            </CardTitle>
                        </div>
                    </CardHeader>
                    <div className="p-0">
                        {loading ? (
                            <Skeleton className="h-[500px] w-full" />
                        ) : (
                            <ProjectCalendarView tasks={data.calendar} />
                        )}
                    </div>
                </Card>
            </div>
        </div>
    )
}
