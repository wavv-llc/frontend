import { Skeleton } from '@/components/ui/skeleton';

export function WorkspaceListSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div
                    key={i}
                    className="bg-card border border-border rounded-xl p-6 h-full flex flex-col"
                >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-4">
                        <Skeleton className="h-12 w-12 rounded-lg" />
                        <Skeleton className="h-4 w-4 rounded-full" />
                    </div>

                    {/* Content */}
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-1/2 mb-6" />

                    {/* Progress */}
                    <div className="mb-4">
                        <div className="flex items-center gap-3">
                            <Skeleton className="flex-1 h-2 rounded-full" />
                            <Skeleton className="w-8 h-4" />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex items-center gap-4 mt-auto">
                        <Skeleton className="h-4 w-24" />
                    </div>
                </div>
            ))}
        </div>
    );
}
