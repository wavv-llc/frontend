import React from 'react';

export function DashboardHeaderSkeleton() {
    return (
        <div className="sticky top-0 z-10 px-8 py-4 bg-[rgba(245,245,243,0.85)] backdrop-blur-xl border-b border-[var(--dashboard-border)]">
            <div className="flex items-center justify-between">
                <div className="flex flex-col gap-2">
                    {/* Greeting skeleton */}
                    <div className="h-6 w-64 bg-[var(--dashboard-border)] rounded animate-pulse" />
                    {/* Date skeleton */}
                    <div className="h-3 w-48 bg-[var(--dashboard-border)] rounded animate-pulse" />
                </div>
                {/* Button skeleton */}
                <div className="h-9 w-32 bg-[var(--dashboard-border)] rounded-lg animate-pulse" />
            </div>
        </div>
    );
}

export function CalendarSkeleton() {
    return (
        <div className="bg-[var(--dashboard-surface)] rounded-xl border border-[var(--dashboard-border)] p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-[var(--dashboard-border)]">
                <div className="h-5 w-24 bg-[var(--dashboard-border)] rounded animate-pulse" />
                <div className="flex items-center gap-2">
                    <div className="h-7 w-20 bg-[var(--dashboard-border)] rounded animate-pulse" />
                    <div className="h-7 w-16 bg-[var(--dashboard-border)] rounded animate-pulse" />
                    <div className="h-7 w-20 bg-[var(--dashboard-border)] rounded animate-pulse" />
                </div>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1.5 mb-2">
                {[...Array(7)].map((_, i) => (
                    <div
                        key={i}
                        className="h-4 bg-[var(--dashboard-border)] rounded animate-pulse"
                    />
                ))}
            </div>

            {/* Week grid */}
            <div className="grid grid-cols-7 gap-1.5">
                {[...Array(7)].map((_, i) => (
                    <div
                        key={i}
                        className="min-h-[56px] p-2 bg-[var(--dashboard-border-light)] rounded-lg animate-pulse"
                    />
                ))}
            </div>
        </div>
    );
}

export function TaskTableSkeleton() {
    return (
        <div className="bg-[var(--dashboard-surface)] rounded-xl border border-[var(--dashboard-border)]">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--dashboard-border)]">
                <div className="h-5 w-20 bg-[var(--dashboard-border)] rounded animate-pulse" />
                <div className="flex gap-2">
                    <div className="h-7 w-20 bg-[var(--dashboard-border)] rounded animate-pulse" />
                    <div className="h-7 w-20 bg-[var(--dashboard-border)] rounded animate-pulse" />
                    <div className="h-7 w-20 bg-[var(--dashboard-border)] rounded animate-pulse" />
                </div>
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-[1fr_80px_90px_120px] px-5 py-2 border-b border-[var(--dashboard-border-light)]">
                {[...Array(4)].map((_, i) => (
                    <div
                        key={i}
                        className="h-3 w-20 bg-[var(--dashboard-border)] rounded animate-pulse"
                    />
                ))}
            </div>

            {/* Task rows */}
            <div className="space-y-0">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="grid grid-cols-[1fr_80px_90px_120px] px-5 py-3 border-b border-[var(--dashboard-border-light)]"
                    >
                        <div className="space-y-1">
                            <div className="h-4 w-32 bg-[var(--dashboard-border)] rounded animate-pulse" />
                            <div className="h-3 w-20 bg-[var(--dashboard-border)] rounded animate-pulse" />
                        </div>
                        <div className="h-4 w-4 bg-[var(--dashboard-border)] rounded-full animate-pulse" />
                        <div className="h-3 w-16 bg-[var(--dashboard-border)] rounded animate-pulse" />
                        <div className="h-4 w-20 bg-[var(--dashboard-border)] rounded animate-pulse" />
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ActivityFeedSkeleton() {
    return (
        <div className="w-[340px] bg-[var(--dashboard-surface)] rounded-xl border border-[var(--dashboard-border)] p-5">
            {/* Title */}
            <div className="h-5 w-32 bg-[var(--dashboard-border)] rounded animate-pulse mb-4" />

            {/* Activity items */}
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3 py-2">
                        <div className="w-7 h-7 bg-[var(--dashboard-border)] rounded-lg animate-pulse flex-shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-3 w-24 bg-[var(--dashboard-border)] rounded animate-pulse" />
                            <div className="h-3 w-full bg-[var(--dashboard-border)] rounded animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer stats */}
            <div className="pt-4 mt-4 border-t border-[var(--dashboard-border)]">
                <div className="grid grid-cols-2 gap-2.5">
                    {[...Array(2)].map((_, i) => (
                        <div
                            key={i}
                            className="px-3.5 py-3 bg-[var(--dashboard-border-light)] rounded-lg"
                        >
                            <div className="h-3 w-16 bg-[var(--dashboard-border)] rounded animate-pulse mb-2" />
                            <div className="h-6 w-12 bg-[var(--dashboard-border)] rounded animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export function DashboardLoading() {
    return (
        <div className="min-h-screen bg-[var(--dashboard-bg)]">
            <DashboardHeaderSkeleton />
            <main className="px-8 py-6">
                <CalendarSkeleton />
                <div className="mt-4 grid grid-cols-1 gap-3.5 lg:grid-cols-[1fr_340px]">
                    <TaskTableSkeleton />
                    <ActivityFeedSkeleton />
                </div>
            </main>
        </div>
    );
}
