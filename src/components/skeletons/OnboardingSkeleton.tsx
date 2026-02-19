import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function OnboardingSkeleton() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-3xl space-y-8">
                {/* Header Text */}
                <div className="text-center space-y-2 flex flex-col items-center">
                    <Skeleton className="h-10 w-64 md:w-96" />
                    <Skeleton className="h-6 w-48 md:w-72" />
                </div>

                {/* Steps Indicator */}
                <div className="flex items-center justify-center gap-2 mb-8">
                    {[1, 2, 3].map((step, index) => (
                        <div key={step} className="flex items-center">
                            <div className="flex flex-col items-center gap-2">
                                <Skeleton className="w-12 h-12 rounded-full" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                            {index < 2 && (
                                <Skeleton className="w-16 h-0.5 mb-6 mx-2" />
                            )}
                        </div>
                    ))}
                </div>

                {/* Card Skeleton */}
                <Card className="overflow-hidden border border-border">
                    <CardHeader className="space-y-2">
                        <Skeleton className="h-7 w-48" />
                        <Skeleton className="h-4 w-full max-w-md" />
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="flex justify-end pt-4">
                            <Skeleton className="h-11 w-32 rounded-md" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
