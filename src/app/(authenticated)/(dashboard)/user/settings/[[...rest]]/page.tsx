'use client';

import { UserProfile } from '@clerk/nextjs';

export default function UserSettingsPage() {
    return (
        <div className="h-full w-full bg-[var(--dashboard-bg)] flex flex-col">
            {/* Header - Fixed */}
            <header className="flex-shrink-0 flex items-center px-7 py-3.5 bg-[rgba(245,245,243,0.85)] backdrop-blur-xl border-b border-[var(--dashboard-border)] animate-fade-up">
                <div className="flex flex-col gap-1">
                    <h1 className="font-serif text-[20px] font-medium leading-tight tracking-tight text-[var(--dashboard-text-primary)]">
                        <span className="italic">Profile</span> Settings
                    </h1>
                    <p className="font-sans text-[10px] font-normal text-[var(--dashboard-text-muted)]">
                        Manage your personal account settings
                    </p>
                </div>
            </header>

            {/* Main Content Area - Scrollable */}
            <main className="flex-1 overflow-y-auto min-h-0 px-8 py-6">
                <div className="max-w-4xl mx-auto animate-fade-up animate-delay-100">
                    {/* Integrated Clerk Profile - No Card Wrapper */}
                    <div className="[&_.cl-rootBox]:w-full [&_.cl-card]:shadow-none [&_.cl-card]:border-steel-alt-100 [&_.cl-card]:bg-transparent [&_.cl-navbar]:hidden [&_.cl-pageScrollBox]:p-0 [&_.cl-profileSection]:bg-[var(--dashboard-surface)] [&_.cl-profileSection]:rounded-lg [&_.cl-profileSection]:border [&_.cl-profileSection]:border-[var(--dashboard-border)] [&_.cl-profileSection]:p-6 [&_.cl-profileSection]:mb-4 [&_.cl-profileSection]:shadow-sm [&_.cl-profileSection:last-child]:mb-0 [&_.cl-formButtonPrimary]:bg-[var(--accent)] [&_.cl-formButtonPrimary]:text-white [&_.cl-formButtonPrimary:hover]:bg-[var(--accent-light)] [&_.cl-formButtonPrimary]:shadow-md [&_.cl-formButtonPrimary:hover]:shadow-lg [&_.cl-formButtonPrimary]:transition-all [&_.cl-formButtonPrimary]:rounded-lg [&_.cl-badge]:bg-[var(--accent-subtle)] [&_.cl-badge]:text-[var(--accent)] [&_.cl-badge]:border [&_.cl-badge]:border-[var(--accent)]/20 [&_.cl-badge]:rounded-md [&_.cl-avatarBox]:border-[var(--dashboard-border)] [&_.cl-profileSectionTitle]:text-[var(--dashboard-text-primary)] [&_.cl-profileSectionTitle]:font-serif [&_.cl-profileSectionTitle]:text-[16px] [&_.cl-profileSectionTitle]:mb-4 [&_.cl-profileSectionContent]:text-[var(--dashboard-text-steel-alt-800ody)] [&_.cl-profileSectionContent]:text-[13px] [&_.cl-formFieldLabel]:text-[var(--dashboard-text-steel-alt-800ody)] [&_.cl-formFieldLabel]:text-[12px] [&_.cl-formFieldLabel]:font-medium [&_.cl-formFieldInput]:border-[var(--dashboard-border)] [&_.cl-formFieldInput]:bg-white [&_.cl-formFieldInput]:rounded-lg [&_.cl-formFieldInput:focus]:border-[var(--accent)] [&_.cl-formFieldInput:focus]:ring-1 [&_.cl-formFieldInput:focus]:ring-[var(--accent)]/20 [&_.cl-formFieldInput]:text-[var(--dashboard-text-primary)] [&_.cl-formFieldInput]:text-[13px] [&_.cl-formFieldInput]:transition-all [&_.cl-avatarBox]:shadow-sm">
                        <UserProfile
                            appearance={{
                                elements: {
                                    rootBox: 'w-full',
                                    card: 'shadow-none border-steel-alt-100 bg-transparent',
                                    navbar: 'hidden',
                                    pageScrollBox: 'p-0',
                                    profileSection:
                                        'bg-[var(--dashboard-surface)] rounded-lg border border-[var(--dashboard-border)] p-6 mb-4 shadow-sm last:mb-0',
                                    profileSectionTitle:
                                        'text-[var(--dashboard-text-primary)] font-serif text-[16px] mb-4',
                                    profileSectionContent:
                                        'text-[var(--dashboard-text-steel-alt-800ody)] text-[13px]',
                                    formButtonPrimary:
                                        'bg-[var(--accent)] hover:bg-[var(--accent-light)] text-white shadow-md hover:shadow-lg transition-all rounded-lg',
                                    formFieldLabel:
                                        'text-[var(--dashboard-text-steel-alt-800ody)] text-[12px] font-medium',
                                    formFieldInput:
                                        'border-[var(--dashboard-border)] bg-white rounded-lg focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent)]/20 text-[var(--dashboard-text-primary)] text-[13px] transition-all',
                                    badge: 'bg-[var(--accent-subtle)] text-[var(--accent)] border border-[var(--accent)]/20 rounded-md',
                                    avatarBox:
                                        'border-[var(--dashboard-border)] shadow-sm',
                                },
                            }}
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
