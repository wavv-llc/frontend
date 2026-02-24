import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div className="h-full bg-background p-8 overflow-y-auto">
            <Skeleton className="h-10 w-56 mb-2" />
            <Skeleton className="h-4 w-80 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-36 rounded-xl" />
                ))}
            </div>
        </div>
    );
}
