'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
    userName: string;
    className?: string;
}

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
}

function getFormattedDate(): string {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export function DashboardHeader({ userName, className }: DashboardHeaderProps) {
    const greeting = getGreeting();
    const formattedDate = getFormattedDate();

    return (
        <header
            className={cn(
                'sticky top-0 z-10 flex items-center',
                'px-7 py-3.5',
                'bg-[rgba(245,245,243,0.85)] backdrop-blur-xl',
                'border-b border-[var(--dashboard-border)]',
                className,
            )}
        >
            {/* Greeting */}
            <div className="flex flex-col gap-1">
                <h1 className="font-serif text-[20px] font-medium leading-tight tracking-tight text-[var(--dashboard-text-primary)]">
                    {greeting}, <span className="italic">{userName}</span>
                </h1>
                <p className="font-sans text-[10px] font-normal text-[var(--dashboard-text-muted)]">
                    {formattedDate}
                </p>
            </div>
        </header>
    );
}
