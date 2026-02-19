'use client';

import { useUser } from '@/contexts/UserContext';
import { Permission } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';

interface PermissionGuardProps {
    children: ReactNode;
    resourceId?: string;
    scope: 'organization' | 'project';
    permission: Permission;
    fallback?: ReactNode;
    redirectTo?: string;
}

export function PermissionGuard({
    children,
    resourceId,
    scope,
    permission,
    fallback = null,
    redirectTo,
}: PermissionGuardProps) {
    const { user, checkPermission, isLoading } = useUser();
    const router = useRouter();

    const targetId =
        resourceId ||
        (scope === 'organization' ? user?.organization?.id : undefined);

    // We can't check permissions until user is loaded
    // but we also don't want to show fallback immediately if just loading?
    // If UserContext handles loading state globally, maybe we do.

    // If resourceId is missing (and couldn't be inferred), we can't check.
    // Assuming access denied or just waiting?
    // For now, if no target ID found, we assume denied (safe default).

    const hasPermission = targetId
        ? checkPermission(scope, targetId, permission)
        : false;

    useEffect(() => {
        if (!isLoading && !hasPermission && redirectTo) {
            router.push(redirectTo);
        }
    }, [isLoading, hasPermission, redirectTo, router]);

    if (isLoading) {
        // You might want to pass a specific loading component or just return null/children?
        // Usually returning null avoids flashing the protected content.
        return null;
    }

    if (!hasPermission) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}
