'use client';

import {
    NotificationFeed,
    useKnockFeed,
    FilterStatus,
    type NotificationFeedHeaderProps,
} from '@knocklabs/react';
import { Bell, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

const FILTER_LABELS: Record<string, string> = {
    [FilterStatus.All]: 'All',
    [FilterStatus.Unread]: 'Unread',
    [FilterStatus.Read]: 'Read',
};

function CustomFeedHeader({
    filterStatus,
    setFilterStatus,
    onMarkAllAsReadClick,
}: NotificationFeedHeaderProps) {
    const { feedClient } = useKnockFeed();

    const handleMarkAllAsRead = async (e: React.MouseEvent) => {
        await feedClient.markAllAsRead();
        onMarkAllAsReadClick?.(e, []);
    };

    return (
        <div className="flex items-center justify-between px-4 py-3 border-b border-dashboard-border">
            <h3 className="text-sm font-semibold text-dashboard-text-primary">
                Notifications
            </h3>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs text-dashboard-text-primary hover:text-dashboard-text-body underline underline-offset-2 cursor-pointer"
                >
                    Mark all as read
                </button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs text-dashboard-text-primary hover:bg-accent-hover gap-1"
                        >
                            {FILTER_LABELS[filterStatus] ?? 'All'}
                            <ChevronDown className="h-3 w-3" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="min-w-28">
                        <DropdownMenuRadioGroup
                            value={filterStatus}
                            onValueChange={(val) =>
                                setFilterStatus(val as FilterStatus)
                            }
                        >
                            <DropdownMenuRadioItem value={FilterStatus.All}>
                                All
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value={FilterStatus.Unread}>
                                Unread
                            </DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value={FilterStatus.Read}>
                                Read
                            </DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

export const NotificationBell = () => {
    const { useFeedStore } = useKnockFeed();
    const { metadata } = useFeedStore();

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-dashboard-text-primary hover:bg-accent-hover relative"
                    title="Notifications"
                >
                    <Bell className="h-5 w-5" />
                    {metadata.unread_count > 0 && (
                        <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="end"
                sideOffset={8}
                className="w-95 max-h-150 p-0 overflow-hidden bg-dashboard-surface border-dashboard-border shadow-lg"
            >
                <NotificationFeed
                    renderHeader={(props) => <CustomFeedHeader {...props} />}
                />
            </PopoverContent>
        </Popover>
    );
};
