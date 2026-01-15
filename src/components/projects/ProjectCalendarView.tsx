'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { type Task } from '@/lib/api'

interface ProjectCalendarViewProps {
    tasks: Task[]
}

export function ProjectCalendarView({ tasks }: ProjectCalendarViewProps) {
    // Generate current week dates
    const weekDates = useMemo(() => {
        const today = new Date()
        const currentDay = today.getDay()
        const monday = new Date(today)
        monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1))

        return Array.from({ length: 7 }, (_, i) => {
            const date = new Date(monday)
            date.setDate(monday.getDate() + i)
            return date
        })
    }, [])

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

    const getStatusColor = (status: Task['status']) => {
        switch (status) {
            case 'COMPLETED': return 'bg-emerald-500'
            case 'IN_PROGRESS': return 'bg-blue-600'
            case 'IN_REVIEW': return 'bg-orange-500'
            case 'BLOCKED': return 'bg-destructive'
            default: return 'bg-gray-400'
        }
    }

    const getTaskPosition = (task: Task) => {
        if (!task.dueAt) return null

        const dueDate = new Date(task.dueAt)
        const startOfWeek = weekDates[0]
        const endOfWeek = weekDates[6]

        // Only show tasks due this week
        if (dueDate < startOfWeek || dueDate > endOfWeek) return null

        const dayIndex = Math.floor((dueDate.getTime() - startOfWeek.getTime()) / (1000 * 60 * 60 * 24))

        return {
            left: `${dayIndex * (100 / 7) + 0.5}%`,
            width: `${(100 / 7) - 1}%`
        }
    }

    const tasksWithDueDates = tasks.filter(task => task.dueAt)

    return (
        <div className="w-full border border-border rounded-xl bg-card shadow-sm overflow-hidden">
            {/* Header Controls */}
            <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-card">
                <div className="flex items-center gap-4">
                    <h2 className="font-semibold text-lg text-foreground tracking-tight">Calendar View</h2>
                    <div className="px-3 py-1 bg-muted border border-border rounded-md text-xs font-medium text-muted-foreground shadow-sm">Week</div>

                    <div className="flex items-center gap-4 ml-4 text-xs font-medium">
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10" />
                            <span className="text-muted-foreground">Complete</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-4 ring-blue-600/10" />
                            <span className="text-muted-foreground">In Progress</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 ring-4 ring-orange-500/10" />
                            <span className="text-muted-foreground">In Review</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="relative">
                {/* Month Label */}
                <div className="absolute top-3 left-[260px] text-xs font-bold text-muted-foreground uppercase tracking-wide">
                    {weekDates[0].toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </div>

                {/* Timeline Header */}
                <div className="grid grid-cols-[250px_1fr] border-b border-border">
                    <div className="p-4 flex items-end font-semibold text-sm text-foreground border-r border-border bg-muted/20">
                        Task Name
                    </div>
                    <div className="grid grid-cols-7">
                        {weekDates.map((date, i) => (
                            <div key={i} className={cn(
                                "flex flex-col items-center justify-end pb-3 pt-8 border-r border-border text-sm last:border-0",
                                (i === 5 || i === 6) && "bg-muted/30"
                            )}>
                                <span className="font-semibold text-foreground mb-0.5">{days[i]}</span>
                                <span className="text-muted-foreground text-xs">{date.getDate()}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Task Rows */}
                <div className="divide-y divide-border relative">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 grid grid-cols-[250px_1fr] pointer-events-none z-0">
                        <div className="border-r border-border h-full bg-transparent" />
                        <div className="grid grid-cols-7 h-full">
                            {weekDates.map((_, i) => (
                                <div key={i} className={cn(
                                    "border-r border-border h-full last:border-0",
                                    (i === 5 || i === 6) && "bg-muted/10"
                                )} />
                            ))}
                        </div>
                    </div>

                    {tasksWithDueDates.length === 0 ? (
                        <div className="py-16 text-center text-muted-foreground">
                            No tasks with due dates this week
                        </div>
                    ) : (
                        tasksWithDueDates.map((task) => {
                            const position = getTaskPosition(task)
                            if (!position) return null

                            return (
                                <div key={task.id} className="grid grid-cols-[250px_1fr] h-14 relative z-10 hover:bg-muted/20 transition-colors group">
                                    <div className="px-4 flex items-center font-medium text-sm text-foreground border-r border-border bg-card/50 backdrop-blur-[1px]">
                                        {task.name}
                                    </div>
                                    <div className="relative h-full w-full py-3">
                                        {/* Task Bar */}
                                        <div
                                            className={cn(
                                                "absolute top-1/2 -translate-y-1/2 h-8 rounded-md flex items-center overflow-hidden shadow-sm ring-1 ring-inset ring-black/5 transition-all hover:brightness-105 hover:shadow-md cursor-pointer",
                                                getStatusColor(task.status)
                                            )}
                                            style={position}
                                        >
                                            <span className="text-white text-xs font-medium px-3 truncate w-full">
                                                {task.name}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </div>
        </div>
    )
}
