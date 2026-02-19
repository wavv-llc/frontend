'use client';

import { KnockProvider, KnockFeedProvider } from '@knocklabs/react';
import { useUser } from '@clerk/nextjs';
import { ReactNode } from 'react';
import '@knocklabs/react/dist/index.css';

export const KnockClientProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useUser();

    const apiKey = process.env.NEXT_PUBLIC_KNOCK_PUBLIC_API_KEY;
    const feedId = process.env.NEXT_PUBLIC_KNOCK_FEED_CHANNEL_ID;

    if (!user || !apiKey || !feedId) {
        return <>{children}</>;
    }

    return (
        <KnockProvider apiKey={apiKey} userId={user.id}>
            <KnockFeedProvider feedId={feedId}>{children}</KnockFeedProvider>
        </KnockProvider>
    );
};
