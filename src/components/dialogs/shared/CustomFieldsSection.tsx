import { CustomField } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { FormDialogField } from './FormDialogField';

/**
 * Props for the CustomFieldsSection component
 */
export interface CustomFieldsSectionProps {
    /**
     * Array of custom fields to render
     */
    customFields: CustomField[];

    /**
     * Current values for all custom fields, keyed by field ID
     */
    customFieldValues: Record<string, string>;

    /**
     * Callback when a custom field value changes
     */
    onChange: (fieldId: string, value: string) => void;

    /**
     * Whether inputs should be disabled (e.g., during form submission)
     * @default false
     */
    disabled?: boolean;

    /**
     * Whether custom fields are currently being loaded
     * @default false
     */
    isLoading?: boolean;
}

/**
 * Component for rendering a section of custom fields in a form.
 *
 * Handles rendering different input types based on field data type:
 * - NUMBER: number input
 * - DATE: date picker
 * - CUSTOM (with options): dropdown select
 * - STRING/USER/TASK/DOCUMENT: text input
 *
 * @example
 * ```tsx
 * const customFieldsHook = useCustomFields(projectId, open)
 *
 * <CustomFieldsSection
 *   customFields={customFieldsHook.customFields}
 *   customFieldValues={customFieldsHook.customFieldValues}
 *   onChange={customFieldsHook.updateCustomFieldValue}
 *   disabled={isLoading}
 *   isLoading={customFieldsHook.isLoadingFields}
 * />
 * ```
 */
export function CustomFieldsSection({
    customFields,
    customFieldValues,
    onChange,
    disabled = false,
    isLoading = false,
}: CustomFieldsSectionProps) {
    /**
     * Render the appropriate input component based on field data type
     */
    const renderCustomFieldInput = (field: CustomField) => {
        const value = customFieldValues[field.id] || '';

        switch (field.dataType) {
            case 'NUMBER':
                return (
                    <Input
                        id={`custom-${field.id}`}
                        type="number"
                        value={value}
                        onChange={(e) => onChange(field.id, e.target.value)}
                        disabled={disabled}
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                    />
                );

            case 'DATE':
                return (
                    <DatePicker
                        date={value ? new Date(value) : undefined}
                        setDate={(date) =>
                            onChange(field.id, date ? date.toISOString() : '')
                        }
                        disabled={disabled}
                        placeholder={`Select ${field.name.toLowerCase()}`}
                    />
                );

            case 'CUSTOM':
                if (field.customOptions && field.customOptions.length > 0) {
                    return (
                        <Select
                            value={value}
                            onValueChange={(val) => onChange(field.id, val)}
                            disabled={disabled}
                        >
                            <SelectTrigger
                                className="w-full"
                                id={`custom-${field.id}`}
                            >
                                <SelectValue
                                    placeholder={`Select ${field.name.toLowerCase()}`}
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {field.customOptions.map((option) => (
                                    <SelectItem key={option} value={option}>
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    );
                }
                // Fall through to text input if no options defined
                return (
                    <Input
                        id={`custom-${field.id}`}
                        type="text"
                        value={value}
                        onChange={(e) => onChange(field.id, e.target.value)}
                        disabled={disabled}
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                    />
                );

            case 'STRING':
            case 'USER':
            case 'TASK':
            case 'DOCUMENT':
            default:
                return (
                    <Input
                        id={`custom-${field.id}`}
                        type="text"
                        value={value}
                        onChange={(e) => onChange(field.id, e.target.value)}
                        disabled={disabled}
                        placeholder={`Enter ${field.name.toLowerCase()}`}
                    />
                );
        }
    };

    // Show loading state
    if (isLoading) {
        return (
            <div className="text-sm text-muted-foreground py-4">
                Loading custom fields...
            </div>
        );
    }

    // Don't render anything if no custom fields
    if (customFields.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4 border-t pt-4">
            <div className="text-sm font-medium text-muted-foreground">
                Custom Fields
            </div>
            {customFields.map((field) => (
                <FormDialogField
                    key={field.id}
                    label={field.name}
                    name={`custom-${field.id}`}
                    required={field.required}
                    description={field.description}
                >
                    {renderCustomFieldInput(field)}
                </FormDialogField>
            ))}
        </div>
    );
}
