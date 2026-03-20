'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import {
    ArrowLeft,
    Building2,
    Users,
    FileText,
    MessageSquare,
    FolderKanban,
    Layers,
    Loader2,
    Zap,
    Briefcase,
} from 'lucide-react';
import { adminApi, type AdminOrganizationDetail } from '@/lib/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

export default function AdminOrgDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const orgId = params.id as string;

    const [org, setOrg] = useState<AdminOrganizationDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const token = await getToken();
                if (!token) return;
                const res = await adminApi.getOrganization(token, orgId);
                if (res.data) setOrg(res.data);
                else toast.error('Organization not found');
            } catch {
                toast.error('Failed to load organization');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [getToken, orgId]);

    if (isLoading || !org) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-auto">
            <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/admin')}
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <h1 className="text-lg font-semibold flex items-center gap-2">
                                {org.name}
                                {!org.active && (
                                    <Badge variant="outline">Inactive</Badge>
                                )}
                            </h1>
                            <p className="text-xs text-muted-foreground font-mono">
                                {org.slug} | {org.id}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {org.industry && (
                        <Card>
                            <CardContent className="p-3">
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                    Industry
                                </p>
                                <p className="text-sm font-medium">
                                    {org.industry}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                    {org.size && (
                        <Card>
                            <CardContent className="p-3">
                                <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                    Size
                                </p>
                                <p className="text-sm font-medium">
                                    {org.size}
                                </p>
                            </CardContent>
                        </Card>
                    )}
                    <Card>
                        <CardContent className="p-3">
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                Created
                            </p>
                            <p className="text-sm font-medium">
                                {new Date(org.createdAt).toLocaleDateString()}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-3">
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">
                                Updated
                            </p>
                            <p className="text-sm font-medium">
                                {new Date(org.updatedAt).toLocaleDateString()}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Counts */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {[
                        {
                            label: 'Documents',
                            value: org._count.documents,
                            icon: FileText,
                        },
                        {
                            label: 'Chats',
                            value: org._count.chatConversations,
                            icon: MessageSquare,
                        },
                        {
                            label: 'Projects',
                            value: org._count.projects,
                            icon: FolderKanban,
                        },
                        {
                            label: 'Service Jobs',
                            value: org._count.serviceJobs,
                            icon: Briefcase,
                        },
                        {
                            label: 'Agent Tasks',
                            value: org._count.agentTasks,
                            icon: Zap,
                        },
                        {
                            label: 'Users',
                            value: org.users.length,
                            icon: Users,
                        },
                    ].map((item) => (
                        <Card key={item.label}>
                            <CardContent className="p-3 flex items-center gap-2">
                                <item.icon className="h-4 w-4 text-muted-foreground" />
                                <div>
                                    <p className="text-lg font-bold">
                                        {item.value}
                                    </p>
                                    <p className="text-[10px] text-muted-foreground">
                                        {item.label}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Separator />

                {/* Users */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Users ({org.users.length})
                        </CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Guest Expiry</TableHead>
                                <TableHead>Joined</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {org.users.map((user) => (
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
                                                    : user.organizationRole ===
                                                        'GUEST'
                                                      ? 'outline'
                                                      : 'secondary'
                                            }
                                            className="text-[10px]"
                                        >
                                            {user.organizationRole}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {user.guestExpiresAt
                                            ? new Date(
                                                  user.guestExpiresAt,
                                              ).toLocaleDateString()
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(
                                            user.createdAt,
                                        ).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>

                {/* Workspaces */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Layers className="h-4 w-4" />
                            Workspaces ({org.workspaces.length})
                        </CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Projects</TableHead>
                                <TableHead>Members</TableHead>
                                <TableHead>Created</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {org.workspaces.map((ws) => (
                                <TableRow key={ws.id}>
                                    <TableCell className="font-medium">
                                        {ws.name}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="secondary"
                                            className="text-[10px]"
                                        >
                                            {ws.isPersonal
                                                ? 'Personal'
                                                : 'Shared'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{ws._count.projects}</TableCell>
                                    <TableCell>
                                        {ws._count.memberships}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {new Date(
                                            ws.createdAt,
                                        ).toLocaleDateString()}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </div>
        </div>
    );
}
