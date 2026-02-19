'use client';

import { useState, useEffect } from 'react';
import { useAuth, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Loader2,
    CheckCircle2,
    Building2,
    Share2,
    UserPlus,
    ChevronLeft,
    ChevronRight,
    X,
} from 'lucide-react';
import { sharepointApi, userApi, organizationApi } from '@/lib/api';
import { OnboardingSkeleton } from '@/components/skeletons/OnboardingSkeleton';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface SharePointSite {
    id: string;
    name: string;
    displayName: string;
    webUrl: string;
    description?: string;
}

const STEPS = [
    { id: 0, title: 'Create Organization', icon: Building2 },
    { id: 1, title: 'Connect SharePoint', icon: Share2 },
    { id: 2, title: 'Invite Members', icon: UserPlus },
];

export default function OnboardingPage() {
    const { isLoaded, isSignedIn, getToken, userId } = useAuth();
    const { signOut } = useClerk();
    const router = useRouter();

    // Multi-step state
    const [currentStep, setCurrentStep] = useState(0);

    // Step 1: Organization data
    const [orgName, setOrgName] = useState('');
    const [isOrgCreated, setIsOrgCreated] = useState(false);

    // Step 2: SharePoint sites
    const [sites, setSites] = useState<SharePointSite[]>([]);
    const [selectedSiteIds, setSelectedSiteIds] = useState<Set<string>>(
        new Set(),
    );
    const [isLoadingSites, setIsLoadingSites] = useState(false);

    // Step 3: Member invitations
    const [memberEmails, setMemberEmails] = useState<string[]>(['']);

    // General loading states
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Exit dialog state
    const [showExitDialog, setShowExitDialog] = useState(false);
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;

        if (!isSignedIn) {
            router.push('/sign-in');
            return;
        }

        // Check if user has already completed onboarding
        const checkOnboardingStatus = async () => {
            try {
                const token = await getToken();
                if (!token) return;

                const response = await userApi.getMe(token);
                if (response.data?.hasCompletedOnboarding) {
                    router.push('/');
                    return;
                }

                setIsLoading(false);
            } catch (err) {
                console.error('Error checking onboarding status:', err);
                // User doesn't exist in Core API, try to create them
                if (userId) {
                    try {
                        const token = await getToken();
                        if (token) {
                            await userApi.createUser(token, userId);
                            console.log('User created in Core API');
                        }
                    } catch (createErr) {
                        console.error(
                            'Error creating user in Core API:',
                            createErr,
                        );
                    }
                }
                setIsLoading(false);
            }
        };

        checkOnboardingStatus();
    }, [isLoaded, isSignedIn, router, getToken, userId]);

    const loadSites = async () => {
        try {
            setIsLoadingSites(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const response = await sharepointApi.getSites(token);
            if (response.data?.sites) {
                setSites(response.data.sites);
            }
        } catch (err) {
            console.error('Error loading SharePoint sites:', err);
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to load SharePoint sites',
            );
        } finally {
            setIsLoadingSites(false);
        }
    };

    // Load sites when moving to step 2
    useEffect(() => {
        if (currentStep === 1 && sites.length === 0) {
            loadSites();
        }
    }, [currentStep]);

    const handleCreateOrganization = async () => {
        if (!orgName.trim()) {
            toast.error('Please enter an organization name');
            return;
        }

        try {
            setIsSaving(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await organizationApi.createOrganization(token, orgName);
            setIsOrgCreated(true);
            toast.success('Organization created successfully');
            setCurrentStep(1);
        } catch (err) {
            console.error('Error creating organization:', err);
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to create organization',
            );
        } finally {
            setIsSaving(false);
        }
    };

    const toggleSite = (siteId: string) => {
        const newSelected = new Set(selectedSiteIds);
        if (newSelected.has(siteId)) {
            newSelected.delete(siteId);
        } else {
            newSelected.add(siteId);
        }
        setSelectedSiteIds(newSelected);
    };

    const handleSharePointNext = () => {
        if (selectedSiteIds.size === 0) {
            toast.error('Please select at least one SharePoint site');
            return;
        }
        setCurrentStep(2);
    };

    const handleAddEmail = () => {
        setMemberEmails([...memberEmails, '']);
    };

    const handleRemoveEmail = (index: number) => {
        if (memberEmails.length > 1) {
            setMemberEmails(memberEmails.filter((_, i) => i !== index));
        }
    };

    const handleEmailChange = (index: number, value: string) => {
        const newEmails = [...memberEmails];
        newEmails[index] = value;
        setMemberEmails(newEmails);
    };

    const handleFinish = async () => {
        // Prevent double-clicks
        if (isSaving) {
            return;
        }

        try {
            setIsSaving(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                setIsSaving(false);
                return;
            }

            // Save selected SharePoint sites
            const selectedSites = sites
                .filter((site) => selectedSiteIds.has(site.id))
                .map((site) => ({
                    id: site.id,
                    name: site.displayName || site.name,
                    webUrl: site.webUrl,
                }));

            await sharepointApi.saveSelectedSites(token, selectedSites);

            // TODO: Implement member invitation API when available
            // For now, we'll just log the emails
            const validEmails = memberEmails.filter(
                (email) => email.trim() !== '',
            );
            if (validEmails.length > 0) {
                console.log('Members to invite:', validEmails);
                // await workspaceApi.inviteMembers(token, workspaceId, validEmails)
            }

            // Mark onboarding as complete
            await userApi.completeOnboarding(token);

            toast.success('Onboarding completed successfully!');

            // Redirect to dashboard - don't reset isSaving since we're leaving the page
            router.push('/');
        } catch (err) {
            console.error('Error completing onboarding:', err);
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to complete onboarding',
            );
            setIsSaving(false);
        }
    };

    const handleExitOnboarding = async () => {
        try {
            setIsExiting(true);
            const token = await getToken();

            if (!token) {
                toast.error('Authentication required');
                setIsExiting(false);
                return;
            }

            // Call API to clean up data
            await userApi.abandonOnboarding(token);

            // Clear cached onboarding state
            sessionStorage.removeItem('wavv_onboarding_completed');
            sessionStorage.removeItem('wavv_cached_user_id');

            toast.success('Setup cancelled');

            // Sign out from Clerk
            await signOut();

            // Redirect to homepage
            router.push('/');
        } catch (err) {
            console.error('Error abandoning onboarding:', err);
            toast.error(
                err instanceof Error ? err.message : 'Failed to exit setup',
            );
            setIsExiting(false);
            setShowExitDialog(false);
        }
    };

    const canProceedFromStep = (step: number): boolean => {
        switch (step) {
            case 0:
                return isOrgCreated;
            case 1:
                return selectedSiteIds.size > 0;
            case 2:
                return true; // Optional step
            default:
                return false;
        }
    };

    if (!isLoaded || isLoading) {
        return <OnboardingSkeleton />;
    }

    if (!isSignedIn) {
        return null;
    }

    const renderStepContent = () => {
        switch (currentStep) {
            case 0:
                return (
                    <>
                        <CardHeader>
                            <CardTitle>Create Your Organization</CardTitle>
                            <CardDescription>
                                Set up your organization to get started with
                                Wavv.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="org-name">
                                    Organization Name *
                                </Label>
                                <Input
                                    id="org-name"
                                    placeholder="Enter organization name"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    disabled={isOrgCreated}
                                />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={handleCreateOrganization}
                                    disabled={
                                        isSaving ||
                                        !orgName.trim() ||
                                        isOrgCreated
                                    }
                                    size="lg"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : isOrgCreated ? (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Created
                                        </>
                                    ) : (
                                        <>
                                            Continue
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </>
                );

            case 1:
                return (
                    <>
                        <CardHeader>
                            <CardTitle>Connect SharePoint Sites</CardTitle>
                            <CardDescription>
                                Choose the SharePoint sites you want to audit
                                with AI.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoadingSites ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                                </div>
                            ) : sites.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>
                                        No SharePoint sites found. Make sure you
                                        have access to SharePoint sites.
                                    </p>
                                    <Button
                                        variant="outline"
                                        onClick={loadSites}
                                        className="mt-4"
                                    >
                                        Retry
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                                        {sites.map((site) => {
                                            const isSelected =
                                                selectedSiteIds.has(site.id);
                                            return (
                                                <div
                                                    key={site.id}
                                                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                                                        isSelected
                                                            ? 'border-primary bg-primary/5'
                                                            : 'border-input hover:bg-muted'
                                                    }`}
                                                    onClick={() =>
                                                        toggleSite(site.id)
                                                    }
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1">
                                                            {isSelected ? (
                                                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                                            ) : (
                                                                <div className="h-5 w-5 rounded-full border-2 border-muted-foreground" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h3 className="font-medium truncate">
                                                                {site.displayName ||
                                                                    site.name}
                                                            </h3>
                                                            <p className="text-sm text-muted-foreground truncate">
                                                                {site.webUrl}
                                                            </p>
                                                            {site.description && (
                                                                <p className="text-sm text-muted-foreground mt-1">
                                                                    {
                                                                        site.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() =>
                                                    setCurrentStep(0)
                                                }
                                            >
                                                <ChevronLeft className="mr-2 h-4 w-4" />
                                                Back
                                            </Button>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedSiteIds.size} site
                                                {selectedSiteIds.size !== 1
                                                    ? 's'
                                                    : ''}{' '}
                                                selected
                                            </p>
                                        </div>
                                        <Button
                                            onClick={handleSharePointNext}
                                            disabled={
                                                selectedSiteIds.size === 0
                                            }
                                            size="lg"
                                        >
                                            Continue
                                            <ChevronRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </>
                );

            case 2:
                return (
                    <>
                        <CardHeader>
                            <CardTitle>Invite Team Members</CardTitle>
                            <CardDescription>
                                Invite colleagues to join your organization
                                (optional).
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                {memberEmails.map((email, index) => (
                                    <div key={index} className="flex gap-2">
                                        <Input
                                            type="email"
                                            placeholder="colleague@example.com"
                                            value={email}
                                            onChange={(e) =>
                                                handleEmailChange(
                                                    index,
                                                    e.target.value,
                                                )
                                            }
                                        />
                                        {memberEmails.length > 1 && (
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() =>
                                                    handleRemoveEmail(index)
                                                }
                                            >
                                                ×
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            <Button
                                variant="outline"
                                onClick={handleAddEmail}
                                className="w-full"
                            >
                                Add Another Email
                            </Button>
                            <div className="flex items-center justify-between pt-4 border-t">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentStep(1)}
                                >
                                    <ChevronLeft className="mr-2 h-4 w-4" />
                                    Back
                                </Button>
                                <Button
                                    onClick={handleFinish}
                                    disabled={isSaving}
                                    size="lg"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Finishing...
                                        </>
                                    ) : (
                                        'Complete Setup'
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </>
                );

            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-12">
                <div className="max-w-3xl mx-auto space-y-8">
                    <div className="text-center space-y-2">
                        <h1 className="text-4xl font-bold">Welcome to Wavv</h1>
                        <p className="text-xl text-muted-foreground">
                            Let's get you set up in just a few steps
                        </p>
                    </div>

                    {/* Step Indicator */}
                    <div className="flex items-center justify-center gap-2">
                        {STEPS.map((step, index) => {
                            const StepIcon = step.icon;
                            const isActive = currentStep === index;
                            const isCompleted =
                                canProceedFromStep(index) &&
                                currentStep > index;

                            return (
                                <div
                                    key={step.id}
                                    className="flex items-center"
                                >
                                    <div className="flex flex-col items-center gap-2">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                                                isActive
                                                    ? 'bg-primary text-primary-foreground'
                                                    : isCompleted
                                                      ? 'bg-primary/20 text-primary'
                                                      : 'bg-muted text-muted-foreground'
                                            }`}
                                        >
                                            {isCompleted ? (
                                                <CheckCircle2 className="h-6 w-6" />
                                            ) : (
                                                <StepIcon className="h-6 w-6" />
                                            )}
                                        </div>
                                        <span
                                            className={`text-xs font-medium text-center ${
                                                isActive
                                                    ? 'text-foreground'
                                                    : 'text-muted-foreground'
                                            }`}
                                        >
                                            {step.title}
                                        </span>
                                    </div>
                                    {index < STEPS.length - 1 && (
                                        <div
                                            className={`w-16 h-0.5 mb-6 mx-2 transition-colors ${
                                                isCompleted
                                                    ? 'bg-primary'
                                                    : 'bg-muted'
                                            }`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Step Content Card */}
                    <Card className="overflow-hidden relative">
                        {/* Exit Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowExitDialog(true)}
                            disabled={isExiting || isSaving}
                            className="absolute top-4 right-4 z-10"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Exit Setup
                        </Button>

                        <div className="transition-all duration-300">
                            {renderStepContent()}
                        </div>
                    </Card>

                    {/* Exit Confirmation Dialog */}
                    <Dialog
                        open={showExitDialog}
                        onOpenChange={setShowExitDialog}
                    >
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Exit Setup?</DialogTitle>
                                <DialogDescription>
                                    Are you sure you want to exit the setup
                                    process? Any progress you've made will be
                                    lost.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowExitDialog(false)}
                                    disabled={isExiting}
                                >
                                    Continue Setup
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleExitOnboarding}
                                    disabled={isExiting}
                                >
                                    {isExiting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Exiting...
                                        </>
                                    ) : (
                                        'Exit'
                                    )}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
        </div>
    );
}
