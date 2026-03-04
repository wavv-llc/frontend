import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * Props for the FormDialog component
 */
export interface FormDialogProps {
    /**
     * Whether the dialog is open
     */
    open: boolean;

    /**
     * Callback when the dialog open state changes
     */
    onOpenChange: (open: boolean) => void;

    /**
     * Dialog title displayed in the header
     */
    title: string;

    /**
     * Optional description displayed below the title
     */
    description?: string;

    /**
     * Dialog content (typically a form)
     */
    children: React.ReactNode;

    /**
     * Maximum width of the dialog
     * @default 'sm'
     */
    maxWidth?: 'sm' | 'md' | 'lg';

    /**
     * Whether the dialog content should be scrollable.
     * Adds max-height and overflow-y-auto classes.
     * @default false
     */
    scrollable?: boolean;
}

/**
 * Base dialog wrapper component for form dialogs.
 *
 * Provides a consistent structure for all form dialogs with:
 * - Standard header layout with title and description
 * - Configurable max-width
 * - Optional scrollable content
 * - Maintains existing dialog animations and behavior
 *
 * @example
 * ```tsx
 * <FormDialog
 *   open={open}
 *   onOpenChange={setOpen}
 *   title="Create Project"
 *   description="Create a new project within this workspace."
 * >
 *   <form onSubmit={handleSubmit}>
 *     {/ * Form fields * /}
 *   </form>
 * </FormDialog>
 * ```
 */
export function FormDialog({
    open,
    onOpenChange,
    title,
    description,
    children,
    maxWidth = 'sm',
    scrollable = false,
}: FormDialogProps) {
    // Map maxWidth prop to Tailwind classes
    const maxWidthClasses = {
        sm: 'sm:max-w-[500px]',
        md: 'sm:max-w-[600px]',
        lg: 'sm:max-w-[700px]',
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent
                className={cn(
                    maxWidthClasses[maxWidth],
                    scrollable && 'max-h-[85vh] overflow-y-auto',
                )}
            >
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}
