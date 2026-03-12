'use client';

import React, {
    createContext,
    useContext,
    useState,
    useCallback,
    useMemo,
} from 'react';

interface SidebarRefreshContextType {
    refreshTrigger: number;
    triggerRefresh: () => void;
}

const SidebarRefreshContext = createContext<
    SidebarRefreshContextType | undefined
>(undefined);

export function SidebarRefreshProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const triggerRefresh = useCallback(
        () => setRefreshTrigger((prev) => prev + 1),
        [],
    );

    const contextValue = useMemo(
        () => ({ refreshTrigger, triggerRefresh }),
        [refreshTrigger, triggerRefresh],
    );

    return (
        <SidebarRefreshContext.Provider value={contextValue}>
            {children}
        </SidebarRefreshContext.Provider>
    );
}

export function useSidebarRefresh() {
    const context = useContext(SidebarRefreshContext);
    if (context === undefined) {
        throw new Error(
            'useSidebarRefresh must be used within a SidebarRefreshProvider',
        );
    }
    return context;
}
