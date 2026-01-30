'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import { userApi, accessLinkApi } from '@/lib/api';
import { toast } from 'sonner';

export default function SignupCallbackPage() {
    // All hooks must be called unconditionally at the top
    const { isLoaded, isSignedIn, getToken, userId } = useAuth();
    const { user } = useUser();
    const [error, setError] = useState<string | null>(null);
    const [statusMessage, setStatusMessage] = useState<string>(
        'Setting up your account...'
    );
    const hasCalledApi = useRef(false);
    const isRedirecting = useRef(false);

    const redirect = useCallback((path: string) => {
        if (isRedirecting.current) return;
        isRedirecting.current = true;
        window.location.href = path;
    }, []);

    useEffect(() => {
        // Guard conditions - but all hooks are already called above
        if (!isLoaded || !isSignedIn || !userId || !user) {
            return;
        }

        if (hasCalledApi.current) {
            return;
        }

        hasCalledApi.current = true;

        const handleAuthCallback = async () => {
            try {
                const token = await getToken();
                if (!token) {
                    throw new Error('Failed to get authentication token');
                }

                // Check for pending access link invitation
                const pendingAccessLinkId = sessionStorage.getItem(
                    'pendingAccessLinkId'
                );
                const pendingAccessLinkEmail = sessionStorage.getItem(
                    'pendingAccessLinkEmail'
                );

                // If there's a pending invite, validate the email matches
                if (pendingAccessLinkId && pendingAccessLinkEmail) {
                    const userEmail =
                        user.primaryEmailAddress?.emailAddress?.toLowerCase();
                    const inviteEmail = pendingAccessLinkEmail.toLowerCase();

                    if (userEmail !== inviteEmail) {
                        sessionStorage.removeItem('pendingAccessLinkId');
                        sessionStorage.removeItem('pendingAccessLinkEmail');

                        const errorMsg = `You signed up with ${userEmail}, but the invite was sent to ${inviteEmail}. Please sign up with the correct email address.`;
                        setError(errorMsg);
                        toast.error(errorMsg);

                        setTimeout(() => redirect('/sign-in'), 5000);
                        return;
                    }
                }

                setStatusMessage('Checking your account...');
                let userExists = false;
                let hasCompletedOnboarding = false;

                try {
                    const existingUser = await userApi.getMe(token);
                    if (existingUser.data) {
                        userExists = true;
                        hasCompletedOnboarding =
                            existingUser.data.hasCompletedOnboarding;
                    }
                } catch {
                    console.log(
                        'User not found in Core API, will create new user'
                    );
                }

                if (!userExists) {
                    setStatusMessage('Creating your account...');
                    await userApi.createUser(token, userId);
                }

                if (pendingAccessLinkId) {
                    setStatusMessage('Accepting invitation...');
                    try {
                        await accessLinkApi.acceptAccessLink(
                            token,
                            pendingAccessLinkId,
                            {
                                email:
                                    user.primaryEmailAddress?.emailAddress ||
                                    '',
                                firstName: user.firstName || '',
                                lastName: user.lastName || '',
                                clerkId: userId,
                            }
                        );
                        toast.success('Invitation accepted!');
                        sessionStorage.removeItem('pendingAccessLinkId');
                        sessionStorage.removeItem('pendingAccessLinkEmail');
                        redirect('/home');
                        return;
                    } catch (inviteErr) {
                        console.error('Error accepting invite:', inviteErr);
                        toast.error(
                            'Account created, but failed to accept invitation.'
                        );
                    }
                }

                // Verify user object exists in database before redirecting to home
                if (userExists && hasCompletedOnboarding) {
                    setStatusMessage('Verifying your account...');
                    try {
                        const verifiedUser = await userApi.getMe(token);
                        if (!verifiedUser.data) {
                            throw new Error('User verification failed');
                        }
                        redirect('/home');
                    } catch (verifyErr) {
                        console.error('Error verifying user:', verifyErr);
                        setError(
                            'Failed to verify your account. Please try again.'
                        );
                        setTimeout(() => redirect('/sign-in'), 3000);
                    }
                } else {
                    redirect('/onboarding');
                }
            } catch (err) {
                console.error('Error in auth callback:', err);
                const errorMessage =
                    err instanceof Error
                        ? err.message
                        : 'Failed to process authentication';
                setError(errorMessage);
                toast.error(errorMessage);
                setTimeout(() => redirect('/onboarding'), 3000);
            }
        };

        handleAuthCallback();
    }, [isLoaded, isSignedIn, userId, user, getToken, redirect]);

    // Always render the same JSX structure
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
            {error ? (
                <div className="text-center">
                    <div className="text-destructive">
                        <p className="font-semibold">Error creating account</p>
                        <p className="text-sm mt-2">{error}</p>
                    </div>
                    <p className="text-sm text-muted-foreground mt-4">
                        Redirecting...
                    </p>
                </div>
            ) : (
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="font-medium mt-4">{statusMessage}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        Please wait while we set up your profile
                    </p>
                </div>
            )}
        </div>
    );
}
