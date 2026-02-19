import {
    CheckCircle2,
    Circle,
    FileText,
    FolderOpen,
    Layers,
} from 'lucide-react';

// Status icons
export function StatusIcon({ status }: { status: string }) {
    switch (status) {
        case 'COMPLETED':
            return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
        case 'IN_PROGRESS':
            return <Circle className="h-4 w-4 text-primary fill-primary/20" />;
        case 'IN_REVIEW':
            return (
                <Circle className="h-4 w-4 text-amber-500 fill-amber-500/20" />
            );
        default:
            return <Circle className="h-4 w-4 text-muted-foreground" />;
    }
}

// Item type icons
export function ItemIcon({ type }: { type: string }) {
    switch (type) {
        case 'workspace':
            return <Layers className="h-4 w-4 text-primary" />;
        case 'project':
            return <FolderOpen className="h-4 w-4 text-blue-500" />;
        default:
            return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
}
