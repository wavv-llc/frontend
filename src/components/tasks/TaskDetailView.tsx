'use client';

import {
    useState,
    useEffect,
    useCallback,
    useRef,
    useMemo,
    forwardRef,
    useImperativeHandle,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import DOMPurify from 'isomorphic-dompurify';
import {
    ArrowLeft,
    MoreVertical,
    Upload,
    FileText,
    Check,
    Edit2,
    Trash2,
    Copy,
    AlignLeft,
    Paperclip,
    SmilePlus,
    SlidersHorizontal,
    ArrowUp,
    CheckCircle2,
    MoreHorizontal,
    RotateCcw,
    CircleDot,
    Lock,
    Send,
    RefreshCw,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    ChevronDown,
    Bell,
    XCircle,
    Link2,
    Library,
    Search,
    Activity,
    UserCheck,
} from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { EditTaskDialog } from '@/components/dialogs/EditTaskDialog';
import { cn } from '@/lib/utils';
import {
    type Task,
    type Comment,
    type User,
    type CustomField,
    type Document,
    type TaskCommentReaction,
    taskApi,
    taskCommentApi,
    approvalApi,
    documentApi,
} from '@/lib/api';
import { useUser } from '@/contexts/UserContext';
import { format } from 'date-fns';
import { useAuth } from '@clerk/nextjs';
import { toast } from 'sonner';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import Link from 'next/link';
import { Input } from '@/components/ui/input';

// ─── Helper: compact relative timestamps ──────────────────────────────────────
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) return format(date, 'MMM d');
    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'just now';
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function ordinal(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return s[(v - 20) % 10] ?? s[v] ?? s[0];
}

function approvalStatusLabel(
    status: string,
    reviewerIndex: number,
    totalSteps: number,
): string {
    if (status === 'IN_PREPARATION') return 'In Preparation';
    if (status === 'COMPLETED') return 'Complete';
    if (status === 'IN_REVIEW') {
        const level = reviewerIndex; // index 1 = 1st level, etc.
        if (totalSteps <= 1) return 'Under Review';
        return `${level}${ordinal(level)} Level Review`;
    }
    return status;
}

// ─── Comment formatting helpers ────────────────────────────────────────────────
function sanitizeCommentHtml(html: string): string {
    return DOMPurify.sanitize(html, {
        ALLOWED_TAGS: [
            'p',
            'br',
            'b',
            'i',
            'u',
            'strong',
            'em',
            'a',
            'ul',
            'ol',
            'li',
            'span',
            'div',
            'img',
            'h1',
            'h2',
            'h3',
            'blockquote',
            'code',
            'pre',
        ],
        ALLOWED_ATTR: [
            'href',
            'src',
            'alt',
            'class',
            'style',
            'target',
            'rel',
            'data-mention-id',
        ],
        ALLOW_DATA_ATTR: false,
    });
}

interface RichEditorHandle {
    clear: () => void;
    focus: () => void;
}

const RichCommentEditor = forwardRef<
    RichEditorHandle,
    {
        onContentChange: (html: string, isEmpty: boolean) => void;
        onSubmit?: () => void;
        onCancel?: () => void;
        onFocus?: () => void;
        onBlur?: (isEmpty: boolean) => void;
        placeholder?: string;
        showToolbar?: boolean;
        toolbarActions?: ReactNode;
        mentionableUsers?: User[];
        initialContent?: string;
    }
