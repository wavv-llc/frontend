'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, User } from 'lucide-react';
import { userApi } from '@/lib/api';
import { toast } from 'sonner';

export default function MemberSetupPage() {
    const { isLoaded, isSignedIn, getToken, userId } = useAuth();
    const { user, isLoaded: isUserLoaded } = useUser();
    const router = useRouter();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded || !isUserLoaded) return;

        if (!isSignedIn) {
            router.replace('/sign-in');
            return;
        }

        // Pre-fill with existing values from Clerk
        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');

            // If user already has both names, redirect to home
            if (user.firstName && user.lastName) {
                router.replace('/home');
                return;
            }
        }

        setIsLoading(false);
    }, [isLoaded, isUserLoaded, isSignedIn, user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!firstName.trim() || !lastName.trim()) {
            toast.error('Please enter both first and last name');
            return;
        }

        setIsSubmitting(true);

        try {
            // Update Clerk user profile
            await user?.update({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            });

            // Update our backend user record
            const token = await getToken();
            if (token) {
                await userApi.updateProfile(token, {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                });
            }

            toast.success('Profile updated successfully!');

            // Cache onboarding as complete
            sessionStorage.setItem('wavv_onboarding_completed', 'true');
            sessionStorage.setItem('wavv_cached_user_id', userId || '');

            router.push('/home');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Failed to update profile. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !isLoaded || !isUserLoaded) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <User className="h-8 w-8 text-primary" />
                        </div>
                        <h1 className="text-2xl font-semibold tracking-tight">
                            Complete Your Profile
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Please provide your name to continue
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                                id="firstName"
                                type="text"
                                placeholder="Enter your first name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                required
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                                id="lastName"
                                type="text"
                                placeholder="Enter your last name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting || !firstName.trim() || !lastName.trim()}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Continue to Dashboard'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
