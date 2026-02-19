import { UnauthenticatedSkeleton } from '@/components/skeletons/UnauthenticatedSkeleton';
import { Suspense } from 'react';

export default function UnauthenticatedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<UnauthenticatedSkeleton />}>{children}</Suspense>
    );
}
