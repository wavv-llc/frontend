'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Loader2 } from 'lucide-react';
import { userApi, accessLinkApi } from '@/lib/api';
import { toast } from 'sonner';

const ONBOARDING_CACHE_KEY = 'wavv_onboarding_completed';

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
                let userHasOrg = false;

                try {
                    const existingUser = await userApi.getMe(token);
                    if (existingUser.data) {
                        userExists = true;
                        hasCompletedOnboarding =
                            existingUser.data.hasCompletedOnboarding;
                        userHasOrg = !!existingUser.data.organization;
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

                // Handle pending access link invitation
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

                        // Clear pending invitation
                        sessionStorage.removeItem('pendingAccessLinkId');
                        sessionStorage.removeItem('pendingAccessLinkEmail');

                        // Cache onboarding status as complete for invited users
                        sessionStorage.setItem(ONBOARDING_CACHE_KEY, 'true');
                        sessionStorage.setItem('wavv_cached_user_id', userId);

                        // Check if user is missing name - redirect to member setup
                        if (!user.firstName || !user.lastName) {
                            redirect('/member-setup');
                            return;
                        }

                        redirect('/home');
                        return;
                    } catch (inviteErr) {
                        console.error('Error accepting invite:', inviteErr);
                        toast.error(
                            'Account created, but failed to accept invitation.'
                        );
                        // Continue to home anyway since account was created
                        redirect('/home');
                        return;
                    }
                }

                // No pending invite - check existing user status
                if (userExists && hasCompletedOnboarding) {
                    // Cache the completed status
                    sessionStorage.setItem(ONBOARDING_CACHE_KEY, 'true');
                    sessionStorage.setItem('wavv_cached_user_id', userId);

                    setStatusMessage('Verifying your account...');
                    redirect('/home');
                } else if (userExists && userHasOrg && !hasCompletedOnboarding) {
                    // User was invited and has org but hasn't completed onboarding
                    // This means they're an invited member - auto-complete onboarding
                    try {
                        await userApi.completeOnboarding(token);
                        sessionStorage.setItem(ONBOARDING_CACHE_KEY, 'true');
                        sessionStorage.setItem('wavv_cached_user_id', userId);

                        // Check if user is missing name
                        if (!user.firstName || !user.lastName) {
                            redirect('/member-setup');
                            return;
                        }

                        redirect('/home');
                    } catch (e) {
                        console.warn('Could not auto-complete onboarding:', e);
                        // Still redirect to home, the layout will handle it
                        redirect('/home');
                    }
                } else {
                    // New user without org - needs full onboarding
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
                <div className="w-full max-w-md px-6">
                    <div className="relative bg-card border border-border rounded-xl p-8 shadow-sm text-center">
                        <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-6" />
                        <h2 className="text-xl font-semibold mb-2">{statusMessage}</h2>
                        <p className="text-muted-foreground text-sm">
                            Please wait while we set up your profile
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
