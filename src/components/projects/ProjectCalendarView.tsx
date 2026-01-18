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
        // We want Monday as start of week, so if Sunday (0), go back 6 days. Else go back day-1
        const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1
        const startDate = new Date(firstDay)
        startDate.setDate(startDate.getDate() - offset)

        // Generate 42 days (6 weeks) to ensure full grid
        const dates = Array.from({ length: 42 }, (_, i) => {
            const date = new Date(startDate)
            date.setDate(startDate.getDate() + i)
            return date
        })

        return dates
    }, [currentDate])

    const weeks = useMemo(() => {
        const chunks = []
        for (let i = 0; i < monthDates.length; i += 7) {
            chunks.push(monthDates.slice(i, i + 7))
        }
        return chunks
    }, [monthDates])

    const getWeekLayout = (weekDates: Date[]) => {
        const weekStart = new Date(weekDates[0])
        weekStart.setHours(0, 0, 0, 0)
        const weekEnd = new Date(weekDates[6])
        weekEnd.setHours(23, 59, 59, 999)

        // Filter tasks visible in this week
        const weekTasks = tasks.filter(task => {
            if (!task.dueAt) return false
            const taskStart = new Date(task.createdAt)
            const taskEnd = new Date(task.dueAt)

            // Normalize
            taskStart.setHours(0, 0, 0, 0)
            taskEnd.setHours(23, 59, 59, 999)
            if (taskStart > taskEnd) taskStart.setTime(taskEnd.getTime())

            return taskEnd >= weekStart && taskStart <= weekEnd
        })

        // Sort: earlier start => top, longer => top
        weekTasks.sort((a, b) => {
            const startA = new Date(a.createdAt).getTime()
            const startB = new Date(b.createdAt).getTime()
            if (startA !== startB) return startA - startB
            return 0
        })

        const slots: string[][] = [] // slots[row][col] => taskId
        const layout: { task: Task; startIdx: number; span: number; rowIndex: number }[] = []

        weekTasks.forEach(task => {
            const taskStart = new Date(task.createdAt)
            const taskEnd = new Date(task.dueAt!)
            taskStart.setHours(0, 0, 0, 0)
            taskEnd.setHours(23, 59, 59, 999)
            if (taskStart > taskEnd) taskStart.setTime(taskEnd.getTime())

            // Calculate start/end indices in this week (0-6)
            let startIdx = 0
            if (taskStart >= weekStart) {
                const diff = Math.floor((taskStart.getTime() - weekStart.getTime()) / (24 * 3600 * 1000))
                startIdx = Math.max(0, diff)
            }

            let endIdx = 6
            if (taskEnd <= weekEnd) {
                const diff = Math.floor((taskEnd.getTime() - weekStart.getTime()) / (24 * 3600 * 1000))
                endIdx = Math.min(6, diff)
            }

            // Find first row where columns [startIdx...endIdx] are free
            let rowIndex = 0
            while (true) {
                if (!slots[rowIndex]) slots[rowIndex] = new Array(7).fill(null)

                let collision = false
                for (let c = startIdx; c <= endIdx; c++) {
                    if (slots[rowIndex][c]) {
                        collision = true
                        break
                    }
                }

                if (!collision) {
                    for (let c = startIdx; c <= endIdx; c++) {
                        slots[rowIndex][c] = task.id
                    }
                    layout.push({
                        task,
                        startIdx,
                        span: endIdx - startIdx + 1,
                        rowIndex
                    })
                    break
                }
                rowIndex++
            }
        })

        return { layout, maxRows: slots.length }
    }

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const today = new Date()

    const getStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'COMPLETED': return 'bg-gradient-to-r from-emerald-500 to-emerald-600 border-emerald-600/20 text-white shadow-emerald-500/20'
            case 'IN_PROGRESS': return 'bg-gradient-to-r from-blue-500 to-blue-600 border-blue-600/20 text-white shadow-blue-500/20'
            case 'IN_REVIEW': return 'bg-gradient-to-r from-orange-400 to-orange-500 border-orange-500/20 text-white shadow-orange-500/20'
            default: return 'bg-gradient-to-r from-gray-500 to-gray-600 border-gray-600/20 text-white shadow-gray-500/20'
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

        const startDate = new Date(task.createdAt)
        const dueDate = new Date(task.dueAt)

        // Normalize times to start of day for accurate day calculation
        startDate.setHours(0, 0, 0, 0)
        dueDate.setHours(23, 59, 59, 999)

        // Helper to ensure start <= due
        if (startDate > dueDate) {
            startDate.setTime(dueDate.getTime())
            startDate.setHours(0, 0, 0, 0)
        }

        const startOfWeek = new Date(weekDates[0])
        startOfWeek.setHours(0, 0, 0, 0)

        const endOfWeek = new Date(weekDates[6])
        endOfWeek.setHours(23, 59, 59, 999)

        // Check availability in current view
        if (dueDate < startOfWeek || startDate > endOfWeek) return null

        // Clamp dates to week view
        const visualStart = startDate < startOfWeek ? startOfWeek : startDate
        const visualEnd = dueDate > endOfWeek ? endOfWeek : dueDate

        // Normalize visual end for index calculation
        const visualEndNormalized = new Date(visualEnd)
        visualEndNormalized.setHours(0, 0, 0, 0)

        const dayMs = 24 * 60 * 60 * 1000
        const startIdx = Math.max(0, Math.floor((visualStart.getTime() - startOfWeek.getTime()) / dayMs))
        const endIdx = Math.min(6, Math.floor((visualEndNormalized.getTime() - startOfWeek.getTime()) / dayMs))

        const span = endIdx - startIdx + 1

        return {
            left: `${(startIdx * 100) / 7 + 0.5}%`,
            width: `${(span * 100) / 7 - 1}%`
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
                                            "flex flex-col items-center justify-center py-4 border-r border-border/40 text-sm last:border-0 relative bg-opacity-50",
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
                                            <div key={task.id} className="grid grid-cols-[250px_1fr] min-h-[56px] relative group hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0">
                                                <div className="px-4 py-3 flex flex-col justify-center border-r border-border/40 bg-card/50 backdrop-blur-[1px]">
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
                                                                        "absolute top-1/2 -translate-y-1/2 h-9 rounded-md flex items-center shadow-sm cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md ring-1 ring-black/5 group-hover:z-10",
                                                                        getStatusColor(task.status)
                                                                    )}
                                                                    style={position}
                                                                >
                                                                    <div className="px-3 flex items-center justify-between w-full overflow-hidden">
                                                                        <span className="text-xs font-semibold truncate relative z-10 drop-shadow-md">
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
                            <div className="flex flex-col border-l border-border bg-background">
                                {weeks.map((week, weekIndex) => {
                                    const { layout, maxRows } = getWeekLayout(week)
                                    // Base height (header) + rows height
                                    const minHeight = Math.max(120, 36 + (maxRows * 28) + 10)

                                    return (
                                        <div
                                            key={weekIndex}
                                            className="relative border-b border-border flex-1 w-full"
                                            style={{ minHeight: `${minHeight}px` }}
                                        >
                                            {/* Grid Background (Days) */}
                                            <div className="absolute inset-0 grid grid-cols-7 z-0 pointer-events-none">
                                                {week.map((date, i) => {
                                                    const isCurrentMonthDay = isCurrentMonth(date)
                                                    const isTodayDate = isToday(date)
                                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6

                                                    return (
                                                        <div
                                                            key={i}
                                                            className={cn(
                                                                "border-r border-border/40 h-full p-2 last:border-r-0",
                                                                !isCurrentMonthDay && "bg-muted/30",
                                                                isWeekend && isCurrentMonthDay && "bg-muted/5",
                                                                isTodayDate && "bg-primary/5"
                                                            )}
                                                        >
                                                            <div className="flex justify-end">
                                                                <div className={cn(
                                                                    "h-7 w-7 rounded-full flex items-center justify-center text-sm font-semibold transition-colors",
                                                                    isTodayDate && "bg-primary text-primary-foreground shadow-sm",
                                                                    !isTodayDate && isCurrentMonthDay && "text-foreground",
                                                                    !isTodayDate && !isCurrentMonthDay && "text-muted-foreground/50"
                                                                )}>
                                                                    {date.getDate()}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* Tasks Layer */}
                                            <div className="relative z-10 w-full mt-9 pb-2">
                                                {layout.map(({ task, startIdx, span, rowIndex }) => (
                                                    <div
                                                        key={`${task.id}-${weekIndex}`}
                                                        className="absolute h-6 transition-all hover:z-20 group"
                                                        style={{
                                                            left: `${(startIdx * 100) / 7}%`,
                                                            width: `${(span * 100) / 7}%`,
                                                            top: `${rowIndex * 28}px`,
                                                        }}
                                                    >
                                                        <div className="px-1 h-full w-full">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div
                                                                            className={cn(
                                                                                "h-full w-full rounded px-2 flex items-center shadow-sm cursor-pointer hover:shadow-md transition-all border border-black/5 overflow-hidden",
                                                                                getStatusColor(task.status)
                                                                            )}
                                                                        >
                                                                            <span className="text-[10px] font-semibold truncate text-white drop-shadow-sm">
                                                                                {task.name}
                                                                            </span>
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
                                                ))}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div >
    )
}
