'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import {
    Building2,
    Users,
    FileText,
    MessageSquare,
    FolderKanban,
    ListTodo,
    Layers,
    Search,
    Loader2,
    ShieldCheck,
} from 'lucide-react';
import {
    adminApi,
    type AdminStats,
    type AdminOrganization,
    type AdminUser,
    type AdminDocument,
} from '@/lib/api';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

function StatCard({
    label,
    value,
    icon: Icon,
}: {
    label: string;
    value: number;
    icon: React.ElementType;
}) {
    return (
        <Card>
            <CardContent className="p-4 flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                    <p className="text-2xl font-bold tracking-tight">
                        {value.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">{label}</p>
                </div>
            </CardContent>
        </Card>
    );
}

export default function AdminPage() {
    const { getToken } = useAuth();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [documents, setDocuments] = useState<AdminDocument[]>([]);
    const [orgSearch, setOrgSearch] = useState('');
    const [userSearch, setUserSearch] = useState('');
    const [docSearch, setDocSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const check = async () => {
            try {
                const token = await getToken();
                if (!token) return;
                const res = await adminApi.checkAccess(token);
                if (res.data?.isSuperAdmin) {
                    setIsAuthorized(true);
                } else {
                    setIsAuthorized(false);
                    router.replace('/home');
                }
            } catch {
                setIsAuthorized(false);
                router.replace('/home');
            }
        };
        check();
    }, [getToken, router]);

    useEffect(() => {
        if (!isAuthorized) return;
        const load = async () => {
            try {
                const token = await getToken();
                if (!token) return;
                const [statsRes, orgsRes, usersRes, docsRes] =
                    await Promise.all([
                        adminApi.getStats(token),
                        adminApi.searchOrganizations(token),
                        adminApi.searchUsers(token),
                        adminApi.searchDocuments(token),
                    ]);
                if (statsRes.data) setStats(statsRes.data);
                if (orgsRes.data) setOrganizations(orgsRes.data);
                if (usersRes.data) setUsers(usersRes.data);
                if (docsRes.data) setDocuments(docsRes.data);
            } catch {
                toast.error('Failed to load admin data');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [isAuthorized, getToken]);

    const searchOrgs = useCallback(
        async (q: string) => {
            const token = await getToken();
            if (!token) return;
            const res = await adminApi.searchOrganizations(token, q);
            if (res.data) setOrganizations(res.data);
        },
        [getToken],
    );

    const searchUsers = useCallback(
        async (q: string) => {
            const token = await getToken();
            if (!token) return;
            const res = await adminApi.searchUsers(token, q);
            if (res.data) setUsers(res.data);
        },
        [getToken],
    );

    const searchDocs = useCallback(
        async (q: string) => {
            const token = await getToken();
            if (!token) return;
            const res = await adminApi.searchDocuments(token, q);
            if (res.data) setDocuments(res.data);
        },
        [getToken],
    );

    useEffect(() => {
        const t = setTimeout(() => searchOrgs(orgSearch), 300);
        return () => clearTimeout(t);
    }, [orgSearch, searchOrgs]);

    useEffect(() => {
        const t = setTimeout(() => searchUsers(userSearch), 300);
        return () => clearTimeout(t);
    }, [userSearch, searchUsers]);

    useEffect(() => {
        const t = setTimeout(() => searchDocs(docSearch), 300);
        return () => clearTimeout(t);
    }, [docSearch, searchDocs]);

    if (isAuthorized === null || isAuthorized === false) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
                        <ShieldCheck className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold">Admin Panel</h1>
                        <p className="text-sm text-muted-foreground">
                            Internal CRM and data management
                        </p>
                    </div>
                </div>

                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                        <StatCard
                            label="Organizations"
                            value={stats.totalOrganizations}
                            icon={Building2}
                        />
                        <StatCard
                            label="Users"
                            value={stats.totalUsers}
                            icon={Users}
                        />
                        <StatCard
                            label="Documents"
                            value={stats.totalDocuments}
                            icon={FileText}
                        />
                        <StatCard
                            label="Chats"
                            value={stats.totalChats}
                            icon={MessageSquare}
                        />
                        <StatCard
                            label="Projects"
                            value={stats.totalProjects}
                            icon={FolderKanban}
                        />
                        <StatCard
                            label="Tasks"
                            value={stats.totalTasks}
                            icon={ListTodo}
                        />
                        <StatCard
                            label="Workspaces"
                            value={stats.totalWorkspaces}
                            icon={Layers}
                        />
                    </div>
                )}

                <Separator />

                {/* Tabs */}
                <Tabs defaultValue="organizations">
                    <TabsList>
                        <TabsTrigger value="organizations" className="gap-1.5">
                            <Building2 className="h-3.5 w-3.5" />
                            Organizations
                        </TabsTrigger>
                        <TabsTrigger value="users" className="gap-1.5">
                            <Users className="h-3.5 w-3.5" />
                            Users
                        </TabsTrigger>
                        <TabsTrigger value="documents" className="gap-1.5">
                            <FileText className="h-3.5 w-3.5" />
                            Documents
                        </TabsTrigger>
                    </TabsList>

                    {/* Organizations Tab */}
                    <TabsContent value="organizations" className="space-y-4">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search organizations..."
                                value={orgSearch}
                                onChange={(e) => setOrgSearch(e.target.value)}
                                className="pl-8 h-9"
                            />
                        </div>
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Slug</TableHead>
                                        <TableHead>Users</TableHead>
                                        <TableHead>Documents</TableHead>
                                        <TableHead>Projects</TableHead>
                                        <TableHead>Chats</TableHead>
                                        <TableHead>Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {organizations.map((org) => (
                                        <TableRow
                                            key={org.id}
                                            className="cursor-pointer"
                                            onClick={() =>
                                                router.push(
                                                    `/admin/organizations/${org.id}`,
                                                )
                                            }
                                        >
                                            <TableCell className="font-medium">
                                                {org.name}
                                                {!org.active && (
                                                    <Badge
                                                        variant="outline"
                                                        className="ml-2 text-[10px]"
                                                    >
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground font-mono text-xs">
                                                {org.slug}
                                            </TableCell>
                                            <TableCell>
                                                {org._count.users}
                                            </TableCell>
                                            <TableCell>
                                                {org._count.documents}
                                            </TableCell>
                                            <TableCell>
                                                {org._count.projects}
                                            </TableCell>
                                            <TableCell>
                                                {org._count.chatConversations}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(
                                                    org.createdAt,
                                                ).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {organizations.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={7}
                                                className="text-center py-8 text-muted-foreground"
                                            >
                                                No organizations found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    {/* Users Tab */}
                    <TabsContent value="users" className="space-y-4">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search users..."
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                                className="pl-8 h-9"
                            />
                        </div>
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Organization</TableHead>
                                        <TableHead>Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">
                                                {user.firstName} {user.lastName}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {user.email}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        user.organizationRole ===
                                                        'ADMIN'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                    className="text-[10px]"
                                                >
                                                    {user.organizationRole}
                                                </Badge>
                                            </TableCell>
                                            <TableCell
                                                className="cursor-pointer hover:underline"
                                                onClick={() =>
                                                    router.push(
                                                        `/admin/organizations/${user.organizationId}`,
                                                    )
                                                }
                                            >
                                                {user.organization.name}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(
                                                    user.createdAt,
                                                ).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {users.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={5}
                                                className="text-center py-8 text-muted-foreground"
                                            >
                                                No users found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents" className="space-y-4">
                        <div className="relative max-w-sm">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            <Input
                                placeholder="Search documents..."
                                value={docSearch}
                                onChange={(e) => setDocSearch(e.target.value)}
                                className="pl-8 h-9"
                            />
                        </div>
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Organization</TableHead>
                                        <TableHead>Size</TableHead>
                                        <TableHead>Created</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium max-w-48 truncate">
                                                {doc.originalName}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        doc.status === 'READY'
                                                            ? 'default'
                                                            : doc.status ===
                                                                'FAILED'
                                                              ? 'destructive'
                                                              : 'secondary'
                                                    }
                                                    className="text-[10px]"
                                                >
                                                    {doc.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {doc.source
                                                    .replace(/_/g, ' ')
                                                    .toLowerCase()}
                                            </TableCell>
                                            <TableCell
                                                className="cursor-pointer hover:underline"
                                                onClick={() =>
                                                    router.push(
                                                        `/admin/organizations/${doc.organization.id}`,
                                                    )
                                                }
                                            >
                                                {doc.organization.name}
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {(
                                                    doc.filesize /
                                                    1024 /
                                                    1024
                                                ).toFixed(2)}{' '}
                                                MB
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(
                                                    doc.createdAt,
                                                ).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {documents.length === 0 && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="text-center py-8 text-muted-foreground"
                                            >
                                                No documents found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
