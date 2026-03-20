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
    X,
    Check,
    ArrowLeft,
    Clock,
    ChevronDown,
    ChevronRight,
    ChevronUp,
    Briefcase,
    CheckCircle,
    XCircle,
    AlertCircle,
    PlayCircle,
    Pencil,
} from 'lucide-react';
import {
    sharepointApi,
    organizationApi,
    documentsApi,
    OrganizationDocument,
    OrganizationDocumentsResponse,
    OrganizationDetails,
    OrganizationMember,
    OrganizationRole,
    jobsApi,
    ServiceJob,
    DocumentDetail,
} from '@/lib/api';
import { TaxLibraryTab } from '@/components/tax-library/TaxLibraryTab';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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

type TabType =
    | 'documents'
    | 'users'
    | 'sharepoint'
    | 'organization'
    | 'taxlibrary';

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
    const [inviteFirstName, setInviteFirstName] = useState('');
    const [inviteLastName, setInviteLastName] = useState('');
    const [isInviting, setIsInviting] = useState(false);
    const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);

    // Documents state
    const [documents, setDocuments] = useState<OrganizationDocument[]>([]);
    const [isLoadingDocuments, setIsLoadingDocuments] = useState(false);
    const [retryingDocumentId, setRetryingDocumentId] = useState<string | null>(
        null,
    );
    const [documentSearch, setDocumentSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(
        null,
    );

    // Members state
    const [members, setMembers] = useState<OrganizationMember[]>([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
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
        }
    }, [isLoaded, getToken, organizationId]);

    const loadDocuments = async (orgId?: string) => {
        const targetOrgId = orgId || organizationId;
        if (!targetOrgId) return;

        try {
            setIsLoadingDocuments(true);
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
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to load documents';
            toast.error(errorMessage);
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
            toast.error(errorMessage);
        } finally {
            setRetryingDocumentId(null);
        }
    };

    const handleReembedDocument = async (
        documentId: string,
        resume = false,
    ) => {
        try {
            setRetryingDocumentId(documentId);
            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await documentsApi.reembedDocument(token, documentId, resume);
            toast.success(
                resume
                    ? 'Retrying failed chunks started successfully'
                    : 'Document re-embedding started successfully',
            );
            // Reload documents to get updated status
            await loadDocuments();
        } catch (err) {
            console.error('Error re-embedding document:', err);
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to re-embed document';
            toast.error(errorMessage);
        } finally {
            setRetryingDocumentId(null);
        }
    };

    const getStatusBadge = (status: OrganizationDocument['status']) => {
        switch (status) {
            case 'READY':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#eef0f3] text-[#4e5d74] dark:bg-gray-800 dark:text-gray-400">
                        Ready
                    </span>
                );
            case 'UPLOADING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#dce1e8] text-[#6b7a94] dark:bg-gray-700 dark:text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6b7a94] dark:bg-gray-400 animate-pulse" />
                        Uploading
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
            case 'FAILED':
            case 'FAILED_CORRUPTED':
            case 'FAILED_UNSUPPORTED':
            case 'FAILED_TOO_LARGE':
            case 'FAILED_PROCESSING':
            case 'FAILED_EMBEDDING':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#272f3b]10 text-[#272f3b] dark:bg-red-900/30 dark:text-red-400">
                        Error
                    </span>
                );
            case 'DELETING':
            case 'DELETED':
                return (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#eef0f3] text-[#4e5d74] dark:bg-gray-800 dark:text-gray-400">
                        {status === 'DELETING' ? 'Deleting' : 'Deleted'}
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
            setInviteSuccess(null);

            const token = await getToken();
            if (!token) {
                toast.error('Authentication required');
                return;
            }

            await organizationApi.inviteMember(
                token,
                organizationId,
                inviteEmail.trim(),
                inviteFirstName.trim() || undefined,
                inviteLastName.trim() || undefined,
            );
            toast.success(`Invitation sent to ${inviteEmail}`);
            setInviteSuccess(`Invitation sent to ${inviteEmail}`);
            setInviteEmail('');
            setInviteFirstName('');
            setInviteLastName('');
        } catch (err) {
            console.error('Error inviting member:', err);
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to send invitation';
            toast.error(errorMessage);
        } finally {
            setIsInviting(false);
        }
    };

    const loadMembers = async () => {
        if (!organizationId) return;

        try {
            setIsLoadingMembers(true);
            const token = await getToken();
            if (!token) return;

            const response = await organizationApi.getMembers(
                token,
                organizationId,
            );
            setMembers(response.data || []);
        } catch (err) {
            console.error('Error loading members:', err);
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to load members';
            toast.error(errorMessage);
        } finally {
            setIsLoadingMembers(false);
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
                newRoleId as OrganizationRole,
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

    const getMemberRole = (member: OrganizationMember): OrganizationRole => {
        return member.organizationRole;
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

            toast.success('SharePoint sites updated successfully');
        } catch (err) {
            console.error('Error saving selected sites:', err);
            const message =
                err instanceof Error
                    ? err.message
                    : 'Failed to save selected sites';
            setError(message);
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isLoaded || isUserLoading) {
        return null;
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
        {
            id: 'taxlibrary',
            label: 'Tax Library',
            icon: <FileText className="h-3 w-3" />,
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
                            className="absolute bottom-0 h-[2px] bg-linear-to-r from-[#3a4557] to-[#272f3b] dark:from-gray-100 dark:to-gray-50 rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(58,69,87,0.35)] dark:shadow-[0_0_12px_rgba(255,255,255,0.25)]"
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
                            {activeTab === 'documents' &&
                                (selectedDocumentId ? (
                                    <DocumentDetailView
                                        documentId={selectedDocumentId}
                                        onBack={() =>
                                            setSelectedDocumentId(null)
                                        }
                                        handleRetryDocument={
                                            handleRetryDocument
                                        }
                                        handleReembedDocument={
                                            handleReembedDocument
                                        }
                                        retryingDocumentId={retryingDocumentId}
                                        getStatusBadge={getStatusBadge}
                                        formatFileSize={formatFileSize}
                                        getToken={getToken}
                                    />
                                ) : (
                                    <DocumentsTab
                                        documents={documents}
                                        isLoadingDocuments={isLoadingDocuments}
                                        organizationId={organizationId}
                                        documentSearch={documentSearch}
                                        setDocumentSearch={setDocumentSearch}
                                        statusFilter={statusFilter}
                                        setStatusFilter={setStatusFilter}
                                        retryingDocumentId={retryingDocumentId}
                                        handleRetryDocument={
                                            handleRetryDocument
                                        }
                                        handleReembedDocument={
                                            handleReembedDocument
                                        }
                                        loadDocuments={loadDocuments}
                                        getStatusBadge={getStatusBadge}
                                        formatFileSize={formatFileSize}
                                        onDocumentClick={(id) =>
                                            setSelectedDocumentId(id)
                                        }
                                    />
                                ))}

                            {activeTab === 'users' && (
                                <UsersTab
                                    members={members}
                                    isLoadingMembers={isLoadingMembers}
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
                                    inviteFirstName={inviteFirstName}
                                    setInviteFirstName={setInviteFirstName}
                                    inviteLastName={inviteLastName}
                                    setInviteLastName={setInviteLastName}
                                    isInviting={isInviting}
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

                            {activeTab === 'taxlibrary' && (
                                <TaxLibraryTab
                                    organizationId={organizationId}
                                    getToken={getToken}
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
    organizationId?: string;
    documentSearch: string;
    setDocumentSearch: (value: string) => void;
    statusFilter: string;
    setStatusFilter: (value: string) => void;
    retryingDocumentId: string | null;
    handleRetryDocument: (documentId: string) => void;
    handleReembedDocument: (documentId: string, resume?: boolean) => void;
    loadDocuments: () => void;
    getStatusBadge: (
        status: OrganizationDocument['status'],
    ) => React.ReactElement;
    formatFileSize: (bytes: number) => string;
    onDocumentClick: (documentId: string) => void;
}

function DocumentsTab({
    documents,
    isLoadingDocuments,
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
    onDocumentClick,
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
                            onClick={() => loadDocuments()}
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
                    {!organizationId ? (
                        <div className="text-center py-12 text-[#8d9ab0] dark:text-gray-400 text-[11px]">
                            <p>Unable to load organization information.</p>
                        </div>
                    ) : isLoadingDocuments ? null : documents.length === 0 ? (
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
                                        matchesStatus = doc.status === 'READY';
                                    } else if (statusFilter === 'in-progress') {
                                        matchesStatus = [
                                            'UPLOADING',
                                            'PROCESSING',
                                            'EMBEDDING',
                                        ].includes(doc.status);
                                    } else if (statusFilter === 'failed') {
                                        matchesStatus = [
                                            'FAILED',
                                            'FAILED_CORRUPTED',
                                            'FAILED_UNSUPPORTED',
                                            'FAILED_TOO_LARGE',
                                            'FAILED_PROCESSING',
                                            'FAILED_EMBEDDING',
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
                                                    onClick={() =>
                                                        onDocumentClick(doc.id)
                                                    }
                                                    className="grid grid-cols-[240px_140px_80px_1fr] gap-3 items-center px-5 py-3.5 border-b border-[#eef0f3]66 dark:border-gray-800/40 hover:bg-[#f8f9fa] dark:hover:bg-gray-800/30 transition-colors cursor-pointer"
                                                >
                                                    {/* File Name */}
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div
                                                            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform hover:scale-105"
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
                                                        <span className="text-[#8d9ab0] dark:text-gray-400 shrink-0">
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
                                                            'FAILED_PROCESSING' ||
                                                            doc.status ===
                                                                'PROCESSING' ||
                                                            doc.status ===
                                                                'FAILED' ||
                                                            doc.status ===
                                                                'FAILED_EMBEDDING' ||
                                                            doc.status ===
                                                                'READY' ||
                                                            doc.status ===
                                                                'EMBEDDING') && (
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
                                                                {(doc.status ===
                                                                    'FAILED' ||
                                                                    doc.status ===
                                                                        'FAILED_EMBEDDING' ||
                                                                    doc.status ===
                                                                        'READY' ||
                                                                    doc.status ===
                                                                        'EMBEDDING') && (
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={(
                                                                            e,
                                                                        ) => {
                                                                            e.stopPropagation();
                                                                            handleReembedDocument(
                                                                                doc.id,
                                                                                false,
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
                                                                )}
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

// Document Detail View
interface DocumentDetailViewProps {
    documentId: string;
    onBack: () => void;
    handleRetryDocument: (documentId: string) => void;
    handleReembedDocument: (documentId: string, resume?: boolean) => void;
    retryingDocumentId: string | null;
    getStatusBadge: (
        status: OrganizationDocument['status'],
    ) => React.ReactElement;
    formatFileSize: (bytes: number) => string;
    getToken: () => Promise<string | null>;
}

function DocumentDetailView({
    documentId,
    onBack,
    handleRetryDocument,
    handleReembedDocument,
    retryingDocumentId,
    getStatusBadge,
    formatFileSize,
    getToken,
}: DocumentDetailViewProps) {
    const [document, setDocument] = useState<DocumentDetail | null>(null);
    const [jobs, setJobs] = useState<ServiceJob[]>([]);
    const [isLoadingDocument, setIsLoadingDocument] = useState(true);
    const [isLoadingJobs, setIsLoadingJobs] = useState(true);
    const [expandedJobIds, setExpandedJobIds] = useState<Set<string>>(
        new Set(),
    );
    const [jobSortOrder, setJobSortOrder] = useState<'desc' | 'asc'>('desc');

    useEffect(() => {
        loadDocument();
        loadJobs();
    }, [documentId]);

    const loadDocument = async () => {
        try {
            setIsLoadingDocument(true);
            const token = await getToken();
            if (!token) return;
            const response = await documentsApi.getDocument(token, documentId);
            if (response.data) {
                setDocument(response.data.document);
            }
        } catch (err) {
            console.error('Error loading document:', err);
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to load document';
            toast.error(errorMessage);
        } finally {
            setIsLoadingDocument(false);
        }
    };

    const loadJobs = async () => {
        try {
            setIsLoadingJobs(true);
            const token = await getToken();
            if (!token) return;
            const response = await jobsApi.getJobsByDocument(token, documentId);
            if (response.data) {
                const jobsData = Array.isArray(response.data)
                    ? response.data
                    : [];
                setJobs(jobsData);
            }
        } catch (err) {
            console.error('Error loading jobs:', err);
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to load jobs';
            toast.error(errorMessage);
        } finally {
            setIsLoadingJobs(false);
        }
    };

    const toggleJobExpanded = (jobId: string) => {
        setExpandedJobIds((prev) => {
            const next = new Set(prev);
            if (next.has(jobId)) {
                next.delete(jobId);
            } else {
                next.add(jobId);
            }
            return next;
        });
    };

    const getJobStatusBadge = (status: ServiceJob['status']) => {
        switch (status) {
            case 'COMPLETED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <CheckCircle size={10} />
                        Completed
                    </span>
                );
            case 'IN_PROGRESS':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#dce1e8] text-[#6b7a94] dark:bg-gray-700 dark:text-gray-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#6b7a94] dark:bg-gray-400 animate-pulse" />
                        In Progress
                    </span>
                );
            case 'PENDING':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#eef0f3] text-[#8d9ab0] dark:bg-gray-800 dark:text-gray-400">
                        <Clock size={10} />
                        Pending
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                        <XCircle size={10} />
                        Failed
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

    const getPhaseBadge = (phase: ServiceJob['documentStatusPhase']) => {
        if (!phase) return null;
        const colors: Record<string, string> = {
            UPLOADING:
                'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
            PROCESSING:
                'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
            EMBEDDING:
                'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400',
        };
        return (
            <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-semibold ${colors[phase] || 'bg-[#eef0f3] text-[#4e5d74]'}`}
            >
                {phase.charAt(0) + phase.slice(1).toLowerCase()}
            </span>
        );
    };

    const getFileIcon = (fileName: string) => {
        const ext = fileName.split('.').pop()?.toLowerCase() || '';
        if (['xls', 'xlsx', 'csv'].includes(ext)) {
            return { icon: Table, color: '#4e5d74', bg: '#4e5d7412' };
        }
        return { icon: FileText, color: '#6b7a94', bg: '#6b7a9410' };
    };

    const getFileType = (fileName: string) => {
        return (fileName.split('.').pop()?.toLowerCase() || '').toUpperCase();
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoadingDocument) {
        return null;
    }

    if (!document) {
        return (
            <div className="space-y-5">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 text-[11px] font-medium text-[#6b7a94] dark:text-gray-400 hover:text-[#272f3b] dark:hover:text-gray-200 transition-colors cursor-pointer"
                >
                    <ArrowLeft size={14} />
                    Back to Documents
                </button>
                <div className="text-center py-12 text-[#8d9ab0] dark:text-gray-400">
                    <AlertCircle className="h-10 w-10 mx-auto mb-2.5 opacity-40" />
                    <p className="text-[11px]">Document not found.</p>
                </div>
            </div>
        );
    }

    const fileIcon = getFileIcon(document.originalName);
    const FileIconComponent = fileIcon.icon;
    const showRetryProcessing =
        document.status === 'FAILED_PROCESSING' ||
        document.status === 'PROCESSING' ||
        document.status === 'FAILED' ||
        document.status === 'FAILED_EMBEDDING' ||
        document.status === 'READY' ||
        document.status === 'EMBEDDING';
    const showReembed =
        document.status === 'FAILED' ||
        document.status === 'FAILED_EMBEDDING' ||
        document.status === 'READY' ||
        document.status === 'EMBEDDING';

    return (
        <div className="space-y-5 section-header-anim">
            {/* Back Button */}
            <button
                onClick={onBack}
                className="flex items-center gap-2 text-[11px] font-medium text-[#6b7a94] dark:text-gray-400 hover:text-[#272f3b] dark:hover:text-gray-200 transition-colors cursor-pointer"
            >
                <ArrowLeft size={14} />
                Back to Documents
            </button>

            {/* Document Info Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(14,17,23,0.04),0_4px_16px_rgba(14,17,23,0.03)] overflow-hidden fade-up-1">
                <div className="px-5 py-5">
                    <div className="flex items-start gap-4">
                        <div
                            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                                background: fileIcon.bg,
                                color: fileIcon.color,
                            }}
                        >
                            <FileIconComponent size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-[14px] font-semibold text-[#272f3b] dark:text-gray-100 truncate">
                                {document.originalName}
                            </h2>
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-[#f0f1f4] text-[#6b7a94] dark:bg-gray-800 dark:text-gray-400">
                                    {getFileType(document.originalName)}
                                </span>
                                {getStatusBadge(document.status)}
                                <span className="text-[10px] text-[#8d9ab0] dark:text-gray-400">
                                    {formatFileSize(document.filesize)}
                                </span>
                                <span className="text-[10px] text-[#8d9ab0] dark:text-gray-400 flex items-center gap-1">
                                    <Clock size={10} />
                                    {formatDate(document.createdAt)}
                                </span>
                            </div>
                        </div>
                        {/* Retry / Re-embed Buttons */}
                        {showRetryProcessing && (
                            <div className="flex items-center gap-1.5 shrink-0">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                        handleRetryDocument(document.id)
                                    }
                                    disabled={
                                        retryingDocumentId === document.id
                                    }
                                    className="rounded-md h-7 px-2.5 bg-[#f5f6f8] hover:bg-[#eef0f3] dark:bg-gray-800/50 dark:hover:bg-gray-800 cursor-pointer text-[10px]"
                                >
                                    {retryingDocumentId === document.id ? (
                                        <>
                                            <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <RotateCcw
                                                size={12}
                                                className="mr-1.5"
                                            />
                                            <span>Retry</span>
                                        </>
                                    )}
                                </Button>
                                {showReembed && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleReembedDocument(
                                                    document.id,
                                                    false,
                                                )
                                            }
                                            disabled={
                                                retryingDocumentId ===
                                                document.id
                                            }
                                            className="rounded-md h-7 px-2.5 bg-[#f5f6f8] hover:bg-[#eef0f3] dark:bg-gray-800/50 dark:hover:bg-gray-800 cursor-pointer text-[10px]"
                                        >
                                            {retryingDocumentId ===
                                            document.id ? (
                                                <>
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                                    <span>Embedding...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <RefreshCw
                                                        size={12}
                                                        className="mr-1.5"
                                                    />
                                                    <span>Re-embed</span>
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() =>
                                                handleReembedDocument(
                                                    document.id,
                                                    true,
                                                )
                                            }
                                            disabled={
                                                retryingDocumentId ===
                                                document.id
                                            }
                                            className="rounded-md h-7 px-2.5 bg-[#f5f6f8] hover:bg-[#eef0f3] dark:bg-gray-800/50 dark:hover:bg-gray-800 cursor-pointer text-[10px]"
                                        >
                                            {retryingDocumentId ===
                                            document.id ? (
                                                <>
                                                    <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                                                    <span>Retrying...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <PlayCircle
                                                        size={12}
                                                        className="mr-1.5"
                                                    />
                                                    <span>Retry chunks</span>
                                                </>
                                            )}
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Jobs Section */}
            <div>
                <h3 className="text-lg font-serif text-[#272f3b] dark:text-gray-100 tracking-tight mb-1">
                    Processing Jobs
                </h3>
                <p className="text-[11px] text-[#8d9ab0] dark:text-gray-400 mb-4">
                    All jobs associated with this document
                </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(14,17,23,0.04),0_4px_16px_rgba(14,17,23,0.03)] overflow-hidden fade-up-1">
                {/* Jobs Header */}
                <div className="px-5 py-4 border-b border-[#eef0f3] dark:border-gray-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Briefcase size={14} className="text-[#6b7a94]" />
                        <span className="text-[11px] font-semibold text-[#272f3b] dark:text-gray-100">
                            Jobs
                        </span>
                        {!isLoadingJobs && (
                            <span className="text-[10px] text-[#8d9ab0] dark:text-gray-400">
                                ({jobs.length})
                            </span>
                        )}
                    </div>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={loadJobs}
                        disabled={isLoadingJobs}
                        className="rounded-md h-8"
                    >
                        <RefreshCw
                            className={`h-3 w-3 mr-2 ${isLoadingJobs ? 'animate-spin' : ''}`}
                        />
                        Refresh
                    </Button>
                </div>

                {/* Jobs Content */}
                <div className="p-1.5">
                    {isLoadingJobs ? null : jobs.length === 0 ? (
                        <div className="text-center py-12 text-[#8d9ab0] dark:text-gray-400">
                            <Briefcase className="h-10 w-10 mx-auto mb-2.5 opacity-40" />
                            <p className="text-[11px]">
                                No jobs found for this document.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-[1fr_140px_100px_120px] gap-3 px-5 py-2.5 border-b border-[#eef0f3] dark:border-gray-800">
                                <div className="text-[8.5px] font-bold uppercase tracking-wider text-[#8d9ab0] dark:text-gray-400">
                                    Job
                                </div>
                                <div className="text-[8.5px] font-bold uppercase tracking-wider text-[#8d9ab0] dark:text-gray-400">
                                    Phase
                                </div>
                                <div className="text-[8.5px] font-bold uppercase tracking-wider text-[#8d9ab0] dark:text-gray-400">
                                    Status
                                </div>
                                <button
                                    onClick={() =>
                                        setJobSortOrder((prev) =>
                                            prev === 'desc' ? 'asc' : 'desc',
                                        )
                                    }
                                    className="flex items-center gap-1 text-[8.5px] font-bold uppercase tracking-wider text-[#8d9ab0] dark:text-gray-400 hover:text-[#272f3b] dark:hover:text-gray-200 transition-colors cursor-pointer"
                                >
                                    Date
                                    {jobSortOrder === 'desc' ? (
                                        <ChevronDown size={10} />
                                    ) : (
                                        <ChevronUp size={10} />
                                    )}
                                </button>
                            </div>

                            {/* Table Body */}
                            <div className="max-h-[500px] overflow-y-auto">
                                {[...jobs]
                                    .sort((a, b) => {
                                        const diff =
                                            new Date(a.createdAt).getTime() -
                                            new Date(b.createdAt).getTime();
                                        return jobSortOrder === 'asc'
                                            ? diff
                                            : -diff;
                                    })
                                    .map((job) => {
                                        const hasChildren =
                                            job.childJobs.length > 0;
                                        const isChildJob =
                                            job.parentJob !== null;
                                        const isExpanded = expandedJobIds.has(
                                            job.id,
                                        );

                                        return (
                                            <div key={job.id}>
                                                <div
                                                    className={`grid grid-cols-[1fr_140px_100px_120px] gap-3 items-center px-5 py-3.5 border-b border-[#eef0f3]66 dark:border-gray-800/40 hover:bg-[#f8f9fa] dark:hover:bg-gray-800/30 transition-colors ${hasChildren ? 'cursor-pointer' : ''}`}
                                                    onClick={
                                                        hasChildren
                                                            ? () =>
                                                                  toggleJobExpanded(
                                                                      job.id,
                                                                  )
                                                            : undefined
                                                    }
                                                >
                                                    {/* Task Name & Description */}
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                        {hasChildren && (
                                                            <span className="shrink-0 text-[#8d9ab0]">
                                                                {isExpanded ? (
                                                                    <ChevronDown
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                ) : (
                                                                    <ChevronRight
                                                                        size={
                                                                            12
                                                                        }
                                                                    />
                                                                )}
                                                            </span>
                                                        )}
                                                        <div className="min-w-0">
                                                            <div className="text-[11px] font-semibold text-[#272f3b] dark:text-gray-100 truncate">
                                                                {job.jobName}
                                                            </div>
                                                            <div
                                                                className="text-[9px] text-[#8d9ab0] dark:text-gray-400 mt-0.5 truncate"
                                                                title={
                                                                    job.description
                                                                }
                                                            >
                                                                {isChildJob ? (
                                                                    <>
                                                                        <span className="text-[#6b7a94] dark:text-gray-500">
                                                                            Parent:{' '}
                                                                        </span>
                                                                        {
                                                                            job
                                                                                .parentJob!
                                                                                .jobName
                                                                        }
                                                                    </>
                                                                ) : (
                                                                    job.description
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Phase */}
                                                    <div>
                                                        {getPhaseBadge(
                                                            job.documentStatusPhase,
                                                        )}
                                                    </div>

                                                    {/* Status */}
                                                    <div>
                                                        {getJobStatusBadge(
                                                            job.status,
                                                        )}
                                                    </div>

                                                    {/* Date */}
                                                    <div className="text-[10px] text-[#6b7a94] dark:text-gray-400 font-medium">
                                                        {formatDate(
                                                            job.createdAt,
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expanded Child Jobs */}
                                                {hasChildren && isExpanded && (
                                                    <div className="bg-[#f8f9fa]/60 dark:bg-gray-800/20 border-b border-[#eef0f3]66 dark:border-gray-800/40">
                                                        {job.childJobs.map(
                                                            (child) => (
                                                                <div
                                                                    key={
                                                                        child.id
                                                                    }
                                                                    className="grid grid-cols-[1fr_140px_100px_120px] gap-3 items-center pl-12 pr-5 py-2.5 border-b border-[#eef0f3]33 dark:border-gray-800/20 last:border-b-0"
                                                                >
                                                                    <div className="text-[10px] text-[#6b7a94] dark:text-gray-400 truncate">
                                                                        {
                                                                            child.jobName
                                                                        }
                                                                    </div>
                                                                    <div />
                                                                    <div>
                                                                        {getJobStatusBadge(
                                                                            child.status,
                                                                        )}
                                                                    </div>
                                                                    <div className="text-[10px] text-[#6b7a94] dark:text-gray-400 font-medium">
                                                                        {formatDate(
                                                                            child.createdAt,
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ),
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

interface UsersTabProps {
    members: OrganizationMember[];
    isLoadingMembers: boolean;
    organizationId?: string;
    updatingRoleForUserId: string | null;
    getMemberRole: (member: OrganizationMember) => OrganizationRole;
    isCurrentUser: (member: OrganizationMember) => boolean;
    handleRoleChange: (userId: string, newRoleId: string) => void;
    setMemberToRemove: (member: OrganizationMember) => void;
    loadMembers: () => void;
    inviteEmail: string;
    setInviteEmail: (value: string) => void;
    inviteFirstName: string;
    setInviteFirstName: (value: string) => void;
    inviteLastName: string;
    setInviteLastName: (value: string) => void;
    isInviting: boolean;
    inviteSuccess: string | null;
    handleInviteMember: (e: React.FormEvent) => void;
}

function UsersTab({
    members,
    isLoadingMembers,
    organizationId,
    updatingRoleForUserId,
    getMemberRole,
    isCurrentUser,
    handleRoleChange,
    setMemberToRemove,
    inviteEmail,
    setInviteEmail,
    inviteFirstName,
    setInviteFirstName,
    inviteLastName,
    setInviteLastName,
    isInviting,
    inviteSuccess,
    handleInviteMember,
}: UsersTabProps) {
    const [memberSearch, setMemberSearch] = useState('');

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

                {/* Card Content */}
                {!organizationId ? (
                    <div className="text-center py-12 text-[#8d9ab0] dark:text-gray-400 text-[11px]">
                        <p>Unable to load organization information.</p>
                    </div>
                ) : isLoadingMembers ? null : filteredMembers.length === 0 ? (
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
                                        <div className="h-10 w-10 rounded-full bg-[#272f3b] dark:bg-gray-700 flex items-center justify-center shrink-0">
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
                                            value={memberRole}
                                            onValueChange={(newRole) =>
                                                handleRoleChange(
                                                    member.id,
                                                    newRole,
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
                                                            {memberRole ===
                                                            'ADMIN'
                                                                ? 'Admin'
                                                                : memberRole ===
                                                                    'GUEST'
                                                                  ? 'Guest'
                                                                  : 'Member'}
                                                        </span>
                                                    )}
                                                </SelectValue>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ADMIN">
                                                    Admin
                                                </SelectItem>
                                                <SelectItem value="MEMBER">
                                                    Member
                                                </SelectItem>
                                                <SelectItem value="GUEST">
                                                    Guest
                                                </SelectItem>
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
                            <div className="w-12 h-12 rounded-xl bg-[#f8f9fa] dark:bg-gray-800 flex items-center justify-center shrink-0">
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

                                {/* Invite Form */}
                                <form onSubmit={handleInviteMember}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Input
                                            type="text"
                                            placeholder="First name"
                                            value={inviteFirstName}
                                            onChange={(e) =>
                                                setInviteFirstName(
                                                    e.target.value,
                                                )
                                            }
                                            className="flex-1 h-9 rounded-xl border-[1.5px] border-[#dce1e8] dark:border-gray-700 text-[11px]"
                                        />
                                        <Input
                                            type="text"
                                            placeholder="Last name"
                                            value={inviteLastName}
                                            onChange={(e) =>
                                                setInviteLastName(
                                                    e.target.value,
                                                )
                                            }
                                            className="flex-1 h-9 rounded-xl border-[1.5px] border-[#dce1e8] dark:border-gray-700 text-[11px]"
                                        />
                                    </div>
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
                                        <Button
                                            type="submit"
                                            variant="default"
                                            size="default"
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

function OrganizationTab({ organizationId }: OrganizationTabProps) {
    const { getToken } = useAuth();
    const { user, refreshUser } = useUser();
    const [orgDetails, setOrgDetails] = useState<OrganizationDetails | null>(
        null,
    );
    const [isLoading, setIsLoading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [nameInput, setNameInput] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // Shell limits state
    const [isEditingLimits, setIsEditingLimits] = useState(false);
    const [userLimitInput, setUserLimitInput] = useState('');
    const [documentLimitInput, setDocumentLimitInput] = useState('');
    const [chatLimitInput, setChatLimitInput] = useState('');
    const [isSavingLimits, setIsSavingLimits] = useState(false);

    useEffect(() => {
        if (organizationId) {
            loadOrgDetails();
        }
    }, [organizationId]);

    const loadOrgDetails = async () => {
        if (!organizationId) return;
        try {
            setIsLoading(true);
            const token = await getToken();
            if (!token) return;
            const response = await organizationApi.getOrganization(
                token,
                organizationId,
            );
            if (response.data) {
                setOrgDetails(response.data);
                setNameInput(response.data.name);
                setUserLimitInput(
                    response.data.userLimit !== null &&
                        response.data.userLimit !== undefined
                        ? String(response.data.userLimit)
                        : '',
                );
                setDocumentLimitInput(
                    response.data.documentLimit !== null &&
                        response.data.documentLimit !== undefined
                        ? String(response.data.documentLimit)
                        : '',
                );
                setChatLimitInput(
                    response.data.chatLimit !== null &&
                        response.data.chatLimit !== undefined
                        ? String(response.data.chatLimit)
                        : '',
                );
            }
        } catch {
            toast.error('Failed to load organization details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRename = async () => {
        if (!organizationId || !nameInput.trim()) return;
        try {
            setIsSaving(true);
            const token = await getToken();
            if (!token) return;
            const response = await organizationApi.renameOrganization(
                token,
                organizationId,
                nameInput.trim(),
            );
            if (response.data) {
                setOrgDetails(response.data);
                setIsEditing(false);
                await refreshUser();
                toast.success('Organization renamed successfully');
            }
        } catch {
            toast.error('Failed to rename organization');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setNameInput(orgDetails?.name || user?.organization?.name || '');
    };

    const handleSaveLimits = async () => {
        if (!organizationId) return;
        try {
            setIsSavingLimits(true);
            const token = await getToken();
            if (!token) return;
            const response = await organizationApi.updateLimits(
                token,
                organizationId,
                {
                    userLimit:
                        userLimitInput === '' ? null : Number(userLimitInput),
                    documentLimit:
                        documentLimitInput === ''
                            ? null
                            : Number(documentLimitInput),
                    chatLimit:
                        chatLimitInput === '' ? null : Number(chatLimitInput),
                },
            );
            if (response.data) {
                setOrgDetails((prev) =>
                    prev ? { ...prev, ...response.data } : prev,
                );
                setIsEditingLimits(false);
                toast.success('Limits updated successfully');
            }
        } catch {
            toast.error('Failed to update limits');
        } finally {
            setIsSavingLimits(false);
        }
    };

    const handleCancelLimitsEdit = () => {
        setIsEditingLimits(false);
        setUserLimitInput(
            orgDetails?.userLimit !== null &&
                orgDetails?.userLimit !== undefined
                ? String(orgDetails.userLimit)
                : '',
        );
        setDocumentLimitInput(
            orgDetails?.documentLimit !== null &&
                orgDetails?.documentLimit !== undefined
                ? String(orgDetails.documentLimit)
                : '',
        );
        setChatLimitInput(
            orgDetails?.chatLimit !== null &&
                orgDetails?.chatLimit !== undefined
                ? String(orgDetails.chatLimit)
                : '',
        );
    };

    const displayName =
        orgDetails?.name || user?.organization?.name || '\u2014';
    const memberCount = orgDetails?._count?.users ?? orgDetails?.users?.length;
    const documentCount = orgDetails?._count?.documents;
    const chatCount = orgDetails?._count?.chatConversations;
    const createdAt = orgDetails?.createdAt;

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

            {/* Organization Name Card */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(14,17,23,0.04),0_4px_16px_rgba(14,17,23,0.03)] overflow-hidden fade-up-1 mb-4">
                <div className="px-5 py-4 border-b border-[#eef0f3] dark:border-gray-800">
                    <h3 className="text-[12px] font-semibold text-[#272f3b] dark:text-gray-100 mb-0.5">
                        Organization Name
                    </h3>
                    <p className="text-[10px] text-[#8d9ab0] dark:text-gray-400">
                        The display name for your organization
                    </p>
                </div>
                <div className="p-5">
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-[#8d9ab0]">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span className="text-[11px]">Loading...</span>
                        </div>
                    ) : isEditing ? (
                        <div className="flex items-center gap-2">
                            <Input
                                value={nameInput}
                                onChange={(e) => setNameInput(e.target.value)}
                                className="h-8 text-[11px] rounded-lg border-[1.5px] border-[#dce1e8] dark:border-gray-700 focus:border-[#b8c1ce] focus:ring-1 focus:ring-[#b8c1ce]/20 max-w-xs"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRename();
                                    if (e.key === 'Escape') handleCancelEdit();
                                }}
                                autoFocus
                            />
                            <Button
                                size="sm"
                                onClick={handleRename}
                                disabled={
                                    isSaving ||
                                    !nameInput.trim() ||
                                    nameInput.trim() === displayName
                                }
                                className="h-8 text-[11px]"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    <Check className="h-3 w-3" />
                                )}
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelEdit}
                                disabled={isSaving}
                                className="h-8 text-[11px]"
                            >
                                <X className="h-3 w-3" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <span className="text-[13px] font-medium text-[#272f3b] dark:text-gray-100">
                                {displayName}
                            </span>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="text-[#8d9ab0] hover:text-[#272f3b] dark:hover:text-gray-100 transition-colors cursor-pointer"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Organization Details Card */}
            {!isLoading && orgDetails && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(14,17,23,0.04),0_4px_16px_rgba(14,17,23,0.03)] overflow-hidden fade-up-2">
                    <div className="px-5 py-4 border-b border-[#eef0f3] dark:border-gray-800">
                        <h3 className="text-[12px] font-semibold text-[#272f3b] dark:text-gray-100 mb-0.5">
                            Details
                        </h3>
                        <p className="text-[10px] text-[#8d9ab0] dark:text-gray-400">
                            Information about your organization
                        </p>
                    </div>
                    <div className="divide-y divide-[#eef0f3] dark:divide-gray-800">
                        <div className="flex items-center justify-between px-5 py-3">
                            <span className="text-[11px] text-[#8d9ab0] dark:text-gray-400">
                                Organization ID
                            </span>
                            <span className="text-[11px] text-[#272f3b] dark:text-gray-300 font-mono">
                                {organizationId}
                            </span>
                        </div>
                        {memberCount !== undefined && (
                            <div className="flex items-center justify-between px-5 py-3">
                                <span className="text-[11px] text-[#8d9ab0] dark:text-gray-400">
                                    Members
                                </span>
                                <span className="text-[11px] text-[#272f3b] dark:text-gray-300">
                                    {memberCount}
                                </span>
                            </div>
                        )}
                        {documentCount !== undefined && (
                            <div className="flex items-center justify-between px-5 py-3">
                                <span className="text-[11px] text-[#8d9ab0] dark:text-gray-400">
                                    Documents
                                </span>
                                <span className="text-[11px] text-[#272f3b] dark:text-gray-300">
                                    {documentCount}
                                </span>
                            </div>
                        )}
                        {createdAt && (
                            <div className="flex items-center justify-between px-5 py-3">
                                <span className="text-[11px] text-[#8d9ab0] dark:text-gray-400">
                                    Created
                                </span>
                                <span className="text-[11px] text-[#272f3b] dark:text-gray-300">
                                    {new Date(createdAt).toLocaleDateString(
                                        'en-US',
                                        {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        },
                                    )}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Shell Limits Card */}
            {!isLoading && orgDetails && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-[0_1px_3px_rgba(14,17,23,0.04),0_4px_16px_rgba(14,17,23,0.03)] overflow-hidden fade-up-3 mt-4">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-[#eef0f3] dark:border-gray-800">
                        <div>
                            <h3 className="text-[12px] font-semibold text-[#272f3b] dark:text-gray-100 mb-0.5">
                                Shell Limits
                            </h3>
                            <p className="text-[10px] text-[#8d9ab0] dark:text-gray-400">
                                Maximum resources allowed for this organization
                                (leave blank for unlimited)
                            </p>
                        </div>
                        {!isEditingLimits && (
                            <button
                                onClick={() => setIsEditingLimits(true)}
                                className="text-[#8d9ab0] hover:text-[#272f3b] dark:hover:text-gray-100 transition-colors cursor-pointer"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="divide-y divide-[#eef0f3] dark:divide-gray-800">
                        {/* Users limit row */}
                        <div className="flex items-center justify-between px-5 py-3 gap-4">
                            <div>
                                <span className="text-[11px] text-[#8d9ab0] dark:text-gray-400">
                                    Users
                                </span>
                                <span className="ml-2 text-[10px] text-[#b8c1ce] dark:text-gray-600">
                                    {memberCount ?? 0} used
                                </span>
                            </div>
                            {isEditingLimits ? (
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="Unlimited"
                                    value={userLimitInput}
                                    onChange={(e) =>
                                        setUserLimitInput(e.target.value)
                                    }
                                    className="w-28 h-7 text-[11px] rounded-lg border-[1.5px] border-[#dce1e8] dark:border-gray-700"
                                />
                            ) : (
                                <span className="text-[11px] text-[#272f3b] dark:text-gray-300">
                                    {orgDetails.userLimit !== null &&
                                    orgDetails.userLimit !== undefined
                                        ? orgDetails.userLimit
                                        : '∞'}
                                </span>
                            )}
                        </div>

                        {/* Documents limit row */}
                        <div className="flex items-center justify-between px-5 py-3 gap-4">
                            <div>
                                <span className="text-[11px] text-[#8d9ab0] dark:text-gray-400">
                                    Documents
                                </span>
                                <span className="ml-2 text-[10px] text-[#b8c1ce] dark:text-gray-600">
                                    {documentCount ?? 0} used
                                </span>
                            </div>
                            {isEditingLimits ? (
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="Unlimited"
                                    value={documentLimitInput}
                                    onChange={(e) =>
                                        setDocumentLimitInput(e.target.value)
                                    }
                                    className="w-28 h-7 text-[11px] rounded-lg border-[1.5px] border-[#dce1e8] dark:border-gray-700"
                                />
                            ) : (
                                <span className="text-[11px] text-[#272f3b] dark:text-gray-300">
                                    {orgDetails.documentLimit !== null &&
                                    orgDetails.documentLimit !== undefined
                                        ? orgDetails.documentLimit
                                        : '∞'}
                                </span>
                            )}
                        </div>

                        {/* Chats limit row */}
                        <div className="flex items-center justify-between px-5 py-3 gap-4">
                            <div>
                                <span className="text-[11px] text-[#8d9ab0] dark:text-gray-400">
                                    Chats
                                </span>
                                <span className="ml-2 text-[10px] text-[#b8c1ce] dark:text-gray-600">
                                    {chatCount ?? 0} used
                                </span>
                            </div>
                            {isEditingLimits ? (
                                <Input
                                    type="number"
                                    min="1"
                                    placeholder="Unlimited"
                                    value={chatLimitInput}
                                    onChange={(e) =>
                                        setChatLimitInput(e.target.value)
                                    }
                                    className="w-28 h-7 text-[11px] rounded-lg border-[1.5px] border-[#dce1e8] dark:border-gray-700"
                                />
                            ) : (
                                <span className="text-[11px] text-[#272f3b] dark:text-gray-300">
                                    {orgDetails.chatLimit !== null &&
                                    orgDetails.chatLimit !== undefined
                                        ? orgDetails.chatLimit
                                        : '∞'}
                                </span>
                            )}
                        </div>
                    </div>

                    {isEditingLimits && (
                        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-[#eef0f3] dark:border-gray-800">
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={handleCancelLimitsEdit}
                                disabled={isSavingLimits}
                                className="h-7 text-[11px]"
                            >
                                Cancel
                            </Button>
                            <Button
                                size="sm"
                                onClick={handleSaveLimits}
                                disabled={isSavingLimits}
                                className="h-7 text-[11px]"
                            >
                                {isSavingLimits ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                    'Save'
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            )}
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

                    {isLoadingSites ? null : sites.length === 0 ? (
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
                            variant="default"
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

// TaxLibraryTab is now imported from @/components/tax-library/TaxLibraryTab
