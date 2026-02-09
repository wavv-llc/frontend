"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { userApi, MeResponse, Permission } from "@/lib/api";

interface UserContextType {
    user: MeResponse | null;
    isLoading: boolean;
    error: Error | null;
    refreshUser: () => Promise<void>;
    checkPermission: (
        scope: "organization" | "project",
        resourceId: string,
        permission: Permission
    ) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
    const { isLoaded, isSignedIn, getToken } = useAuth();
    const [user, setUser] = useState<MeResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchUser = useCallback(async () => {
        if (!isLoaded || !isSignedIn) {
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
            console.error("Error fetching user:", err);
            setError(err instanceof Error ? err : new Error("Failed to fetch user"));
        } finally {
            setIsLoading(false);
        }
    }, [isLoaded, isSignedIn, getToken]);

    // Initial fetch
    useEffect(() => {
        fetchUser();
    }, [fetchUser]);

    const checkPermission = useCallback(
        (
            scope: "organization" | "project",
            resourceId: string,
            permission: Permission
        ): boolean => {
            if (!user) return false;

            if (scope === "organization") {
                const orgPermissions = user.permissions.organizations[resourceId];
                return orgPermissions?.includes(permission) ?? false;
            }

            if (scope === "project") {
                const projectPermissions = user.permissions.projects[resourceId];
                return projectPermissions?.includes(permission) ?? false;
            }

            return false;
        },
        [user]
    );

    return (
        <UserContext.Provider
            value={{
                user,
                isLoading,
                error,
                refreshUser: fetchUser,
                checkPermission,
            }}
        >
            {children}
        </UserContext.Provider>
    );
}

export function useUser() {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
}