>(function RichCommentEditor(
    {
        onContentChange,
        onSubmit,
        onCancel,
        onFocus,
        onBlur,
        placeholder,
        showToolbar,
        toolbarActions,
        mentionableUsers = [],
        initialContent,
    },
    ref,
) {
    const divRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (initialContent && divRef.current) {
            divRef.current.innerHTML = sanitizeCommentHtml(initialContent);
            const empty =
                !divRef.current.textContent?.trim() &&
                !divRef.current.querySelector('img');
            onContentChange(initialContent, empty);
            // Move cursor to end
            const range = document.createRange();
            range.selectNodeContents(divRef.current);
            range.collapse(false);
            const sel = window.getSelection();
            sel?.removeAllRanges();
            sel?.addRange(range);
        }
    }, []);
    const [isEmpty, setIsEmpty] = useState(true);
    const [activeFormats, setActiveFormats] = useState<Set<string>>(new Set());

    // ── Mention state ──────────────────────────────────────────────────────────
    const [mentionOpen, setMentionOpen] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionIndex, setMentionIndex] = useState(0);
    const [mentionPos, setMentionPos] = useState({ top: 0, left: 0 });

    const filteredMentions = useMemo(() => {
        if (!mentionableUsers.length) return [];
        const q = mentionQuery.toLowerCase();
        return mentionableUsers
            .filter((u) => {
                const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`
                    .toLowerCase()
                    .trim();
                return (
                    !q || name.includes(q) || u.email.toLowerCase().includes(q)
                );
            })
            .slice(0, 6);
    }, [mentionableUsers, mentionQuery]);

    useImperativeHandle(ref, () => ({
        clear: () => {
            if (divRef.current) {
                divRef.current.innerHTML = '';
                setIsEmpty(true);
                setMentionOpen(false);
                onContentChange('', true);
            }
        },
        focus: () => divRef.current?.focus(),
    }));

    const syncFormats = useCallback(() => {
        const fmts = new Set<string>();
        if (document.queryCommandState('bold')) fmts.add('bold');
        if (document.queryCommandState('italic')) fmts.add('italic');
        if (document.queryCommandState('underline')) fmts.add('underline');
        if (document.queryCommandState('strikeThrough'))
            fmts.add('strikeThrough');
        setActiveFormats(fmts);
    }, []);

    const isEditorEmpty = useCallback((el: HTMLDivElement) => {
        return !el.textContent?.trim() && !el.querySelector('img');
    }, []);

    const execFormat = useCallback(
        (cmd: string, val?: string) => {
            divRef.current?.focus();
            document.execCommand(cmd, false, val);
            syncFormats();
            const html = divRef.current?.innerHTML ?? '';
            const empty = divRef.current ? isEditorEmpty(divRef.current) : true;
            onContentChange(html, empty);
        },
        [syncFormats, onContentChange, isEditorEmpty],
    );

    // Check if cursor is right after an @query pattern and open/close mention dropdown
    const checkForMention = useCallback(() => {
        if (!mentionableUsers.length) return;
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0 || !divRef.current) {
            setMentionOpen(false);
            return;
        }
        const range = sel.getRangeAt(0);
        const preRange = document.createRange();
        preRange.selectNodeContents(divRef.current);
        preRange.setEnd(range.endContainer, range.endOffset);
        const textBefore = preRange.toString();

        // Match a bare @ or @ followed by word chars (no spaces) at the very end
        const match = textBefore.match(/@([\w.]*)$/);
        if (!match) {
            setMentionOpen(false);
            return;
        }

        setMentionQuery(match[1]);
        setMentionIndex(0);
        setMentionOpen(true);

        // Position the dropdown just below the cursor
        const rect = range.getBoundingClientRect();
        setMentionPos({ top: rect.bottom + 6, left: rect.left });
    }, [mentionableUsers.length]);

    // Insert a mention chip and close the dropdown
    const insertMention = useCallback(
        (user: User) => {
            const el = divRef.current;
            const sel = window.getSelection();
            if (!el || !sel || sel.rangeCount === 0) return;

            const range = sel.getRangeAt(0);
            const node = range.startContainer;
            if (node.nodeType !== Node.TEXT_NODE) return;

            const text = node.textContent ?? '';
            const cursorPos = range.startOffset;
            const textBefore = text.slice(0, cursorPos);
            const atIdx = textBefore.lastIndexOf('@');
            if (atIdx === -1) return;

            // Select from @ to cursor so we can replace it
            const replaceRange = document.createRange();
            replaceRange.setStart(node, atIdx);
            replaceRange.setEnd(node, cursorPos);
            sel.removeAllRanges();
            sel.addRange(replaceRange);

            const displayName = user.firstName
                ? `${user.firstName} ${user.lastName ?? ''}`.trim()
                : user.email;

            document.execCommand(
                'insertHTML',
                false,
                `<span class="mention" data-user-id="${user.id}" contenteditable="false">@${displayName}</span>&nbsp;`,
            );

            setMentionOpen(false);
            setMentionQuery('');

            const html = el.innerHTML;
            const empty = isEditorEmpty(el);
            setIsEmpty(empty);
            onContentChange(html, empty);
        },
        [isEditorEmpty, onContentChange],
    );

    const handleInput = useCallback(() => {
        const el = divRef.current;
        if (!el) return;
        const html = el.innerHTML;
        const empty = isEditorEmpty(el);
        setIsEmpty(empty);
        syncFormats();
        onContentChange(html, empty);
        checkForMention();
    }, [syncFormats, onContentChange, isEditorEmpty, checkForMention]);

    const handlePaste = useCallback(
        (e: React.ClipboardEvent) => {
            e.preventDefault();

            // Check for image in clipboard first
            const items = Array.from(e.clipboardData.items);
            const imageItem = items.find((item) =>
                item.type.startsWith('image/'),
            );

            if (imageItem) {
                const file = imageItem.getAsFile();
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const dataUrl = ev.target?.result as string;
                        const img = document.createElement('img');
                        img.src = dataUrl;
                        img.style.maxWidth = '100%';
                        img.style.borderRadius = '6px';
                        img.style.marginTop = '4px';
                        img.style.display = 'block';
                        divRef.current?.focus();
                        const sel = window.getSelection();
                        if (sel && sel.rangeCount > 0) {
                            const range = sel.getRangeAt(0);
                            range.deleteContents();
                            range.insertNode(img);
                            range.setStartAfter(img);
                            range.collapse(true);
                            sel.removeAllRanges();
                            sel.addRange(range);
                        } else {
                            divRef.current?.appendChild(img);
                        }
                        handleInput();
                    };
                    reader.readAsDataURL(file);
                    return;
                }
            }

            // Fall back to plain text
            const text = e.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
            handleInput();
        },
        [handleInput],
    );

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent) => {
            // Mention dropdown navigation takes priority
            if (mentionOpen && filteredMentions.length > 0) {
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setMentionIndex((i) =>
                        Math.min(i + 1, filteredMentions.length - 1),
                    );
                    return;
                }
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setMentionIndex((i) => Math.max(i - 1, 0));
                    return;
                }
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const selected = filteredMentions[mentionIndex];
                    if (selected) insertMention(selected);
                    return;
                }
                if (e.key === 'Escape') {
                    e.preventDefault();
                    setMentionOpen(false);
                    return;
                }
            }

            const mod = e.metaKey || e.ctrlKey;
            if (mod && e.key === 'Enter') {
                e.preventDefault();
                onSubmit?.();
                return;
            }
            if (e.key === 'Escape') {
                onCancel?.();
                return;
            }
            if (mod && e.key === 'b') {
                e.preventDefault();
                execFormat('bold');
            }
            if (mod && e.key === 'i') {
                e.preventDefault();
                execFormat('italic');
            }
            if (mod && e.key === 'u') {
                e.preventDefault();
                execFormat('underline');
            }
        },
        [
            execFormat,
            onSubmit,
            onCancel,
            mentionOpen,
            filteredMentions,
            mentionIndex,
            insertMention,
        ],
    );

    const fmtBtnCls = (active: boolean) =>
        cn(
            'h-6 w-6 inline-flex items-center justify-center rounded transition-colors',
            active
                ? 'bg-accent-subtle text-accent-blue'
                : 'text-dashboard-text-muted hover:text-dashboard-text-primary hover:bg-accent-hover',
        );

    return (
        <div className="flex-1 min-w-0">
            {/* Editable area */}
            <div className="relative">
                {isEmpty && placeholder && (
                    <span className="absolute inset-0 text-sm text-dashboard-text-muted pointer-events-none select-none">
                        {placeholder}
                    </span>
                )}
                <div
                    ref={divRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    onPaste={handlePaste}
                    onKeyDown={handleKeyDown}
                    onKeyUp={syncFormats}
                    onMouseUp={syncFormats}
                    onFocus={onFocus}
                    onBlur={() => {
                        // Delay closing so clicks on the mention list are registered first
                        setTimeout(() => setMentionOpen(false), 150);
                        onBlur?.(isEmpty);
                    }}
                    className="text-sm outline-none text-dashboard-text-body leading-relaxed min-h-5 [&_.mention]:text-accent-blue [&_.mention]:font-medium [&_.mention]:bg-accent-subtle [&_.mention]:px-1 [&_.mention]:rounded [&_.mention]:text-xs"
                />
            </div>

            {/* Mention dropdown — rendered in a portal so it escapes overflow:hidden containers */}
            {mentionOpen &&
                filteredMentions.length > 0 &&
                typeof document !== 'undefined' &&
                createPortal(
                    <div
                        style={{
                            position: 'fixed',
                            top: mentionPos.top,
                            left: mentionPos.left,
                            zIndex: 9999,
                        }}
                        className="w-56 rounded-lg border border-dashboard-border bg-white shadow-lg overflow-hidden"
                        onMouseDown={(e) => e.preventDefault()}
                    >
                        <div className="px-2 py-1 border-b border-dashboard-border/50">
                            <p className="text-[10px] font-medium text-dashboard-text-muted uppercase tracking-wide">
                                Mention someone
                            </p>
                        </div>
                        {filteredMentions.map((user, idx) => {
                            const initials = user.firstName
                                ? `${user.firstName[0]}${user.lastName?.[0] ?? ''}`.toUpperCase()
                                : user.email[0].toUpperCase();
                            const name = user.firstName
                                ? `${user.firstName} ${user.lastName ?? ''}`.trim()
                                : user.email;
                            return (
                                <button
                                    key={user.id}
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        insertMention(user);
                                    }}
                                    className={cn(
                                        'w-full flex items-center gap-2 px-2 py-1.5 text-left transition-colors cursor-pointer',
                                        idx === mentionIndex
                                            ? 'bg-accent-subtle'
                                            : 'hover:bg-dashboard-surface',
                                    )}
                                >
                                    <div className="h-6 w-6 rounded-full bg-accent-subtle border border-dashboard-border flex items-center justify-center text-[10px] font-semibold text-accent-blue shrink-0">
                                        {initials}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium text-dashboard-text-primary truncate">
                                            {name}
                                        </p>
                                        <p className="text-[10px] text-dashboard-text-muted truncate">
                                            {user.email}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>,
                    document.body,
                )}

            {/* Formatting toolbar */}
            {showToolbar && (
                <div className="flex items-center gap-0.5 mt-2 pt-1.5 border-t border-dashboard-border/50">
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execFormat('bold');
                        }}
                        title="Bold (⌘B)"
                        className={fmtBtnCls(activeFormats.has('bold'))}
                    >
                        <Bold className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execFormat('italic');
                        }}
                        title="Italic (⌘I)"
                        className={fmtBtnCls(activeFormats.has('italic'))}
                    >
                        <Italic className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execFormat('underline');
                        }}
                        title="Underline (⌘U)"
                        className={fmtBtnCls(activeFormats.has('underline'))}
                    >
                        <Underline className="h-3.5 w-3.5" />
                    </button>
                    <button
                        type="button"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execFormat('strikeThrough');
                        }}
                        title="Strikethrough"
                        className={fmtBtnCls(
                            activeFormats.has('strikeThrough'),
                        )}
                    >
                        <Strikethrough className="h-3.5 w-3.5" />
                    </button>
                    {toolbarActions}
                </div>
            )}
        </div>
    );
});

// ─── Props ─────────────────────────────────────────────────────────────────────
interface TaskDetailViewProps {
    task: Task;
    onBack: () => void;
    onUpdate?: () => void;
    onDelete?: () => void;
    workspaceName?: string;
    workspaceId?: string;
    workspaceSlug?: string;
    projectName?: string;
    projectId?: string;
    projectSlug?: string;
    customFields?: CustomField[];
    projectMembers?: User[];
    workspaceMembers?: User[];
}

// ─── TaskDetailView ────────────────────────────────────────────────────────────
export function TaskDetailView({
    task,
    onBack,
    onUpdate,
    onDelete,
    workspaceName,
    workspaceId,
    workspaceSlug,
    projectName,
    projectId,
    projectSlug,
    customFields = [],
    projectMembers = [],
    workspaceMembers = [],
}: TaskDetailViewProps) {
    const { getToken } = useAuth();
    const { user } = useUser();
    const orgPrefix = user?.organization?.name
        ? user.organization.name
              .replace(/[^a-zA-Z]/g, '')
              .slice(0, 3)
              .toUpperCase() || 'TSK'
        : 'TSK';
    const formatTaskId = (taskNumber: number | null | undefined) =>
        taskNumber !== null && taskNumber !== undefined
            ? `${orgPrefix}-${String(taskNumber).padStart(3, '0')}`
            : null;
    const formattedTaskId = formatTaskId(task.taskNumber);
    const [comments, setComments] = useState<Comment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [linkedFiles, setLinkedFiles] = useState<Document[]>(
        task.linkedFiles ?? [],
    );
    const [linkDocOpen, setLinkDocOpen] = useState(false);
    const [orgDocuments, setOrgDocuments] = useState<Document[]>([]);
    const [isLoadingOrgDocs, setIsLoadingOrgDocs] = useState(false);
    const [docSearch, setDocSearch] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [newCommentContent, setNewCommentContent] = useState('');
    const [isNewCommentEmpty, setIsNewCommentEmpty] = useState(true);
    const [isCreatingThread, setIsCreatingThread] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isApprovalLoading, setIsApprovalLoading] = useState(false);
    const [localApprovalStatus, setLocalApprovalStatus] = useState<
        Task['approvalStatus'] | null
    >(null);
    const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
    const [rejectNote, setRejectNote] = useState('');
    const [activityLogOpen, setActivityLogOpen] = useState(false);
    const effectiveApprovalStatus =
        localApprovalStatus ?? task.approvalStatus ?? 'IN_PREPARATION';
    const newThreadInputRef = useRef<RichEditorHandle>(null);
    const threadStateBeforeUpload = useRef(false);

    // Merged, deduped list of users that can be @mentioned in comments
    const mentionableUsers = useMemo(() => {
        const seen = new Set<string>();
        return [...workspaceMembers, ...projectMembers].filter((u) => {
            if (seen.has(u.id)) return false;
            seen.add(u.id);
            return true;
        });
    }, [workspaceMembers, projectMembers]);

    // ── Attachment handlers ───────────────────────────────────────────────────
    const handleUploadFile = async (files: File[]) => {
        if (!user?.organizationId || !projectId || files.length === 0) return;
        setIsUploading(true);
        let successCount = 0;
        try {
            const token = await getToken();
            if (!token) return;
            for (const file of files) {
                try {
                    const documentId = await documentApi.uploadForTask(
                        token,
                        user.organizationId,
                        file,
                    );
                    const result = await taskApi.attachFile(
                        token,
                        projectId,
                        task.id,
                        documentId,
                    );
                    if (result.data)
                        setLinkedFiles(result.data.linkedFiles ?? []);
                    successCount++;
                } catch {
                    toast.error(`Failed to upload ${file.name}`);
                }
            }
            if (successCount > 0) setUploadDialogOpen(false);
        } catch {
            toast.error('Failed to upload files');
        } finally {
            setIsUploading(false);
        }
    };

    const handleRemoveFile = async (documentId: string) => {
        if (!projectId) return;
        const prev = linkedFiles;
        setLinkedFiles((f) => f.filter((d) => d.id !== documentId));
        try {
            const token = await getToken();
            if (!token) {
                setLinkedFiles(prev);
                return;
            }
            await taskApi.removeFile(token, projectId, task.id, documentId);
        } catch {
            setLinkedFiles(prev);
            toast.error('Failed to remove file');
        }
    };

    const handleDownloadFile = async (documentId: string) => {
        try {
            const token = await getToken();
            if (!token) return;
            const result = await documentApi.getDownloadUrl(token, documentId);
            if (result.data?.signedS3Url)
                window.open(result.data.signedS3Url, '_blank');
        } catch {
            toast.error('Failed to get download link');
        }
    };

    const handleOpenLinkDoc = async () => {
        setDocSearch('');
        setLinkDocOpen(true);
        if (orgDocuments.length > 0) return;
        if (!user?.organizationId) return;
        setIsLoadingOrgDocs(true);
        try {
            const token = await getToken();
            if (!token) return;
            const result = await documentApi.listForOrganization(
                token,
                user.organizationId,
            );
            setOrgDocuments(result.data?.documents ?? []);
        } catch {
            toast.error('Failed to load documents');
        } finally {
            setIsLoadingOrgDocs(false);
        }
    };

    const handleLinkDocument = async (doc: Document) => {
        if (!projectId) return;
        if (linkedFiles.some((f) => f.id === doc.id)) return;
        setLinkedFiles((prev) => [...prev, doc]);
        try {
            const token = await getToken();
            if (!token) return;
            await taskApi.attachFile(token, projectId, task.id, doc.id);
        } catch {
            setLinkedFiles((prev) => prev.filter((f) => f.id !== doc.id));
            toast.error('Failed to link document');
        }
    };

    // ── Approval workflow derived values ──────────────────────────────────────
    // Per-task chain: derived from approvalChain returned by the backend
    const approvalChain = task.approvalChain ?? [];
    // Reviewer-only entries (excludes PREPARER — which is display-only), sorted by stepOrder
    const reviewerChain = approvalChain
        .filter((e) => e.role === 'REVIEWER')
        .sort((a, b) => (a.stepOrder ?? 0) - (b.stepOrder ?? 0));
    // Task is locked for editing when it's under review or completed
    const isLocked =
        effectiveApprovalStatus === 'IN_REVIEW' ||
        effectiveApprovalStatus === 'COMPLETED';

    // ── Role-aware approval action logic ──────────────────────────────────────
    const preparerEntry = approvalChain.find((e) => e.role === 'PREPARER');
    // The reviewer whose turn it currently is (1-based currentStepIndex → 0-based reviewerChain)
    const activeReviewerEntry =
        effectiveApprovalStatus === 'IN_REVIEW' && task.currentStepIndex > 0
            ? reviewerChain[task.currentStepIndex - 1]
            : null;
    const isCurrentUserPreparer =
        !!preparerEntry?.user && preparerEntry.user.id === user?.id;
    const isCurrentUserActiveReviewer =
        !!activeReviewerEntry?.user && activeReviewerEntry.user.id === user?.id;
    // Anyone can submit from IN_PREPARATION (backend enforces this); highlight for preparer
    const canSubmit =
        effectiveApprovalStatus === 'IN_PREPARATION' &&
        (!preparerEntry?.user || isCurrentUserPreparer);
    const canReject = isCurrentUserActiveReviewer;

    // Name inline edit state
    const [nameValue, setNameValue] = useState(task.name);
    const [isEditingName, setIsEditingName] = useState(false);
    const nameRef = useRef<HTMLInputElement>(null);

    // Description inline edit state
    const [descValue, setDescValue] = useState(task.description || '');
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const descRef = useRef<HTMLTextAreaElement>(null);

    // Watch/notify state
    const [isWatching, setIsWatching] = useState(false);

    // ── Activity items derived from task data ──────────────────────────────────
    const activityItems = useMemo(() => {
        const items: Array<{
            id: string;
            type: 'created' | 'assigned' | 'field';
            text: string;
            timestamp: string;
        }> = [];

        items.push({
            id: 'created',
            type: 'created',
            text: 'Task was created',
            timestamp: task.createdAt,
        });

        const preparers = (task.approvalChain ?? [])
            .filter((e) => e.role === 'PREPARER' && e.user)
            .map((e) => e.user!);
        if (preparers.length > 0) {
            const names = preparers
                .map(
                    (p) =>
                        [p.firstName, p.lastName].filter(Boolean).join(' ') ||
                        p.email,
                )
                .join(', ');
            items.push({
                id: 'preparers',
                type: 'assigned',
                text: `Assigned to ${names}`,
                timestamp: task.createdAt,
            });
        }

        const reviewers = (task.approvalChain ?? [])
            .filter((e) => e.role === 'REVIEWER' && e.user)
            .map((e) => e.user!);
        if (reviewers.length > 0) {
            const names = reviewers
                .map(
                    (r) =>
                        [r.firstName, r.lastName].filter(Boolean).join(' ') ||
                        r.email,
                )
                .join(', ');
            items.push({
                id: 'reviewers',
                type: 'assigned',
                text: `${names} added as reviewers`,
                timestamp: task.createdAt,
            });
        }

        task.customFieldValues
            ?.filter((cfv) => cfv.value)
            .forEach((cfv) => {
                let displayValue = cfv.value;
                if (cfv.customField.dataType === 'DATE') {
                    try {
                        displayValue = format(
                            new Date(cfv.value),
                            'MMM d, yyyy',
                        );
                    } catch {
                        /* keep as-is */
                    }
                } else if (cfv.customField.dataType === 'USER') {
                    const allMembers = [...projectMembers, ...workspaceMembers];
                    const member = allMembers.find((m) => m.id === cfv.value);
                    if (member) {
                        displayValue =
                            [member.firstName, member.lastName]
                                .filter(Boolean)
                                .join(' ') || member.email;
                    }
                }
                items.push({
                    id: `cfv-${cfv.id}`,
                    type: 'field',
                    text: `Set ${cfv.customField.name} to ${displayValue}`,
                    timestamp: task.updatedAt,
                });
            });

        return items;
    }, [task, projectMembers, workspaceMembers]);

    const handleSaveDescription = async (value: string) => {
        const trimmed = value.trim();
        if (trimmed === (task.description || '')) {
            setIsEditingDesc(false);
            return;
        }
        try {
            const token = await getToken();
            if (!token) return;
            await taskApi.updateTask(token, task.projectId, task.id, {
                description: trimmed,
            });
            toast.success('Description updated');
        } catch {
            toast.error('Failed to update description');
            setDescValue(task.description || '');
        } finally {
            setIsEditingDesc(false);
        }
    };

    const handleSaveName = async (value: string) => {
        const trimmed = value.trim();
        if (!trimmed) {
            setNameValue(task.name);
            setIsEditingName(false);
            return;
        }
        if (trimmed === task.name) {
            setIsEditingName(false);
            return;
        }
        try {
            const token = await getToken();
            if (!token) return;
            await taskApi.updateTask(token, task.projectId, task.id, {
                name: trimmed,
            });
            toast.success('Task renamed');
        } catch {
            toast.error('Failed to rename task');
            setNameValue(task.name);
        } finally {
            setIsEditingName(false);
        }
    };

    const openCommentsCount = comments.filter((c) => !c.resolved).length;

    const loadComments = useCallback(
        async (showLoading = false) => {
            try {
                if (showLoading) setIsLoadingComments(true);
                const token = await getToken();
                if (!token) return;

                const response = await taskCommentApi.getCommentsByTask(
                    token,
                    task.projectId,
                    task.id,
                );

                const commentsData = (response.data ||
                    []) as unknown as CommentResponse[];

                interface CommentResponse {
                    id: string;
                    comment?: string;
                    content?: string;
                    postedAt?: string;
                    createdAt: string;
                    updatedAt?: string;
                    createdBy?: User;
                    postedByUser?: User;
                    user?: User;
                    resolved?: boolean;
                    resolvedBy?: User;
                    reactions?: Array<{
                        id: string;
                        emoji: string;
                        userId: string;
                        user: User;
                        commentId: string;
                        createdAt: string;
                    }>;
                    replies?: CommentResponse[];
                    parentCommentId?: string;
                }

                const transformComment = (c: CommentResponse): Comment => ({
                    id: c.id,
                    comment: c.comment || c.content || '',
                    createdAt: c.postedAt || c.createdAt,
                    updatedAt: c.updatedAt || c.createdAt,
                    user: c.createdBy ||
                        c.postedByUser ||
                        c.user || { id: '', email: '' },
                    resolved: c.resolved ?? false,
                    resolvedBy: c.resolvedBy,
                    reactions:
                        c.reactions?.map((r) => ({
                            id: r.id,
                            emoji: r.emoji,
                            userId: r.userId,
                            user: r.user,
                            commentId: r.commentId,
                            createdAt: r.createdAt,
                        })) || [],
                    replies: c.replies?.map(transformComment) || [],
                    parentId: c.parentCommentId,
                });

                const transformedComments: Comment[] = Array.isArray(
                    commentsData,
                )
                    ? commentsData.map(transformComment)
                    : [];

                setComments(transformedComments);
            } catch (error) {
                console.error('Failed to load comments:', error);
            } finally {
                if (showLoading) setIsLoadingComments(false);
            }
        },
        [getToken, task.projectId, task.id],
    );

    useEffect(() => {
        loadComments(true);
    }, [loadComments]);

    // Reset local approval status when server data arrives
    useEffect(() => {
        setLocalApprovalStatus(null);
    }, [task.approvalStatus]);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const token = await getToken();
                if (!token || cancelled) return;
                const res = await taskApi.getWatchStatus(
                    token,
                    task.projectId,
                    task.id,
                );
                if (!cancelled && res.data) setIsWatching(res.data.watching);
            } catch {
                // endpoint may not be available yet
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [task.id, task.projectId]);

    const handleDeleteTask = async () => {
        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            await taskApi.deleteTask(token, task.projectId, task.id);
            toast.success('Task deleted successfully');
            setDeleteDialogOpen(false);
            onDelete?.();
            onBack();
        } catch (error) {
            console.error('Failed to delete task:', error);
            toast.error('Failed to delete task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopyTask = async () => {
        try {
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }
            await taskApi.copyTask(token, task.projectId, task.id);
            toast.success('Task copied successfully');
            onUpdate?.();
        } catch (error) {
            console.error('Failed to copy task:', error);
            toast.error('Failed to copy task');
        }
    };

    const handleSubmitTask = async () => {
        const prevStatus = task.approvalStatus;
        setLocalApprovalStatus('IN_REVIEW');
        try {
            setIsApprovalLoading(true);
            const token = await getToken();
            if (!token) {
                setLocalApprovalStatus(prevStatus);
                return;
            }
            await approvalApi.submitTask(token, task.projectId, task.id);
            const nextStatus =
                reviewerChain.length === 0 ||
                task.currentStepIndex >= reviewerChain.length
                    ? 'Complete'
                    : `${task.currentStepIndex + 1}${ordinal(task.currentStepIndex + 1)} Level Review`;
            toast.success(`Task submitted — now at ${nextStatus}`);
            onUpdate?.();
        } catch (error) {
            console.error('Failed to submit task:', error);
            setLocalApprovalStatus(prevStatus);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to submit task',
            );
        } finally {
            setIsApprovalLoading(false);
        }
    };

    const handleRejectTask = async (note?: string) => {
        const prevStatus = task.approvalStatus;
        setLocalApprovalStatus('IN_PREPARATION');
        setRejectDialogOpen(false);
        setRejectNote('');
        try {
            setIsApprovalLoading(true);
            const token = await getToken();
            if (!token) {
                setLocalApprovalStatus(prevStatus);
                return;
            }
            await approvalApi.rejectTask(token, task.projectId, task.id, note);
            toast.success('Task returned for revision');
            onUpdate?.();
        } catch (error) {
            console.error('Failed to reject task:', error);
            setLocalApprovalStatus(prevStatus);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to reject task',
            );
        } finally {
            setIsApprovalLoading(false);
        }
    };

    const handleReopenTask = async () => {
        const prevStatus = task.approvalStatus;
        setLocalApprovalStatus('IN_PREPARATION');
        try {
            setIsApprovalLoading(true);
            const token = await getToken();
            if (!token) {
                setLocalApprovalStatus(prevStatus);
                return;
            }
            await approvalApi.reopenTask(token, task.projectId, task.id);
            toast.success('Task reopened');
            onUpdate?.();
        } catch (error) {
            console.error('Failed to reopen task:', error);
            setLocalApprovalStatus(prevStatus);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Failed to reopen task',
            );
        } finally {
            setIsApprovalLoading(false);
        }
    };

    const handleCreateComment = async () => {
        if (isNewCommentEmpty) return;

        const content = newCommentContent;
        const optimisticId = `optimistic-${Date.now()}`;
        const optimisticComment: Comment = {
            id: optimisticId,
            comment: content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user: {
                id: user?.id ?? '',
                email: user?.email ?? '',
                firstName: user?.firstName,
                lastName: user?.lastName,
            },
            resolved: false,
            replies: [],
            reactions: [],
        };

        // Update UI immediately
        setComments((prev) => [...prev, optimisticComment]);
        newThreadInputRef.current?.clear();
        setIsNewCommentEmpty(true);
        setNewCommentContent('');
        setIsCreatingThread(false);

        try {
            const token = await getToken();
            if (!token) {
                setComments((prev) =>
                    prev.filter((c) => c.id !== optimisticId),
                );
                toast.error('Authentication required');
                return;
            }
            await taskCommentApi.createComment(token, task.projectId, task.id, {
                comment: content,
            });
            loadComments();
        } catch (error) {
            setComments((prev) => prev.filter((c) => c.id !== optimisticId));
            console.error('Failed to create comment:', error);
            toast.error('Failed to start thread');
        }
    };

    return (
        <div className="flex flex-col flex-1 min-h-0 bg-dashboard-bg animate-in fade-in slide-in-from-bottom-4 duration-300">
            {/* ── Sticky Header ─────────────────────────────────────────────── */}
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-dashboard-border px-8 py-4 flex flex-col gap-3 shrink-0">
                {/* Back & Breadcrumbs */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onBack}
                        className="hover:bg-accent-hover text-dashboard-text-muted hover:text-dashboard-text-primary -ml-2 cursor-pointer"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div className="text-sm text-dashboard-text-muted flex items-center gap-2">
                        {workspaceId ? (
                            <Link
                                href={`/workspaces/${workspaceSlug ?? workspaceId}`}
                                className="hover:text-dashboard-text-primary hover:underline transition-colors cursor-pointer"
                            >
                                {workspaceName || 'Workspace'}
                            </Link>
                        ) : (
                            <span>{workspaceName || 'Workspace'}</span>
                        )}
                        <span className="text-(--dashboard-text-muted)/40">
                            /
                        </span>
                        {workspaceId && (projectId || task.projectId) ? (
                            <Link
                                href={`/workspaces/${workspaceSlug ?? workspaceId}/projects/${projectSlug ?? projectId ?? task.projectId}`}
                                className="hover:text-dashboard-text-primary hover:underline transition-colors cursor-pointer"
                            >
                                {projectName ||
                                    task.project?.description ||
                                    'Project'}
                            </Link>
                        ) : (
                            <span>
                                {projectName ||
                                    task.project?.description ||
                                    'Project'}
                            </span>
                        )}
                        <span className="text-(--dashboard-text-muted)/40">
                            /
                        </span>
                        <span className="font-medium text-dashboard-text-primary flex items-center gap-1.5">
                            {formattedTaskId && (
                                <span className="text-[10px] font-mono text-muted-foreground/60 shrink-0">
                                    {formattedTaskId}
                                </span>
                            )}
                            {task.name}
                        </span>
                    </div>
                </div>

                {/* Title & Actions */}
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                        {formattedTaskId && (
                            <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded shrink-0">
                                {formattedTaskId}
                            </span>
                        )}
                        {isEditingName ? (
                            <input
                                ref={nameRef}
                                value={nameValue}
                                autoFocus
                                onChange={(e) => setNameValue(e.target.value)}
                                onBlur={() => handleSaveName(nameValue)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        nameRef.current?.blur();
                                    }
                                    if (e.key === 'Escape') {
                                        setNameValue(task.name);
                                        setIsEditingName(false);
                                    }
                                }}
                                className="text-2xl font-serif font-semibold tracking-tight text-dashboard-text-primary leading-tight bg-transparent border-none outline-none w-full min-w-0 p-0"
                            />
                        ) : (
                            <h1
                                role={isLocked ? undefined : 'button'}
                                tabIndex={isLocked ? undefined : 0}
                                onClick={
                                    isLocked
                                        ? undefined
                                        : () => setIsEditingName(true)
                                }
                                onKeyDown={
                                    isLocked
                                        ? undefined
                                        : (e) => {
                                              if (
                                                  e.key === 'Enter' ||
                                                  e.key === ' '
                                              ) {
                                                  e.preventDefault();
                                                  setIsEditingName(true);
                                              }
                                          }
                                }
                                title={isLocked ? undefined : 'Click to rename'}
                                className={cn(
                                    'text-2xl font-serif font-semibold tracking-tight text-dashboard-text-primary leading-tight truncate',
                                    !isLocked && 'cursor-text',
                                )}
                            >
                                {nameValue}
                            </h1>
                        )}
                        {isLocked && (
                            <span
                                title="Task is locked for review"
                                className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200"
                            >
                                <Lock className="h-3 w-3" />
                                Locked
                            </span>
                        )}
                        <span
                            className={cn(
                                'shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                                effectiveApprovalStatus === 'COMPLETED' &&
                                    'bg-green-50 text-green-700 border-green-200',
                                effectiveApprovalStatus === 'IN_REVIEW' &&
                                    'bg-blue-50 text-blue-700 border-blue-200',
                                effectiveApprovalStatus === 'IN_PREPARATION' &&
                                    'bg-dashboard-surface text-dashboard-text-muted border-dashboard-border',
                            )}
                        >
                            {effectiveApprovalStatus === 'COMPLETED' && (
                                <CheckCircle2 className="h-3 w-3" />
                            )}
                            {effectiveApprovalStatus === 'IN_REVIEW' && (
                                <Lock className="h-3 w-3" />
                            )}
                            {effectiveApprovalStatus === 'IN_PREPARATION' && (
                                <CircleDot className="h-3 w-3" />
                            )}
                            {approvalStatusLabel(
                                effectiveApprovalStatus,
                                task.currentStepIndex,
                                reviewerChain.length,
                            )}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        {/* ── Prominent approval action buttons ─────────── */}
                        {canSubmit && (
                            <Button
                                size="sm"
                                className="cursor-pointer bg-accent-blue hover:bg-accent-light text-white"
                                onClick={handleSubmitTask}
                                disabled={isApprovalLoading}
                            >
                                <Send className="h-3.5 w-3.5 mr-1.5" />
                                Submit
                            </Button>
                        )}
                        {canReject && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="cursor-pointer border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                onClick={() => setRejectDialogOpen(true)}
                                disabled={isApprovalLoading}
                            >
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                                Reject
                            </Button>
                        )}
                        {effectiveApprovalStatus === 'COMPLETED' && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="cursor-pointer"
                                onClick={handleReopenTask}
                                disabled={isApprovalLoading}
                            >
                                <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                                Reopen Task
                            </Button>
                        )}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 cursor-pointer hover:bg-accent-hover"
                                >
                                    <MoreVertical className="h-5 w-5 text-dashboard-text-muted" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => setEditDialogOpen(true)}
                                    disabled={isLocked}
                                >
                                    <Edit2 className="h-4 w-4 mr-2" />
                                    Edit Task
                                    {isLocked && (
                                        <Lock className="h-3 w-3 ml-auto text-dashboard-text-muted" />
                                    )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={handleCopyTask}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Copy Task
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={async () => {
                                        const token = await getToken();
                                        if (!token) return;
                                        setIsWatching((w) => !w);
                                        try {
                                            const res =
                                                await taskApi.toggleWatch(
                                                    token,
                                                    task.projectId,
                                                    task.id,
                                                );
                                            if (res.data)
                                                setIsWatching(
                                                    res.data.watching,
                                                );
                                        } catch {
                                            setIsWatching((w) => !w);
                                            toast.error(
                                                'Failed to update notifications',
                                            );
                                        }
                                    }}
                                >
                                    <Bell
                                        className={cn(
                                            'h-4 w-4 mr-2',
                                            isWatching && 'fill-current',
                                        )}
                                    />
                                    {isWatching ? 'Watching' : 'Notify'}
                                </DropdownMenuItem>
                                {canSubmit && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={handleSubmitTask}
                                            disabled={isApprovalLoading}
                                        >
                                            <Send className="h-4 w-4 mr-2" />
                                            Submit
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {canReject && (
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setRejectDialogOpen(true)
                                        }
                                        disabled={isApprovalLoading}
                                        className="text-red-600 focus:text-red-600"
                                    >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Reject
                                    </DropdownMenuItem>
                                )}
                                {effectiveApprovalStatus === 'COMPLETED' && (
                                    <DropdownMenuItem
                                        onClick={handleReopenTask}
                                        disabled={isApprovalLoading}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Reopen Task
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => {
                                        const url = `${window.location.origin}${window.location.pathname}?taskId=${task.id}`;
                                        navigator.clipboard
                                            .writeText(url)
                                            .then(() =>
                                                toast.success(
                                                    'Link copied to clipboard',
                                                ),
                                            );
                                    }}
                                >
                                    <Link2 className="h-4 w-4 mr-2" />
                                    Share Link
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setActivityLogOpen(true)}
                                >
                                    <Activity className="h-4 w-4 mr-2" />
                                    Activity Log
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => setDeleteDialogOpen(true)}
                                    className="text-destructive focus:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete Task
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            {/* ── Two-column layout ──────────────────────────────────────────── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* Main scrollable content */}
                <div className="flex-1 min-w-0 overflow-y-auto p-8 flex flex-col gap-6">
                    {/* ── Comments ─────────────────────────────────────────── */}
                    <div>
                        {/* Section header */}
                        <div className="flex items-center justify-between mb-4 px-1">
                            <h3 className="font-serif font-semibold text-lg text-dashboard-text-primary flex items-center gap-2">
                                <span>Comments</span>
                                <Badge
                                    variant="secondary"
                                    className="rounded-full px-2 h-5 text-xs bg-accent-subtle text-accent-blue border-dashboard-border"
                                >
                                    {comments.length}
                                </Badge>
                            </h3>
                            {openCommentsCount > 0 && (
                                <Badge
                                    variant="outline"
                                    className="text-xs text-dashboard-text-muted border-dashboard-border font-normal"
                                >
                                    {openCommentsCount} open
                                </Badge>
                            )}
                        </div>

                        {/* Thread list */}
                        {isLoadingComments ? (
                            <div className="space-y-4 mb-4">
                                {[1, 2].map((i) => (
                                    <div
                                        key={i}
                                        className="flex gap-3 animate-pulse"
                                    >
                                        <div className="h-8 w-8 bg-accent-subtle rounded-full shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3.5 bg-accent-subtle rounded w-1/4" />
                                            <div className="h-12 bg-accent-subtle rounded-lg" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : comments.length > 0 ? (
                            <div className="space-y-4 mb-4">
                                {comments.map((comment, index) => (
                                    <CommentThread
                                        key={comment.id}
                                        index={index + 1}
                                        comment={comment}
                                        onUpdate={loadComments}
                                        taskId={task.id}
                                        projectId={task.projectId}
                                        onAttach={() =>
                                            setUploadDialogOpen(true)
                                        }
                                        mentionableUsers={mentionableUsers}
                                        onDeleteRoot={(id) =>
                                            setComments((prev) =>
                                                prev.filter((c) => c.id !== id),
                                            )
                                        }
                                        onUpdateRootContent={(id, content) =>
                                            setComments((prev) =>
                                                prev.map((c) =>
                                                    c.id === id
                                                        ? {
                                                              ...c,
                                                              comment: content,
                                                          }
                                                        : c,
                                                ),
                                            )
                                        }
                                        onToggleResolved={(id, resolved) =>
                                            setComments((prev) =>
                                                prev.map((c) =>
                                                    c.id === id
                                                        ? { ...c, resolved }
                                                        : c,
                                                ),
                                            )
                                        }
                                    />
                                ))}
                            </div>
                        ) : null}

                        {/* Comment input – Linear style */}
                        <div
                            className={cn(
                                'rounded-lg border bg-dashboard-surface transition-all duration-150 cursor-text',
                                isCreatingThread
                                    ? 'border-dashboard-border shadow-sm ring-1 ring-accent-blue/15'
                                    : 'border-dashboard-border hover:border-accent-blue/20',
                            )}
                            onClick={() => {
                                if (!isCreatingThread)
                                    newThreadInputRef.current?.focus();
                            }}
                        >
                            <div className="px-4 py-3">
                                <RichCommentEditor
                                    ref={newThreadInputRef}
                                    onContentChange={(html, empty) => {
                                        setNewCommentContent(html);
                                        setIsNewCommentEmpty(empty);
                                    }}
                                    onFocus={() => setIsCreatingThread(true)}
                                    onBlur={(empty) => {
                                        if (
                                            empty &&
                                            !threadStateBeforeUpload.current
                                        )
                                            setIsCreatingThread(false);
                                    }}
                                    onSubmit={handleCreateComment}
                                    onCancel={() => {
                                        newThreadInputRef.current?.clear();
                                        setIsCreatingThread(false);
                                    }}
                                    placeholder="Leave a comment…"
                                    showToolbar={isCreatingThread}
                                    mentionableUsers={mentionableUsers}
                                    toolbarActions={
                                        isCreatingThread ? (
                                            <div className="ml-auto flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => {
                                                        e.preventDefault();
                                                        threadStateBeforeUpload.current = true;
                                                    }}
                                                    onClick={() =>
                                                        setUploadDialogOpen(
                                                            true,
                                                        )
                                                    }
                                                    className="h-6 w-6 inline-flex items-center justify-center rounded transition-colors text-dashboard-text-muted hover:text-dashboard-text-primary hover:bg-accent-hover"
                                                    title="Attach file"
                                                >
                                                    <Paperclip className="h-3.5 w-3.5" />
                                                </button>
                                                <Button
                                                    size="icon"
                                                    className="h-6 w-6 bg-accent-blue text-white hover:bg-accent-light disabled:opacity-40"
                                                    onClick={
                                                        handleCreateComment
                                                    }
                                                    disabled={
                                                        isNewCommentEmpty ||
                                                        isSubmitting
                                                    }
                                                    title="Send (⌘↵)"
                                                >
                                                    <ArrowUp className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                        ) : undefined
                                    }
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Right Sidebar ──────────────────────────────────────────── */}
                <div className="w-72 xl:w-80 shrink-0 border-l border-dashboard-border bg-dashboard-surface overflow-y-auto flex flex-col">
                    {/* Description */}
                    <div className="px-5 py-5 border-b border-dashboard-border">
                        <div className="flex items-center gap-2 mb-3">
                            <AlignLeft className="h-3.5 w-3.5 text-dashboard-text-muted" />
                            <h4 className="text-xs font-semibold text-dashboard-text-muted uppercase tracking-wider">
                                Description
                            </h4>
                        </div>
                        {isEditingDesc ? (
                            <textarea
                                ref={descRef}
                                value={descValue}
                                autoFocus
                                onChange={(e) => {
                                    setDescValue(e.target.value);
                                    const el = e.currentTarget;
                                    el.style.height = 'auto';
                                    el.style.height = `${el.scrollHeight}px`;
                                }}
                                onBlur={() => handleSaveDescription(descValue)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Escape') {
                                        setDescValue(task.description || '');
                                        setIsEditingDesc(false);
                                    }
                                }}
                                className="w-full resize-none border-none focus:outline-none bg-accent-subtle/50 rounded px-2 py-1.5 text-sm text-dashboard-text-body leading-relaxed min-h-[80px]"
                            />
                        ) : (
                            <div
                                role={isLocked ? undefined : 'button'}
                                tabIndex={isLocked ? undefined : 0}
                                onClick={
                                    isLocked
                                        ? undefined
                                        : () => setIsEditingDesc(true)
                                }
                                onKeyDown={
                                    isLocked
                                        ? undefined
                                        : (e) => {
                                              if (
                                                  e.key === 'Enter' ||
                                                  e.key === ' '
                                              ) {
                                                  e.preventDefault();
                                                  setIsEditingDesc(true);
                                              }
                                          }
                                }
                                className={cn(
                                    'group',
                                    isLocked ? 'cursor-default' : 'cursor-text',
                                )}
                                title={
                                    isLocked
                                        ? 'Task is locked for review'
                                        : 'Click to edit description'
                                }
                            >
                                <p
                                    className={cn(
                                        'text-sm leading-relaxed whitespace-pre-line rounded px-1 py-0.5 -mx-1 transition-colors',
                                        !isLocked &&
                                            'group-hover:bg-accent-subtle/50',
                                        descValue
                                            ? 'text-dashboard-text-body'
                                            : 'text-dashboard-text-muted/50 italic',
                                    )}
                                >
                                    {descValue || 'Add a description…'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Properties / Custom Fields */}
                    <div className="px-5 py-5 border-b border-dashboard-border">
                        <div className="flex items-center gap-2 mb-4">
                            <SlidersHorizontal className="h-3.5 w-3.5 text-dashboard-text-muted" />
                            <h4 className="text-xs font-semibold text-dashboard-text-muted uppercase tracking-wider">
                                Properties
                            </h4>
                            {customFields.length > 0 && (
                                <span className="ml-auto text-xs text-dashboard-text-muted/50">
                                    {customFields.length}
                                </span>
                            )}
                        </div>

                        {customFields.length > 0 ? (
                            <div className="flex flex-col">
                                {customFields
                                    .slice()
                                    .sort((a, b) => a.order - b.order)
                                    .map((field) => {
                                        const cfv =
                                            task.customFieldValues?.find(
                                                (v) =>
                                                    v.customFieldId ===
                                                    field.id,
                                            );
                                        const raw = cfv?.value ?? null;

                                        let displayValue: string;
                                        if (!raw) {
                                            displayValue = '—';
                                        } else if (field.dataType === 'DATE') {
                                            try {
                                                displayValue = format(
                                                    new Date(raw),
                                                    'MMM d, yyyy',
                                                );
                                            } catch {
                                                displayValue = raw;
                                            }
                                        } else if (field.dataType === 'USER') {
                                            const member = projectMembers.find(
                                                (m) => m.id === raw,
                                            );
                                            displayValue = member
                                                ? [
                                                      member.firstName,
                                                      member.lastName,
                                                  ]
                                                      .filter(Boolean)
                                                      .join(' ') || member.email
                                                : raw;
                                        } else {
                                            displayValue = raw;
                                        }

                                        return (
                                            <div
                                                key={field.id}
                                                className="flex items-start justify-between gap-3 py-3 border-b border-dashboard-border/50 last:border-0"
                                            >
                                                <div className="flex flex-col gap-0.5 min-w-0 shrink-0 max-w-[45%]">
                                                    <span className="text-[11px] font-medium text-dashboard-text-muted truncate">
                                                        {field.name}
                                                    </span>
                                                    <span className="text-[10px] text-dashboard-text-muted/50 capitalize">
                                                        {field.dataType.toLowerCase()}
                                                    </span>
                                                </div>
                                                <span
                                                    className={cn(
                                                        'text-xs font-medium text-right max-w-[50%] break-words',
                                                        raw
                                                            ? 'text-dashboard-text-body'
                                                            : 'text-dashboard-text-muted/40 italic',
                                                    )}
                                                >
                                                    {displayValue}
                                                </span>
                                            </div>
                                        );
                                    })}
                            </div>
                        ) : (
                            <p className="text-xs text-dashboard-text-muted/50 italic">
                                No properties configured
                            </p>
                        )}
                    </div>

                    {/* Attachments */}
                    <div className="px-5 py-4 flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <Paperclip className="h-3.5 w-3.5 text-dashboard-text-muted" />
                            <h4 className="text-xs font-semibold text-dashboard-text-muted uppercase tracking-wider">
                                Attachments
                            </h4>
                            {isLocked && (
                                <Lock className="h-3 w-3 text-dashboard-text-muted ml-1" />
                            )}
                            {!isLocked && (
                                <div className="ml-auto flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={handleOpenLinkDoc}
                                        title="Link from library"
                                        className="h-5 w-5 text-dashboard-text-muted hover:text-accent-blue"
                                    >
                                        <Library className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            setUploadDialogOpen(true)
                                        }
                                        title="Upload file"
                                        className="h-5 w-5 text-dashboard-text-muted hover:text-accent-blue"
                                    >
                                        <Upload className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                        </div>
                        {linkedFiles.length > 0 ? (
                            <div className="flex flex-col gap-1.5">
                                {linkedFiles.map((file) => (
                                    <div
                                        key={file.id}
                                        className="group flex items-center gap-2 p-2 rounded-lg border border-dashboard-border hover:border-accent-blue/30 hover:bg-accent-hover transition-all"
                                    >
                                        <button
                                            className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                                            onClick={() =>
                                                handleDownloadFile(file.id)
                                            }
                                        >
                                            <div className="h-7 w-7 bg-accent-subtle rounded-md flex items-center justify-center text-accent-blue shrink-0">
                                                <FileText className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="min-w-0 text-left">
                                                <p className="font-medium text-xs text-dashboard-text-body group-hover:text-accent-blue transition-colors truncate">
                                                    {file.originalName}
                                                </p>
                                                <p className="text-[10px] text-dashboard-text-muted">
                                                    {(
                                                        file.filesize / 1024
                                                    ).toFixed(0)}{' '}
                                                    KB
                                                </p>
                                            </div>
                                        </button>
                                        {!isLocked && (
                                            <button
                                                onClick={() =>
                                                    handleRemoveFile(file.id)
                                                }
                                                className="opacity-0 group-hover:opacity-100 shrink-0 text-dashboard-text-muted hover:text-destructive transition-all cursor-pointer"
                                            >
                                                <XCircle className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : isLocked ? (
                            <p className="text-xs text-dashboard-text-muted text-center py-3">
                                No attachments
                            </p>
                        ) : (
                            <button
                                onClick={() => setUploadDialogOpen(true)}
                                className="w-full py-3 text-center border border-dashed border-dashboard-border rounded-lg text-xs text-dashboard-text-muted hover:text-accent-blue hover:border-accent-blue/40 transition-colors cursor-pointer"
                            >
                                Upload a file
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Upload Dialog ─────────────────────────────────────────────── */}
            <Dialog
                open={uploadDialogOpen}
                onOpenChange={(open) => {
                    setUploadDialogOpen(open);
                    if (!open && threadStateBeforeUpload.current) {
                        threadStateBeforeUpload.current = false;
                        setIsCreatingThread(true);
                        requestAnimationFrame(() =>
                            newThreadInputRef.current?.focus(),
                        );
                    }
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload Files</DialogTitle>
                        <DialogDescription>
                            Attach files to this task.
                        </DialogDescription>
                    </DialogHeader>
                    <div
                        className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-dashboard-border rounded-lg cursor-pointer hover:border-accent-blue/40 hover:bg-accent-subtle/20 transition-colors"
                        onClick={() =>
                            !isUploading && fileInputRef.current?.click()
                        }
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            const files = Array.from(e.dataTransfer.files);
                            if (files.length > 0) handleUploadFile(files);
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                const files = Array.from(e.target.files ?? []);
                                if (files.length > 0) handleUploadFile(files);
                                e.target.value = '';
                            }}
                        />
                        {isUploading ? (
                            <>
                                <div className="h-8 w-8 rounded-full border-2 border-accent-blue border-t-transparent animate-spin mb-3" />
                                <p className="text-sm text-dashboard-text-muted">
                                    Uploading…
                                </p>
                            </>
                        ) : (
                            <>
                                <Upload className="h-8 w-8 text-dashboard-text-muted mb-3" />
                                <p className="text-sm font-medium text-dashboard-text-body">
                                    Click or drag files here
                                </p>
                                <p className="text-xs text-dashboard-text-muted mt-1">
                                    Any file type supported
                                </p>
                            </>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setUploadDialogOpen(false)}
                            disabled={isUploading}
                        >
                            Cancel
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Link from Library Dialog ──────────────────────────────── */}
            <Dialog open={linkDocOpen} onOpenChange={setLinkDocOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>Link from Library</DialogTitle>
                        <DialogDescription>
                            Select documents from your organization to attach to
                            this task.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-dashboard-text-muted pointer-events-none" />
                        <Input
                            placeholder="Search documents…"
                            value={docSearch}
                            onChange={(e) => setDocSearch(e.target.value)}
                            className="pl-8 h-8 text-sm"
                        />
                    </div>
                    <div className="max-h-72 overflow-y-auto space-y-1">
                        {isLoadingOrgDocs ? (
                            <div className="py-8 flex items-center justify-center">
                                <div className="h-5 w-5 rounded-full border-2 border-accent-blue border-t-transparent animate-spin" />
                            </div>
                        ) : (
                            (() => {
                                const filtered = orgDocuments.filter((d) =>
                                    d.originalName
                                        .toLowerCase()
                                        .includes(docSearch.toLowerCase()),
                                );
                                if (filtered.length === 0) {
                                    return (
                                        <p className="py-8 text-center text-sm text-dashboard-text-muted">
                                            No documents found.
                                        </p>
                                    );
                                }
                                return filtered.map((doc) => {
                                    const already = linkedFiles.some(
                                        (f) => f.id === doc.id,
                                    );
                                    return (
                                        <button
                                            key={doc.id}
                                            onClick={() =>
                                                handleLinkDocument(doc)
                                            }
                                            disabled={already}
                                            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg hover:bg-accent-subtle/40 disabled:opacity-50 disabled:cursor-default transition-colors text-left"
                                        >
                                            <div className="h-7 w-7 bg-accent-subtle rounded-md flex items-center justify-center text-accent-blue shrink-0">
                                                <FileText className="h-3.5 w-3.5" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-medium text-dashboard-text-body truncate">
                                                    {doc.originalName}
                                                </p>
                                                <p className="text-[10px] text-dashboard-text-muted">
                                                    {(
                                                        doc.filesize / 1024
                                                    ).toFixed(0)}{' '}
                                                    KB
                                                </p>
                                            </div>
                                            {already && (
                                                <Check className="h-3.5 w-3.5 text-accent-blue shrink-0" />
                                            )}
                                        </button>
                                    );
                                });
                            })()
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setLinkDocOpen(false)}
                        >
                            Done
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <EditTaskDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                task={task}
                onSuccess={onUpdate || (() => {})}
            />

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Task</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this task? This
                            action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteTask}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Deleting...' : 'Delete Task'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Activity Log Dialog ────────────────────────────────────── */}
            <Dialog open={activityLogOpen} onOpenChange={setActivityLogOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Activity className="h-4 w-4 text-dashboard-text-muted" />
                            Activity Log
                        </DialogTitle>
                        <DialogDescription>
                            Recent activity for <strong>{task.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[360px] overflow-y-auto -mx-1 py-2">
                        {activityItems.length > 0 ? (
                            <div className="relative">
                                <div className="absolute left-[13px] top-2 bottom-2 w-px bg-dashboard-border" />
                                <div className="flex flex-col gap-0">
                                    {activityItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className="flex items-start gap-3 px-2 py-2.5 rounded-md hover:bg-dashboard-surface transition-colors"
                                        >
                                            <div
                                                className={cn(
                                                    'relative z-10 mt-0.5 flex h-3 w-3 shrink-0 items-center justify-center rounded-full ring-2 ring-dashboard-bg',
                                                    item.type === 'created' &&
                                                        'bg-accent-blue',
                                                    item.type === 'assigned' &&
                                                        'bg-dashboard-text-muted',
                                                    item.type === 'field' &&
                                                        'bg-dashboard-border border border-dashboard-border bg-dashboard-surface',
                                                )}
                                            >
                                                {item.type === 'created' && (
                                                    <CircleDot className="h-2 w-2 text-white" />
                                                )}
                                                {item.type === 'assigned' && (
                                                    <UserCheck className="h-2 w-2 text-white" />
                                                )}
                                                {item.type === 'field' && (
                                                    <SlidersHorizontal className="h-1.5 w-1.5 text-dashboard-text-muted" />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-dashboard-text-body">
                                                    {item.text}
                                                </p>
                                                <p className="text-xs text-dashboard-text-muted mt-0.5">
                                                    {formatRelativeTime(
                                                        new Date(
                                                            item.timestamp,
                                                        ),
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="py-10 text-center">
                                <Activity className="h-8 w-8 mx-auto text-dashboard-text-muted/30 mb-2" />
                                <p className="text-sm text-dashboard-text-muted">
                                    No activity yet
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setActivityLogOpen(false)}
                        >
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Reject / Return Dialog ─────────────────────────────────── */}
            <Dialog
                open={rejectDialogOpen}
                onOpenChange={(open) => {
                    setRejectDialogOpen(open);
                    if (!open) setRejectNote('');
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Return for Revision</DialogTitle>
                        <DialogDescription>
                            The task will be returned to the preparer. Add an
                            optional note explaining what needs to be corrected
                            — it will be posted as a comment.
                        </DialogDescription>
                    </DialogHeader>
                    <textarea
                        value={rejectNote}
                        onChange={(e) => setRejectNote(e.target.value)}
                        placeholder="Rejection note (optional)…"
                        rows={4}
                        className="w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setRejectDialogOpen(false);
                                setRejectNote('');
                            }}
                            disabled={isApprovalLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() =>
                                handleRejectTask(rejectNote || undefined)
                            }
                            disabled={isApprovalLoading}
                        >
                            Return for Revision
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// ─── CommentBubble ─────────────────────────────────────────────────────────────
// Renders a single comment (reply) inside a CommentThread card row.
// Uses named-group (group/bubble) to scope hover actions.
function CommentBubble({
    comment,
    isResolutionTarget = false,
    onUpdate,
    taskId,
    projectId,
    onResolve,
    mentionableUsers = [],
    onDeleteReply,
    onUpdateReplyContent,
}: {
    comment: Comment;
    isResolutionTarget?: boolean;
    onUpdate: () => void;
    taskId: string;
    projectId: string;
    onResolve?: () => void;
    mentionableUsers?: User[];
    onDeleteReply?: (replyId: string) => void;
    onUpdateReplyContent?: (replyId: string, content: string) => void;
}) {
    const { getToken, userId } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [isEditEmpty, setIsEditEmpty] = useState(false);
    const editRef = useRef<RichEditorHandle>(null);
    const [localReactions, setLocalReactions] = useState<TaskCommentReaction[]>(
        comment.reactions ?? [],
    );

    useEffect(() => {
        setLocalReactions(comment.reactions ?? []);
    }, [comment.reactions]);

    const handleSaveEdit = async () => {
        if (isEditEmpty) return;
        onUpdateReplyContent?.(comment.id, editContent);
        setIsEditing(false);
        try {
            const token = await getToken();
            if (!token) {
                onUpdate();
                return;
            }
            await taskCommentApi.updateComment(
                token,
                projectId,
                taskId,
                comment.id,
                editContent,
            );
            onUpdate();
        } catch {
            onUpdate();
            toast.error('Failed to update comment');
        }
    };

    const handleDelete = async () => {
        onDeleteReply?.(comment.id);
        try {
            const token = await getToken();
            if (!token) {
                onUpdate();
                return;
            }
            await taskCommentApi.deleteComment(
                token,
                projectId,
                taskId,
                comment.id,
            );
            onUpdate();
        } catch {
            onUpdate();
            toast.error('Failed to delete comment');
        }
    };

    const reactionGroups = localReactions.reduce(
        (acc, reaction) => {
            if (!acc[reaction.emoji]) acc[reaction.emoji] = [];
            acc[reaction.emoji]!.push(reaction);
            return acc;
        },
        {} as Record<string, TaskCommentReaction[]>,
    );

    const handleReaction = async (emoji: string) => {
        const alreadyReacted = localReactions.some(
            (r) => r.emoji === emoji && r.userId === userId,
        );
        const prev = localReactions;
        if (alreadyReacted) {
            setLocalReactions((rs) =>
                rs.filter((r) => !(r.emoji === emoji && r.userId === userId)),
            );
        } else {
            const optimistic: TaskCommentReaction = {
                id: `optimistic-${Date.now()}`,
                emoji,
                userId: userId ?? '',
                user: { id: userId ?? '', email: '' },
                commentId: comment.id,
                createdAt: new Date().toISOString(),
            };
            setLocalReactions((rs) => [...rs, optimistic]);
        }
        try {
            const token = await getToken();
            if (!token) return;
            await taskCommentApi.toggleReaction(
                token,
                projectId,
                taskId,
                comment.id,
                emoji,
            );
            onUpdate();
        } catch {
            setLocalReactions(prev);
            toast.error('Failed to update reaction');
        }
    };

    const commentContent = comment.comment || '';
    const relativeTime = formatRelativeTime(new Date(comment.createdAt));

    return (
        <div className="group/bubble relative flex items-start gap-3 min-w-0">
            <Avatar className="h-7 w-7 border border-dashboard-border shrink-0 mt-0.5">
                <AvatarFallback className="bg-accent-subtle text-accent-blue text-xs font-medium">
                    {comment.user.firstName?.[0]}
                    {comment.user.lastName?.[0]}
                </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="font-medium text-sm text-dashboard-text-primary">
                        {comment.user.firstName} {comment.user.lastName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {relativeTime}
                    </span>
                    {isResolutionTarget && (
                        <Badge
                            className="h-4 px-1.5 text-[10px] font-medium rounded-sm bg-green-50 text-green-700 border-green-200"
                            variant="outline"
                        >
                            Resolved this
                        </Badge>
                    )}
                </div>

                {isEditing ? (
                    <RichCommentEditor
                        ref={editRef}
                        initialContent={comment.comment || ''}
                        onContentChange={(html, empty) => {
                            setEditContent(html);
                            setIsEditEmpty(empty);
                        }}
                        onSubmit={handleSaveEdit}
                        onCancel={() => setIsEditing(false)}
                        showToolbar
                        mentionableUsers={mentionableUsers}
                    />
                ) : (
                    <div
                        className="text-sm text-dashboard-text-body leading-relaxed wrap-break-word [&_b]:font-bold [&_strong]:font-bold [&_u]:underline [&_s]:line-through [&_strike]:line-through [&_img]:max-w-full [&_img]:rounded-md [&_img]:mt-1 [&_img]:block [&_img]:cursor-zoom-in [&_.mention]:text-accent-blue [&_.mention]:font-medium [&_.mention]:bg-accent-subtle [&_.mention]:px-1 [&_.mention]:rounded [&_.mention]:text-xs"
                        dangerouslySetInnerHTML={{
                            __html: sanitizeCommentHtml(commentContent),
                        }}
                    />
                )}

                {Object.keys(reactionGroups).length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(reactionGroups).map(
                            ([emoji, reactions]) => {
                                const hasReacted = reactions?.some(
                                    (r) => r.userId === userId,
                                );
                                return (
                                    <button
                                        key={emoji}
                                        onClick={() => handleReaction(emoji)}
                                        className={cn(
                                            'inline-flex items-center gap-0.5 h-5 px-1.5 rounded-full text-[11px] border transition-colors cursor-pointer',
                                            hasReacted
                                                ? 'bg-accent-subtle border-accent-blue/30 text-accent-blue'
                                                : 'bg-transparent border-dashboard-border text-dashboard-text-muted hover:bg-accent-hover',
                                        )}
                                    >
                                        <span>{emoji}</span>
                                        <span className="font-medium">
                                            {reactions?.length}
                                        </span>
                                    </button>
                                );
                            },
                        )}
                    </div>
                )}
            </div>

            {/* Hover action pill */}
            <div
                className={cn(
                    'absolute right-0 top-0 z-10',
                    'flex items-center gap-0.5 px-0.5 py-0.5',
                    'bg-background border border-dashboard-border rounded-md shadow-sm',
                    'opacity-0 group-hover/bubble:opacity-100 transition-opacity duration-100',
                )}
            >
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-dashboard-text-muted hover:text-dashboard-text-primary"
                            title="Add reaction"
                        >
                            <SmilePlus className="h-3.5 w-3.5" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto p-1"
                        side="top"
                        align="end"
                    >
                        <div className="flex gap-0.5">
                            {[
                                '👍',
                                '👎',
                                '😄',
                                '🎉',
                                '😕',
                                '❤️',
                                '🚀',
                                '👀',
                            ].map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => handleReaction(emoji)}
                                    className="p-1.5 hover:bg-accent-hover rounded text-base leading-none transition-colors cursor-pointer"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </PopoverContent>
                </Popover>

                {onResolve && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-dashboard-text-muted hover:text-green-600"
                        onClick={onResolve}
                        title="Resolve thread"
                    >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                    </Button>
                )}

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-dashboard-text-muted hover:text-dashboard-text-primary"
                        >
                            <MoreHorizontal className="h-3.5 w-3.5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem onClick={() => setIsEditing(true)}>
                            <Edit2 className="h-3.5 w-3.5 mr-2" />
                            Edit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={handleDelete}
                        >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}

// ─── CommentThread ─────────────────────────────────────────────────────────────
// Linear-style card: root comment → replies → reply input. Collapsible.
function CommentThread({
    comment,
    index,
    onUpdate,
    taskId,
    projectId,
    onAttach,
    mentionableUsers = [],
    onDeleteRoot,
    onUpdateRootContent,
    onToggleResolved,
}: {
    comment: Comment;
    index: number;
    onUpdate: () => void;
    taskId: string;
    projectId: string;
    onAttach?: () => void;
    mentionableUsers?: User[];
    onDeleteRoot?: (commentId: string) => void;
    onUpdateRootContent?: (commentId: string, content: string) => void;
    onToggleResolved?: (commentId: string, resolved: boolean) => void;
}) {
    const { getToken, userId } = useAuth();
    const { user: currentUser } = useUser();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const [isReplyEmpty, setIsReplyEmpty] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isReplyFocused, setIsReplyFocused] = useState(false);
    const replyInputRef = useRef<RichEditorHandle>(null);
    const [isEditingRoot, setIsEditingRoot] = useState(false);
    const [editRootContent, setEditRootContent] = useState('');
    const [isEditRootEmpty, setIsEditRootEmpty] = useState(false);
    const editRootRef = useRef<RichEditorHandle>(null);

    const handleSaveRootEdit = async () => {
        if (isEditRootEmpty) return;
        onUpdateRootContent?.(comment.id, editRootContent);
        setIsEditingRoot(false);
        try {
            const token = await getToken();
            if (!token) {
                onUpdate();
                return;
            }
            await taskCommentApi.updateComment(
                token,
                projectId,
                taskId,
                comment.id,
                editRootContent,
            );
            onUpdate();
        } catch {
            onUpdate();
            toast.error('Failed to update comment');
        }
    };

    const handleDeleteRoot = async () => {
        onDeleteRoot?.(comment.id);
        try {
            const token = await getToken();
            if (!token) {
                onUpdate();
                return;
            }
            await taskCommentApi.deleteComment(
                token,
                projectId,
                taskId,
                comment.id,
            );
            onUpdate();
        } catch {
            onUpdate();
            toast.error('Failed to delete comment');
        }
    };
    const [localReplies, setLocalReplies] = useState<Comment[]>(
        comment.replies ?? [],
    );

    // Sync local replies when parent refreshes with real server data
    useEffect(() => {
        setLocalReplies(comment.replies ?? []);
    }, [comment.replies]);

    // Optimistic reply state
    const [deletedReplyIds, setDeletedReplyIds] = useState<Set<string>>(
        new Set(),
    );
    const [replyContentOverrides, setReplyContentOverrides] = useState<
        Record<string, string>
    >({});

    const isResolved = comment.resolved;
    const replies = localReplies.filter((r) => !deletedReplyIds.has(r.id));

    const [localRootReactions, setLocalRootReactions] = useState<
        TaskCommentReaction[]
    >(comment.reactions ?? []);

    useEffect(() => {
        setLocalRootReactions(comment.reactions ?? []);
    }, [comment.reactions]);

    const rootReactionGroups = localRootReactions.reduce(
        (acc, reaction) => {
            if (!acc[reaction.emoji]) acc[reaction.emoji] = [];
            acc[reaction.emoji]!.push(reaction);
            return acc;
        },
        {} as Record<string, TaskCommentReaction[]>,
    );

    const handleRootReaction = async (emoji: string) => {
        const alreadyReacted = localRootReactions.some(
            (r) => r.emoji === emoji && r.userId === userId,
        );
        const prev = localRootReactions;
        if (alreadyReacted) {
            setLocalRootReactions((rs) =>
                rs.filter((r) => !(r.emoji === emoji && r.userId === userId)),
            );
        } else {
            const optimistic: TaskCommentReaction = {
                id: `optimistic-${Date.now()}`,
                emoji,
                userId: userId ?? '',
                user: { id: userId ?? '', email: '' },
                commentId: comment.id,
                createdAt: new Date().toISOString(),
            };
            setLocalRootReactions((rs) => [...rs, optimistic]);
        }
        try {
            const token = await getToken();
            if (!token) return;
            await taskCommentApi.toggleReaction(
                token,
                projectId,
                taskId,
                comment.id,
                emoji,
            );
            onUpdate();
        } catch {
            setLocalRootReactions(prev);
            toast.error('Failed to update reaction');
        }
    };

    const handleResolve = async () => {
        onToggleResolved?.(comment.id, true);
        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (!token) {
                onToggleResolved?.(comment.id, false);
                return;
            }
            await taskCommentApi.resolveComment(
                token,
                projectId,
                taskId,
                comment.id,
            );
            toast.success('Thread resolved');
            onUpdate();
        } catch {
            onToggleResolved?.(comment.id, false);
            toast.error('Failed to resolve thread');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReopen = async () => {
        onToggleResolved?.(comment.id, false);
        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (!token) {
                onToggleResolved?.(comment.id, true);
                return;
            }
            await taskCommentApi.reopenComment(
                token,
                projectId,
                taskId,
                comment.id,
            );
            toast.success('Thread reopened');
            onUpdate();
        } catch {
            onToggleResolved?.(comment.id, true);
            toast.error('Failed to reopen thread');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReply = async () => {
        if (isReplyEmpty) return;

        const content = replyContent;
        const optimisticId = `optimistic-${Date.now()}`;
        const optimisticReply: Comment = {
            id: optimisticId,
            comment: content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            user: {
                id: currentUser?.id ?? '',
                email: currentUser?.email ?? '',
                firstName: currentUser?.firstName,
                lastName: currentUser?.lastName,
            },
            resolved: false,
            replies: [],
            reactions: [],
            parentId: comment.id,
        };

        // Update UI immediately
        setLocalReplies((prev) => [...prev, optimisticReply]);
        replyInputRef.current?.clear();
        setReplyContent('');
        setIsReplyFocused(false);

        try {
            const token = await getToken();
            if (!token) {
                setLocalReplies((prev) =>
                    prev.filter((r) => r.id !== optimisticId),
                );
                toast.error('Authentication required');
                return;
            }
            await taskCommentApi.createComment(token, projectId, taskId, {
                comment: content,
                parentId: comment.id,
            });
            onUpdate();
        } catch {
            setLocalReplies((prev) =>
                prev.filter((r) => r.id !== optimisticId),
            );
            toast.error('Failed to add reply');
        }
    };

    const rootRelativeTime = formatRelativeTime(new Date(comment.createdAt));

    return (
        <div
            className={cn(
                'rounded-lg border overflow-hidden shadow-sm',
                'animate-in fade-in slide-in-from-bottom-2 duration-200',
                isResolved
                    ? 'border-dashboard-border/50 bg-dashboard-surface/60'
                    : 'border-dashboard-border bg-dashboard-surface',
            )}
        >
            {/* ── Root comment ─────────────────────────────────────── */}
            <div className="group/root relative px-4 pt-3 pb-3">
                <div className="flex items-start gap-3">
                    <Avatar className="h-7 w-7 border border-dashboard-border shrink-0 mt-0.5">
                        <AvatarFallback className="bg-accent-subtle text-accent-blue text-xs font-medium">
                            {comment.user.firstName?.[0]}
                            {comment.user.lastName?.[0]}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-mono text-dashboard-text-muted/60 select-none">
                                #{index}
                            </span>
                            <span className="font-medium text-sm text-dashboard-text-primary">
                                {comment.user.firstName} {comment.user.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                                {rootRelativeTime}
                            </span>
                            {isCollapsed && !isResolved && (
                                <span className="text-xs text-muted-foreground/60">
                                    {replies.length > 0
                                        ? `· ${replies.length} ${replies.length === 1 ? 'reply' : 'replies'}`
                                        : '· no replies'}
                                </span>
                            )}
                        </div>

                        {isCollapsed && (
                            <p className="text-sm text-dashboard-text-muted truncate">
                                {(comment.comment || '')
                                    .replace(/<[^>]*>/g, '')
                                    .trim()
                                    .slice(0, 120) || ''}
                            </p>
                        )}

                        {!isCollapsed && (
                            <>
                                {isEditingRoot ? (
                                    <RichCommentEditor
                                        ref={editRootRef}
                                        initialContent={comment.comment || ''}
                                        onContentChange={(html, empty) => {
                                            setEditRootContent(html);
                                            setIsEditRootEmpty(empty);
                                        }}
                                        onSubmit={handleSaveRootEdit}
                                        onCancel={() => setIsEditingRoot(false)}
                                        showToolbar
                                        mentionableUsers={mentionableUsers}
                                    />
                                ) : (
                                    <div
                                        className="text-sm text-dashboard-text-body leading-relaxed wrap-break-word [&_b]:font-bold [&_strong]:font-bold [&_u]:underline [&_s]:line-through [&_strike]:line-through"
                                        dangerouslySetInnerHTML={{
                                            __html: sanitizeCommentHtml(
                                                comment.comment || '',
                                            ),
                                        }}
                                    />
                                )}
                                {Object.keys(rootReactionGroups).length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                        {Object.entries(rootReactionGroups).map(
                                            ([emoji, reactions]) => {
                                                const hasReacted =
                                                    reactions?.some(
                                                        (r) =>
                                                            r.userId === userId,
                                                    );
                                                return (
                                                    <button
                                                        key={emoji}
                                                        onClick={() =>
                                                            handleRootReaction(
                                                                emoji,
                                                            )
                                                        }
                                                        className={cn(
                                                            'inline-flex items-center gap-0.5 h-5 px-1.5 rounded-full text-[11px] border transition-colors cursor-pointer',
                                                            hasReacted
                                                                ? 'bg-accent-subtle border-accent-blue/30 text-accent-blue'
                                                                : 'bg-transparent border-dashboard-border text-dashboard-text-muted hover:bg-accent-hover',
                                                        )}
                                                    >
                                                        <span>{emoji}</span>
                                                        <span className="font-medium">
                                                            {reactions?.length}
                                                        </span>
                                                    </button>
                                                );
                                            },
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* Collapse toggle – always visible */}
                    <button
                        onClick={() => setIsCollapsed((c) => !c)}
                        className="shrink-0 h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-dashboard-text-primary hover:bg-accent-hover transition-colors cursor-pointer"
                        title={
                            isCollapsed ? 'Expand thread' : 'Collapse thread'
                        }
                    >
                        <ChevronDown
                            className={cn(
                                'h-3.5 w-3.5 transition-transform duration-200',
                                isCollapsed ? '' : 'rotate-180',
                            )}
                        />
                    </button>
                </div>

                {/* Hover actions for root comment – offset left of collapse button */}
                {!isCollapsed && (
                    <div
                        className={cn(
                            'absolute right-12 top-2 z-10',
                            'flex items-center gap-0.5 px-0.5 py-0.5',
                            'bg-background border border-dashboard-border rounded-md shadow-sm',
                            'opacity-0 group-hover/root:opacity-100 transition-opacity duration-100',
                        )}
                    >
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-dashboard-text-muted hover:text-dashboard-text-primary"
                                    title="Add reaction"
                                >
                                    <SmilePlus className="h-3.5 w-3.5" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto p-1"
                                side="top"
                                align="end"
                            >
                                <div className="flex gap-0.5">
                                    {[
                                        '👍',
                                        '👎',
                                        '😄',
                                        '🎉',
                                        '😕',
                                        '❤️',
                                        '🚀',
                                        '👀',
                                    ].map((emoji) => (
                                        <button
                                            key={emoji}
                                            onClick={() =>
                                                handleRootReaction(emoji)
                                            }
                                            className="p-1.5 hover:bg-accent-hover rounded text-base leading-none transition-colors cursor-pointer"
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {!isResolved && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-dashboard-text-muted hover:text-green-600"
                                onClick={handleResolve}
                                disabled={isSubmitting}
                                title="Resolve thread"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-dashboard-text-muted hover:text-dashboard-text-primary"
                                >
                                    <MoreHorizontal className="h-3.5 w-3.5" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36">
                                <DropdownMenuItem
                                    onClick={() => setIsEditingRoot(true)}
                                >
                                    <Edit2 className="h-3.5 w-3.5 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={handleDeleteRoot}
                                >
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </div>

            {/* ── Replies, resolution, reply input (hidden when collapsed) ── */}
            {!isCollapsed && (
                <>
                    {replies.map((reply, i) => (
                        <div
                            key={reply.id}
                            className="border-t border-dashboard-border/40 px-4 py-3 animate-in fade-in slide-in-from-bottom-1 duration-150"
                        >
                            <CommentBubble
                                comment={{
                                    ...reply,
                                    comment:
                                        replyContentOverrides[reply.id] ??
                                        reply.comment,
                                }}
                                isResolutionTarget={
                                    isResolved && i === replies.length - 1
                                }
                                onUpdate={onUpdate}
                                taskId={taskId}
                                projectId={projectId}
                                onResolve={
                                    !isResolved ? handleResolve : undefined
                                }
                                mentionableUsers={mentionableUsers}
                                onDeleteReply={(replyId) =>
                                    setDeletedReplyIds((prev) =>
                                        new Set(prev).add(replyId),
                                    )
                                }
                                onUpdateReplyContent={(replyId, content) =>
                                    setReplyContentOverrides((prev) => ({
                                        ...prev,
                                        [replyId]: content,
                                    }))
                                }
                            />
                        </div>
                    ))}

                    {/* Resolution log */}
                    {isResolved && (
                        <div className="border-t border-dashboard-border/40 px-4 py-2.5 flex items-center gap-2">
                            <div className="h-4 w-4 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Check className="h-2.5 w-2.5 text-green-600" />
                            </div>
                            <p className="text-xs text-muted-foreground flex-1">
                                {comment.resolvedBy?.firstName ? (
                                    <>
                                        <span className="font-medium text-dashboard-text-body">
                                            {comment.resolvedBy.firstName}
                                            {comment.resolvedBy.lastName
                                                ? ` ${comment.resolvedBy.lastName}`
                                                : ''}
                                        </span>
                                        {' resolved this thread'}
                                        {replies.length > 0 && (
                                            <>
                                                {' with '}
                                                <span className="font-medium text-dashboard-text-body">
                                                    {
                                                        replies[
                                                            replies.length - 1
                                                        ].user.firstName
                                                    }
                                                    &apos;s
                                                </span>
                                                {' comment'}
                                            </>
                                        )}
                                    </>
                                ) : (
                                    'Thread resolved'
                                )}
                            </p>
                            <button
                                onClick={handleReopen}
                                disabled={isSubmitting}
                                className="text-xs text-muted-foreground hover:text-dashboard-text-primary transition-colors flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                            >
                                <RotateCcw className="h-3 w-3" />
                                Reopen
                            </button>
                        </div>
                    )}

                    {/* Reply input */}
                    {!isResolved && (
                        <div
                            className="border-t border-dashboard-border/40 px-4 py-2.5 cursor-text"
                            onClick={() => {
                                if (!isReplyFocused)
                                    replyInputRef.current?.focus();
                            }}
                        >
                            <div className="flex items-end gap-2">
                                <div className="flex-1 min-w-0">
                                    <RichCommentEditor
                                        ref={replyInputRef}
                                        onContentChange={(html, empty) => {
                                            setReplyContent(html);
                                            setIsReplyEmpty(empty);
                                        }}
                                        onFocus={() => setIsReplyFocused(true)}
                                        onBlur={(empty) => {
                                            if (empty) setIsReplyFocused(false);
                                        }}
                                        onSubmit={handleReply}
                                        onCancel={() => {
                                            replyInputRef.current?.clear();
                                            setIsReplyFocused(false);
                                        }}
                                        placeholder="Leave a reply…"
                                        showToolbar={isReplyFocused}
                                        mentionableUsers={mentionableUsers}
                                    />
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0 pb-0.5">
                                    <button
                                        className="text-muted-foreground hover:text-dashboard-text-primary transition-colors cursor-pointer"
                                        title="Attach file"
                                        tabIndex={-1}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onAttach?.();
                                        }}
                                    >
                                        <Paperclip className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleReply();
                                        }}
                                        disabled={isReplyEmpty || isSubmitting}
                                        className={cn(
                                            'h-6 w-6 rounded-full flex items-center justify-center transition-colors',
                                            isReplyEmpty || isSubmitting
                                                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                                                : 'bg-accent-blue text-white hover:bg-accent-light cursor-pointer',
                                        )}
                                        title="Send reply (⌘↵)"
                                    >
                                        <ArrowUp className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
