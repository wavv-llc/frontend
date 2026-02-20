'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    Database,
    Table,
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

type TabType = 'documents' | 'users' | 'sharepoint' | 'organization';

export default function SettingsPage() {
    const { isLoaded, getToken } = useAuth();
    const { user, isLoading: isUserLoading } = useUser();

    // Tab state
    const [activeTab, setActiveTab] = useState<TabType>('documents');
    const [indicatorStyle, setIndicatorStyle] = useState({
        left: 0,
        width: 0,
    });
    const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
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

    // Update indicator position when active tab changes
    useEffect(() => {
        const activeTabElement = tabRefs.current[activeTab];
        if (activeTabElement) {
            const { offsetLeft, offsetWidth } = activeTabElement;
            setIndicatorStyle({
                left: offsetLeft,
                width: offsetWidth,
            });
        }
    }, [activeTab]);

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
            case 'READY':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#eef0f3] text-[#4e5d74] dark:bg-gray-800 dark:text-gray-400">
                        Ready
                    </span>
                );
            case 'PROCESSING':
            case 'EMBEDDING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#dce1e8] text-[#6b7a94] dark:bg-gray-700 dark:text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6b7a94] dark:bg-gray-400 animate-pulse" />
                        Processing
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#dce1e8] text-[#6b7a94] dark:bg-gray-700 dark:text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6b7a94] dark:bg-gray-400 animate-pulse" />
                        Pending
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#272f3b]10 text-[#272f3b] dark:bg-red-900/30 dark:text-red-400">
                        Error
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#eef0f3] text-[#4e5d74] dark:bg-gray-800 dark:text-gray-400">
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
            icon: <FileText className="h-3 w-3" />,
        },
        { id: 'users', label: 'Users', icon: <Users className="h-3 w-3" /> },
        {
            id: 'sharepoint',
            label: 'SharePoint',
            icon: <Building2 className="h-3 w-3" />,
        },
        {
            id: 'organization',
            label: 'Organization',
            icon: <Building2 className="h-3 w-3" />,
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
                <header className="sticky top-0 z-10 flex items-center justify-center h-[43px] bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-[#dce1e8]/60 dark:border-gray-800/60">
                    <nav className="relative flex items-stretch gap-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                ref={(el) => {
                                    tabRefs.current[tab.id] = el;
                                }}
                                onClick={() => setActiveTab(tab.id)}
                                className={`relative flex items-center gap-2 px-5 py-2 text-[11px] font-medium transition-all duration-300 ease-out cursor-pointer rounded-lg ${
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
                                left: `${indicatorStyle.left + indicatorStyle.width * 0.15}px`,
                                width: `${indicatorStyle.width * 0.7}px`,
                            }}
                        />
                    </nav>
                </header>

                {/* Tab Content */}
                <div className="w-full pl-6 pr-6 py-6 pb-12 relative z-[1]">
                    <div className="max-w-[900px] mx-auto">
                        <div key={activeTab} className="tab-content-enter">
                            {activeTab === 'documents' && (
                                <DocumentsTab
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

                            {activeTab === 'sharepoint' && (
                                <SharePointTab
                                    sites={sites}
                                    selectedSiteIds={selectedSiteIds}
                                    isLoadingSites={isLoadingSites}
                                    error={error}
                                    isSaving={isSaving}
                                    toggleSite={toggleSite}
                                    handleSaveSites={handleSaveSites}
                                    loadSharePointData={loadSharePointData}
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
    getStatusBadge: (
        status: OrganizationDocument['status'],
    ) => React.ReactElement;
    formatFileSize: (bytes: number) => string;
}

function DocumentsTab({
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
}: DocumentsTabProps) {
    // Helper to get file icon and colors based on file type
    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        if (['xls', 'xlsx', 'csv'].includes(ext)) {
            return {
                icon: Table,
                color: '#4e5d74',
                bg: '#4e5d7412',
            };
        }
        return {
            icon: FileText,
            color: '#6b7a94',
            bg: '#6b7a9410',
        };
    };

    // Helper to get file type label
    const getFileType = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        return ext.toUpperCase();
    };

    return (
        <>
            {/* Section Header */}
            <div className="mb-5 section-header-anim">
                <h2 className="text-lg font-serif text-[#272f3b] dark:text-gray-100 tracking-tight mb-1">
                    Document Management
                </h2>
                <p className="text-[11px] text-[#8d9ab0] dark:text-gray-400">
                    View and manage documents uploaded to your organization
                </p>
            </div>

            {/* Documents List Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(14,17,23,0.04),0_4px_16px_rgba(14,17,23,0.03)] overflow-hidden fade-up-1">
                {/* Card Header */}
                <div className="px-5 py-4 border-b border-[#eef0f3] dark:border-gray-800">
                    {/* Search and Filter */}
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8d9ab0]" />
                            <Input
                                placeholder="Search documents..."
                                value={documentSearch}
                                onChange={(e) =>
                                    setDocumentSearch(e.target.value)
                                }
                                className="pl-9 h-8 rounded-md border border-[#dce1e8] dark:border-gray-700 text-[11px] focus:border-[#b8c1ce] focus:ring-1 focus:ring-[#b8c1ce]/20 bg-white dark:bg-gray-900"
                            />
                        </div>
                        <Select
                            value={statusFilter}
                            onValueChange={setStatusFilter}
                        >
                            <SelectTrigger className="w-[120px] h-8 rounded-md border border-[#dce1e8] dark:border-gray-700 text-[11px] bg-white dark:bg-gray-900">
                                <div className="flex items-center gap-1.5">
                                    <Filter className="h-3 w-3" />
                                    <SelectValue />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="ready">Ready</SelectItem>
                                <SelectItem value="in-progress">
                                    In Progress
                                </SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={loadDocuments}
                            disabled={isLoadingDocuments || !organizationId}
                            className="rounded-md h-8"
                        >
                            <RefreshCw
                                className={`h-3 w-3 mr-2 ${isLoadingDocuments ? 'animate-spin' : ''}`}
                            />
                            Refresh
                        </Button>
                    </div>
                </div>

                {/* Card Content */}
                <div className="p-1.5">
                    {documentsError && (
                        <div className="mx-1.5 mt-1.5 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px]">
                            {documentsError}
                        </div>
                    )}

                    {!organizationId ? (
                        <div className="text-center py-12 text-[#8d9ab0] dark:text-gray-400 text-[11px]">
                            <p>Unable to load organization information.</p>
                        </div>
                    ) : isLoadingDocuments ? (
                        <div className="space-y-0.5 p-1">
                            {[1, 2, 3, 4, 5].map((i) => (
                                <div
                                    key={i}
                                    className="p-3 rounded-xl flex items-center gap-3 bg-[#f8f9fa] dark:bg-gray-800"
                                >
                                    <Skeleton className="h-4 w-4 rounded" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3 w-1/3" />
                                        <Skeleton className="h-2.5 w-1/4" />
                                    </div>
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                            ))}
                        </div>
                    ) : documents.length === 0 ? (
                        <div className="text-center py-12 text-[#8d9ab0] dark:text-gray-400">
                            <FileText className="h-10 w-10 mx-auto mb-2.5 opacity-40" />
                            <p className="text-[11px]">
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

                                    // Map filter categories to actual statuses
                                    let matchesStatus = true;
                                    if (statusFilter === 'ready') {
                                        matchesStatus = [
                                            'COMPLETED',
                                            'READY',
                                        ].includes(doc.status);
                                    } else if (statusFilter === 'in-progress') {
                                        matchesStatus = [
                                            'PROCESSING',
                                            'EMBEDDING',
                                            'PENDING',
                                        ].includes(doc.status);
                                    } else if (statusFilter === 'failed') {
                                        matchesStatus = [
                                            'FAILED',
                                            'ARCHIVED',
                                        ].includes(doc.status);
                                    }
                                    // 'all' filter shows everything

                                    return matchesSearch && matchesStatus;
                                },
                            );

                            if (filteredDocuments.length === 0) {
                                return (
                                    <div className="text-center py-12 text-[#8d9ab0] dark:text-gray-400">
                                        <Search className="h-10 w-10 mx-auto mb-2.5 opacity-40" />
                                        <p className="text-[11px]">
                                            No documents match your search or
                                            filter criteria.
                                        </p>
                                    </div>
                                );
                            }

                            return (
                                <div className="overflow-hidden">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-[240px_140px_80px_1fr] gap-3 px-5 py-2.5 border-b border-[#eef0f3] dark:border-gray-800">
                                        <div className="text-[8.5px] font-bold uppercase tracking-wider text-[#8d9ab0] dark:text-gray-400">
                                            Name
                                        </div>
                                        <div className="text-[8.5px] font-bold uppercase tracking-wider text-[#8d9ab0] dark:text-gray-400">
                                            Source
                                        </div>
                                        <div className="text-[8.5px] font-bold uppercase tracking-wider text-[#8d9ab0] dark:text-gray-400">
                                            Size
                                        </div>
                                        <div className="text-[8.5px] font-bold uppercase tracking-wider text-[#8d9ab0] dark:text-gray-400">
                                            Status
                                        </div>
                                    </div>

                                    {/* Table Body */}
                                    <div className="max-h-[400px] overflow-y-auto">
                                        {filteredDocuments.map((doc) => {
                                            const fileIcon = getFileIcon(
                                                doc.originalName,
                                            );
                                            const FileIconComponent =
                                                fileIcon.icon;

                                            return (
                                                <div
                                                    key={doc.id}
                                                    className="grid grid-cols-[240px_140px_80px_1fr] gap-3 items-center px-5 py-3.5 border-b border-[#eef0f3]66 dark:border-gray-800/40 hover:bg-[#f8f9fa] dark:hover:bg-gray-800/30 transition-colors"
                                                >
                                                    {/* File Name */}
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105"
                                                            style={{
                                                                background:
                                                                    fileIcon.bg,
                                                                color: fileIcon.color,
                                                            }}
                                                        >
                                                            <FileIconComponent
                                                                size={14}
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div
                                                                className="text-[11px] font-semibold text-[#272f3b] dark:text-gray-100 truncate"
                                                                title={
                                                                    doc.originalName
                                                                }
                                                            >
                                                                {
                                                                    doc.originalName
                                                                }
                                                            </div>
                                                            <div className="text-[9px] text-[#8d9ab0] dark:text-gray-400 mt-0.5">
                                                                {getFileType(
                                                                    doc.originalName,
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Source */}
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        <span className="text-[#8d9ab0] dark:text-gray-400 flex-shrink-0">
                                                            <Database
                                                                size={11}
                                                            />
                                                        </span>
                                                        <span
                                                            className="text-[10px] font-medium text-[#6b7a94] dark:text-gray-400 truncate"
                                                            title={
                                                                doc
                                                                    .sharepointSite
                                                                    ?.siteName ||
                                                                'SharePoint'
                                                            }
                                                        >
                                                            {doc.sharepointSite
                                                                ?.siteName ||
                                                                'SharePoint'}
                                                        </span>
                                                    </div>

                                                    {/* Size */}
                                                    <div className="text-[10px] text-[#6b7a94] dark:text-gray-400 font-medium">
                                                        {formatFileSize(
                                                            doc.filesize,
                                                        )}
                                                    </div>

                                                    {/* Status with Action Buttons */}
                                                    <div className="flex items-center gap-2">
                                                        {getStatusBadge(
                                                            doc.status,
                                                        )}
                                                        {(doc.status ===
                                                            'FAILED' ||
                                                            doc.status ===
                                                                'COMPLETED' ||
                                                            doc.status ===
                                                                'READY') && (
                                                            <div className="flex items-center gap-1.5">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
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
                                                                    className="rounded-md h-7 px-2.5 hover:bg-[#eef0f3] dark:hover:bg-gray-800 cursor-pointer text-[10px]"
                                                                >
                                                                    {retryingDocumentId ===
                                                                    doc.id ? (
                                                                        <>
                                                                            <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                                                            <span>
                                                                                Processing...
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <RotateCcw
                                                                                size={
                                                                                    12
                                                                                }
                                                                                className="mr-1.5"
                                                                            />
                                                                            <span>
                                                                                Retry
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
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
                                                                    className="rounded-md h-7 px-2.5 hover:bg-[#eef0f3] dark:hover:bg-gray-800 cursor-pointer text-[10px]"
                                                                >
                                                                    {retryingDocumentId ===
                                                                    doc.id ? (
                                                                        <>
                                                                            <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                                                            <span>
                                                                                Embedding...
                                                                            </span>
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <RefreshCw
                                                                                size={
                                                                                    12
                                                                                }
                                                                                className="mr-1.5"
                                                                            />
                                                                            <span>
                                                                                Re-embed
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
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
    inviteEmail,
    setInviteEmail,
    isInviting,
    inviteError,
    inviteSuccess,
    handleInviteMember,
}: UsersTabProps) {
    const [memberSearch, setMemberSearch] = useState('');
    const [selectedRole, setSelectedRole] = useState('');

    // Filter members based on search
    const filteredMembers = members.filter((member) => {
        const matchesSearch =
            memberSearch === '' ||
            member.email.toLowerCase().includes(memberSearch.toLowerCase()) ||
            (member.firstName &&
                member.firstName
                    .toLowerCase()
                    .includes(memberSearch.toLowerCase())) ||
            (member.lastName &&
                member.lastName
                    .toLowerCase()
                    .includes(memberSearch.toLowerCase()));

        return matchesSearch;
    });

    return (
        <>
            {/* Team Members Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(14,17,23,0.04),0_4px_16px_rgba(14,17,23,0.03)] overflow-hidden fade-up-1">
                {/* Search Bar */}
                <div className="px-5 py-4 border-b border-[#eef0f3] dark:border-gray-800">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8d9ab0]" />
                        <Input
                            placeholder="Search members..."
                            value={memberSearch}
                            onChange={(e) => setMemberSearch(e.target.value)}
                            className="pl-9 h-9 rounded-xl border-[1.5px] border-[#dce1e8] dark:border-gray-700 text-[11px] focus:border-[#b8c1ce] focus:ring-1 focus:ring-[#b8c1ce]/20"
                        />
                    </div>
                </div>

                {/* Error Message */}
                {membersError && (
                    <div className="mx-5 mt-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px]">
                        {membersError}
                    </div>
                )}

                {/* Card Content */}
                {!organizationId ? (
                    <div className="text-center py-12 text-[#8d9ab0] dark:text-gray-400 text-[11px]">
                        <p>Unable to load organization information.</p>
                    </div>
                ) : isLoadingMembers ? (
                    <div className="p-4 space-y-0.5">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-4 bg-[#f8f9fa] dark:bg-gray-800 rounded-xl"
                            >
                                <div className="flex items-center gap-3 flex-1">
                                    <Skeleton className="h-10 w-10 rounded-full" />
                                    <div className="space-y-2 flex-1">
                                        <Skeleton className="h-3 w-28" />
                                        <Skeleton className="h-2.5 w-32" />
                                    </div>
                                </div>
                                <Skeleton className="h-5 w-20" />
                            </div>
                        ))}
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="text-center py-12 text-[#8d9ab0] dark:text-gray-400">
                        <Users className="h-10 w-10 mx-auto mb-2.5 opacity-40" />
                        <p className="text-[11px]">
                            {memberSearch
                                ? 'No members match your search.'
                                : 'No members found in your organization.'}
                        </p>
                    </div>
                ) : (
                    <div className="p-4 space-y-2">
                        {filteredMembers.map((member) => {
                            const memberRole = getMemberRole(member);
                            const isMe = isCurrentUser(member);
                            const isUpdating =
                                updatingRoleForUserId === member.id;

                            // Get initials for avatar
                            const initials =
                                member.firstName && member.lastName
                                    ? `${member.firstName[0]}${member.lastName[0]}`.toUpperCase()
                                    : member.email
                                          .substring(0, 2)
                                          .toUpperCase();

                            return (
                                <div
                                    key={member.id}
                                    className="flex items-center justify-between p-4 rounded-xl hover:bg-[#f8f9fa]/50 dark:hover:bg-gray-800/30 transition-colors"
                                >
                                    {/* Left: Avatar + Info */}
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        {/* Circular Avatar */}
                                        <div className="h-10 w-10 rounded-full bg-[#272f3b] dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                            <span className="text-[11px] font-bold text-white dark:text-gray-200">
                                                {initials}
                                            </span>
                                        </div>

                                        {/* Name and Email + Badge + Status */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className="text-[12px] font-semibold text-[#272f3b] dark:text-gray-100 truncate">
                                                    {member.firstName &&
                                                    member.lastName
                                                        ? `${member.firstName} ${member.lastName}`
                                                        : member.email}
                                                </div>
                                                {isMe && (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold bg-[#eef0f3] text-[#6b7a94] dark:bg-gray-800 dark:text-gray-400 uppercase">
                                                        YOU
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[11px] text-[#8d9ab0] dark:text-gray-400 truncate">
                                                {member.email}
                                            </div>
                                            <div className="flex items-center gap-2 mt-1.5">
                                                {/* Status Dot + Text */}
                                                <div className="flex items-center gap-1.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                    <span className="text-[10px] text-[#6b7a94] dark:text-gray-400">
                                                        Active
                                                    </span>
                                                </div>
                                                <span className="text-[#dce1e8] dark:text-gray-700">
                                                    •
                                                </span>
                                                <span className="text-[10px] text-[#6b7a94] dark:text-gray-400">
                                                    {new Date(
                                                        member.createdAt,
                                                    ).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Role Dropdown + Actions */}
                                    <div className="flex items-center gap-2 ml-4">
                                        <Select
                                            value={memberRole?.id || ''}
                                            onValueChange={(newRoleId) =>
                                                handleRoleChange(
                                                    member.id,
                                                    newRoleId,
                                                )
                                            }
                                            disabled={isMe || isUpdating}
                                        >
                                            <SelectTrigger className="w-[140px] h-8 rounded-lg border-[#dce1e8] dark:border-gray-700 text-[11px]">
                                                <SelectValue>
                                                    {isUpdating ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                            <span className="text-[10px]">
                                                                Updating...
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] font-medium text-[#272f3b] dark:text-gray-100">
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

                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() =>
                                                setMemberToRemove(member)
                                            }
                                            disabled={isMe}
                                            title={
                                                isMe
                                                    ? 'You cannot remove yourself'
                                                    : 'Remove member'
                                            }
                                            className="rounded-lg hover:bg-[#eef0f3] dark:hover:bg-gray-800 h-8 w-8"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Invite Members Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(14,17,23,0.04),0_4px_16px_rgba(14,17,23,0.03)] overflow-hidden fade-up-2 mt-4">
                <div className="p-5">
                    {inviteError && (
                        <div className="mb-3 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px]">
                            {inviteError}
                        </div>
                    )}

                    {inviteSuccess && (
                        <div className="mb-3 p-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[11px] flex items-center gap-1.5">
                            <CheckCircle2 className="h-3 w-3" />
                            {inviteSuccess}
                        </div>
                    )}

                    {!organizationId ? (
                        <div className="text-center py-10 text-[#8d9ab0] dark:text-gray-400 text-[11px]">
                            <p>Unable to load organization information.</p>
                        </div>
                    ) : (
                        <div className="flex items-start gap-4">
                            {/* Mail Icon */}
                            <div className="w-12 h-12 rounded-xl bg-[#f8f9fa] dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                                <Mail className="h-5 w-5 text-[#6b7a94] dark:text-gray-400" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <h3 className="text-[13px] font-semibold text-[#272f3b] dark:text-gray-100 mb-1">
                                    Invite a team member
                                </h3>
                                <p className="text-[11px] text-[#8d9ab0] dark:text-gray-400 mb-3">
                                    They'll receive a link to join your
                                    organization
                                </p>

                                {/* Single Row Form */}
                                <form onSubmit={handleInviteMember}>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="email"
                                            placeholder="email@example.com"
                                            value={inviteEmail}
                                            onChange={(e) =>
                                                setInviteEmail(e.target.value)
                                            }
                                            className="flex-1 h-9 rounded-xl border-[1.5px] border-[#dce1e8] dark:border-gray-700 text-[11px]"
                                            required
                                        />
                                        <Select
                                            value={selectedRole}
                                            onValueChange={setSelectedRole}
                                        >
                                            <SelectTrigger className="w-[140px] h-9 rounded-xl border-[1.5px] border-[#dce1e8] dark:border-gray-700 text-[11px]">
                                                <SelectValue placeholder="Select role" />
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
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            size="md"
                                            disabled={
                                                isInviting ||
                                                !inviteEmail.trim()
                                            }
                                            className="rounded-xl h-9 text-[11px] px-4"
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
                                </form>
                            </div>
                        </div>
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
            <div className="mb-5 section-header-anim">
                <h2 className="text-lg font-serif text-[#272f3b] dark:text-gray-100 tracking-tight mb-1">
                    Organization
                </h2>
                <p className="text-[11px] text-[#8d9ab0] dark:text-gray-400">
                    General settings for your organization
                </p>
            </div>

            {/* Placeholder for future organization settings */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(14,17,23,0.04),0_4px_16px_rgba(14,17,23,0.03)] overflow-hidden fade-up-1">
                <div className="p-10 text-center">
                    <Building2 className="h-10 w-10 mx-auto mb-2.5 text-[#8d9ab0] opacity-40" />
                    <p className="text-[11px] text-[#8d9ab0] dark:text-gray-400">
                        Organization settings will be available here soon.
                    </p>
                </div>
            </div>
        </>
    );
}

interface SharePointTabProps {
    sites: SharePointSite[];
    selectedSiteIds: Set<string>;
    isLoadingSites: boolean;
    error: string | null;
    isSaving: boolean;
    toggleSite: (siteId: string) => void;
    handleSaveSites: () => void;
    loadSharePointData: () => void;
}

function SharePointTab({
    sites,
    selectedSiteIds,
    isLoadingSites,
    error,
    isSaving,
    toggleSite,
    handleSaveSites,
    loadSharePointData,
}: SharePointTabProps) {
    return (
        <>
            {/* Section Header */}
            <div className="mb-5 section-header-anim">
                <h2 className="text-lg font-serif text-[#272f3b] dark:text-gray-100 tracking-tight mb-1">
                    SharePoint Integration
                </h2>
                <p className="text-[11px] text-[#8d9ab0] dark:text-gray-400">
                    Configure SharePoint sites for AI auditing
                </p>
            </div>

            {/* SharePoint Sites Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(14,17,23,0.04),0_4px_16px_rgba(14,17,23,0.03)] overflow-hidden fade-up-1">
                {/* Card Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#eef0f3] dark:border-gray-800">
                    <div>
                        <h3 className="text-[12px] font-semibold text-[#272f3b] dark:text-gray-100 mb-0.5">
                            SharePoint Sites
                        </h3>
                        <p className="text-[10px] text-[#8d9ab0] dark:text-gray-400">
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
                            className={`h-3 w-3 mr-2 ${isLoadingSites ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </Button>
                </div>

                {/* Card Content */}
                <div className="p-1.5">
                    {error && (
                        <div className="mx-1.5 mt-1.5 p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px]">
                            {error}
                        </div>
                    )}

                    {isLoadingSites ? (
                        <div className="space-y-0.5 p-1">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="p-3 rounded-xl flex items-center gap-3 bg-[#f8f9fa] dark:bg-gray-800"
                                >
                                    <Skeleton className="h-4 w-4 rounded-full" />
                                    <div className="flex-1 space-y-1.5">
                                        <Skeleton className="h-3 w-28" />
                                        <Skeleton className="h-2.5 w-40" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : sites.length === 0 ? (
                        <div className="text-center py-10 text-[#8d9ab0] dark:text-gray-400 text-[11px]">
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
                                        className={`p-3 rounded-xl cursor-pointer transition-all duration-200 ${
                                            isSelected
                                                ? 'bg-[#eef0f3]/60 dark:bg-gray-800'
                                                : 'hover:bg-[#f8f9fa] dark:hover:bg-gray-800/50'
                                        }`}
                                        onClick={() => toggleSite(site.id)}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="flex items-center justify-center shrink-0 mt-0.5">
                                                <div
                                                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                                                        isSelected
                                                            ? 'border-[#3a4557] bg-[#3a4557] dark:border-gray-100 dark:bg-gray-100'
                                                            : 'border-[#b8c1ce] dark:border-gray-600'
                                                    }`}
                                                >
                                                    {isSelected && (
                                                        <div className="h-1.5 w-1.5 rounded-full bg-white dark:bg-gray-900" />
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-[11px] font-semibold text-[#272f3b] dark:text-gray-100">
                                                    {site.displayName ||
                                                        site.name}
                                                </h4>
                                                <p className="text-[10px] text-[#8d9ab0] dark:text-gray-400 truncate mt-0.5">
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
                    <div className="flex items-center justify-between px-5 py-3 border-t border-[#eef0f3] dark:border-gray-800">
                        <span className="text-[10px] text-[#8d9ab0] dark:text-gray-400 font-medium">
                            {selectedSiteIds.size} site
                            {selectedSiteIds.size !== 1 ? 's' : ''} selected
                        </span>
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleSaveSites}
                            disabled={isSaving}
                            className="rounded-xl text-[10px] h-7 px-3"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}
