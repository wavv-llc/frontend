'use client'

import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import { type Task } from '@/lib/api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface ProjectCalendarViewProps {
    tasks: Task[]
}

type ViewMode = 'week' | 'month'

export function ProjectCalendarView({ tasks }: ProjectCalendarViewProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('week')
    const [currentDate, setCurrentDate] = useState(new Date())

    // Generate current week dates
    const weekDates = useMemo(() => {
        const currentDay = currentDate.getDay()
        const monday = new Date(currentDate)
        monday.setDate(currentDate.getDate() - (currentDay === 0 ? 6 : currentDay - 1))

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(monday)
            date.setDate(monday.getDate() + i)
            return date
        })
    }, [currentDate])

    // Generate month dates (including padding days from previous/next month)
    const monthDates = useMemo(() => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()

        // First day of the month
        const firstDay = new Date(year, month, 1)
        // Last day of the month
        const lastDay = new Date(year, month + 1, 0)

        // Get the day of week for first day (0 = Sunday)
        const firstDayOfWeek = firstDay.getDay()

        // Calculate start date (may be from previous month)
        const startDate = new Date(firstDay)
        startDate.setDate(startDate.getDate() - firstDayOfWeek)

        // Generate 42 days (6 weeks) to ensure full grid
        const dates = Array.from({ length: 42 }, (_, i) => {
            const date = new Date(startDate)
            date.setDate(startDate.getDate() + i)
            return date
        })

        return dates
    }, [currentDate])

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = new Date()

    const getStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-500/90 hover:bg-emerald-500 text-white'
            case 'IN_PROGRESS': return 'bg-blue-600/90 hover:bg-blue-600 text-white'
            case 'IN_REVIEW': return 'bg-orange-500/90 hover:bg-orange-500 text-white'
            default: return 'bg-gray-500/90 hover:bg-gray-500 text-white'
        }
    }

    const getStatusLabel = (status: Task['status']) => {
        switch (status) {
            case 'COMPLETED': return 'Completed'
            case 'IN_PROGRESS': return 'In Progress'
            case 'IN_REVIEW': return 'In Review'
            default: return 'Pending'
        }
    }

    const getTaskPosition = (task: Task) => {
        if (!task.dueAt) return null

        const dueDate = new Date(task.dueAt)
        const startOfWeek = weekDates[0]
        const endOfWeek = weekDates[6]

        // Reset times for comparison
        const d = new Date(dueDate)
        d.setHours(0, 0, 0, 0)

        const s = new Date(startOfWeek)
        s.setHours(0, 0, 0, 0)

        const e = new Date(endOfWeek)
        e.setHours(23, 59, 59, 999)

        // Only show tasks due this week
        if (d < s || d > e) return null

        const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1

        return {
            left: `${dayIndex * (100 / 7) + 0.5}%`,
            width: `${(100 / 7) - 1}%`
        }
    }

    const tasksWithDueDates = tasks.filter(task => task.dueAt)

    const isToday = (date: Date) => {
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
    }

    const isSameDay = (date1: Date, date2: Date) => {
        return date1.getDate() === date2.getDate() &&
            date1.getMonth() === date2.getMonth() &&
            date1.getFullYear() === date2.getFullYear()
    }

    const getTasksForDate = (date: Date) => {
        return tasksWithDueDates.filter(task => {
            if (!task.dueAt) return false
            const dueDate = new Date(task.dueAt)
            return isSameDay(dueDate, date)
        })
    }

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentDate.getMonth() &&
            date.getFullYear() === currentDate.getFullYear()
    }

    return (
        <div className="w-full border border-border rounded-xl bg-card shadow-sm overflow-hidden flex flex-col h-full">
            {/* Header Controls */}
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-card shrank-0">
                <div className="flex items-center gap-4">
                    <h2 className="font-semibold text-lg text-foreground tracking-tight">Calendar View</h2>
                    <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border border-border/50">
                        <button
                            onClick={() => setViewMode('week')}
                            className={cn(
                                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                viewMode === 'week'
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setViewMode('month')}
                            className={cn(
                                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                viewMode === 'month'
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            Month
                        </button>
                    </div>

                    <div className="w-px h-6 bg-border mx-2" />

                    <div className="flex items-center gap-4 text-xs font-medium">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="text-muted-foreground">Complete</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600" />
                            <span className="text-muted-foreground">In Progress</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-orange-500" />
                            <span className="text-muted-foreground">In Review</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => {
                                const newDate = new Date(currentDate)
                                if (viewMode === 'week') {
                                    newDate.setDate(newDate.getDate() - 7)
                                } else {
                                    newDate.setMonth(newDate.getMonth() - 1)
                                }
                                setCurrentDate(newDate)
                            }}
                            className="p-1.5 hover:bg-muted rounded-md transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <button
                            onClick={() => setCurrentDate(new Date())}
                            className="px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
                        >
                            Today
                        </button>
                        <button
                            onClick={() => {
                                const newDate = new Date(currentDate)
                                if (viewMode === 'week') {
                                    newDate.setDate(newDate.getDate() + 7)
                                } else {
                                    newDate.setMonth(newDate.getMonth() + 1)
                                }
                                setCurrentDate(newDate)
                            }}
                            className="p-1.5 hover:bg-muted rounded-md transition-colors"
                        >
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </button>
                    </div>
                    <div className="text-sm font-medium text-muted-foreground">
                        {viewMode === 'week'
                            ? weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                            : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                        }
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="relative flex-1 overflow-y-auto">
                {viewMode === 'week' ? (
                    <>
                        {/* Week View - Timeline Header */}
                        <div className="grid grid-cols-[250px_1fr] border-b border-border sticky top-0 z-20 bg-card shadow-sm">
                            <div className="p-4 flex items-end font-medium text-xs text-muted-foreground uppercase tracking-wider border-r border-border bg-muted/5">
                                Task Name
                            </div>
                            <div className="grid grid-cols-7 bg-muted/5">
                                {weekDates.map((date, i) => {
                                    const today = isToday(date)
                                    return (
                                        <div key={i} className={cn(
                                            "flex flex-col items-center justify-center py-3 border-r border-border/50 text-sm last:border-0 relative",
                                            (i === 5 || i === 6) && "bg-muted/10",
                                            today && "bg-primary/5"
                                        )}>
                                            {today && (
                                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
                                            )}
                                            <span className={cn(
                                                "text-xs font-medium mb-1",
                                                today ? "text-primary" : "text-muted-foreground"
                                            )}>{days[i]}</span>
                                            <div className={cn(
                                                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                                                today ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground"
                                            )}>
                                                {date.getDate()}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Week View - Task Rows */}
                        <div className="divide-y divide-border relative bg-card min-h-[300px]">
                            {/* Background Grid Lines */}
                            <div className="absolute inset-0 grid grid-cols-[250px_1fr] pointer-events-none z-0">
                                <div className="border-r border-border h-full bg-background/50" />
                                <div className="grid grid-cols-7 h-full">
                                    {weekDates.map((date, i) => (
                                        <div key={i} className={cn(
                                            "border-r border-border/40 h-full last:border-0",
                                            (i === 5 || i === 6) && "bg-muted/5",
                                            isToday(date) && "bg-primary/5"
                                        )} />
                                    ))}
                                </div>
                            </div>

                            {tasksWithDueDates.length === 0 ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground z-10">
                                    <p className="mb-2">No tasks due this week</p>
                                    <p className="text-xs opacity-60">Tasks with due dates will appear here</p>
                                </div>
                            ) : (
                                <div className="relative z-10">
                                    {tasksWithDueDates.map((task) => {
                                        const position = getTaskPosition(task)
                                        if (!position) return null

                                        return (
                                            <div key={task.id} className="grid grid-cols-[250px_1fr] min-h-[60px] relative group hover:bg-muted/30 transition-colors">
                                                <div className="px-4 py-3 flex flex-col justify-center border-r border-border bg-card/50 backdrop-blur-[1px]">
                                                    <span className="font-medium text-sm text-foreground truncate">{task.name}</span>
                                                    <div className="flex items-center gap-2 mt-1.5">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger>
                                                                    <div className="flex -space-x-2">
                                                                        {(task.preparers || []).slice(0, 3).map((user, i) => (
                                                                            <Avatar key={i} className="h-5 w-5 border-2 border-background ring-1 ring-border">
                                                                                <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                                                                                    {user.firstName?.[0] || user.email[0].toUpperCase()}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                        ))}
                                                                        {(tasks.length === 0 && (
                                                                            <div className="h-5 w-5 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[9px] text-muted-foreground">?</div>
                                                                        ))}
                                                                    </div>
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>Assigned to: {(task.preparers || []).map(u => u.firstName).join(', ') || 'Unassigned'}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        <span className="text-xs text-muted-foreground truncate max-w-[120px]">
                                                            {task.project?.description || 'Project'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="relative h-full w-full py-2">
                                                    {/* Task Bar */}
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div
                                                                    className={cn(
                                                                        "absolute top-1/2 -translate-y-1/2 h-10 rounded-lg flex items-center shadow-sm cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ring-1 ring-black/5 group-hover:ring-black/10",
                                                                        getStatusColor(task.status)
                                                                    )}
                                                                    style={position}
                                                                >
                                                                    <div className="px-3 flex items-center justify-between w-full">
                                                                        <span className="text-xs font-semibold truncate relative z-10" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
                                                                            {task.name}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="text-xs">
                                                                    <p className="font-semibold mb-1">{task.name}</p>
                                                                    <p className="text-muted-foreground">Status: {getStatusLabel(task.status)}</p>
                                                                    <p className="text-muted-foreground">Due: {new Date(task.dueAt!).toLocaleDateString()}</p>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        {/* Month View */}
                        <div className="bg-card">
                            {/* Month View Header - Days of Week */}
                            <div className="grid grid-cols-7 border-b border-border sticky top-0 z-20 bg-card shadow-sm">
                                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                                    <div key={i} className="p-3 text-center border-r border-border/50 last:border-0 bg-muted/5">
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                            {day}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Month View Grid */}
                            <div className="grid grid-cols-7 auto-rows-fr min-h-[500px]">
                                {monthDates.map((date, i) => {
                                    const dayTasks = getTasksForDate(date)
                                    const isCurrentMonthDay = isCurrentMonth(date)
                                    const isTodayDate = isToday(date)
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6

                                    return (
                                        <div
                                            key={i}
                                            className={cn(
                                                "min-h-[120px] p-2 border-r border-b border-border/50 last:border-r-0",
                                                !isCurrentMonthDay && "bg-muted/20",
                                                isWeekend && isCurrentMonthDay && "bg-muted/5",
                                                isTodayDate && "bg-primary/5 ring-1 ring-primary/20 ring-inset"
                                            )}
                                        >
                                            {/* Date Number */}
                                            <div className="flex items-center justify-between mb-2">
                                                <div className={cn(
                                                    "h-7 w-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                                                    isTodayDate && "bg-primary text-primary-foreground shadow-sm",
                                                    !isTodayDate && isCurrentMonthDay && "text-foreground",
                                                    !isTodayDate && !isCurrentMonthDay && "text-muted-foreground/50"
                                                )}>
                                                    {date.getDate()}
                                                </div>
                                                {dayTasks.length > 0 && (
                                                    <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                                                        {dayTasks.length}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Tasks for this day */}
                                            <div className="space-y-1">
                                                {dayTasks.slice(0, 3).map((task) => (
                                                    <TooltipProvider key={task.id}>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div
                                                                    className={cn(
                                                                        "px-2 py-1 rounded text-[10px] font-medium truncate cursor-pointer transition-all hover:scale-[1.02] hover:shadow-sm",
                                                                        getStatusColor(task.status)
                                                                    )}
                                                                >
                                                                    {task.name}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <div className="text-xs">
                                                                    <p className="font-semibold mb-1">{task.name}</p>
                                                                    <p className="text-muted-foreground">Status: {getStatusLabel(task.status)}</p>
                                                                    <p className="text-muted-foreground">
                                                                        Assigned: {(task.preparers || []).map(u => u.firstName).join(', ') || 'Unassigned'}
                                                                    </p>
                                                                </div>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                ))}
                                                {dayTasks.length > 3 && (
                                                    <div className="text-[10px] text-muted-foreground px-2 py-0.5">
                                                        +{dayTasks.length - 3} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
