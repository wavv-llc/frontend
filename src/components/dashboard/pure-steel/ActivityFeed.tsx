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
}

interface ActivityFeedProps {
    activities: ActivityItem[];
    stats: ActivityStat[];
    className?: string;
}

const ACTIVITY_ICONS: Record<ActivityItem['type'], LucideIcon> = {
    upload: Upload,
    comment: MessageSquare,
    status_change: CheckCircle,
    assignment: UserPlus,
    review: FileText,
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

function getActionLabel(type: ActivityItem['type']): string {
    switch (type) {
        case 'upload':
            return 'Uploaded';
        case 'comment':
            return 'Commented';
        case 'status_change':
            return 'Updated';
        case 'assignment':
            return 'Assigned';
        case 'review':
            return 'Reviewed';
        default:
            return 'Activity';
    }
}

export function ActivityFeed({
    activities,
    stats,
    className,
}: ActivityFeedProps) {
    return (
        <div
            className={cn(
                'w-[306px] flex-shrink-0',
                'bg-[var(--dashboard-surface)] rounded-xl border border-[var(--dashboard-border)]',
                'p-[18px]',
                'transition-shadow duration-200 hover:shadow-[0_2px_16px_rgba(90,127,154,0.05)]',
                className,
            )}
        >
            {/* Title */}
            <h2 className="font-serif text-[14px] font-semibold tracking-tight text-[var(--dashboard-text-primary)] mb-4">
                Recent Activity
            </h2>

            {/* Activity List */}
            <div className="space-y-0 mb-4">
                {activities.length === 0 ? (
                    <div className="py-8 text-center">
                        <p className="font-sans text-[12px] text-[var(--dashboard-text-muted)]">
                            No recent activity
                        </p>
                    </div>
                ) : (
                    activities.map((activity, index) => {
                        const Icon = ACTIVITY_ICONS[activity.type];
                        const isLast = index === activities.length - 1;

                        return (
                            <div
                                key={activity.id}
                                className={cn(
                                    'flex gap-2.5 py-2',
                                    !isLast &&
                                        'border-b border-[var(--dashboard-border-light)]',
                                )}
                            >
                                {/* Icon Badge */}
                                <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-[var(--accent-subtle)] flex items-center justify-center">
                                    <Icon
                                        className="w-3 h-3 text-[var(--accent)]"
                                        strokeWidth={2}
                                    />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    {/* Action Label + Timestamp */}
                                    <div className="flex items-center justify-between gap-2 mb-0.5">
                                        <span className="font-sans text-[9px] font-semibold uppercase tracking-wide text-[var(--accent)]">
                                            {getActionLabel(activity.type)}
                                        </span>
                                        <span className="font-sans text-[9px] font-normal text-[var(--dashboard-text-faint)]">
                                            {formatTimestamp(
                                                activity.timestamp,
                                            )}
                                        </span>
                                    </div>

                                    {/* Description */}
                                    <p className="font-sans text-[11px] leading-[1.4] text-[var(--dashboard-text-body)]">
                                        {activity.description}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Footer Stats */}
            {stats.length > 0 && (
                <div className="pt-3 border-t border-[var(--dashboard-border)]">
                    <div className="grid grid-cols-2 gap-2">
                        {stats.map((stat, index) => (
                            <div
                                key={index}
                                className="px-3 py-2.5 rounded-lg bg-[var(--accent-subtle)]"
                            >
                                {/* Label */}
                                <div className="font-sans text-[8px] font-medium uppercase tracking-wider text-[var(--dashboard-text-muted)] mb-1">
                                    {stat.label}
                                </div>

                                {/* Value */}
                                <div className="font-serif text-lg font-semibold tracking-tight text-[var(--dashboard-text-primary)]">
                                    {stat.value}
                                </div>

                                {/* Sub-label */}
                                {stat.subLabel && (
                                    <div className="font-sans text-[9px] text-[var(--dashboard-text-muted)] mt-0.5">
                                        {stat.subLabel}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
