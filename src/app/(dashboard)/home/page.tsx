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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { dashboardApi, type RecentItem, type DashboardTask } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { ProjectCalendarView } from '@/components/projects/ProjectCalendarView'

// Helper to get time-based greeting
function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
}

// Status icons
function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'COMPLETED':
            return <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        case 'IN_PROGRESS':
            return <Circle className="h-4 w-4 text-blue-500 fill-blue-500/30" />
        case 'IN_REVIEW':
            return <Circle className="h-4 w-4 text-amber-500 fill-amber-500/30" />
        default:
            return <Circle className="h-4 w-4 text-gray-400" />
    }
}

// Item type icons
function ItemIcon({ type, icon }: { type: string; icon?: string }) {
    switch (type) {
        case 'workspace':
            return <Layers className="h-4 w-4 text-muted-foreground" />
        case 'project':
            return <FolderOpen className="h-4 w-4 text-muted-foreground" />
        case 'task':
        default:
            return <FileText className="h-4 w-4 text-muted-foreground" />
    }
}

// Recents Section Component
function RecentsSection({ items, isLoading, onItemClick }: {
    items: RecentItem[]
    isLoading: boolean
    onItemClick: (item: RecentItem) => void
}) {
    if (isLoading) {
        return (
            <div className="bg-card rounded-xl border border-border p-5 h-full">
                <Skeleton className="h-5 w-20 mb-4" />
                <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-8 w-full" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="bg-card rounded-xl border border-border p-5 h-full">
            <h2 className="text-sm font-semibold text-foreground mb-4">Recents</h2>
            <div className="space-y-1">
                {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
                ) : (
                    items.slice(0, 10).map((item) => (
                        <button
                            key={`${item.type}-${item.id}`}
                            onClick={() => onItemClick(item)}
                            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-muted/50 transition-colors text-left group"
                        >
                            <ItemIcon type={item.type} icon={item.icon} />
                            <div className="flex-1 min-w-0">
                                <span className="text-sm text-foreground truncate block group-hover:text-primary transition-colors">
                                    {item.name}
                                </span>
                            </div>
                            {item.parentName && (
                                <span className="text-xs text-muted-foreground truncate">
                                    in {item.parentName}
                                </span>
                            )}
                        </button>
                    ))
                )}
            </div>
        </div>
    )
}

