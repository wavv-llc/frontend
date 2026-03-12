'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { UserProvider, useUser } from '@/contexts/UserContext';

const EXCLUDED_PATHS = [
    '/onboarding',
    '/auth/callback',
    '/member-setup',
    '/invite/callback',
];

function AuthenticatedGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading, error } = useUser();
    const { isLoaded, isSignedIn } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);
    const hasCheckedRef = useRef(false);

    useEffect(() => {
        if (!isLoaded) return;
        if (!isSignedIn) return;

        const isExcluded = EXCLUDED_PATHS.some((path) =>
            pathname?.startsWith(path),
        );

        if (isExcluded) {
            setIsAuthorized(true);
            hasCheckedRef.current = true;
            return;
        }

        if (isLoading) return;

        // User not found or API error → redirect appropriately
        if (error || !user) {
            // If DB record is missing (pre-onboarding), skip the extra
            // auth/callback hop and go directly to onboarding
            const isUserNotFound = (error as any)?.code === 'USER_NOT_FOUND';
            router.replace(isUserNotFound ? '/onboarding' : '/auth/callback');
            return;
        }

        // User exists but has no organization → needs onboarding
        if (!user.organization) {
            router.replace('/onboarding');
            return;
        }

        setIsAuthorized(true);
        hasCheckedRef.current = true;
    }, [isLoaded, isSignedIn, isLoading, user, error, pathname, router]);

    if (!isLoaded || !isSignedIn) {
        return null;
    }

    if (!isAuthorized) {
        return null;
    }

    return <>{children}</>;
}

export default function AuthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <UserProvider>
            <AuthenticatedGuard>{children}</AuthenticatedGuard>
        </UserProvider>
    );
}
