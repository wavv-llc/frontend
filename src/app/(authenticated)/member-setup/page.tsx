'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Field } from '@/components/ui/field';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { User } from 'lucide-react';
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

        if (user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');

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
            await user?.update({
                firstName: firstName.trim(),
                lastName: lastName.trim(),
            });

            const token = await getToken();
            if (token) {
                await userApi.updateProfile(token, {
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                });
            }

            toast.success('Profile updated successfully!');

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
        return null;
    }

    const initials =
        `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || undefined;

    return (
        <div className="min-h-screen bg-dashboard-bg flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-6">
                {/* Brand */}
                <div className="text-center">
                    <div className="w-9 h-9 rounded bg-steel-800 flex items-center justify-center mx-auto mb-3">
                        <span className="text-white font-serif italic text-base">
                            w
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground tracking-widest uppercase">
                        wavv
                    </p>
                </div>

                <Card className="border-dashboard-border shadow-[0_2px_16px_rgba(90,127,154,0.08)]">
                    <CardHeader className="text-center pb-4">
                        <div className="flex justify-center mb-4">
                            <Avatar className="h-16 w-16">
                                <AvatarFallback className="bg-linear-to-br from-[#3d4a52] to-[#2e3b44] text-white text-lg font-semibold">
                                    {initials || <User className="h-7 w-7" />}
                                </AvatarFallback>
                            </Avatar>
                        </div>
                        <CardTitle className="font-serif text-xl text-dashboard-text-primary">
                            Complete Your Profile
                        </CardTitle>
                        <CardDescription>
                            Please provide your name to continue to your
                            dashboard
                        </CardDescription>
                    </CardHeader>

                    <Separator />

                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <Field
                                    label="First Name"
                                    htmlFor="firstName"
                                    required
                                >
                                    <Input
                                        id="firstName"
                                        type="text"
                                        placeholder="First name"
                                        value={firstName}
                                        onChange={(e) =>
                                            setFirstName(e.target.value)
                                        }
                                        required
                                        autoFocus
                                        className="h-10"
                                    />
                                </Field>
                                <Field
                                    label="Last Name"
                                    htmlFor="lastName"
                                    required
                                >
                                    <Input
                                        id="lastName"
                                        type="text"
                                        placeholder="Last name"
                                        value={lastName}
                                        onChange={(e) =>
                                            setLastName(e.target.value)
                                        }
                                        required
                                        className="h-10"
                                    />
                                </Field>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-11"
                                disabled={
                                    isSubmitting ||
                                    !firstName.trim() ||
                                    !lastName.trim()
                                }
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Spinner
                                            size="sm"
                                            className="text-current"
                                        />
                                        Saving...
                                    </span>
                                ) : (
                                    'Continue to Dashboard'
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
