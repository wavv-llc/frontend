'use client'

import { Calendar as CalendarIcon } from 'lucide-react'
import { type DashboardTask } from '@/lib/api'
import { ProjectCalendarView } from '@/components/projects/ProjectCalendarView'

export function CalendarWidget({ tasks, isLoading }: {
    tasks: DashboardTask[]
    isLoading: boolean
}) {
    return (
        <div className="h-full bg-background/60 backdrop-blur-xl border border-border/50 shadow-sm rounded-xl overflow-hidden flex flex-col">
            <div className="border-b border-border/40 bg-muted/20 py-3 px-4 shrink-0 cursor-move">
                <span className="text-sm font-serif font-semibold flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-primary" />
                    Smart Schedule
                </span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto">
                <ProjectCalendarView tasks={tasks} compact />
            </div>
        </div>
    )
}
