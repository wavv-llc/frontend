'use client';

import { useUser } from '@/contexts/UserContext';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

interface PermissionGuardProps {
    children: ReactNode;
    /** When true, only ADMIN org role is allowed. Defaults to true. */
    requireAdmin?: boolean;
    /** When true, ADMIN or MEMBER org role is allowed (blocks GUEST). Defaults to false. */
    requireMember?: boolean;
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
    requireMember = false,
    fallback = null,
    redirectTo,
}: PermissionGuardProps) {
    const { user, isLoading } = useUser();
    const router = useRouter();

    let hasAccess = true;
    if (requireAdmin) {
        hasAccess = user?.organizationRole === 'ADMIN';
    } else if (requireMember) {
        hasAccess =
            user?.organizationRole === 'ADMIN' ||
            user?.organizationRole === 'MEMBER';
    }

    useEffect(() => {
        if (!isLoading && !hasAccess && redirectTo) {
            router.push(redirectTo);
        }
    }, [isLoading, hasAccess, redirectTo, router]);

    if (isLoading) {
        return <>{fallback}</>;
    }

    if (!hasAccess) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
