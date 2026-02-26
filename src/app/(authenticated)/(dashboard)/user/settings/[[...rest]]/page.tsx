'use client';

import { UserProfile } from '@clerk/nextjs';

const clerkAppearance = {
    variables: {
        colorPrimary: '#5a7f9a',
        colorBackground: '#ffffff',
        colorInputBackground: '#ffffff',
        colorInputText: '#2e3b44',
        colorText: '#2e3b44',
        colorTextSecondary: '#8c969e',
        colorTextOnPrimaryBackground: '#ffffff',
        colorDanger: '#ef4444',
        colorSuccess: '#3b9b72',
        colorWarning: '#b5880a',
        fontFamily: '"DM Sans", system-ui, sans-serif',
        fontFamilyButtons: '"DM Sans", system-ui, sans-serif',
        fontSize: '13px',
        borderRadius: '0.45rem',
        spacingUnit: '1rem',
    },
    elements: {
        rootBox: 'w-full h-full flex flex-col',
        card: 'shadow-none border-0 bg-transparent p-0 rounded-none w-full h-full flex flex-col',
        navbar: 'hidden',
        navbarMobileMenuButton: 'hidden',
        pageScrollBox: 'flex-1 overflow-y-auto p-0',
        header: 'hidden',
        profileSection:
            'bg-white rounded-lg border border-[#e2e2df] p-5 mb-3 shadow-sm',
        profileSectionTitle:
            'font-serif text-[15px] font-medium text-[#2e3b44] pb-3 mb-3 border-b border-[#ededeb]',
        profileSectionContent: 'text-[#3d4a52] text-[13px]',
        profileSectionPrimaryButton:
            'text-[#5a7f9a] hover:text-[#7ba3bf] text-[13px] font-medium transition-colors',
        formButtonPrimary:
            'bg-[#5a7f9a] hover:bg-[#4a6d85] text-white shadow-sm hover:shadow-md transition-all rounded-md text-[13px] font-medium px-4 py-2',
        formButtonReset:
            'text-[#8c969e] hover:text-[#2e3b44] text-[13px] transition-colors border border-[#e2e2df] rounded-md px-4 py-2',
        formFieldLabel: 'text-[#3d4a52] text-[12px] font-medium mb-1',
        formFieldInput:
            'border border-[#e2e2df] bg-white rounded-md focus:border-[#5a7f9a] focus:ring-2 focus:ring-[rgba(90,127,154,0.15)] text-[#2e3b44] text-[13px] transition-all placeholder:text-[#b8c0c6]',
        formFieldInputShowPasswordButton:
            'text-[#8c969e] hover:text-[#2e3b44] transition-colors',
        formFieldErrorText: 'text-[#ef4444] text-[11px] mt-1',
        formFieldWarningText: 'text-[#b5880a] text-[11px] mt-1',
        formFieldSuccessText: 'text-[#3b9b72] text-[11px] mt-1',
        badge: 'bg-[rgba(90,127,154,0.07)] text-[#5a7f9a] border border-[rgba(90,127,154,0.2)] rounded-md text-[11px] font-medium',
        avatarBox: 'border-2 border-[#e2e2df] shadow-sm rounded-full',
        avatarImageActionsUpload:
            'text-[#5a7f9a] hover:text-[#7ba3bf] transition-colors',
        dividerRow: 'before:border-[#ededeb] after:border-[#ededeb]',
        identityPreviewText: 'text-[#3d4a52] text-[13px]',
        identityPreviewEditButton:
            'text-[#5a7f9a] hover:text-[#7ba3bf] transition-colors',
        accordionTriggerButton:
            'text-[#2e3b44] hover:bg-[rgba(90,127,154,0.05)] rounded-md transition-colors',
        menuList: 'border border-[#e2e2df] shadow-md rounded-lg bg-white',
        menuItem:
            'text-[#3d4a52] hover:bg-[rgba(90,127,154,0.05)] text-[13px] rounded-md',
        menuItemDestructive: 'text-[#ef4444] hover:bg-[rgba(239,68,68,0.05)]',
        actionCard:
            'border border-[#e2e2df] rounded-lg bg-white shadow-sm text-[#3d4a52]',
        alert: 'border border-[#e2e2df] rounded-lg bg-[#f5f5f3] text-[#3d4a52]',
        alertText: 'text-[#3d4a52] text-[13px]',
    },
};

export default function UserSettingsPage() {
    return (
        <div className="h-full w-full bg-dashboard-bg flex flex-col">
            {/* Header - Fixed */}
            <header className="shrink-0 flex items-center px-7 py-3.5 bg-[rgba(245,245,243,0.85)] backdrop-blur-xl border-b border-dashboard-border animate-fade-up">
                <div className="flex flex-col gap-1">
                    <h1 className="font-serif text-[20px] font-medium leading-tight tracking-tight text-dashboard-text-primary">
                        <span className="italic">Profile</span> Settings
                    </h1>
                    <p className="font-sans text-[10px] font-normal text-dashboard-text-muted">
                        Manage your personal account settings
                    </p>
                </div>
            </header>

            {/* Main Content Area - Fixed, no page scroll */}
            <main className="flex-1 min-h-0 overflow-hidden px-8 py-6 animate-fade-up animate-delay-100">
                {/* Force Clerk card to fill full width/height, overriding its internal max-width inline style */}
                <div className="h-full w-full [&_.cl-rootBox]:h-full [&_.cl-card]:max-w-none! [&_.cl-card]:h-full [&_.cl-cardBox]:h-full [&_.cl-cardBox]:max-w-none! [&_.cl-scrollBox]:h-full">
                    <UserProfile appearance={clerkAppearance} />
                </div>
            </main>
        </div>
    );
}
