'use client';

import React from 'react';
import {
    Upload,
    MessageSquare,
    CheckCircle,
    UserPlus,
    FileText,
    LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface ActivityItem {
    id: string;
    type: 'upload' | 'comment' | 'status_change' | 'assignment' | 'review';
    title: string;
    description: string;
    user: {
        name: string;
        avatar?: string;
    };
    timestamp: Date;
}

export interface ActivityStat {
    label: string;
    value: string | number;
    subLabel?: string;
    icon?: LucideIcon;
    progress?: number;
}

interface ActivityFeedProps {
    activities: ActivityItem[];
    stats: ActivityStat[];
    className?: string;
    isLoading?: boolean;
}

const ACTIVITY_ICONS: Record<ActivityItem['type'], LucideIcon> = {
    upload: Upload,
    comment: MessageSquare,
    status_change: CheckCircle,
    assignment: UserPlus,
    review: FileText,
};

const ACTIVITY_TYPE_LABELS: Record<ActivityItem['type'], string> = {
    upload: 'Uploaded',
    comment: 'Commented',
    status_change: 'Updated',
    assignment: 'Assigned',
    review: 'Reviewed',
};

function formatTimestamp(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function ActivityFeed({
    activities,
    stats,
    className,
    isLoading = false,
}: ActivityFeedProps) {
    return (
        <Card
            className={cn(
                'bg-dashboard-surface rounded-xl border border-dashboard-border',
                'transition-shadow duration-200 hover:shadow-[0_2px_16px_rgba(90,127,154,0.05)]',
                'overflow-hidden gap-0 py-0',
                className,
            )}
        >
            <CardHeader className="px-4.5 pt-4.5 pb-4 border-b-0 gap-0">
                <CardTitle className="font-serif text-[14px] font-semibold tracking-tight text-dashboard-text-primary leading-none">
                    Recent Activity
                </CardTitle>
            </CardHeader>

            {/* Activity List */}
            <CardContent className="px-0 pb-0">
                <ScrollArea className="px-4.5" style={{ maxHeight: 320 }}>
                    {isLoading ? (
                        <div className="space-y-0">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div key={i}>
                                    <div className="flex gap-2.5 py-2">
                                        <Skeleton className="shrink-0 w-6 h-6 rounded-lg bg-dashboard-border" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <Skeleton className="h-2 w-12 bg-dashboard-border" />
                                                <Skeleton className="h-2 w-8 bg-dashboard-border" />
                                            </div>
                                            <Skeleton className="h-3 w-full bg-dashboard-border" />
                                        </div>
                                    </div>
                                    {i < 4 && (
                                        <Separator className="bg-dashboard-border-light" />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="py-8 text-center">
                            <p className="font-sans text-[12px] text-dashboard-text-muted">
                                No recent activity
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-0">
                            {activities.map((activity, index) => {
                                const Icon = ACTIVITY_ICONS[activity.type];
                                const isLast = index === activities.length - 1;

                                return (
                                    <div key={activity.id}>
                                        <div className="flex gap-2.5 py-2">
                                            {/* Avatar with icon overlay */}
                                            <div className="relative shrink-0">
                                                <Avatar className="w-6 h-6 rounded-lg bg-accent-subtle">
                                                    <AvatarFallback className="rounded-lg bg-accent-subtle text-(--accent) text-[8px] font-semibold">
                                                        {getInitials(
                                                            activity.user.name,
                                                        )}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-sm bg-accent-subtle flex items-center justify-center">
                                                    <Icon
                                                        className="w-2 h-2 text-(--accent)"
                                                        strokeWidth={2}
                                                    />
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                {/* Badge + Timestamp */}
                                                <div className="flex items-center justify-between gap-2 mb-0.5">
                                                    <Badge
                                                        variant="outline"
                                                        className="font-sans text-[9px] font-semibold uppercase tracking-wide text-(--accent) bg-transparent border-transparent px-0 py-0 h-auto rounded-none"
                                                    >
                                                        {
                                                            ACTIVITY_TYPE_LABELS[
                                                                activity.type
                                                            ]
                                                        }
                                                    </Badge>
                                                    <span className="font-sans text-[9px] font-normal text-dashboard-text-faint">
                                                        {formatTimestamp(
                                                            activity.timestamp,
                                                        )}
                                                    </span>
                                                </div>

                                                {/* Description */}
                                                <p className="font-sans text-[11px] leading-[1.4] text-dashboard-text-body">
                                                    {activity.description}
                                                </p>
                                            </div>
                                        </div>
                                        {!isLast && (
                                            <Separator className="bg-dashboard-border-light" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                {/* Footer Stats */}
                {(isLoading || stats.length > 0) && (
                    <div className="px-4.5 pt-3 pb-4.5 border-t border-dashboard-border mt-4">
                        <div className="grid grid-cols-2 gap-2">
                            {isLoading
                                ? Array.from({ length: 2 }).map((_, i) => (
                                      <div
                                          key={i}
                                          className="px-3 py-2.5 rounded-lg bg-accent-subtle"
                                      >
                                          <Skeleton className="h-2 w-16 bg-dashboard-border mb-2" />
                                          <Skeleton className="h-6 w-8 bg-dashboard-border mb-1" />
                                          <Skeleton className="h-2 w-10 bg-dashboard-border" />
                                      </div>
                                  ))
                                : stats.map((stat, index) => (
                                      <div
                                          key={index}
                                          className="px-3 py-2.5 rounded-lg bg-accent-subtle"
                                      >
                                          {/* Label */}
                                          <div className="font-sans text-[8px] font-medium uppercase tracking-wider text-dashboard-text-muted mb-1">
                                              {stat.label}
                                          </div>

                                          {/* Value */}
                                          <div className="font-serif text-lg font-semibold tracking-tight text-dashboard-text-primary">
                                              {stat.value}
                                          </div>

                                          {/* Sub-label */}
                                          {stat.subLabel && (
                                              <div className="font-sans text-[9px] text-dashboard-text-muted mt-0.5">
                                                  {stat.subLabel}
                                              </div>
                                          )}

                                          {/* Optional progress bar */}
                                          {stat.progress !== undefined && (
                                              <Progress
                                                  value={stat.progress}
                                                  className="mt-1.5 h-1 bg-dashboard-border"
                                              />
                                          )}
                                      </div>
                                  ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
