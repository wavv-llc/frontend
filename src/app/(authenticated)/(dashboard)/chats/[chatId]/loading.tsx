import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
    return (
        <div
            style={{
                display: 'flex',
                height: '100vh',
                overflow: 'hidden',
                flexDirection: 'column',
            }}
        >
            {/* Top bar skeleton */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 19px',
                    height: '45px',
                    borderBottom: '1px solid hsl(var(--border))',
                    gap: '10px',
                    flexShrink: 0,
                }}
            >
                <Skeleton className="h-7 w-7 rounded-lg shrink-0" />
                <div className="flex flex-col gap-1 flex-1">
                    <Skeleton className="h-3 w-48" />
                    <Skeleton className="h-2 w-24" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            {/* Messages skeleton */}
            <div className="flex-1 overflow-hidden">
                <div className="max-w-[608px] mx-auto px-6 pt-6 flex flex-col gap-5">
                    {/* User message */}
                    <div className="flex justify-end">
                        <Skeleton className="h-12 w-64 rounded-[13px_13px_3px_13px]" />
                    </div>
                    {/* Assistant message */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-6 w-6 rounded-md shrink-0" />
                            <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-32 w-full rounded-[13px]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