// My Work Section Component
function MyWorkSection({ tasks, isLoading, onTaskClick }: {
    tasks: DashboardTask[]
    isLoading: boolean
    onTaskClick: (task: DashboardTask) => void
}) {
    const [activeTab, setActiveTab] = useState<'todo' | 'done' | 'delegated'>('todo')
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ today: true, overdue: true })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const categorizedTasks = useMemo(() => {
        const filteredTasks = tasks.filter(task => {
            if (activeTab === 'done') return task.status === 'COMPLETED'
            if (activeTab === 'todo') return task.status !== 'COMPLETED'
            return false
        })

        const overdue: DashboardTask[] = []
        const todayTasks: DashboardTask[] = []
        const upcoming: DashboardTask[] = []
        const noDueDate: DashboardTask[] = []

        filteredTasks.forEach(task => {
            if (!task.dueAt) {
                noDueDate.push(task)
                return
            }

            const dueDate = new Date(task.dueAt)
            dueDate.setHours(0, 0, 0, 0)

            if (dueDate < today && task.status !== 'COMPLETED') {
                overdue.push(task)
            } else if (dueDate.getTime() === today.getTime()) {
                todayTasks.push(task)
            } else {
                upcoming.push(task)
            }
        })

        return { overdue, today: todayTasks, upcoming, noDueDate }
    }, [tasks, activeTab])

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }))
    }

    if (isLoading) {
        return (
            <div className="bg-card rounded-xl border border-border p-5 h-full">
                <Skeleton className="h-5 w-20 mb-4" />
                <div className="space-y-3">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-12 w-full" />
                    ))}
                </div>
            </div>
        )
    }

    const renderTaskRow = (task: DashboardTask) => {
        const dueDate = task.dueAt ? new Date(task.dueAt) : null
        const isOverdue = dueDate && dueDate < today && task.status !== 'COMPLETED'

        return (
            <button
                key={task.id}
                onClick={() => onTaskClick(task)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-muted/50 transition-colors text-left group border-b border-border last:border-b-0"
            >
                <StatusIcon status={task.status} />
                <div className="flex-1 min-w-0">
                    <span className={cn(
                        "text-sm truncate block group-hover:text-primary transition-colors",
                        task.status === 'COMPLETED' ? "text-muted-foreground line-through" : "text-foreground"
                    )}>
                        {task.name}
                    </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="hidden sm:block">{task.project.name}</span>
                    <span className="hidden md:block">{task.project.workspace.name}</span>
                    {dueDate && (
                        <span className={cn(
                            "whitespace-nowrap",
                            isOverdue && "text-red-500"
                        )}>
                            {dueDate.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' })}
                            {isOverdue && ' - Today'}
                        </span>
                    )}
                </div>
            </button>
        )
    }

    const renderSection = (title: string, sectionTasks: DashboardTask[], sectionKey: string, showAlert?: boolean) => {
        if (sectionTasks.length === 0) return null

        const isExpanded = expandedSections[sectionKey] !== false

        return (
            <div className="mb-2">
                <button
                    onClick={() => toggleSection(sectionKey)}
                    className="w-full flex items-center gap-2 py-2 hover:bg-muted/30 rounded-lg px-2 transition-colors"
                >
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className={cn(
                        "text-sm font-medium",
                        showAlert ? "text-red-600" : "text-foreground"
                    )}>
                        {title}
                    </span>
                    <span className={cn(
                        "text-xs",
                        showAlert ? "text-red-500" : "text-muted-foreground"
                    )}>
                        {sectionTasks.length}
                    </span>
                </button>
                {isExpanded && (
                    <div className="ml-2">
                        {sectionTasks.map(renderTaskRow)}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="bg-card rounded-xl border border-border p-5 h-full">
            <h2 className="text-sm font-semibold text-foreground mb-4">My Work</h2>

            {/* Tabs */}
            <div className="flex items-center gap-4 mb-4 border-b border-border pb-3">
                {[
                    { id: 'todo', label: 'To Do' },
                    { id: 'done', label: 'Done' },
                    { id: 'delegated', label: 'Delegated' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={cn(
                            "text-sm font-medium transition-colors",
                            activeTab === tab.id
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Task Sections */}
            <div className="space-y-1">
                {renderSection('Overdue', categorizedTasks.overdue, 'overdue', true)}
                {renderSection('Today', categorizedTasks.today, 'today')}
                {renderSection('Upcoming', categorizedTasks.upcoming, 'upcoming')}
                {renderSection('No Due Date', categorizedTasks.noDueDate, 'noDueDate')}

                {tasks.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">
                        No tasks assigned yet
                    </p>
                )}
            </div>
        </div>
    )
}

// Main Home Page Component
export default function HomePage() {
    const router = useRouter()
    const { getToken } = useAuth()
    const { user } = useUser()

    const [recentItems, setRecentItems] = useState<RecentItem[]>([])
    const [myTasks, setMyTasks] = useState<DashboardTask[]>([])
    const [calendarTasks, setCalendarTasks] = useState<DashboardTask[]>([])

    const [isLoadingRecent, setIsLoadingRecent] = useState(true)
    const [isLoadingTasks, setIsLoadingTasks] = useState(true)
    const [isLoadingCalendar, setIsLoadingCalendar] = useState(true)

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const token = await getToken()
                if (!token) return

                // Fetch data in parallel
                const [recentRes, myTasksRes, calendarRes] = await Promise.allSettled([
                    dashboardApi.getRecentItems(token, 10),
                    dashboardApi.getMyTasks(token),
                    dashboardApi.getCalendarTasks(token),
                ])

                if (recentRes.status === 'fulfilled' && recentRes.value.data) {
                    setRecentItems(recentRes.value.data)
                }
                setIsLoadingRecent(false)

                if (myTasksRes.status === 'fulfilled' && myTasksRes.value.data) {
                    setMyTasks(myTasksRes.value.data)
                }
                setIsLoadingTasks(false)

                if (calendarRes.status === 'fulfilled' && calendarRes.value.data) {
                    setCalendarTasks(calendarRes.value.data)
                }
                setIsLoadingCalendar(false)

            } catch (error) {
                console.error('Error fetching dashboard data:', error)
                setIsLoadingRecent(false)
                setIsLoadingTasks(false)
                setIsLoadingCalendar(false)
            }
        }

        fetchDashboardData()
    }, [getToken])

    const handleRecentItemClick = (item: RecentItem) => {
        switch (item.type) {
            case 'workspace':
                router.push(`/workspaces/${item.id}`)
                break
            case 'project':
                router.push(`/workspaces/${item.workspaceId}/projects/${item.id}`)
                break
            case 'task':
                router.push(`/workspaces/${item.workspaceId}/projects/${item.parentId}?task=${item.id}`)
                break
        }
    }

    const handleTaskClick = (task: DashboardTask) => {
        router.push(`/workspaces/${task.project.workspace.id}/projects/${task.project.id}?task=${task.id}`)
    }

    const [greeting, setGreeting] = useState('')

    useEffect(() => {
        setGreeting(getGreeting())
    }, [])

    const firstName = user?.firstName || 'there'

    return (
        <div className="h-full bg-background overflow-y-auto">
            <div className="max-w-7xl mx-auto p-8 animate-in fade-in duration-300">
                {/* Header */}
                <h1 className="text-2xl font-semibold text-foreground mb-8">
                    {greeting || '\u00A0'}
                    {greeting && `, ${firstName}`}
                </h1>

                {/* Main Grid Layout */}
                <div className="space-y-6">
                    {/* Top Row: Recents & My Work */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                        <RecentsSection
                            items={recentItems}
                            isLoading={isLoadingRecent}
                            onItemClick={handleRecentItemClick}
                        />
                        <MyWorkSection
                            tasks={myTasks}
                            isLoading={isLoadingTasks}
                            onTaskClick={handleTaskClick}
                        />
                    </div>

                    {/* Bottom Row: Calendar */}
                    <div className="h-[700px] w-full">
                        {isLoadingCalendar ? (
                            <Skeleton className="h-full w-full rounded-xl" />
                        ) : (
                            <ProjectCalendarView tasks={calendarTasks} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
