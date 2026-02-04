import { Skeleton } from "@/components/ui/skeleton"

export function UnauthenticatedSkeleton() {
    return (
        <div className="flex h-screen w-full bg-background items-center justify-center">
            {/* Simple full screen loader for unauthenticated pages */}
            <div className="space-y-4 w-full max-w-md p-6">
                <Skeleton className="h-12 w-full rounded-lg" />
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                </div>
            </div>
        </div>
    )
}
