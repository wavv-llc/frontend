import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';

/**
 * Props for the FormDialogActions component
 */
export interface FormDialogActionsProps {
    /**
     * Callback when cancel button is clicked
     */
    onCancel: () => void;

    /**
     * Label for the submit button
     * @default 'Submit'
     */
    submitLabel?: string;

    /**
     * Label for the cancel button
     * @default 'Cancel'
     */
    cancelLabel?: string;

    /**
     * Whether the form is currently loading/submitting.
     * Disables both buttons and shows loading text.
     * @default false
     */
    isLoading?: boolean;

    /**
     * Text to show on submit button when loading
     * @default 'Loading...'
     */
    loadingLabel?: string;

    /**
     * Whether buttons should be disabled (in addition to loading state)
     * @default false
     */
    disabled?: boolean;
}

/**
 * Standard dialog footer with Cancel and Submit buttons.
 *
 * Provides consistent button layout for all form dialogs with:
 * - Cancel button (outline variant)
 * - Submit button (default variant)
 * - Loading states with disabled buttons
 * - Customizable labels
 *
 * @example
 * ```tsx
 * <FormDialogActions
 *   onCancel={() => onOpenChange(false)}
 *   submitLabel="Create Project"
 *   isLoading={isLoading}
 *   loadingLabel="Creating..."
 * />
 * ```
 */
export function FormDialogActions({
    onCancel,
    submitLabel = 'Submit',
    cancelLabel = 'Cancel',
    isLoading = false,
    loadingLabel = 'Loading...',
    disabled = false,
}: FormDialogActionsProps) {
    const isDisabled = isLoading || disabled;

    return (
        <DialogFooter>
            <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isDisabled}
            >
                {cancelLabel}
            </Button>
            <Button type="submit" disabled={isDisabled}>
                {isLoading ? loadingLabel : submitLabel}
            </Button>
        </DialogFooter>
    );
}
