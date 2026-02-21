'use client';

import { Toaster as Sonner, ToasterProps as SonnerProps } from 'sonner';

interface ToasterProps extends Omit<SonnerProps, 'toastOptions'> {
    errorClassName?: string;
}

const Toaster = ({ errorClassName, ...props }: ToasterProps) => {
    return (
        <>
            <style jsx global>{`
                [data-sonner-toast] [data-close-button] {
                    opacity: 0;
                    transition: opacity 150ms ease;
                }
                [data-sonner-toast]:hover [data-close-button] {
                    opacity: 1;
                }
            `}</style>
            <Sonner
                className="toaster group"
                closeButton
                toastOptions={{
                    classNames: {
                        toast: 'group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
                        description: 'group-[.toast]:text-muted-foreground',
                        actionButton:
                            'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
                        cancelButton:
                            'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground',
                        closeButton:
                            'group-[.toaster]:!bg-transparent group-[.toaster]:!border-none group-[.toaster]:!text-current group-[.toaster]:hover:!bg-black/5',
                        error:
                            errorClassName ||
                            'group-[.toaster]:!bg-[#fef2f2] group-[.toaster]:!text-[#dc2626] group-[.toaster]:!border-[#fecaca]',
                    },
                }}
                {...props}
            />
        </>
    );
};

export { Toaster };
export type { ToasterProps };
