'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    FileText,
    Upload,
    Search,
    X,
    Paperclip,
    FileUp,
    Loader2,
    Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { documentApi, type DocumentSearchResult } from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface AttachedDocument {
    id: string;
    filename: string;
    originalName: string;
    mimeType: string;
    filesize: number;
}

interface DocumentAttachmentProps {
    /** Currently attached documents */
    attachedDocuments: AttachedDocument[];
    /** Called when a document is attached (either searched or newly uploaded) */
    onAttach: (doc: AttachedDocument) => void;
    /** Called when a document is removed */
    onRemove: (documentId: string) => void;
    /** Whether to show the attached documents list below the trigger */
    showAttachedList?: boolean;
    /** Custom trigger element. If not provided, uses default button */
    trigger?: React.ReactNode;
    /** Additional class name for the root */
    className?: string;
    /** Disable the component */
    disabled?: boolean;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
    if (mimeType.startsWith('image/')) return FileText;
    if (mimeType.includes('pdf')) return FileText;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel'))
        return FileText;
    return FileText;
}

export function DocumentAttachment({
    attachedDocuments,
    onAttach,
    onRemove,
    showAttachedList = true,
    trigger,
    className,
    disabled = false,
}: DocumentAttachmentProps) {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<string>('search');

    // Search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<DocumentSearchResult[]>(
        [],
    );
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Upload state
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const attachedIds = new Set(attachedDocuments.map((d) => d.id));

    // Debounced search
    const performSearch = useCallback(
        async (query: string) => {
            if (!query.trim()) {
                setSearchResults([]);
                return;
            }
            setIsSearching(true);
            try {
                const token = await getToken();
                if (!token) return;
                const response = await documentApi.search(token, query);
                if (response.data) {
                    setSearchResults(response.data);
                }
            } catch {
                // Silently fail search
            } finally {
                setIsSearching(false);
            }
        },
        [getToken],
    );

    useEffect(() => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            performSearch(searchQuery);
        }, 300);
        return () => {
            if (searchTimeoutRef.current)
                clearTimeout(searchTimeoutRef.current);
        };
    }, [searchQuery, performSearch]);

    // Load recent documents when opening search tab with empty query
    useEffect(() => {
        if (open && activeTab === 'search' && !searchQuery) {
            performSearch('');
        }
    }, [open, activeTab]);

    const handleFileUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const file = event.target.files?.[0];
        if (!file || !user?.organizationId) return;

        setIsUploading(true);
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            const documentId = await documentApi.uploadForTask(
                token,
                user.organizationId,
                file,
            );
            onAttach({
                id: documentId,
                filename: file.name,
                originalName: file.name,
                mimeType: file.type || 'application/octet-stream',
                filesize: file.size,
            });
            toast.success(`Uploaded ${file.name}`);
            setOpen(false);
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Failed to upload file');
        } finally {
            setIsUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleAttachExisting = (doc: DocumentSearchResult) => {
        if (attachedIds.has(doc.id)) return;
        onAttach({
            id: doc.id,
            filename: doc.filename,
            originalName: doc.originalName,
            mimeType: doc.mimeType,
            filesize: doc.filesize,
        });
        toast.success(`Attached ${doc.originalName}`);
    };

    return (
        <div className={cn('flex flex-col gap-2', className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    {trigger ?? (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={disabled}
                            className="gap-1.5 text-xs"
                        >
                            <Paperclip className="h-3.5 w-3.5" />
                            Attach
                            {attachedDocuments.length > 0 && (
                                <Badge
                                    variant="secondary"
                                    className="h-4 min-w-4 px-1 text-[10px]"
                                >
                                    {attachedDocuments.length}
                                </Badge>
                            )}
                        </Button>
                    )}
                </PopoverTrigger>
                <PopoverContent
                    className="w-80 p-0"
                    align="start"
                    sideOffset={4}
                >
                    <Tabs
                        value={activeTab}
                        onValueChange={setActiveTab}
                        className="w-full"
                    >
                        <div className="border-b px-3 pt-3 pb-0">
                            <TabsList className="h-8 w-full">
                                <TabsTrigger
                                    value="search"
                                    className="text-xs gap-1.5"
                                >
                                    <Search className="h-3 w-3" />
                                    Search
                                </TabsTrigger>
                                <TabsTrigger
                                    value="upload"
                                    className="text-xs gap-1.5"
                                >
                                    <Upload className="h-3 w-3" />
                                    Upload
                                </TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="search" className="mt-0">
                            <div className="p-3 pb-2">
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input
                                        placeholder="Search documents..."
                                        value={searchQuery}
                                        onChange={(e) =>
                                            setSearchQuery(e.target.value)
                                        }
                                        className="h-8 pl-8 text-xs"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <ScrollArea className="max-h-56">
                                <div className="px-2 pb-2 space-y-0.5">
                                    {isSearching && (
                                        <div className="flex items-center justify-center py-6 text-muted-foreground">
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                            <span className="text-xs">
                                                Searching...
                                            </span>
                                        </div>
                                    )}
                                    {!isSearching &&
                                        searchResults.length === 0 &&
                                        searchQuery && (
                                            <div className="py-6 text-center text-xs text-muted-foreground">
                                                No documents found
                                            </div>
                                        )}
                                    {!isSearching &&
                                        searchResults.map((doc) => {
                                            const isAttached = attachedIds.has(
                                                doc.id,
                                            );
                                            const Icon = getFileIcon(
                                                doc.mimeType,
                                            );
                                            return (
                                                <button
                                                    key={doc.id}
                                                    onClick={() =>
                                                        handleAttachExisting(
                                                            doc,
                                                        )
                                                    }
                                                    disabled={isAttached}
                                                    className={cn(
                                                        'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-left transition-colors',
                                                        isAttached
                                                            ? 'bg-muted/50 cursor-default'
                                                            : 'hover:bg-accent/50 cursor-pointer',
                                                    )}
                                                >
                                                    <div className="flex items-center justify-center h-7 w-7 rounded-md bg-muted shrink-0">
                                                        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-xs font-medium truncate">
                                                            {doc.originalName}
                                                        </p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            {formatFileSize(
                                                                doc.filesize,
                                                            )}{' '}
                                                            ·{' '}
                                                            {doc.source
                                                                .replace(
                                                                    /_/g,
                                                                    ' ',
                                                                )
                                                                .toLowerCase()}
                                                        </p>
                                                    </div>
                                                    {isAttached && (
                                                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                                                    )}
                                                </button>
                                            );
                                        })}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="upload" className="mt-0">
                            <div className="p-4">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    onChange={handleFileUpload}
                                    disabled={isUploading}
                                />
                                <button
                                    onClick={() =>
                                        fileInputRef.current?.click()
                                    }
                                    disabled={isUploading}
                                    className="w-full flex flex-col items-center gap-3 py-8 border-2 border-dashed border-border rounded-lg hover:border-primary/50 hover:bg-accent/30 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
                                            <span className="text-xs text-muted-foreground">
                                                Uploading...
                                            </span>
                                        </>
                                    ) : (
                                        <>
                                            <FileUp className="h-8 w-8 text-muted-foreground" />
                                            <div className="text-center">
                                                <p className="text-xs font-medium">
                                                    Click to upload
                                                </p>
                                                <p className="text-[10px] text-muted-foreground mt-0.5">
                                                    PDF, XLSX, DOCX, or any file
                                                </p>
                                            </div>
                                        </>
                                    )}
                                </button>
                            </div>
                        </TabsContent>
                    </Tabs>
                </PopoverContent>
            </Popover>

            {/* Attached documents list */}
            {showAttachedList && attachedDocuments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {attachedDocuments.map((doc) => (
                        <div
                            key={doc.id}
                            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/60 border border-border/50 text-xs group"
                        >
                            <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                            <span className="truncate max-w-32">
                                {doc.originalName}
                            </span>
                            <button
                                onClick={() => onRemove(doc.id)}
                                className="ml-0.5 h-3.5 w-3.5 flex items-center justify-center rounded-sm opacity-50 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all"
                            >
                                <X className="h-2.5 w-2.5" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
