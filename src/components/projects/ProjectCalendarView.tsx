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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, LayoutList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'

interface ProjectCalendarViewProps {
    tasks: Task[]
    compact?: boolean // When true, uses a simplified layout without task name column
}

type ViewMode = 'week' | 'month'

export function ProjectCalendarView({ tasks, compact = false }: ProjectCalendarViewProps) {
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
        <div className="w-full h-full border-none rounded-none bg-transparent shadow-none overflow-hidden flex flex-col">
            {/* Header Controls */}
            {/* Header Controls */}
            <div className="px-0 py-4 flex items-center justify-between bg-transparent shrink-0">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            const newDate = new Date(currentDate)
                            if (viewMode === 'week') {
                                newDate.setDate(newDate.getDate() - 7)
                            } else {
                                newDate.setMonth(newDate.getMonth() - 1)
                            }
                            setCurrentDate(newDate)
                        }}
                        className="h-8 w-8 hover:bg-muted/50"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <div className="flex items-center gap-2 px-2">
                        <span className="font-semibold text-lg text-foreground min-w-[140px] text-center font-serif">
                            {viewMode === 'week'
                                ? weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                                : currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                            }
                        </span>
                        {(viewMode === 'week' ? weekDates.some(date => isToday(date)) : isToday(currentDate)) && (
                            <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">Today</span>
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                            const newDate = new Date(currentDate)
                            if (viewMode === 'week') {
                                newDate.setDate(newDate.getDate() + 7)
                            } else {
                                newDate.setMonth(newDate.getMonth() + 1)
                            }
                            setCurrentDate(newDate)
                        }}
                        className="h-8 w-8 hover:bg-muted/50"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center bg-muted/30 p-1 rounded-lg border border-border/20">
                        <Select
                            value={viewMode}
                            onValueChange={(v) => setViewMode(v as ViewMode)}
                        >
                            <SelectTrigger className="w-[120px] h-8 bg-transparent border-0 focus:ring-0 text-sm font-medium focus:outline-none">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="month">Monthly</SelectItem>
                                <SelectItem value="week">Weekly</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentDate(new Date())}
                        className="ml-2 h-9 bg-transparent hover:bg-muted/50"
                    >
                        Today
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="relative flex-1 overflow-y-auto">
                {viewMode === 'week' ? (
                    <>
                        {/* Week View - Timeline Header */}
                        <div className={cn(
                            "border-b border-border/40 sticky top-0 z-20 bg-background/95 backdrop-blur-sm shadow-sm",
                            compact ? "grid grid-cols-7" : "grid grid-cols-[250px_1fr]"
                        )}>
                            {!compact && (
                                <div className="p-4 flex items-end font-medium text-xs text-muted-foreground uppercase tracking-wider border-r border-border/40">
                                    Task Name
                                </div>
                            )}
                            <div className={cn(compact ? "contents" : "grid grid-cols-7 flex-1")}>
                                {weekDates.map((date, i) => {
                                    const today = isToday(date)
                                    return (
                                        <div key={i} className={cn(
                                            "flex flex-col items-center justify-center py-4 px-2 border-r border-border/40 text-sm last:border-0 relative min-w-0",
                                            (i === 5 || i === 6) && "bg-muted/5",
                                            today && "bg-primary/5"
                                        )}>
                                            {today && (
                                                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
                                            )}
                                            <span className={cn(
                                                "text-xs font-medium mb-1 whitespace-nowrap",
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
                        <div className="divide-y divide-border/40 relative bg-background/30 min-h-[300px]">
                            {/* Background Grid Lines */}
                            <div className={cn(
                                "absolute inset-0 pointer-events-none z-0",
                                compact ? "grid grid-cols-7" : "grid grid-cols-[250px_1fr]"
                            )}>
                                {!compact && <div className="border-r border-border/40 h-full bg-muted/5" />}
                                <div className={cn(compact ? "contents" : "grid grid-cols-7 h-full flex-1")}>
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
                                            <div key={task.id} className={cn(
                                                "min-h-[56px] relative group hover:bg-muted/30 transition-colors border-b border-border/40 last:border-0",
                                                compact ? "grid grid-cols-7" : "grid grid-cols-[250px_1fr]"
                                            )}>
                                                {!compact && (
                                                    <div className="px-4 py-3 flex flex-col justify-center border-r border-border/40 bg-background/40 backdrop-blur-[1px]">
                                                        <span className="font-medium text-sm text-foreground truncate">{task.name}</span>
                                                        <div className="flex items-center gap-2 mt-1.5">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger>
                                                                        <div className="flex -space-x-2">
                                                                            {(task.preparers || []).slice(0, 3).map((user, i) => (
                                                                                <Avatar key={i} className="h-5 w-5 border-2 border-background ring-1 ring-border/50">
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
                                                )}
                                                <div className={cn("relative h-full w-full py-2", compact && "col-span-7")}>
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
                        <div className="h-full">
                            {/* Month View Header - Days of Week */}
                            <div className="grid grid-cols-7 border-b border-border/50 sticky top-0 z-20 bg-background/95 backdrop-blur-sm shadow-sm">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
                                    <div key={i} className="py-3 px-2 text-center">
                                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            {day}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Month View Grid */}
                            <div className="flex flex-col">
                                {weeks.map((week, weekIndex) => {
                                    const { layout, maxRows } = getWeekLayout(week)
                                    // Calculate responsive height: Base cell height (e.g. 150px) or content based
                                    // The image shows spacious cells. Let's enforce a minimum height.
                                    const minHeight = Math.max(160, 48 + (maxRows * 30) + 10)

                                    return (
                                        <div
                                            key={weekIndex}
                                            className="relative border-b border-border/30 flex-1 w-full"
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
                                                                "border-r border-border/30 h-full p-3 last:border-r-0 transition-colors",
                                                                !isCurrentMonthDay ? "bg-muted/5 opacity-50 text-muted-foreground" : "bg-transparent",
                                                                isWeekend && isCurrentMonthDay && "bg-muted/5",
                                                            )}
                                                            style={
                                                                isWeekend && isCurrentMonthDay
                                                                    ? { backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.02) 10px, rgba(0,0,0,0.02) 20px)' }
                                                                    : {}
                                                            }
                                                        >
                                                            <div className="flex justify-start">
                                                                <div className={cn(
                                                                    "h-7 w-7 rounded-sm flex items-center justify-start pl-1 text-sm font-medium transition-colors date-number",
                                                                    isTodayDate && "text-primary font-bold",
                                                                    !isTodayDate && isCurrentMonthDay && "text-foreground",
                                                                    !isTodayDate && !isCurrentMonthDay && "text-muted-foreground/50",
                                                                    isTodayDate && "relative after:content-[''] after:absolute after:-bottom-1 after:left-1 after:w-full after:h-0.5 after:bg-primary"
                                                                )}>
                                                                    {date.getDate()}
                                                                </div>
                                                            </div>
                                                            {/* Highlight box for active selected or special days if needed */}
                                                            {isTodayDate && (
                                                                <div className="absolute inset-0 border-2 border-primary/20 pointer-events-none rounded-sm" />
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            {/* Tasks Layer */}
                                            <div className="relative z-10 w-full mt-10 pb-2">
                                                {layout.map(({ task, startIdx, span, rowIndex }) => (
                                                    <div
                                                        key={`${task.id}-${weekIndex}`}
                                                        className="absolute h-[26px] transition-all hover:z-20 group"
                                                        style={{
                                                            left: `${(startIdx * 100) / 7}%`,
                                                            width: `${(span * 100) / 7}%`,
                                                            top: `${rowIndex * 30}px`,
                                                        }}
                                                    >
                                                        <div className="px-1 h-full w-full">
                                                            <TooltipProvider>
                                                                <Tooltip>
                                                                    <TooltipTrigger asChild>
                                                                        <div
                                                                            className={cn(
                                                                                "h-full w-full rounded-[4px] px-2 flex items-center shadow-sm cursor-pointer hover:shadow-md transition-all border overflow-hidden hover:bg-muted/50",
                                                                                getStatusColor(task.status).replace('text-white', 'text-foreground').replace('bg-gradient-to-r', '').replace('from-', '').replace('to-', ''),
                                                                                "bg-card/80 backdrop-blur-sm border-l-4" // Use clean card with colored border styling
                                                                            )}
                                                                            style={{
                                                                                // Override the gradient background from getStatusColor to be cleaner
                                                                                borderLeftColor:
                                                                                    task.status === 'COMPLETED' ? '#10b981' :
                                                                                        task.status === 'IN_PROGRESS' ? '#3b82f6' :
                                                                                            task.status === 'IN_REVIEW' ? '#f97316' : '#6b7280'
                                                                            }}
                                                                        >
                                                                            <span className="text-[11px] font-medium truncate text-foreground/90 flex items-center gap-1.5">
                                                                                {/* Status Indicator Dot */}
                                                                                <div
                                                                                    className="w-1.5 h-1.5 rounded-full shrank-0"
                                                                                    style={{
                                                                                        backgroundColor:
                                                                                            task.status === 'COMPLETED' ? '#10b981' :
                                                                                                task.status === 'IN_PROGRESS' ? '#3b82f6' :
                                                                                                    task.status === 'IN_REVIEW' ? '#f97316' : '#6b7280'
                                                                                    }}
                                                                                />
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
        </div>
    )
}
