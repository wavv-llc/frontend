import { Loader2 } from "lucide-react"

interface AuthenticatedSkeletonProps {
    message?: string
}

export function AuthenticatedSkeleton({ message = "Loading your workspace..." }: AuthenticatedSkeletonProps) {
    return (
        <div className="flex h-screen w-full bg-background items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground text-sm">{message}</p>
            </div>
        </div>
    )
}
