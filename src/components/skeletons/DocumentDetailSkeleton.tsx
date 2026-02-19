import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export function DocumentDetailSkeleton() {
    return (
        <div className="h-full overflow-auto p-6 pb-12">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" disabled className="pl-0">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back
                    </Button>
                </div>

                <div className="flex items-start gap-4">
                    <Skeleton className="h-14 w-14 rounded-lg" />
                    <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-6 w-24 rounded-full" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-9 w-24 rounded-md" />
                        <Skeleton className="h-9 w-24 rounded-md" />
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-40 mb-2" />
                        <Skeleton className="h-4 w-60" />
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-6">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3"
                                    >
                                        <Skeleton className="h-5 w-5 rounded-sm" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-4 w-48" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-6">
                                {[1, 2, 3].map((i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3"
                                    >
                                        <Skeleton className="h-5 w-5 rounded-sm" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-4 w-48" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-6 w-40 mb-2" />
                        <Skeleton className="h-4 w-60" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                        <Skeleton className="h-3 w-16" />
                                        <Skeleton className="h-3 w-24" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
