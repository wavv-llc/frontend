'use client';

import { Toaster as Sonner, ToasterProps as SonnerProps } from 'sonner';

interface ToasterProps extends Omit<SonnerProps, 'toastOptions'> {
    errorClassName?: string;
}

const Toaster = ({ errorClassName, ...props }: ToasterProps) => {
    return (
        <Sonner
            className="toaster group"
            closeButton
            toastOptions={{
                classNames: {
                    toast: 'group toast group-[.toaster]:bg-dashboard-surface group-[.toaster]:text-dashboard-text-body group-[.toaster]:border-dashboard-border group-[.toaster]:shadow-lg',
                    description: 'group-[.toast]:text-dashboard-text-muted',
                    actionButton:
                        'group-[.toast]:bg-accent-blue group-[.toast]:text-white',
                    cancelButton:
                        'group-[.toast]:bg-dashboard-surface group-[.toast]:text-dashboard-text-muted',
                    closeButton:
                        'group-[.toaster]:!bg-transparent group-[.toaster]:!border-none group-[.toaster]:!text-current group-[.toaster]:hover:!bg-black/5',
                    error:
                        errorClassName ||
                        'group-[.toaster]:!bg-[#fef2f2] group-[.toaster]:!text-[#dc2626] group-[.toaster]:!border-[#fecaca]',
                },
            }}
            {...props}
        />
    );
};

export { Toaster };
export type { ToasterProps };
