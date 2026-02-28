import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

// Auth endpoints must never be cached
export const dynamic = 'force-dynamic';

export async function GET() {
    const user = await currentUser();

    if (!user) {
        return NextResponse.json(
            { error: 'Not authenticated' },
            { status: 401 },
        );
    }

    // console.log('CLERK USER:', JSON.stringify(user, null, 2));

    // Resolve email server-side so the frontend never needs to know where it lives.
    // Microsoft OAuth: email lives in externalAccounts, primaryEmailAddress is null
    // when email is disabled as an identifier in the Clerk dashboard.
    const allEmails = [
        user.primaryEmailAddress?.emailAddress,
        user.emailAddresses?.[0]?.emailAddress,
        ...(user.emailAddresses?.map((e) => e.emailAddress) || []),
        user.externalAccounts?.find((acc) => acc.provider === 'oauth_microsoft')
            ?.emailAddress,
        ...(user.externalAccounts?.map((e) => e.emailAddress) || []),
        // Fallback: some Microsoft tenants return empty emailAddress but populate username with the UPN
        ...(user.externalAccounts
            ?.map((e) => e.username)
            .filter((u) => u?.includes('@')) || []),
    ].filter(Boolean);

    const email = allEmails.length > 0 ? allEmails[0] : null;

    return NextResponse.json({
        email,
        firstName: user.firstName ?? null,
        lastName: user.lastName ?? null,
    });
}
