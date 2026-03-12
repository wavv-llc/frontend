'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
    useRef,
} from 'react';
import { useAuth } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { userApi, MeResponse } from '@/lib/api';
import { toast } from 'sonner';

// Paths where the user may not exist in the DB yet — skip fetching
const SKIP_FETCH_PATHS = [
    '/onboarding',
    '/auth/callback',
    '/member-setup',
    '/invite/callback',
];

interface UserContextType {
    user: MeResponse | null;
    isLoading: boolean;
    error: Error | null;
    refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const pathname = usePathname();
    const [user, setUser] = useState<MeResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    // Use a ref so getToken is never a useCallback dependency — Clerk's getToken
    // is not guaranteed to be referentially stable, and including it would cause
    // fetchUser to be recreated on every render, triggering an infinite loop.
    const getTokenRef = useRef(getToken);
    getTokenRef.current = getToken;

    // Use a ref so pathname is never a useCallback dependency — every client-side
    // navigation changes pathname, which would recreate fetchUser, re-run the
    // effect, set isLoading=true, and fire a new GET /users/me on every page change.
    const pathnameRef = useRef(pathname);
    pathnameRef.current = pathname;

    const fetchUser = useCallback(async () => {
        const isExcluded = SKIP_FETCH_PATHS.some((p) =>
            pathnameRef.current?.startsWith(p),
        );

        if (!isLoaded || !isSignedIn || isExcluded) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const token = await getTokenRef.current();
            if (!token) {
                setIsLoading(false);
                return;
            }

            const response = await userApi.getMe(token);
            if (response.data) {
                setUser(response.data);
                setError(null);
            }
        } catch (err) {
            console.error('Error fetching user:', err);
            const error =
                err instanceof Error ? err : new Error('Failed to fetch user');
            setError(error);
            // USER_NOT_FOUND is expected for users who haven't completed
            // onboarding yet — the guard will redirect them; don't show a toast
            if ((error as any).code !== 'USER_NOT_FOUND') {
                toast.error('Failed to load user information');
            }
        } finally {
            setIsLoading(false);
        }
    }, [isLoaded, isSignedIn]); // getToken + pathname accessed via refs — see getTokenRef/pathnameRef above

    // Initial fetch
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    // Synchronously guard against the transient (user=null, isLoading=false) state
    // that occurs when navigating FROM an excluded path (e.g. /auth/callback) TO a
    // normal route. The child AuthenticatedGuard effect fires before the parent
    // UserProvider effect, so it would see stale null/false state and redirect back
    // to /auth/callback before fetchUser even starts. Treat it as "loading" until we
    // actually have a result.
    const isExcludedPath = SKIP_FETCH_PATHS.some((p) =>
        pathname?.startsWith(p),
    );
    const effectiveIsLoading =
        !isExcludedPath && isLoaded && isSignedIn && !user && !error
            ? true
            : isLoading;

    return (
        <UserContext.Provider
            value={{
                user,
                isLoading: effectiveIsLoading,
                error,
                refreshUser: fetchUser,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
}
