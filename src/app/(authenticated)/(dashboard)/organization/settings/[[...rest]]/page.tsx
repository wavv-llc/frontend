'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Loader2,
    CheckCircle2,
    RefreshCw,
    Mail,
    FileText,
    RotateCcw,
    Search,
    Filter,
    Users,
    Trash2,
    Building2,
} from 'lucide-react';
import {
    sharepointApi,
    organizationApi,
    documentsApi,
    OrganizationDocument,
    OrganizationDocumentsResponse,
    roleApi,
    OrganizationMember,
    Role,
} from '@/lib/api';
import { SettingsSkeleton } from '@/components/skeletons/SettingsSkeleton';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/contexts/UserContext';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface SharePointSite {
    id: string;
    name: string;
    displayName: string;
    webUrl: string;
    description?: string;
}

interface SelectedSite {
    id: string;
    siteId: string;
    siteName: string;
    webUrl: string;
}

type TabType = 'documents' | 'users' | 'organization';

export default function SettingsPage() {
    const router = useRouter();
    const { isLoaded, getToken } = useAuth();
    const { user, isLoading: isUserLoading } = useUser();

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>('documents');
    const [sites, setSites] = useState<SharePointSite[]>([]);
    const [, setSelectedSites] = useState<SelectedSite[]>([]);
    const [selectedSiteIds, setSelectedSiteIds] = useState<Set<string>>(
        new Set(),
    );
    const [isLoadingSites, setIsLoadingSites] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Invite member state
    const [inviteEmail, setInviteEmail] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

    // Documents state
    const [documents, setDocuments] = useState<OrganizationDocument[]>([]);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [documentsError, setDocumentsError] = useState<string | null>(null);
    const [retryingDocumentId, setRetryingDocumentId] = useState<string | null>(
        null,
    );
    const [documentSearch, setDocumentSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    // Members state
    const [members, setMembers] = useState<OrganizationMember[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [membersError, setMembersError] = useState<string | null>(null);
    const [memberToRemove, setMemberToRemove] =
        useState<OrganizationMember | null>(null);
    const [isRemovingMember, setIsRemovingMember] = useState(false);
    const [updatingRoleForUserId, setUpdatingRoleForUserId] = useState<
        string | null
    >(null);

    const organizationId = user?.organization?.id;

    useEffect(() => {
        if (isLoaded && organizationId) {
            loadSharePointData();
            loadDocuments(organizationId);
            loadMembers();
            loadRoles();
        }
    }, [isLoaded, getToken, organizationId]);

    const loadDocuments = async (orgId?: string) => {
        const targetOrgId = orgId || organizationId;
        if (!targetOrgId) return;

        try {
            setIsLoadingDocuments(true);
            setDocumentsError(null);
            const token = await getToken();
            if (!token) return;

            const response = await documentsApi.getOrganizationDocuments(
                token,
                targetOrgId,
            );
            // Handle both array response and wrapped object response
            const docs = Array.isArray(response.data)
                ? response.data
                : (response.data as OrganizationDocumentsResponse)?.documents ||
                  [];
            setDocuments(docs);
        } catch (err) {
            console.error('Error loading documents:', err);
            setDocumentsError(
                err instanceof Error ? err.message : 'Failed to load documents',
            );
        } finally {
            setIsLoadingDocuments(false);
        }
    };

    const handleRetryDocument = async (documentId: string) => {
        try {
            setRetryingDocumentId(documentId);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await documentsApi.retryDocument(token, documentId);
            toast.success('Document processing restarted successfully');
            // Reload documents to get updated status
            await loadDocuments();
        } catch (err) {
            console.error('Error retrying document:', err);
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to retry document';
            setDocumentsError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setRetryingDocumentId(null);
        }
    };

    const handleReembedDocument = async (documentId: string) => {
        try {
            setRetryingDocumentId(documentId);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await documentsApi.reembedDocument(token, documentId);
            toast.success('Document re-embedding started successfully');
            // Reload documents to get updated status
            await loadDocuments();
        } catch (err) {
            console.error('Error re-embedding document:', err);
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to re-embed document';
            setDocumentsError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setRetryingDocumentId(null);
        }
    };

    const getStatusBadge = (status: OrganizationDocument['status']) => {
        switch (status) {
            case 'COMPLETED':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Completed
                    </span>
                );
            case 'PROCESSING':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                        Processing
                    </span>
                );
            case 'EMBEDDING':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                        Embedding
                    </span>
                );
            case 'READY':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                        Ready
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                        Pending
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                        Failed
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400">
                        {status}
                    </span>
                );
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleInviteMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inviteEmail.trim() || !organizationId) return;

        try {
            setIsInviting(true);
            setInviteError(null);
            setInviteSuccess(null);

            const token = await getToken();
            if (!token) {
                setInviteError('Authentication required');
                return;
            }

            await organizationApi.inviteMember(
                token,
                organizationId,
                inviteEmail.trim(),
            );
            setInviteSuccess(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
        } catch (err) {
            console.error('Error inviting member:', err);
            setInviteError(
                err instanceof Error
                    ? err.message
                    : 'Failed to send invitation',
            );
        } finally {
            setIsInviting(false);
        }
    };

    const loadMembers = async () => {
        if (!organizationId) return;

        try {
            setIsLoadingMembers(true);
            setMembersError(null);
            const token = await getToken();
            if (!token) return;

            const response = await organizationApi.getMembers(
                token,
                organizationId,
            );
            setMembers(response.data || []);
        } catch (err) {
            console.error('Error loading members:', err);
            setMembersError(
                err instanceof Error ? err.message : 'Failed to load members',
            );
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const loadRoles = async () => {
        try {
            const token = await getToken();
            if (!token) return;

            const response = await roleApi.getAllRoles(token);
            // Filter to only organization-level roles
            const orgRoles = (response.data || []).filter((role) =>
                role.permissions.some((p) =>
                    [
                        'ORG_VIEW',
                        'ORG_EDIT',
                        'ORG_DELETE',
                        'ORG_MANAGE_MEMBERS',
                    ].includes(p.key),
                ),
            );
            setRoles(orgRoles);
        } catch (err) {
            console.error('Error loading roles:', err);
        }
    };

    const handleRoleChange = async (userId: string, newRoleId: string) => {
        if (!organizationId) return;

        try {
            setUpdatingRoleForUserId(userId);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await organizationApi.updateMemberRole(
                token,
                organizationId,
                userId,
                newRoleId,
            );
            toast.success('Member role updated successfully');
            await loadMembers();
        } catch (err) {
            console.error('Error updating member role:', err);
            toast.error(
                err instanceof Error
                    ? err.message
                    : 'Failed to update member role',
            );
        } finally {
            setUpdatingRoleForUserId(null);
        }
    };

    const handleRemoveMember = async () => {
        if (!organizationId || !memberToRemove) return;

        try {
            setIsRemovingMember(true);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await organizationApi.removeMember(
                token,
                organizationId,
                memberToRemove.id,
            );
            toast.success(
                `${memberToRemove.email} has been removed from the organization`,
            );
            setMemberToRemove(null);
            await loadMembers();
        } catch (err) {
            console.error('Error removing member:', err);
            toast.error(
                err instanceof Error ? err.message : 'Failed to remove member',
            );
        } finally {
            setIsRemovingMember(false);
        }
    };

    const getMemberRole = (member: OrganizationMember) => {
        const orgRoleAssignment = member.roleAssignments.find(
            (ra) => ra.organizationId === organizationId,
        );
        return orgRoleAssignment?.role;
    };

    const isCurrentUser = (member: OrganizationMember) => {
        return member.id === user?.id;
    };

    const loadSharePointData = async () => {
        try {
            setIsLoadingSites(true);
            setError(null);
            const token = await getToken();
            if (!token) return;

            // Load available sites and selected sites in parallel
            const [sitesResponse, selectedResponse] = await Promise.all([
                sharepointApi
                    .getSites(token)
                    .catch(() => ({ data: { sites: [] } })),
                sharepointApi
                    .getSelectedSites(token)
                    .catch(() => ({ data: { selectedSites: [] } })),
            ]);

            if (sitesResponse.data?.sites) {
                setSites(sitesResponse.data.sites);
            }

            if (selectedResponse.data?.selectedSites) {
                setSelectedSites(selectedResponse.data.selectedSites);
                setSelectedSiteIds(
                    new Set(
                        selectedResponse.data.selectedSites.map(
                            (s) => s.siteId,
                        ),
                    ),
                );
            }
        } catch (err) {
            console.error('Error loading SharePoint data:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to load SharePoint data',
            );
        } finally {
            setIsLoadingSites(false);
        }
    };

    const toggleSite = (siteId: string) => {
        const newSelected = new Set(selectedSiteIds);
        if (newSelected.has(siteId)) {
            newSelected.delete(siteId);
        } else {
            newSelected.add(siteId);
        }
        setSelectedSiteIds(newSelected);
    };

    const handleSaveSites = async () => {
        try {
            setIsSaving(true);
            setError(null);
            const token = await getToken();
            if (!token) {
                setError('Authentication required');
                return;
            }

            const sitesToSave = sites
                .filter((site) => selectedSiteIds.has(site.id))
                .map((site) => ({
                    id: site.id,
                    name: site.displayName || site.name,
                    webUrl: site.webUrl,
                }));

            await sharepointApi.saveSelectedSites(token, sitesToSave);

            // Reload selected sites
            const selectedResponse =
                await sharepointApi.getSelectedSites(token);
            if (selectedResponse.data?.selectedSites) {
                setSelectedSites(selectedResponse.data.selectedSites);
            }
        } catch (err) {
            console.error('Error saving selected sites:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Failed to save selected sites',
            );
        } finally {
            setIsSaving(false);
        }
    };

    if (!isLoaded || isUserLoading) {
        return <SettingsSkeleton />;
    }

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        {
            id: 'documents',
            label: 'Documents',
            icon: <FileText className="h-4 w-4" />,
        },
        { id: 'users', label: 'Users', icon: <Users className="h-4 w-4" /> },
        {
            id: 'organization',
            label: 'Organization',
            icon: <Building2 className="h-4 w-4" />,
        },
    ];

    return (
        <PermissionGuard
            scope="organization"
            permission="ORG_EDIT"
            redirectTo="/home"
        >
            <style jsx>{`
                @keyframes fadeUp {
                    from {
                        opacity: 0;
                        transform: translateY(8px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fadeSlideIn {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .fade-up-1 {
                    animation: fadeUp 400ms cubic-bezier(0.23, 1, 0.32, 1)
                        forwards;
                }

                .fade-up-2 {
                    animation: fadeUp 400ms cubic-bezier(0.23, 1, 0.32, 1) 120ms
                        forwards;
                    opacity: 0;
                }

                .fade-up-3 {
                    animation: fadeUp 400ms cubic-bezier(0.23, 1, 0.32, 1) 180ms
                        forwards;
                    opacity: 0;
                }

                .section-header-anim {
                    animation: fadeUp 450ms cubic-bezier(0.23, 1, 0.32, 1) 60ms
                        forwards;
                    opacity: 0;
                }

                .tab-content-enter {
                    animation: fadeSlideIn 350ms cubic-bezier(0.23, 1, 0.32, 1)
                        forwards;
                }
            `}</style>

            <div className="h-full overflow-auto bg-[#f8f9fa] dark:bg-gray-950 relative">
                {/* Background gradient */}
                <div className="fixed inset-0 opacity-20 pointer-events-none">
                    <div className="absolute w-[55%] h-[40%] top-[20%] left-[30%] bg-[#dce1e8] rounded-full blur-3xl" />
                    <div className="absolute w-[40%] h-[30%] top-[70%] left-[75%] bg-[#dce1e8]/60 rounded-full blur-3xl" />
                </div>

                {/* Top Tab Bar */}
                <header className="sticky top-0 z-10 flex items-center justify-center h-[54px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-[#dce1e8]/60 dark:border-gray-800/60">
                    <nav className="relative flex items-stretch gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex items-center gap-2.5 px-6 py-2.5 text-[13.5px] font-medium transition-all duration-300 ease-out cursor-pointer rounded-lg ${
                                    activeTab === tab.id
                                        ? 'text-[#272f3b] dark:text-gray-50 bg-[#f8f9fa]/50 dark:bg-gray-800/50'
                                        : 'text-[#8d9ab0] dark:text-gray-400 hover:text-[#4e5d74] dark:hover:text-gray-300 hover:bg-[#f8f9fa]/30 dark:hover:bg-gray-800/30'
                                }`}
                            >
                                <span
                                    className={`flex items-center transition-all duration-300 ${activeTab === tab.id ? 'opacity-100 scale-100' : 'opacity-60 scale-95'}`}
                                >
                                    {tab.icon}
                                </span>
                                <span className="relative">{tab.label}</span>
                            </button>
                        ))}
                        {/* Sliding active indicator */}
                        <div
                            className="absolute bottom-0 h-[2px] bg-gradient-to-r from-[#3a4557] to-[#272f3b] dark:from-gray-100 dark:to-gray-50 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(58,69,87,0.35)] dark:shadow-[0_0_12px_rgba(255,255,255,0.25)]"
                            style={{
                                left: `${tabs.findIndex((t) => t.id === activeTab) * (100 / tabs.length)}%`,
                                width: `${100 / tabs.length}%`,
                                marginLeft: '0.5rem',
                                marginRight: '0.5rem',
                                transform: 'scaleX(0.7)',
                            }}
                        />
                    </nav>
                </header>

                {/* Tab Content */}
                <div className="w-full pl-8 pr-8 py-8 pb-16 relative z-[1]">
                    <div className="max-w-[760px] mx-auto">
                        <div key={activeTab} className="tab-content-enter">
                            {activeTab === 'documents' && (
                                <DocumentsTab
                                    sites={sites}
                                    selectedSiteIds={selectedSiteIds}
                                    isLoadingSites={isLoadingSites}
                                    error={error}
                                    isSaving={isSaving}
                                    toggleSite={toggleSite}
                                    handleSaveSites={handleSaveSites}
                                    loadSharePointData={loadSharePointData}
                                    documents={documents}
                                    isLoadingDocuments={isLoadingDocuments}
                                    documentsError={documentsError}
                                    organizationId={organizationId}
                                    documentSearch={documentSearch}
                                    setDocumentSearch={setDocumentSearch}
                                    statusFilter={statusFilter}
                                    setStatusFilter={setStatusFilter}
                                    retryingDocumentId={retryingDocumentId}
                                    handleRetryDocument={handleRetryDocument}
                                    handleReembedDocument={
                                        handleReembedDocument
                                    }
                                    loadDocuments={loadDocuments}
                                    getStatusBadge={getStatusBadge}
                                    formatFileSize={formatFileSize}
                                    router={router}
                                />
                            )}

                            {activeTab === 'users' && (
                                <UsersTab
                                    members={members}
                                    roles={roles}
                                    isLoadingMembers={isLoadingMembers}
                                    membersError={membersError}
                                    organizationId={organizationId}
                                    updatingRoleForUserId={
                                        updatingRoleForUserId
                                    }
                                    getMemberRole={getMemberRole}
                                    isCurrentUser={isCurrentUser}
                                    handleRoleChange={handleRoleChange}
                                    setMemberToRemove={setMemberToRemove}
                                    loadMembers={loadMembers}
                                    inviteEmail={inviteEmail}
                                    setInviteEmail={setInviteEmail}
                                    isInviting={isInviting}
                                    inviteError={inviteError}
                                    inviteSuccess={inviteSuccess}
                                    handleInviteMember={handleInviteMember}
                                />
                            )}

                            {activeTab === 'organization' && (
                                <OrganizationTab
                                    organizationId={organizationId}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Dialog for Member Removal */}
            <Dialog
                open={!!memberToRemove}
                onOpenChange={(open) => !open && setMemberToRemove(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Member</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove{' '}
                            {memberToRemove?.email} from the organization? This
                            action will deactivate their account and remove all
                            their access.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setMemberToRemove(null)}
                            disabled={isRemovingMember}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRemoveMember}
                            disabled={isRemovingMember}
                        >
                            {isRemovingMember ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Removing...
                                </>
                            ) : (
                                'Remove Member'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PermissionGuard>
    );
}

// Tab Components
interface DocumentsTabProps {
    sites: SharePointSite[];
    selectedSiteIds: Set<string>;
    isLoadingSites: boolean;
    error: string | null;
    isSaving: boolean;
    toggleSite: (siteId: string) => void;
    handleSaveSites: () => void;
    loadSharePointData: () => void;
    documents: OrganizationDocument[];
    isLoadingDocuments: boolean;
    documentsError: string | null;
    organizationId?: string;
    documentSearch: string;
    setDocumentSearch: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    retryingDocumentId: string | null;
    handleRetryDocument: (documentId: string) => void;
    handleReembedDocument: (documentId: string) => void;
    loadDocuments: () => void;
    getStatusBadge: (status: OrganizationDocument['status']) => JSX.Element;
    formatFileSize: (bytes: number) => string;
    router: ReturnType<typeof useRouter>;
}

function DocumentsTab({
    sites,
    selectedSiteIds,
    isLoadingSites,
    error,
    isSaving,
    toggleSite,
    handleSaveSites,
    loadSharePointData,
    documents,
    isLoadingDocuments,
    documentsError,
    organizationId,
    documentSearch,
    setDocumentSearch,
    statusFilter,
    setStatusFilter,
    retryingDocumentId,
    handleRetryDocument,
    handleReembedDocument,
    loadDocuments,
    getStatusBadge,
    formatFileSize,
    router,
}: DocumentsTabProps) {
    return (
        <>
            {/* Section Header */}
            <div className="mb-6 section-header-anim">
                <h2 className="text-2xl font-serif text-[#272f3b] dark:text-gray-100 tracking-tight mb-1">
                    Document Management
                </h2>
                <p className="text-[13.5px] text-[#8d9ab0] dark:text-gray-400">
                    Configure document sources and indexing behavior
                </p>
            </div>

            {/* SharePoint Sites Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(14,17,23,0.04),0_4px_16px_rgba(14,17,23,0.03)] overflow-hidden mb-5 fade-up-1">
                {/* Card Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#eef0f3] dark:border-gray-800">
                    <div>
                        <h3 className="text-[15px] font-semibold text-[#272f3b] dark:text-gray-100 mb-0.5">
                            SharePoint Sites
                        </h3>
                        <p className="text-[12.5px] text-[#8d9ab0] dark:text-gray-400">
                            Select which sites are available for AI auditing
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={loadSharePointData}
                        disabled={isLoadingSites}
                        className="rounded-xl"
                    >
                        <RefreshCw
                            className={`h-3.5 w-3.5 mr-2 ${isLoadingSites ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </Button>
                </div>

                {/* Card Content */}
                <div className="p-2">
                    {error && (
                        <div className="mx-2 mt-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    {isLoadingSites ? (
                        <div className="space-y-0.5 p-1">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="p-3.5 rounded-xl flex items-center gap-3.5 bg-[#f8f9fa] dark:bg-gray-800"
                                >
                                    <Skeleton className="h-5 w-5 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3.5 w-52" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : sites.length === 0 ? (
                        <div className="text-center py-12 text-[#8d9ab0] dark:text-gray-400 text-sm">
                            <p>
                                No SharePoint sites found. Make sure you have
                                access to SharePoint sites.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-0.5 p-1">
                            {sites.map((site) => {
                                const isSelected = selectedSiteIds.has(site.id);
                                return (
                                    <div
                                        key={site.id}
                                        className={`p-3.5 rounded-xl cursor-pointer transition-all duration-200 ${
                                            isSelected
                                                ? 'bg-[#eef0f3]/60 dark:bg-gray-800'
                                                : 'hover:bg-[#f8f9fa] dark:hover:bg-gray-800/50'
                                        }`}
                                        onClick={() => toggleSite(site.id)}
                                    >
                                        <div className="flex items-start gap-3.5">
                                            <div className="flex items-center justify-center shrink-0 mt-0.5">
                                                <div
                                                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                                        isSelected
                                                            ? 'border-[#3a4557] bg-[#3a4557] dark:border-gray-100 dark:bg-gray-100'
                                                            : 'border-[#b8c1ce] dark:border-gray-600'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <div className="h-2 w-2 rounded-full bg-white dark:bg-gray-900" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-[#272f3b] dark:text-gray-100">
                                                    {site.displayName ||
                                                        site.name}
                                                </h4>
                                                <p className="text-[12.5px] text-[#8d9ab0] dark:text-gray-400 truncate mt-0.5">
                                                    {site.webUrl}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Card Footer */}
                {sites.length > 0 && (
                    <div className="flex items-center justify-between px-6 py-3.5 border-t border-[#eef0f3] dark:border-gray-800">
                        <span className="text-[12.5px] text-[#8d9ab0] dark:text-gray-400 font-medium">
                            {selectedSiteIds.size} site
                            {selectedSiteIds.size !== 1 ? 's' : ''} selected
                        </span>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSaveSites}
                            disabled={isSaving}
                            className="rounded-xl"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                )}
            </div>

            {/* Documents List Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(14,17,23,0.04),0_4px_16px_rgba(14,17,23,0.03)] overflow-hidden fade-up-3">
                {/* Card Header */}
                <div className="px-6 py-5 border-b border-[#eef0f3] dark:border-gray-800">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-[15px] font-semibold text-[#272f3b] dark:text-gray-100 mb-0.5">
                                Documents
                            </h3>
                            <p className="text-[12.5px] text-[#8d9ab0] dark:text-gray-400">
                                View and manage documents uploaded to your
                                organization
                            </p>
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={loadDocuments}
                            disabled={isLoadingDocuments || !organizationId}
                            className="rounded-xl"
                        >
                            <RefreshCw
                                className={`h-3.5 w-3.5 mr-2 ${isLoadingDocuments ? 'animate-spin' : ''}`}
                            />
                            Refresh
                        </Button>
                    </div>

                    {/* Search and Filter */}
                    {documents.length > 0 && (
                        <div className="flex items-center gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8d9ab0]" />
                                <Input
                                    placeholder="Search documents..."
                                    value={documentSearch}
                                    onChange={(e) =>
                                        setDocumentSearch(e.target.value)
                                    }
                                    className="pl-9 h-9 rounded-xl border-[1.5px] border-[#dce1e8] dark:border-gray-700 text-sm"
                                />
                            </div>
                            <Select
                                value={statusFilter}
                                onValueChange={setStatusFilter}
                            >
                                <SelectTrigger className="w-[140px] h-9 rounded-xl border-[1.5px] border-[#dce1e8] dark:border-gray-700">
                                    <Filter className="h-3.5 w-3.5 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        All Status
                                    </SelectItem>
                                    <SelectItem value="COMPLETED">
                                        Completed
                                    </SelectItem>
                                    <SelectItem value="PROCESSING">
                                        Processing
                                    </SelectItem>
                                    <SelectItem value="EMBEDDING">
                                        Embedding
                                    </SelectItem>
                                    <SelectItem value="READY">Ready</SelectItem>
                                    <SelectItem value="PENDING">
                                        Pending
                                    </SelectItem>
                                    <SelectItem value="FAILED">
                                        Failed
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                </div>

                {/* Card Content */}
                <div className="p-2">
                    {documentsError && (
                        <div className="mx-2 mt-2 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                            {documentsError}
                        </div>
                    )}

                    {!organizationId ? (
                        <div className="text-center py-16 text-[#8d9ab0] dark:text-gray-400 text-sm">
                            <p>Unable to load organization information.</p>
                        </div>
                    ) : isLoadingDocuments ? (
                        <div className="space-y-0.5 p-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="p-3.5 rounded-xl flex items-center gap-3.5 bg-[#f8f9fa] dark:bg-gray-800"
                                >
                                    <Skeleton className="h-5 w-5 rounded" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-1/3" />
                                        <Skeleton className="h-3 w-1/4" />
                                    </div>
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-16 text-[#8d9ab0] dark:text-gray-400">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-40" />
                            <p className="text-sm">
                                No documents found in your organization.
                            </p>
                        </div>
                    ) : (
                        (() => {
                            const filteredDocuments = documents.filter(
                                (doc) => {
                                    const matchesSearch =
                                        documentSearch === '' ||
                                        doc.originalName
                                            .toLowerCase()
                                            .includes(
                                                documentSearch.toLowerCase(),
                                            );
                                    const matchesStatus =
                                        statusFilter === 'all' ||
                                        doc.status === statusFilter;
                                    return matchesSearch && matchesStatus;
                                },
                            );

                            if (filteredDocuments.length === 0) {
                                return (
                                    <div className="text-center py-16 text-[#8d9ab0] dark:text-gray-400">
                                        <Search className="h-12 w-12 mx-auto mb-3 opacity-40" />
                                        <p className="text-sm">
                                            No documents match your search or
                                            filter criteria.
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <div className="space-y-0.5 p-1 max-h-[500px] overflow-y-auto">
                                    {filteredDocuments.map((doc) => (
                                        <div
                                            key={doc.id}
                                            className="p-3.5 rounded-xl hover:bg-[#f8f9fa] dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                                            onClick={() =>
                                                router.push(
                                                    `/documents/${doc.id}`,
                                                )
                                            }
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <FileText className="h-5 w-5 text-[#8d9ab0] shrink-0" />
                                                    <div className="min-w-0 flex-1">
                                                        <h4
                                                            className="text-sm font-semibold text-[#272f3b] dark:text-gray-100 truncate"
                                                            title={
                                                                doc.originalName
                                                            }
                                                        >
                                                            {doc.originalName}
                                                        </h4>
                                                        <div className="flex items-center gap-2 text-xs text-[#8d9ab0] dark:text-gray-400 mt-0.5">
                                                            <span>
                                                                {formatFileSize(
                                                                    doc.filesize,
                                                                )}
                                                            </span>
                                                            <span>•</span>
                                                            <span>
                                                                {doc.mimeType}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {getStatusBadge(doc.status)}
                                                    {(doc.status ===
                                                        'EMBEDDING' ||
                                                        doc.status ===
                                                            'READY') && (
                                                        <>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleReembedDocument(
                                                                        doc.id,
                                                                    );
                                                                }}
                                                                disabled={
                                                                    retryingDocumentId ===
                                                                    doc.id
                                                                }
                                                                className="rounded-lg"
                                                            >
                                                                {retryingDocumentId ===
                                                                doc.id ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                ) : (
                                                                    <RefreshCw className="h-3.5 w-3.5" />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon-sm"
                                                                onClick={(
                                                                    e,
                                                                ) => {
                                                                    e.stopPropagation();
                                                                    handleRetryDocument(
                                                                        doc.id,
                                                                    );
                                                                }}
                                                                disabled={
                                                                    retryingDocumentId ===
                                                                    doc.id
                                                                }
                                                                className="rounded-lg"
                                                            >
                                                                {retryingDocumentId ===
                                                                doc.id ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                ) : (
                                                                    <RotateCcw className="h-3.5 w-3.5" />
                                                                )}
                                                            </Button>
                                                        </>
                                                    )}
                                                    {(doc.status === 'FAILED' ||
                                                        doc.status ===
                                                            'PROCESSING') && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon-sm"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleRetryDocument(
                                                                    doc.id,
                                                                );
                                                            }}
                                                            disabled={
                                                                retryingDocumentId ===
                                                                doc.id
                                                            }
                                                            className="rounded-lg"
                                                        >
                                                            {retryingDocumentId ===
                                                            doc.id ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <RotateCcw className="h-3.5 w-3.5" />
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            );
                        })()
                    )}
                </div>
            </div>
        </>
    );
}

interface UsersTabProps {
    members: OrganizationMember[];
    roles: Role[];
    isLoadingMembers: boolean;
    membersError: string | null;
    organizationId?: string;
    updatingRoleForUserId: string | null;
    getMemberRole: (member: OrganizationMember) => Role | undefined;
    isCurrentUser: (member: OrganizationMember) => boolean;
    handleRoleChange: (userId: string, newRoleId: string) => void;
    setMemberToRemove: (member: OrganizationMember) => void;
    loadMembers: () => void;
    inviteEmail: string;
    setInviteEmail: (value: string) => void;
    isInviting: boolean;
    inviteError: string | null;
    inviteSuccess: string | null;
    handleInviteMember: (e: React.FormEvent) => void;
}

function UsersTab({
    members,
    roles,
    isLoadingMembers,
    membersError,
    organizationId,
    updatingRoleForUserId,
    getMemberRole,
    isCurrentUser,
    handleRoleChange,
    setMemberToRemove,
    loadMembers,
    inviteEmail,
    setInviteEmail,
    isInviting,
    inviteError,
    inviteSuccess,
    handleInviteMember,
}: UsersTabProps) {
    return (
        <>
            {/* Section Header */}
            <div className="mb-6 section-header-anim">
                <h2 className="text-2xl font-serif text-[#272f3b] dark:text-gray-100 tracking-tight mb-1">
                    User Management
                </h2>
                <p className="text-[13.5px] text-[#8d9ab0] dark:text-gray-400">
                    Manage team members and their permissions
                </p>
            </div>

            {/* Team Members Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(14,17,23,0.04),0_4px_16px_rgba(14,17,23,0.03)] overflow-hidden fade-up-1">
                {/* Card Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-[#eef0f3] dark:border-gray-800">
                    <div>
                        <h3 className="text-[15px] font-semibold text-[#272f3b] dark:text-gray-100 mb-0.5">
                            Team Members
                        </h3>
                        <p className="text-[12.5px] text-[#8d9ab0] dark:text-gray-400">
                            {members.length} member
                            {members.length !== 1 ? 's' : ''} in your
                            organization
                        </p>
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={loadMembers}
                        disabled={isLoadingMembers}
                        className="rounded-xl"
                    >
                        <RefreshCw
                            className={`h-3.5 w-3.5 mr-2 ${isLoadingMembers ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </Button>
                </div>

                {/* Error Message */}
                {membersError && (
                    <div className="mx-6 mt-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                        {membersError}
                    </div>
                )}

                {/* Table Content */}
                {!organizationId ? (
                    <div className="text-center py-16 text-[#8d9ab0] dark:text-gray-400 text-sm">
                        <p>Unable to load organization information.</p>
                    </div>
                ) : isLoadingMembers ? (
                    <div className="p-5 space-y-0.5">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3.5 bg-[#f8f9fa] dark:bg-gray-800 rounded-xl"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-3 w-40" />
                                    </div>
                                </div>
                                <Skeleton className="h-6 w-24" />
                            </div>
                        ))}
                    </div>
                ) : members.length === 0 ? (
                    <div className="text-center py-16 text-[#8d9ab0] dark:text-gray-400">
                        <Users className="h-12 w-12 mx-auto mb-3 opacity-40" />
                        <p className="text-sm">
                            No members found in your organization.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr>
                                    <th className="text-left text-[11px] font-bold uppercase tracking-wider text-[#8d9ab0] dark:text-gray-400 px-5 py-3 border-b border-[#eef0f3] dark:border-gray-800">
                                        Member
                                    </th>
                                    <th className="text-left text-[11px] font-bold uppercase tracking-wider text-[#8d9ab0] dark:text-gray-400 px-5 py-3 border-b border-[#eef0f3] dark:border-gray-800">
                                        Role
                                    </th>
                                    <th className="text-right text-[11px] font-bold uppercase tracking-wider text-[#8d9ab0] dark:text-gray-400 px-5 py-3 border-b border-[#eef0f3] dark:border-gray-800">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {members.map((member, idx) => {
                                    const memberRole = getMemberRole(member);
                                    const isMe = isCurrentUser(member);
                                    const isUpdating =
                                        updatingRoleForUserId === member.id;
                                    const isLast = idx === members.length - 1;

                                    return (
                                        <tr
                                            key={member.id}
                                            className="group transition-colors duration-150 hover:bg-[#f8f9fa]/50 dark:hover:bg-gray-800/30"
                                        >
                                            <td
                                                className={`px-5 py-3.5 ${!isLast ? 'border-b border-[#eef0f3]/40 dark:border-gray-800/40' : ''}`}
                                            >
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-8 w-8 rounded-lg bg-[#eef0f3] dark:bg-gray-800 flex items-center justify-center shrink-0">
                                                        <span className="text-[11px] font-bold text-[#4e5d74] dark:text-gray-400">
                                                            {member.firstName?.[0]?.toUpperCase() ||
                                                                member.email[0].toUpperCase()}
                                                            {member.lastName?.[0]?.toUpperCase() ||
                                                                ''}
                                                        </span>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <div className="text-[13.5px] font-semibold text-[#272f3b] dark:text-gray-100 truncate">
                                                                {member.firstName &&
                                                                member.lastName
                                                                    ? `${member.firstName} ${member.lastName}`
                                                                    : member.email}
                                                            </div>
                                                            {isMe && (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                                    You
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-[#8d9ab0] dark:text-gray-400 truncate mt-0.5">
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td
                                                className={`px-5 py-3.5 ${!isLast ? 'border-b border-[#eef0f3]/40 dark:border-gray-800/40' : ''}`}
                                            >
                                                <Select
                                                    value={memberRole?.id || ''}
                                                    onValueChange={(
                                                        newRoleId,
                                                    ) =>
                                                        handleRoleChange(
                                                            member.id,
                                                            newRoleId,
                                                        )
                                                    }
                                                    disabled={
                                                        isMe || isUpdating
                                                    }
                                                >
                                                    <SelectTrigger className="w-[160px] h-8 rounded-lg border-[#dce1e8] dark:border-gray-700 text-[13px]">
                                                        <SelectValue>
                                                            {isUpdating ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                                    <span className="text-xs">
                                                                        Updating...
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span
                                                                    className={`inline-flex text-[11.5px] font-semibold px-2.5 py-0.5 rounded-full ${
                                                                        memberRole?.name ===
                                                                        'Admin'
                                                                            ? 'bg-[#272f3b] text-white dark:bg-gray-100 dark:text-gray-900'
                                                                            : 'bg-[#eef0f3] text-[#4e5d74] dark:bg-gray-800 dark:text-gray-400'
                                                                    }`}
                                                                >
                                                                    {memberRole?.name ||
                                                                        'No role'}
                                                                </span>
                                                            )}
                                                        </SelectValue>
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {roles.map((role) => (
                                                            <SelectItem
                                                                key={role.id}
                                                                value={role.id}
                                                            >
                                                                {role.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </td>
                                            <td
                                                className={`px-5 py-3.5 ${!isLast ? 'border-b border-[#eef0f3]/40 dark:border-gray-800/40' : ''}`}
                                            >
                                                <div className="flex items-center justify-end gap-0.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        onClick={() =>
                                                            setMemberToRemove(
                                                                member,
                                                            )
                                                        }
                                                        disabled={isMe}
                                                        title={
                                                            isMe
                                                                ? 'You cannot remove yourself'
                                                                : 'Remove member'
                                                        }
                                                        className="rounded-lg hover:bg-[#eef0f3] dark:hover:bg-gray-800"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Invite Members Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(14,17,23,0.04),0_4px_16px_rgba(14,17,23,0.03)] overflow-hidden fade-up-2 mt-5">
                {/* Card Header */}
                <div className="px-6 py-5 border-b border-[#eef0f3] dark:border-gray-800">
                    <h3 className="text-[15px] font-semibold text-[#272f3b] dark:text-gray-100 mb-0.5">
                        Invite Members
                    </h3>
                    <p className="text-[12.5px] text-[#8d9ab0] dark:text-gray-400">
                        Invite new members to join your organization
                    </p>
                </div>

                {/* Card Content */}
                <div className="p-6">
                    {inviteError && (
                        <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
                            {inviteError}
                        </div>
                    )}

                    {inviteSuccess && (
                        <div className="mb-4 p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-sm flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4" />
                            {inviteSuccess}
                        </div>
                    )}

                    {!organizationId ? (
                        <div className="text-center py-12 text-[#8d9ab0] dark:text-gray-400 text-sm">
                            <p>Unable to load organization information.</p>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleInviteMember}
                            className="space-y-4"
                        >
                            <div className="space-y-1.5">
                                <Label
                                    htmlFor="invite-email"
                                    className="text-xs font-semibold text-[#4e5d74] dark:text-gray-300 uppercase tracking-wide"
                                >
                                    Email Address
                                </Label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8d9ab0]" />
                                        <Input
                                            id="invite-email"
                                            type="email"
                                            placeholder="colleague@example.com"
                                            value={inviteEmail}
                                            onChange={(e) =>
                                                setInviteEmail(e.target.value)
                                            }
                                            className="pl-10 h-10 rounded-xl border-[1.5px] border-[#dce1e8] dark:border-gray-700 text-sm"
                                            required
                                        />
                                    </div>
                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="md"
                                        disabled={
                                            isInviting || !inviteEmail.trim()
                                        }
                                        className="rounded-xl h-10"
                                    >
                                        {isInviting ? (
                                            <>
                                                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            'Send Invite'
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-[#8d9ab0] dark:text-gray-400 mt-1">
                                    An invitation link will be sent to the email
                                    address provided.
                                </p>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </>
    );
}

interface OrganizationTabProps {
    organizationId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function OrganizationTab(_props: OrganizationTabProps) {
    return (
        <>
            {/* Section Header */}
            <div className="mb-6 section-header-anim">
                <h2 className="text-2xl font-serif text-[#272f3b] dark:text-gray-100 tracking-tight mb-1">
                    Organization
                </h2>
                <p className="text-[13.5px] text-[#8d9ab0] dark:text-gray-400">
                    General settings for your organization
                </p>
            </div>

            {/* Placeholder for future organization settings */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(14,17,23,0.04),0_4px_16px_rgba(14,17,23,0.03)] overflow-hidden fade-up-1">
                <div className="p-12 text-center">
                    <Building2 className="h-12 w-12 mx-auto mb-3 text-[#8d9ab0] opacity-40" />
                    <p className="text-sm text-[#8d9ab0] dark:text-gray-400">
                        Organization settings will be available here soon.
                    </p>
                </div>
            </div>
        </>
    );
}
