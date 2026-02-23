import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    List as ListIcon,
    Calendar as CalendarIcon,
} from 'lucide-react';

export function ProjectDetailSkeleton() {
    return (
        <div className="flex flex-col h-full bg-dashboard-bg">
            {/* Sticky Header Skeleton */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-dashboard-border px-8 py-4 flex items-start justify-between shrink-0">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 -ml-1 text-dashboard-text-muted"
                            disabled
                        >
                            <ArrowLeft className="h-4 w-4 opacity-50" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-24" />
                            <span className="text-(--dashboard-text-muted)/40">
                                /
                            </span>
                            <Skeleton className="h-4 w-12" />
                        </div>
                    </div>
                    <Skeleton className="h-7 w-64 mb-1" />
                    <Skeleton className="h-4 w-48" />
                </div>
                <div className="flex items-center gap-2 mt-1">
                    {/* View Toggle Skeleton */}
                    <div className="flex items-center bg-dashboard-surface p-1 rounded-lg border border-dashboard-border shadow-sm mr-2 opacity-50">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-accent-subtle text-dashboard-text-primary">
                            <ListIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">List</span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 text-dashboard-text-muted">
                            <CalendarIcon className="h-4 w-4" />
                            <span className="text-sm font-medium">
                                Calendar
                            </span>
                        </div>
                    </div>
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <Skeleton className="h-9 w-9 rounded-md" />
                    <div className="w-px h-6 bg-dashboard-border mx-1" />
                    <Skeleton className="h-9 w-28 rounded-md" />
                </div>
            </div>

            {/* Content Controls Skeleton */}
            <div className="flex items-center justify-between px-8 py-3 border-b border-dashboard-border bg-dashboard-surface/50">
                <Skeleton className="h-8 w-72 rounded-md" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-24 rounded-md" />
                    <Skeleton className="h-8 w-24 rounded-md" />
                </div>
            </div>

            {/* Main Content Skeleton (Table) */}
            <div className="flex-1 min-h-0 bg-dashboard-surface overflow-hidden flex flex-col">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-dashboard-border bg-[#f8f9fa]">
                    <Skeleton className="col-span-12 h-4 w-full" />
                </div>

                <div className="p-0">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="px-8 py-4 border-b border-dashboard-border flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4 w-full">
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <div className="space-y-1 flex-1">
                                    <Skeleton className="h-4 w-1/3" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                                <div className="flex -space-x-2">
                                    <Skeleton className="h-8 w-8 rounded-full border-2 border-dashboard-surface" />
                                    <Skeleton className="h-8 w-8 rounded-full border-2 border-dashboard-surface" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
