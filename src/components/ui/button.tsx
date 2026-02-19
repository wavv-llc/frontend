'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useRipple } from './button-ripple';
import { ButtonSpinner } from './button-loading';

const buttonVariants = cva(
    // Base styles
    'inline-flex items-center justify-center gap-1.5 whitespace-nowrap font-figtree font-medium transition-all duration-200 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 relative overflow-hidden active:scale-[0.975] [&_svg]:pointer-events-none [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                // Pure Steel variants
                primary:
                    'bg-[var(--accent)] text-white shadow-[0_1px_2px_rgba(90,127,154,0.15),0_1px_3px_rgba(90,127,154,0.08)] hover:bg-[#4E7088] hover:shadow-[0_2px_6px_rgba(90,127,154,0.2),0_1px_3px_rgba(90,127,154,0.1)]',
                secondary:
                    'bg-[var(--accent-subtle)] text-[var(--accent)] hover:bg-[rgba(90,127,154,0.13)] active:bg-[rgba(90,127,154,0.18)]',
                outline:
                    'border border-[var(--dashboard-border)] bg-transparent text-[var(--accent)] hover:bg-[rgba(90,127,154,0.03)] hover:border-[var(--accent)] hover:shadow-[0_1px_4px_rgba(90,127,154,0.06)]',
                ghost: 'bg-transparent text-[var(--accent)] hover:bg-[rgba(90,127,154,0.06)] active:bg-[rgba(90,127,154,0.1)]',
                steel: 'bg-[#2E3B44] text-[#E8ECF0] shadow-[0_1px_2px_rgba(46,59,68,0.2),0_1px_3px_rgba(46,59,68,0.1)] hover:bg-[#384854] hover:shadow-[0_2px_8px_rgba(46,59,68,0.22),0_1px_3px_rgba(46,59,68,0.1)]',
                danger: 'bg-[#E05252] text-white shadow-[0_1px_2px_rgba(224,82,82,0.15),0_1px_3px_rgba(224,82,82,0.08)] hover:bg-[#CC4545] hover:shadow-[0_2px_6px_rgba(224,82,82,0.2),0_1px_3px_rgba(224,82,82,0.1)]',
                'danger-outline':
                    'border border-[rgba(224,82,82,0.25)] bg-transparent text-[#E05252] hover:bg-[rgba(224,82,82,0.04)] hover:border-[#E05252]',
                success:
                    'bg-[#3B9B72] text-white shadow-[0_1px_2px_rgba(59,155,114,0.15),0_1px_3px_rgba(59,155,114,0.08)] hover:bg-[#339065] hover:shadow-[0_2px_6px_rgba(59,155,114,0.2),0_1px_3px_rgba(59,155,114,0.1)]',
                // Legacy shadcn variants (mapped for backward compatibility)
                default:
                    'bg-[var(--accent)] text-white shadow-[0_1px_2px_rgba(90,127,154,0.15),0_1px_3px_rgba(90,127,154,0.08)] hover:bg-[#4E7088]',
                destructive:
                    'bg-[#E05252] text-white shadow-[0_1px_2px_rgba(224,82,82,0.15),0_1px_3px_rgba(224,82,82,0.08)] hover:bg-[#CC4545]',
                link: 'text-[var(--accent)] underline-offset-4 hover:underline',
            },
            size: {
                sm: 'h-8 px-3.5 text-xs rounded-md',
                md: 'h-10 px-[18px] text-[13px] rounded-lg',
                lg: 'h-11 px-[22px] text-sm rounded-lg',
                xl: 'h-12 px-7 text-[15px] rounded-lg',
                // Legacy sizes for backward compatibility
                default: 'h-10 px-[18px] text-[13px] rounded-lg',
                icon: 'h-9 w-9 rounded-lg',
                'icon-sm': 'h-8 w-8 rounded-md',
                'icon-lg': 'h-10 w-10 rounded-lg',
            },
        },
        defaultVariants: {
            variant: 'primary',
            size: 'md',
        },
    },
);

export interface ButtonProps
    extends
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    asChild?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            asChild = false,
            icon,
            iconPosition = 'left',
            loading = false,
            disabled,
            onClick,
            children,
            ...props
        },
        ref,
    ) => {
        const Comp = asChild ? Slot : 'button';
        const createRipple = useRipple();

        // Detect icon-only buttons (legacy size patterns)
        const isIconOnly =
            size === 'icon' || size === 'icon-sm' || size === 'icon-lg';

        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            if (!disabled && !loading) {
                createRipple(e);
                onClick?.(e);
            }
        };

        const content = loading ? (
            <>
                <ButtonSpinner
                    size={
                        size === 'sm' || size === 'icon-sm'
                            ? 'sm'
                            : size === 'xl'
                              ? 'xl'
                              : 'md'
                    }
                />
                {!isIconOnly && <span className="opacity-0">{children}</span>}
            </>
        ) : isIconOnly ? (
            icon || children
        ) : (
            <>
                {icon && iconPosition === 'left' && (
                    <span className="[&_svg]:w-[13px] [&_svg]:h-[13px]">
                        {icon}
                    </span>
                )}
                {children}
                {icon && iconPosition === 'right' && (
                    <span className="[&_svg]:w-[13px] [&_svg]:h-[13px]">
                        {icon}
                    </span>
                )}
            </>
        );

        return (
            <Comp
                ref={ref}
                data-slot="button"
                className={cn(buttonVariants({ variant, size, className }))}
                disabled={disabled || loading}
                onClick={handleClick}
                {...props}
            >
                <span className="relative z-10 inline-flex items-center justify-center gap-1.5">
                    {content}
                </span>
            </Comp>
        );
    },
);

Button.displayName = 'Button';

export { Button, buttonVariants };
