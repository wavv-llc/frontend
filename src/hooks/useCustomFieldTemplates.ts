'use client';

import { useState, useEffect, useCallback } from 'react';
import type { CustomField, CustomFieldValue, DataType } from '@/lib/api';

export interface TemplateField {
    fieldName: string;
    dataType: DataType;
    value: string;
}

export interface CustomFieldTemplate {
    id: string;
    name: string;
    description?: string;
    workspaceId: string;
    fields: TemplateField[];
    createdAt: string;
}

function storageKey(workspaceId: string) {
    return `wavv_cf_templates_${workspaceId}`;
}

function loadTemplates(workspaceId: string): CustomFieldTemplate[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(storageKey(workspaceId));
        return raw ? (JSON.parse(raw) as CustomFieldTemplate[]) : [];
    } catch {
        return [];
    }
}

function persistTemplates(
    workspaceId: string,
    templates: CustomFieldTemplate[],
) {
    try {
        localStorage.setItem(
            storageKey(workspaceId),
            JSON.stringify(templates),
        );
    } catch {
        // localStorage unavailable — silently ignore
    }
}

export interface UseCustomFieldTemplatesResult {
    templates: CustomFieldTemplate[];
    saveTemplate: (
        name: string,
        description: string | undefined,
        currentFields: CustomField[],
        currentValues: Record<string, string>,
    ) => void;
    /** Save a template directly from a task's customFieldValues array. */
    saveTemplateFromTask: (
        name: string,
        description: string | undefined,
        customFieldValues: CustomFieldValue[],
    ) => void;
    deleteTemplate: (id: string) => void;
    updateTemplate: (
        id: string,
        patch: { name?: string; description?: string },
    ) => void;
    /** Returns a fieldId→value map of values that match the project's fields. */
    matchTemplate: (
        template: CustomFieldTemplate,
        projectFields: CustomField[],
    ) => Record<string, string>;
}

export function useCustomFieldTemplates(
    workspaceId: string,
): UseCustomFieldTemplatesResult {
    const [templates, setTemplates] = useState<CustomFieldTemplate[]>(() =>
        loadTemplates(workspaceId),
    );

    // Reload when workspaceId changes
    useEffect(() => {
        setTemplates(loadTemplates(workspaceId));
    }, [workspaceId]);

    const save = useCallback(
        (
            name: string,
            description: string | undefined,
            currentFields: CustomField[],
            currentValues: Record<string, string>,
        ) => {
            const fields: TemplateField[] = currentFields
                .filter((f) => {
                    const v = currentValues[f.id];
                    return v !== undefined && v.trim() !== '';
                })
                .map((f) => ({
                    fieldName: f.name,
                    dataType: f.dataType,
                    value: currentValues[f.id],
                }));

            const next: CustomFieldTemplate = {
                id: crypto.randomUUID(),
                name: name.trim(),
                description: description?.trim() || undefined,
                workspaceId,
                fields,
                createdAt: new Date().toISOString(),
            };

            setTemplates((prev) => {
                const updated = [next, ...prev];
                persistTemplates(workspaceId, updated);
                return updated;
            });
        },
        [workspaceId],
    );

    const saveFromTask = useCallback(
        (
            name: string,
            description: string | undefined,
            customFieldValues: CustomFieldValue[],
        ) => {
            const fields: TemplateField[] = customFieldValues
                .filter((cfv) => cfv.value && cfv.value.trim() !== '')
                .map((cfv) => ({
                    fieldName: cfv.customField.name,
                    dataType: cfv.customField.dataType,
                    value: cfv.value,
                }));

            const next: CustomFieldTemplate = {
                id: crypto.randomUUID(),
                name: name.trim(),
                description: description?.trim() || undefined,
                workspaceId,
                fields,
                createdAt: new Date().toISOString(),
            };

            setTemplates((prev) => {
                const updated = [next, ...prev];
                persistTemplates(workspaceId, updated);
                return updated;
            });
        },
        [workspaceId],
    );

    const deleteTemplate = useCallback(
        (id: string) => {
            setTemplates((prev) => {
                const updated = prev.filter((t) => t.id !== id);
                persistTemplates(workspaceId, updated);
                return updated;
            });
        },
        [workspaceId],
    );

    const updateTemplate = useCallback(
        (id: string, patch: { name?: string; description?: string }) => {
            setTemplates((prev) => {
                const updated = prev.map((t) =>
                    t.id === id ? { ...t, ...patch } : t,
                );
                persistTemplates(workspaceId, updated);
                return updated;
            });
        },
        [workspaceId],
    );

    const matchTemplate = useCallback(
        (
            template: CustomFieldTemplate,
            projectFields: CustomField[],
        ): Record<string, string> => {
            const result: Record<string, string> = {};
            for (const field of projectFields) {
                const match = template.fields.find(
                    (tf) =>
                        tf.fieldName.toLowerCase() === field.name.toLowerCase(),
                );
                if (match) result[field.id] = match.value;
            }
            return result;
        },
        [],
    );

    return {
        templates,
        saveTemplate: save,
        saveTemplateFromTask: saveFromTask,
        deleteTemplate,
        updateTemplate,
        matchTemplate,
    };
}
