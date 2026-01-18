import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MoreHorizontal, List as ListIcon, Calendar as CalendarIcon, Plus } from "lucide-react"

export function WorkspaceDetailSkeleton() {
    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            {/* Header */}
            <div className="border-b px-6 py-4 flex items-center justify-between shrink-0 bg-background z-10 px-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-muted" disabled>
                        <ArrowLeft className="h-4 w-4 opacity-50" />
                    </Button>
                    <Skeleton className="h-6 w-48" />
                </div>
                <Button variant="ghost" size="sm" className="gap-2" disabled>
                    <MoreHorizontal className="h-4 w-4 opacity-50" />
                    <Skeleton className="h-4 w-12" />
                </Button>
            </div>

            {/* Toolbar */}
            <div className="px-6 py-4 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                    <div className="flex items-center p-1 bg-muted rounded-lg border border-border/10 mr-2 opacity-50">
                        <div className="h-7 px-3 flex items-center gap-2 bg-background rounded-md">
                            <ListIcon className="h-3 w-3" />
                            <span className="text-xs font-medium">List</span>
                        </div>
                        <div className="h-7 px-3 flex items-center gap-2 text-muted-foreground ">
                            <CalendarIcon className="h-3 w-3" />
                            <span className="text-xs font-medium">Calendar</span>
                        </div>
                    </div>
                    <Skeleton className="h-8 w-32 rounded-md" />
                </div>
            </div>

            {/* Content (Project List Table) */}
            <div className="flex-1 overflow-auto px-6 pb-6">
                <div className="w-full">
                    {/* Projects Table Header */}
                    <div className="grid grid-cols-12 gap-4 px-4 py-3 border-b border-border text-xs font-semibold uppercase tracking-wider text-muted-foreground bg-muted/20 rounded-t-lg">
                        <div className="col-span-5 pl-2"><Skeleton className="h-3 w-24" /></div>
                        <div className="col-span-3"><Skeleton className="h-3 w-16" /></div>
                        <div className="col-span-2"><Skeleton className="h-3 w-16" /></div>
                        <div className="col-span-2"><Skeleton className="h-3 w-12" /></div>
                    </div>

                    <div className="border-x border-b border-border rounded-b-lg divide-y divide-border bg-card">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="grid grid-cols-12 gap-4 px-4 py-4 items-center">
                                {/* Project Name */}
                                <div className="col-span-5 flex items-center gap-3">
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <div className="flex-1 space-y-1">
                                        <Skeleton className="h-4 w-48" />
                                        <Skeleton className="h-3 w-32" />
                                    </div>
                                </div>

                                {/* Progress */}
                                <div className="col-span-3 pr-4">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="flex-1 h-2 rounded-full" />
                                        <Skeleton className="w-8 h-3" />
                                    </div>
                                </div>

                                {/* Due Date */}
                                <div className="col-span-2">
                                    <Skeleton className="h-4 w-24" />
                                </div>

                                {/* Owner */}
                                <div className="col-span-2 flex items-center gap-2">
                                    <Skeleton className="h-6 w-6 rounded-full" />
                                    <Skeleton className="h-4 w-20" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
