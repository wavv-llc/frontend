import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
    return (
        <div className="flex h-screen w-full bg-background overflow-hidden">
            {/* Sidebar Skeleton */}
            <div className="hidden md:flex flex-col w-[260px] border-r border-border bg-sidebar h-full">
                <div className="p-4 border-b border-sidebar-border">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-8 rounded-md" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
                <div className="flex-1 p-2 space-y-4 mt-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-full rounded-md" />
                        <Skeleton className="h-8 w-full rounded-md" />
                        <Skeleton className="h-8 w-full rounded-md" />
                    </div>
                    <div className="pt-4">
                        <Skeleton className="h-4 w-16 mb-2 ml-2" />
                        <Skeleton className="h-8 w-full rounded-md" />
                        <Skeleton className="h-8 w-full rounded-md" />
                    </div>
                </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="flex-1 flex flex-col min-w-0 bg-background">
                <div className="p-8 space-y-8">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-4 w-96" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </div>
                    <Skeleton className="h-[400px] w-full rounded-xl" />
                </div>
            </div>
        </div>
    )
}
