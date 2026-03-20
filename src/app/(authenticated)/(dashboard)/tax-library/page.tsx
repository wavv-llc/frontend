'use client';

import { useAuth } from '@clerk/nextjs';
import { useUser } from '@/contexts/UserContext';
import { TaxLibraryTab } from '@/components/tax-library/TaxLibraryTab';
import { Loader2 } from 'lucide-react';
import { usePageChatContext } from '@/hooks/usePageChatContext';

export default function TaxLibraryPage() {
    const { isLoaded, getToken } = useAuth();
    const { user, isLoading: isUserLoading } = useUser();

    usePageChatContext({ type: 'tax-library', label: 'Tax Library' });

    const organizationId = user?.organization?.id;

    if (!isLoaded || isUserLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto">
            <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="mb-6">
                    <h1 className="text-lg font-semibold text-foreground">
                        Tax Library
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Upload and manage your organization&apos;s tax reference
                        documents
                    </p>
                </div>
                <TaxLibraryTab
                    organizationId={organizationId}
                    getToken={getToken}
                />
            </div>
        </div>
    );
}
