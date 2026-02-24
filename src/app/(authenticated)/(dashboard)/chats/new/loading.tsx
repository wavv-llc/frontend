import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="relative h-full w-full bg-dashboard-bg overflow-hidden flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center px-5">
                <div className="w-full max-w-2xl space-y-10">
                    {/* Greeting skeleton */}
                    <div className="text-center space-y-3">
                        <Skeleton className="h-10 w-72 mx-auto" />
                        <Skeleton className="h-4 w-56 mx-auto" />
                    </div>
                    {/* Recent chats skeleton */}
                    <div className="space-y-3.5">
                        <Skeleton className="h-3 w-40" />
                        <div className="space-y-2">
                            {[...Array(3)].map((_, i) => (
                                <div
                                    key={i}
                                    className="flex items-start gap-3.5 p-3.5 rounded-lg border border-border"
                                >
                                    <Skeleton className="h-2 w-2 rounded-full mt-1.5 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-3.5 w-3/4" />
                                        <Skeleton className="h-3 w-1/2" />
                                    </div>
                                    <Skeleton className="h-3 w-12 shrink-0" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {/* Input bar skeleton */}
            <div className="w-full pb-7 px-5">
                <div className="max-w-2xl mx-auto">
                    <Skeleton className="h-14 w-full rounded-lg" />
                </div>
            </div>
        </div>
    );
}
