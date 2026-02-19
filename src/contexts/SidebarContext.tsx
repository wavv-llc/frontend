'use client';

import React, { createContext, useContext, useState } from 'react';

interface SidebarContextType {
    isOpen: boolean;
    toggle: () => void;
    refreshTrigger: number;
    triggerRefresh: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const toggle = () => setIsOpen(!isOpen);
    const triggerRefresh = () => setRefreshTrigger((prev) => prev + 1);

    return (
        <SidebarContext.Provider
            value={{ isOpen, toggle, refreshTrigger, triggerRefresh }}
        >
            {children}
        </SidebarContext.Provider>
    );
}

export function useSidebar() {
    const context = useContext(SidebarContext);
    if (context === undefined) {
        throw new Error('useSidebar must be used within a SidebarProvider');
    }
    return context;
}
