import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"

export function TaskDetailSkeleton({ onBack }: { onBack?: () => void }) {
    return (
        <div className="flex flex-col h-full bg-background p-8">
            {/* Header Section */}
            <div className="flex flex-col gap-6 pb-6 border-b border-border">
                {/* Back & Breadcrumbs */}
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted -ml-2 cursor-pointer" disabled>
                        <ArrowLeft className="h-5 w-5 opacity-50" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-24" />
                        <span className="text-muted-foreground">/</span>
                        <Skeleton className="h-4 w-12" />
                    </div>
                </div>

                {/* Title & Meta */}
                <div className="flex items-start justify-between">
                    <Skeleton className="h-10 w-3/4 max-w-xl" />
                    <div className="flex items-center gap-3">
                        {/* Due Date Card Skeleton */}
                        <Skeleton className="h-[58px] w-[140px] rounded-xl" />
                        {/* 3-Dot Menu Skeleton */}
                        <Skeleton className="h-10 w-10 rounded-xl" />
                    </div>
                </div>

                {/* Assignees */}
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-20" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-px h-4 bg-border mx-2" />
                        <Skeleton className="h-4 w-20" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-5 w-24" />
                        </div>
                    </div>

                    <Skeleton className="h-6 w-24 rounded-full ml-2" />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col gap-8 mt-8 pb-20">
                {/* Description and Files Split Card */}
                <div className="bg-card rounded-xl border border-border shadow-sm grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-border overflow-hidden h-[300px]">
                    {/* Left Column: Description */}
                    <div className="p-8 space-y-4">
                        <div className="flex items-center gap-2 mb-6">
                            <Skeleton className="h-8 w-8 rounded-lg" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-4 w-4/6" />
                        </div>
                    </div>

                    {/* Right Column: Files */}
                    <div className="p-8 bg-muted/5 lg:bg-transparent">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-8 w-8 rounded-lg" />
                                <Skeleton className="h-6 w-32" />
                            </div>
                            <Skeleton className="h-8 w-20" />
                        </div>

                        <div className="space-y-3">
                            <Skeleton className="h-16 w-full rounded-lg" />
                            <Skeleton className="h-16 w-full rounded-lg" />
                        </div>
                    </div>
                </div>

                {/* Comments Section */}
                <div className="w-full">
                    <div className="flex items-center justify-between mb-6">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-8 w-32" />
                    </div>

                    <div className="space-y-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex gap-4">
                                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-20" />
                                    </div>
                                    <Skeleton className="h-16 w-full rounded-xl" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
