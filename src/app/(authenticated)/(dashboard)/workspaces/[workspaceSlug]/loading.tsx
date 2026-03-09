import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="flex flex-col h-full bg-dashboard-bg overflow-hidden">
            {/* Header skeleton */}
            <div className="sticky top-0 z-10 border-b border-dashboard-border px-6 py-4 flex items-center justify-between shrink-0 bg-white/95">
                <div className="flex flex-col gap-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-7 w-52" />
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            {/* Toolbar skeleton */}
            <div className="px-6 py-3 flex items-center shrink-0 border-b border-dashboard-border">
                <Skeleton className="h-8 w-28 rounded-lg" />
            </div>
            {/* Content skeleton */}
            <div className="flex-1 overflow-auto px-6 pb-6 pt-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
            </div>
        </div>
    );
}
