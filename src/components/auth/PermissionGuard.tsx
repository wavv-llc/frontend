'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

interface PermissionGuardProps {
    children: ReactNode;
    /** When true, only ADMIN org role is allowed. Defaults to true. */
    requireAdmin?: boolean;
    fallback?: ReactNode;
    redirectTo?: string;
    // Legacy props kept for backwards-compatibility at call sites
    scope?: string;
    permission?: string;
    resourceId?: string;
}

export function PermissionGuard({
    children,
    requireAdmin = true,
    fallback = null,
    redirectTo,
}: PermissionGuardProps) {
    const { user, isLoading } = useUser();
    const router = useRouter();

    const hasAccess = !requireAdmin || user?.organizationRole === 'ADMIN';

    useEffect(() => {
        if (!isLoading && !hasAccess && redirectTo) {
            router.push(redirectTo);
        }
    }, [isLoading, hasAccess, redirectTo, router]);

    if (isLoading) {
        return null;
    }

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
