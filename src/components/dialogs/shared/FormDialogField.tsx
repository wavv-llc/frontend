import { Label } from '@/components/ui/label';

/**
 * Props for the FormDialogField component
 */
export interface FormDialogFieldProps {
    /**
     * Label text displayed above the input
     */
    label: string;

    /**
     * Field name (used for htmlFor on label)
     */
    name: string;

    /**
     * Whether the field is required.
     * Adds a red asterisk to the label.
     * @default false
     */
    required?: boolean;

    /**
     * Optional description text displayed below the label
     */
    description?: string;

    /**
     * Optional error message to display below the input
     */
    error?: string;

    /**
     * Input component (Input, Textarea, DatePicker, Select, etc.)
     */
    children: React.ReactNode;
}

/**
 * Standardized form field wrapper component.
 *
 * Provides consistent layout for all form fields with:
 * - Label with optional required indicator
 * - Optional description text
 * - Input component
 * - Error message display
 * - Consistent spacing
 *
 * @example
 * ```tsx
 * <FormDialogField
 *   label="Project Name"
 *   name="name"
 *   required
 *   error={errors.name}
 * >
 *   <Input
 *     value={values.name}
 *     onChange={(e) => handleChange('name', e.target.value)}
 *   />
 * </FormDialogField>
 * ```
 */
export function FormDialogField({
    label,
    name,
    required = false,
    description,
    error,
    children,
}: FormDialogFieldProps) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={name}>
                {label}
                {required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {description && (
                <p className="text-xs text-muted-foreground -mt-1">
                    {description}
                </p>
            )}
            {children}
            {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
    );
}
