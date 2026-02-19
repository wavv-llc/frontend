import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft,
    List as ListIcon,
    Calendar as CalendarIcon,
} from 'lucide-react';

export function ProjectDetailSkeleton() {
    return (
        <div className="flex flex-col h-full space-y-8 p-8">
            {/* Header Section */}
            <div className="flex flex-col gap-8">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 -ml-1"
                                disabled
                            >
                                <ArrowLeft className="h-4 w-4 opacity-50" />
                            </Button>
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-24" />
                                <span className="text-muted-foreground/40">
                                    /
                                </span>
                                <Skeleton className="h-4 w-12" />
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-9 w-64" />
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* View Toggle Skeleton */}
                        <div className="flex items-center bg-white p-1 rounded-lg border border-border shadow-sm mr-2 opacity-50">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-muted text-foreground">
                                <ListIcon className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    List
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 text-muted-foreground">
                                <CalendarIcon className="h-4 w-4" />
                                <span className="text-sm font-medium">
                                    Calendar
                                </span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <Skeleton className="h-9 w-9 rounded-md" />
                        <Skeleton className="h-9 w-9 rounded-md" />
                        <Skeleton className="h-9 w-9 rounded-md" />
                        <div className="w-px h-6 bg-border mx-1" />
                        <Skeleton className="h-9 w-28 rounded-md" />
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div
                            key={i}
                            className="bg-white border border-border rounded-xl p-5 flex items-center justify-between shadow-sm"
                        >
                            <div>
                                <Skeleton className="h-3 w-20 mb-2" />
                                <Skeleton className="h-8 w-12" />
                            </div>
                            <Skeleton className="h-10 w-10 rounded-full" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Controls Skeleton */}
            <div className="flex items-center justify-between pb-2">
                <Skeleton className="h-9 w-72 rounded-md" />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-24 rounded-md" />
                    <Skeleton className="h-8 w-24 rounded-md" />
                </div>
            </div>

            {/* Main Content Skeleton (Table) */}
            <div className="flex-1 min-h-0 bg-white rounded-xl border border-border shadow-sm overflow-hidden flex flex-col">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 px-8 py-5 border-b border-border/60">
                    <Skeleton className="col-span-12 h-4 w-full" />
                </div>

                <div className="p-0">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div
                            key={i}
                            className="px-8 py-4 border-b border-border/60 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4 w-full">
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <div className="space-y-1 flex-1">
                                    <Skeleton className="h-4 w-1/3" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                                <Skeleton className="h-4 w-24" />
                                <div className="flex -space-x-2">
                                    <Skeleton className="h-8 w-8 rounded-full border-2 border-background" />
                                    <Skeleton className="h-8 w-8 rounded-full border-2 border-background" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
