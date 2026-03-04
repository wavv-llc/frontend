import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="h-full flex flex-col bg-background">
            {/* Header */}
            <div className="px-8 py-5 border-b">
                <Skeleton className="h-7 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
            </div>
            {/* Main */}
            <div className="px-8 py-6 flex-1 flex flex-col gap-4 min-h-0">
                {/* Calendar strip */}
                <Skeleton className="h-32 w-full rounded-xl" />
                {/* Bottom: 2fr task table + 1fr activity feed */}
                <div className="flex-1 grid gap-3.5 lg:grid-cols-[2fr_1fr] min-h-0">
                    <Skeleton className="rounded-xl min-h-48" />
                    <Skeleton className="rounded-xl min-h-48" />
                </div>
            </div>
        </div>
    );
}
