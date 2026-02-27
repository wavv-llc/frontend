'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
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

    const fetchUser = useCallback(async () => {
        const isExcluded = SKIP_FETCH_PATHS.some((p) =>
            pathname?.startsWith(p),
        );

        if (!isLoaded || !isSignedIn || isExcluded) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const token = await getToken();
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
            toast.error('Failed to load user information');
        } finally {
            setIsLoading(false);
        }
    }, [isLoaded, isSignedIn, getToken, pathname]);

    // Initial fetch
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    return (
        <UserContext.Provider
            value={{
                user,
                isLoading,
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
