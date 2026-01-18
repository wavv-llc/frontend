import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export function AdminSkeleton() {
    return (
        <div className="h-full overflow-auto p-6">
            <div className="max-w-6xl mx-auto space-y-6">
                <div>
                    <Skeleton className="h-9 w-64 mb-2" />
                    <Skeleton className="h-5 w-96" />
                </div>

                <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-9 w-24" />
                </div>

                <div className="space-y-4">
                    <Skeleton className="h-7 w-48" />
                    <div className="grid gap-4">
                        {[1, 2, 3].map(i => (
                            <Card key={i}>
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="h-7 w-48" />
                                            <Skeleton className="h-4 w-64" />
                                        </div>
                                        <Skeleton className="h-6 w-20 rounded-full" />
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <Skeleton className="h-4 w-full mb-4" />
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-3 w-32" />
                                        <div className="flex gap-2">
                                            <Skeleton className="h-8 w-16" />
                                            <Skeleton className="h-8 w-20" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
