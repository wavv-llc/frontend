'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { projectApi, type Project } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Empty } from '@/components/ui/empty';
import { Archive, Search, Folder, Clock } from 'lucide-react';

export default function ArchivePage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const getTokenRef = useRef(getToken);
    getTokenRef.current = getToken;

    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchArchived = useCallback(async (q: string) => {
        setLoading(true);
        try {
            const token = await getTokenRef.current();
            if (!token) return;
            const res = await projectApi.getArchivedProjects(
                token,
                q || undefined,
            );
            setProjects(res.data || []);
        } catch (err) {
            console.error('Failed to fetch archived projects', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchArchived(debouncedSearch);
    }, [debouncedSearch, fetchArchived]);

    const handleProjectClick = (project: Project) => {
        router.push(
            `/workspaces/${project.workspace?.isPersonal ? 'my-workspace' : (project.workspace?.slug ?? project.workspaceId)}/projects/${project.slug ?? project.id}`,
        );
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="border-b border-border px-6 py-4">
                <div className="flex items-center gap-3 mb-4">
                    <Archive className="h-5 w-5 text-muted-foreground" />
                    <div>
                        <h1 className="text-lg font-semibold tracking-tight">
                            Archive
                        </h1>
                        <p className="text-xs text-muted-foreground">
                            Read-only copies of archived projects. Archived
                            projects are retained for 7 years.
                        </p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                        placeholder="Search archived projects…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 h-8 text-sm"
                    />
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto px-6 py-4">
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4].map((i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 p-3 rounded-md border border-border"
                            >
                                <Skeleton className="h-8 w-8 rounded" />
                                <div className="flex-1 space-y-1.5">
                                    <Skeleton className="h-3.5 w-48" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-5 w-16 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : projects.length === 0 ? (
                    <Empty
                        icon={<Archive className="h-8 w-8" />}
                        title={
                            debouncedSearch
                                ? 'No archived projects match your search'
                                : 'No archived projects'
                        }
                        description={
                            debouncedSearch
                                ? 'Try a different search term'
                                : 'When projects are archived they will appear here'
                        }
                        className="py-20"
                    />
                ) : (
                    <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground mb-3">
                            {projects.length} archived project
                            {projects.length !== 1 ? 's' : ''}
                            {debouncedSearch
                                ? ` matching "${debouncedSearch}"`
                                : ''}
                        </p>
                        {projects.map((project) => (
                            <button
                                key={project.id}
                                onClick={() => handleProjectClick(project)}
                                className="w-full flex items-center gap-3 p-3 rounded-md border border-border hover:bg-accent/50 transition-colors text-left group cursor-pointer"
                            >
                                <div className="flex-shrink-0 h-8 w-8 rounded bg-muted flex items-center justify-center">
                                    <Folder className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium truncate">
                                            {project.name}
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px] px-1.5 py-0 h-4 shrink-0 bg-amber-100 text-amber-700 border-amber-200"
                                        >
                                            Archived
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        {project.workspace && (
                                            <span className="text-xs text-muted-foreground truncate">
                                                {project.workspace.name}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                                            <Clock className="h-3 w-3" />
                                            Archived{' '}
                                            {formatDate(project.updatedAt)}
                                        </span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
