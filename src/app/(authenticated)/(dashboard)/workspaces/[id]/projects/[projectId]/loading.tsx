import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="flex flex-col h-full bg-dashboard-bg overflow-hidden">
            {/* Header skeleton */}
            <div className="sticky top-0 z-10 border-b border-dashboard-border px-6 py-4 flex items-center justify-between shrink-0 bg-white/95">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-7 w-56" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
            </div>
            {/* Toolbar skeleton */}
            <div className="px-6 py-3 flex items-center gap-2 shrink-0 border-b border-dashboard-border">
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
                <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
            {/* Task rows skeleton */}
            <div className="flex-1 overflow-auto px-6 pb-6 pt-4 space-y-2">
                {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
            </div>
        </div>
    );
}
