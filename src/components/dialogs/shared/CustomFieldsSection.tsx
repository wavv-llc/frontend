import { CustomField, User } from '@/lib/api';
import { formatDateOnly, parseDateOnly } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { FormDialogField } from './FormDialogField';

function parseMultiValue(value: string): string[] {
    if (!value) return [];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [value];
    } catch {
        return value ? [value] : [];
    }
}

function getMemberDisplayName(member: User): string {
    return member.firstName
        ? `${member.firstName} ${member.lastName || ''}`.trim()
        : member.email;
}

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

    /**
     * Project members to use for USER-type field pickers.
     * When provided, USER fields render a member select instead of a text input.
     */
    projectMembers?: User[];
}

/**
 * Component for rendering a section of custom fields in a form.
 *
 * Handles rendering different input types based on field data type:
 * - NUMBER: number input
 * - DATE: date picker
 * - CUSTOM (with options): dropdown select
 * - USER (with projectMembers): member select dropdown
 * - STRING/TASK/DOCUMENT: text input
 */
export function CustomFieldsSection({
    customFields,
    customFieldValues,
    onChange,
    disabled = false,
    isLoading = false,
    projectMembers,
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
                        date={value ? parseDateOnly(value) : undefined}
                        setDate={(date) =>
                            onChange(field.id, date ? formatDateOnly(date) : '')
                        }
                        disabled={disabled}
                        placeholder={`Select ${field.name.toLowerCase()}`}
                    />
                );

            case 'CUSTOM':
                if (field.customOptions && field.customOptions.length > 0) {
                    if (field.multiple) {
                        return (
                            <MultiSelect
                                options={field.customOptions.map((opt) => ({
                                    value: opt,
                                    label: opt,
                                }))}
                                selected={parseMultiValue(value)}
                                onChange={(vals) =>
                                    onChange(field.id, JSON.stringify(vals))
                                }
                                placeholder={`Select ${field.name.toLowerCase()}`}
                                disabled={disabled}
                            />
                        );
                    }
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

            case 'USER':
                if (projectMembers && projectMembers.length > 0) {
                    const selectedMember = projectMembers.find(
                        (m) => m.id === value,
                    );
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
                                >
                                    {selectedMember
                                        ? getMemberDisplayName(selectedMember)
                                        : undefined}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                                {projectMembers.map((member) => (
                                    <SelectItem
                                        key={member.id}
                                        value={member.id}
                                    >
                                        {getMemberDisplayName(member)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    );
                }
                // Fallback to text input if no members provided
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
                        placeholder={
                            field.multiple
                                ? `Enter ${field.name.toLowerCase()} IDs, comma-separated`
                                : `Enter ${field.name.toLowerCase()}`
                        }
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
