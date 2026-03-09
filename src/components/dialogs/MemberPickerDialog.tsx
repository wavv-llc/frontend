'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useUser } from '@/contexts/UserContext';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, UserPlus, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    organizationApi,
    workspaceApi,
    projectApi,
    type OrganizationMember,
    type User,
} from '@/lib/api';
import { toast } from 'sonner';

interface MemberPickerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'workspace' | 'project';
    targetId: string;
    targetName: string;
    existingMembers: User[];
    onSuccess?: () => void;
}

export function MemberPickerDialog({
    open,
    onOpenChange,
    type,
    targetId,
    targetName,
    existingMembers,
    onSuccess,
}: MemberPickerDialogProps) {
    const { getToken } = useAuth();
    const { user } = useUser();
    const [orgMembers, setOrgMembers] = useState<OrganizationMember[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [addingIds, setAddingIds] = useState<Set<string>>(new Set());
    const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

    const existingMemberIds = new Set(existingMembers.map((m) => m.id));

    const fetchOrgMembers = useCallback(async () => {
        if (!user?.organizationId) return;
        setIsLoading(true);
        try {
            const token = await getToken();
            if (!token) return;
            const response = await organizationApi.getMembers(
                token,
                user.organizationId,
            );
            if (response.data) {
                setOrgMembers(response.data);
            }
        } catch {
            toast.error('Failed to load organization members');
        } finally {
            setIsLoading(false);
        }
    }, [user?.organizationId, getToken]);

    useEffect(() => {
        if (open) {
            fetchOrgMembers();
            setSearchQuery('');
            setAddedIds(new Set());
        }
    }, [open, fetchOrgMembers]);

    const availableMembers = orgMembers.filter((m) => {
        if (existingMemberIds.has(m.id) || addedIds.has(m.id)) return false;
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const name = `${m.firstName ?? ''} ${m.lastName ?? ''}`
            .toLowerCase()
            .trim();
        return name.includes(q) || m.email.toLowerCase().includes(q);
    });

    const handleAdd = async (member: OrganizationMember) => {
        const token = await getToken();
        if (!token) return;
        setAddingIds((prev) => new Set(prev).add(member.id));
        setAddedIds((prev) => new Set(prev).add(member.id));
        try {
            if (type === 'workspace') {
                await workspaceApi.addMember(
                    token,
                    targetId,
                    member.id,
                    'MEMBER',
                );
            } else {
                await projectApi.addMember(
                    token,
                    targetId,
                    member.id,
                    'MEMBER',
                );
            }
            const name = member.firstName
                ? `${member.firstName} ${member.lastName ?? ''}`.trim()
                : member.email;
            toast.success(`Added ${name} to ${targetName}`);
            onSuccess?.();
        } catch {
            setAddedIds((prev) => {
                const next = new Set(prev);
                next.delete(member.id);
                return next;
            });
            toast.error('Failed to add member');
        } finally {
            setAddingIds((prev) => {
                const next = new Set(prev);
                next.delete(member.id);
                return next;
            });
        }
    };

    const getInitials = (m: OrganizationMember) => {
        if (m.firstName) {
            return `${m.firstName[0]}${m.lastName?.[0] ?? ''}`.toUpperCase();
        }
        return m.email[0].toUpperCase();
    };

    const getDisplayName = (m: OrganizationMember) => {
        if (m.firstName) {
            return `${m.firstName} ${m.lastName ?? ''}`.trim();
        }
        return m.email;
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-dashboard-text-muted" />
                        Add Members
                    </DialogTitle>
                    <DialogDescription>
                        Add organization members to{' '}
                        <strong>{targetName}</strong>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-dashboard-text-muted pointer-events-none" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-8 bg-dashboard-surface border-dashboard-border"
                            autoFocus
                        />
                    </div>

                    {/* Member list */}
                    <div className="max-h-72 overflow-y-auto -mx-1 space-y-0.5 pr-1">
                        {isLoading ? (
                            <div className="flex items-center justify-center py-10">
                                <Loader2 className="h-5 w-5 animate-spin text-dashboard-text-muted" />
                            </div>
                        ) : availableMembers.length === 0 ? (
                            <div className="text-center py-10 text-sm text-dashboard-text-muted">
                                {searchQuery.trim()
                                    ? 'No members match your search'
                                    : 'All organization members have already been added'}
                            </div>
                        ) : (
                            availableMembers.map((member) => (
                                <div
                                    key={member.id}
                                    className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-dashboard-surface transition-colors"
                                >
                                    {/* Avatar */}
                                    <div className="h-8 w-8 rounded-full bg-accent-subtle border border-dashboard-border flex items-center justify-center text-xs font-semibold text-accent-blue shrink-0">
                                        {getInitials(member)}
                                    </div>

                                    {/* Name + email */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-dashboard-text-primary truncate">
                                            {getDisplayName(member)}
                                        </p>
                                        <p className="text-xs text-dashboard-text-muted truncate">
                                            {member.email}
                                        </p>
                                    </div>

                                    {/* Role badge */}
                                    <Badge
                                        variant="secondary"
                                        className={cn(
                                            'text-xs shrink-0',
                                            member.organizationRole === 'ADMIN'
                                                ? 'bg-accent-subtle text-accent-blue border-accent-blue/20'
                                                : 'bg-dashboard-surface text-dashboard-text-muted border-dashboard-border',
                                        )}
                                    >
                                        {member.organizationRole === 'ADMIN'
                                            ? 'Admin'
                                            : 'Member'}
                                    </Badge>

                                    {/* Add button */}
                                    <Button
                                        size="sm"
                                        onClick={() => handleAdd(member)}
                                        disabled={addingIds.has(member.id)}
                                        className="h-7 px-3 text-xs bg-accent-blue hover:bg-accent-light text-white shrink-0 cursor-pointer"
                                    >
                                        {addingIds.has(member.id) ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            'Add'
                                        )}
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Added count */}
                    {addedIds.size > 0 && (
                        <div className="border-t border-dashboard-border pt-3">
                            <p className="text-xs text-dashboard-text-muted flex items-center gap-1.5">
                                <Check className="h-3.5 w-3.5 text-green-500" />
                                {addedIds.size} member
                                {addedIds.size !== 1 ? 's' : ''} added
                            </p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
