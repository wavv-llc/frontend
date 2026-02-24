import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="h-full bg-background p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <Skeleton className="h-9 w-48 mb-2" />
                    <Skeleton className="h-4 w-72" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-card border border-border rounded-xl p-6 flex flex-col gap-3"
                        >
                            <Skeleton className="h-12 w-12 rounded-lg" />
                            <Skeleton className="h-5 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-1/2" />
                            <div className="mt-auto space-y-2 pt-2">
                                <Skeleton className="h-2 w-full rounded-full" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
