'use client'

import { useRef, useState } from "react";
import { NotificationFeedPopover, useKnockFeed } from "@knocklabs/react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NotificationBell = () => {
    const [isVisible, setIsVisible] = useState(false);
    const notifButtonRef = useRef<HTMLButtonElement>(null);
    const { useFeedStore } = useKnockFeed();
    const { metadata } = useFeedStore();

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                ref={notifButtonRef}
                onClick={() => setIsVisible(!isVisible)}
                className="h-9 w-9 flex-shrink-0 text-sidebar-foreground hover:bg-sidebar-accent relative"
                title="Notifications"
            >
                <Bell className="h-5 w-5" />
                {metadata.unread_count > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-background" />
                )}
            </Button>
            <NotificationFeedPopover
                buttonRef={notifButtonRef}
                isVisible={isVisible}
                onClose={() => setIsVisible(false)}
            />
        </>
    );
};
