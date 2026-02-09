'use client'

import { Clock } from 'lucide-react'
import { type RecentItem } from '@/lib/api'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ItemIcon } from '../shared'

export function RecentsWidget({ items, isLoading, onItemClick }: {
    items: RecentItem[]
    isLoading: boolean
    onItemClick: (item: RecentItem) => void
}) {
    if (isLoading) {
        return <Skeleton className="h-full w-full rounded-xl" />
    }

    return (
        <Card className="h-full bg-background/60 backdrop-blur-xl border-border/50 shadow-sm flex flex-col overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40 bg-muted/20 py-3 px-4 shrink-0 cursor-move">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-serif font-semibold flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Recent Activity
                    </CardTitle>
                </div>
            </CardHeader>
            <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground min-h-[100px]">
                            <Clock className="w-6 h-6 mb-2 opacity-20" />
                            <p className="text-xs">No recent items</p>
                        </div>
                    ) : (
                        items.slice(0, 10).map((item) => (
                            <button
                                key={`${item.type}-${item.id}`}
                                onClick={() => onItemClick(item)}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted/50 hover:border-primary/10 border border-transparent transition-all group text-left"
                            >
                                <div className="p-1.5 rounded-md bg-muted/40 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                    <ItemIcon type={item.type} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <span className="text-xs font-medium text-foreground truncate block group-hover:text-primary transition-colors">
                                        {item.name}
                                    </span>
                                    {item.parentName && (
                                        <span className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                                            in {item.parentName}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </ScrollArea>
        </Card>
    )
}
