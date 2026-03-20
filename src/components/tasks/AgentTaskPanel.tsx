'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
    Bot,
    Send,
    Loader2,
    CheckCircle2,
    XCircle,
    Clock,
    Zap,
    ChevronDown,
    ChevronUp,
    Paperclip,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { toast } from 'sonner';
import { agentTaskApi, type AgentTask, type AgentTaskStatus } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import {
    DocumentAttachment,
    type AttachedDocument,
} from '@/components/documents/DocumentAttachment';

interface AgentTaskPanelProps {
    taskId: string;
    taskName: string;
    projectId: string;
    className?: string;
}

function statusIcon(status: AgentTaskStatus) {
    switch (status) {
        case 'PENDING':
            return <Clock className="h-3.5 w-3.5 text-amber-500" />;
        case 'IN_PROGRESS':
            return (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
            );
        case 'COMPLETED':
            return <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />;
        case 'FAILED':
            return <XCircle className="h-3.5 w-3.5 text-red-500" />;
    }
}

function statusLabel(status: AgentTaskStatus) {
    switch (status) {
        case 'PENDING':
            return 'Pending';
        case 'IN_PROGRESS':
            return 'Running';
        case 'COMPLETED':
            return 'Completed';
        case 'FAILED':
            return 'Failed';
    }
}

function statusColor(status: AgentTaskStatus) {
    switch (status) {
        case 'PENDING':
            return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'IN_PROGRESS':
            return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'COMPLETED':
            return 'bg-green-50 text-green-700 border-green-200';
        case 'FAILED':
            return 'bg-red-50 text-red-700 border-red-200';
    }
}

