'use client';

import { useState, useEffect, useCallback } from 'react';

export type SortDir = 'asc' | 'desc';

export interface SortState {
    field: string | null; // fieldId | 'name' | 'dueAt' | null
    dir: SortDir;
}

interface ProjectViewPrefs {
    hiddenColumns: Set<string>;
    toggleColumn: (fieldId: string) => void;
    sortState: SortState;
    setSort: (field: string, dir: SortDir) => void;
    clearSort: () => void;
}

function readSet(key: string): Set<string> {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return new Set();
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed);
    } catch {
        // ignore
    }
    return new Set();
}

function writeSet(key: string, s: Set<string>) {
    try {
        localStorage.setItem(key, JSON.stringify([...s]));
    } catch {
        // ignore
    }
}

function readSort(key: string): SortState {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return { field: null, dir: 'asc' };
        return JSON.parse(raw);
    } catch {
        return { field: null, dir: 'asc' };
    }
}

function writeSort(key: string, s: SortState) {
    try {
        localStorage.setItem(key, JSON.stringify(s));
    } catch {
        // ignore
    }
}

export function useProjectViewPrefs(projectId: string): ProjectViewPrefs {
    const colKey = `wavv_col_visibility_${projectId}`;
    const sortKey = `wavv_sort_${projectId}`;

    const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(
        () => new Set(),
    );
    const [sortState, setSortState] = useState<SortState>({
        field: null,
        dir: 'asc',
    });

    // Hydrate from localStorage on mount (client-only)
    useEffect(() => {
        setHiddenColumns(readSet(colKey));
        setSortState(readSort(sortKey));
    }, [colKey, sortKey]);

    const toggleColumn = useCallback(
        (fieldId: string) => {
            setHiddenColumns((prev) => {
                const next = new Set(prev);
                if (next.has(fieldId)) {
                    next.delete(fieldId);
                } else {
                    next.add(fieldId);
                }
                writeSet(colKey, next);
                return next;
            });
        },
        [colKey],
    );

    const setSort = useCallback(
        (field: string, dir: SortDir) => {
            const next = { field, dir };
            setSortState(next);
            writeSort(sortKey, next);
        },
        [sortKey],
    );

    const clearSort = useCallback(() => {
        const next: SortState = { field: null, dir: 'asc' };
        setSortState(next);
        writeSort(sortKey, next);
    }, [sortKey]);

    return { hiddenColumns, toggleColumn, sortState, setSort, clearSort };
}