export function AgentTaskPanel({
    taskId,
    taskName,
    projectId,
    className,
}: AgentTaskPanelProps) {
    const { getToken } = useAuth();

    // Existing agent tasks for this task
    const [agentTasks, setAgentTasks] = useState<AgentTask[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // New agent task form
    const [prompt, setPrompt] = useState('');
    const [attachedDocs, setAttachedDocs] = useState<AttachedDocument[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

    // Polling for active tasks
    const [pollingIds, setPollingIds] = useState<Set<string>>(new Set());

    const fetchAgentTasks = useCallback(async () => {
        try {
            const token = await getToken();
            if (!token) return;
            const response = await agentTaskApi.getAgentTasks(token);
            if (response.data) {
                // Filter to tasks that reference this task in their context
                const relevant = response.data.filter(
                    (at) =>
                        (at.context as Record<string, unknown>)?.taskId ===
                        taskId,
                );
                setAgentTasks(relevant);

                // Track active tasks for polling
                const active = new Set<string>();
                for (const at of relevant) {
                    if (
                        at.status === 'PENDING' ||
                        at.status === 'IN_PROGRESS'
                    ) {
                        active.add(at.id);
                    }
                }
                setPollingIds(active);
            }
        } catch {
            // Silently fail
        } finally {
            setIsLoading(false);
        }
    }, [getToken, taskId]);

    useEffect(() => {
        fetchAgentTasks();
    }, [fetchAgentTasks]);

    // Poll for active tasks
    useEffect(() => {
        if (pollingIds.size === 0) return;

        const interval = setInterval(async () => {
            const token = await getToken();
            if (!token) return;

            for (const id of pollingIds) {
                try {
                    const response = await agentTaskApi.getAgentTaskById(
                        token,
                        id,
                    );
                    if (response.data) {
                        setAgentTasks((prev) =>
                            prev.map((at) =>
                                at.id === id ? response.data! : at,
                            ),
                        );
                        if (
                            response.data.status === 'COMPLETED' ||
                            response.data.status === 'FAILED'
                        ) {
                            setPollingIds((prev) => {
                                const next = new Set(prev);
                                next.delete(id);
                                return next;
                            });
                        }
                    }
                } catch {
                    // ignore individual poll errors
                }
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [pollingIds, getToken]);

    const handleSubmit = async () => {
        if (!prompt.trim() || isSubmitting) return;

        try {
            setIsSubmitting(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            const context: Record<string, unknown> = {
                taskId,
                taskName,
                projectId,
            };
            if (attachedDocs.length > 0) {
                context.documentIds = attachedDocs.map((d) => d.id);
            }

            const response = await agentTaskApi.createAgentTask(token, {
                prompt: prompt.trim(),
                context,
            });

            if (response.data) {
                setAgentTasks((prev) => [response.data!, ...prev]);
                setPollingIds((prev) => new Set([...prev, response.data!.id]));
                setPrompt('');
                setAttachedDocs([]);
                setShowForm(false);
                setExpandedTaskId(response.data.id);
                toast.success('Agent task started');
            }
        } catch {
            toast.error('Failed to start agent task');
        } finally {
            setIsSubmitting(false);
        }
    };

    const hasActiveTask = agentTasks.some(
        (at) => at.status === 'PENDING' || at.status === 'IN_PROGRESS',
    );

    return (
        <div className={cn('space-y-4', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                        <Zap className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">
                            Agent Workflows
                        </h3>
                        <p className="text-[10px] text-muted-foreground">
                            Delegate work to an AI agent
                        </p>
                    </div>
                </div>
                {!showForm && (
                    <Button
                        size="sm"
                        onClick={() => setShowForm(true)}
                        disabled={hasActiveTask}
                        className="gap-1.5 text-xs bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                    >
                        <Bot className="h-3.5 w-3.5" />
                        {hasActiveTask ? 'Agent Running' : 'Run Agent'}
                    </Button>
                )}
            </div>

            {/* New agent task form */}
            {showForm && (
                <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
                    <div className="flex items-center gap-2 mb-2">
                        <Bot className="h-4 w-4 text-purple-600" />
                        <span className="text-xs font-semibold">
                            Instruct the Agent
                        </span>
                    </div>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Describe what you want the agent to do with this task..."
                        rows={3}
                        className="w-full text-sm border border-border rounded-lg p-3 bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                        disabled={isSubmitting}
                    />

                    <DocumentAttachment
                        attachedDocuments={attachedDocs}
                        onAttach={(doc) =>
                            setAttachedDocs((prev) => [...prev, doc])
                        }
                        onRemove={(id) =>
                            setAttachedDocs((prev) =>
                                prev.filter((d) => d.id !== id),
                            )
                        }
                        disabled={isSubmitting}
                        trigger={
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-1.5 text-xs"
                                disabled={isSubmitting}
                            >
                                <Paperclip className="h-3 w-3" />
                                Attach Files
                                {attachedDocs.length > 0 && (
                                    <Badge
                                        variant="secondary"
                                        className="h-4 min-w-4 px-1 text-[10px]"
                                    >
                                        {attachedDocs.length}
                                    </Badge>
                                )}
                            </Button>
                        }
                    />

                    <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setShowForm(false);
                                setPrompt('');
                                setAttachedDocs([]);
                            }}
                            disabled={isSubmitting}
                            className="text-xs"
                        >
                            Cancel
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            disabled={!prompt.trim() || isSubmitting}
                            className="gap-1.5 text-xs bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Send className="h-3.5 w-3.5" />
                            )}
                            Start Agent
                        </Button>
                    </div>
                </div>
            )}

            {/* Agent task history */}
            {isLoading ? (
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
            ) : agentTasks.length === 0 && !showForm ? (
                <div className="text-center py-6">
                    <p className="text-xs text-muted-foreground">
                        No agent runs yet for this task.
                    </p>
                </div>
            ) : (
                <div className="space-y-2">
                    {agentTasks.map((at) => (
                        <Collapsible
                            key={at.id}
                            open={expandedTaskId === at.id}
                            onOpenChange={(open) =>
                                setExpandedTaskId(open ? at.id : null)
                            }
                        >
                            <CollapsibleTrigger className="w-full">
                                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border bg-background hover:bg-muted/30 transition-colors cursor-pointer">
                                    {statusIcon(at.status)}
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="text-xs font-medium truncate">
                                            {at.prompt.length > 60
                                                ? at.prompt.slice(0, 60) + '...'
                                                : at.prompt}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {new Date(
                                                at.createdAt,
                                            ).toLocaleDateString(undefined, {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                    <Badge
                                        variant="outline"
                                        className={cn(
                                            'text-[10px] shrink-0',
                                            statusColor(at.status),
                                        )}
                                    >
                                        {statusLabel(at.status)}
                                    </Badge>
                                    {expandedTaskId === at.id ? (
                                        <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    ) : (
                                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    )}
                                </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="mt-1 border border-border rounded-lg overflow-hidden">
                                    {/* Prompt */}
                                    <div className="px-4 py-3 bg-muted/20">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                                            Instruction
                                        </p>
                                        <p className="text-xs leading-relaxed whitespace-pre-wrap">
                                            {at.prompt}
                                        </p>
                                    </div>

                                    <Separator />

                                    {/* Response */}
                                    <div className="px-4 py-3">
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                            Output
                                        </p>
                                        {at.status === 'PENDING' ||
                                        at.status === 'IN_PROGRESS' ? (
                                            <div className="flex items-center gap-2 py-4">
                                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                                <span className="text-xs text-muted-foreground">
                                                    Agent is working...
                                                </span>
                                            </div>
                                        ) : at.status === 'FAILED' ? (
                                            <div className="flex items-center gap-2 py-4">
                                                <XCircle className="h-4 w-4 text-red-500" />
                                                <span className="text-xs text-red-600">
                                                    Agent task failed.
                                                </span>
                                            </div>
                                        ) : at.response ? (
                                            <ScrollArea className="max-h-64">
                                                <div className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed [&_p]:mb-1.5 [&_p:last-child]:mb-0">
                                                    <ReactMarkdown
                                                        remarkPlugins={[
                                                            remarkGfm,
                                                        ]}
                                                    >
                                                        {at.response.output}
                                                    </ReactMarkdown>
                                                </div>
                                            </ScrollArea>
                                        ) : (
                                            <p className="text-xs text-muted-foreground py-4">
                                                No output yet.
                                            </p>
                                        )}
                                    </div>

                                    {/* Reasoning steps (collapsible) */}
                                    {at.response?.reasoningSteps && (
                                        <>
                                            <Separator />
                                            <div className="px-4 py-3">
                                                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                                                    Reasoning Steps
                                                </p>
                                                <pre className="text-[10px] text-muted-foreground bg-muted/30 rounded p-2 overflow-x-auto">
                                                    {JSON.stringify(
                                                        at.response
                                                            .reasoningSteps,
                                                        null,
                                                        2,
                                                    )}
                                                </pre>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    ))}
                </div>
            )}
        </div>
    );
}
