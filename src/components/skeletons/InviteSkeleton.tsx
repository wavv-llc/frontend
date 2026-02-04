import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"

export function InviteSkeleton() {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans overflow-x-hidden">
            {/* Background elements (simplified) */}
            <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px]" />
            </div>

            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/70 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="w-16 h-6" />
                    </div>
                </div>
            </nav>

            <section className="relative z-10 pt-32 pb-20 min-h-screen flex items-center justify-center">
                <div className="max-w-xl mx-auto px-6 w-full">
                    <Card className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-8 md:p-10 shadow-lg mb-6">
                        <div className="flex items-center gap-4 mb-6">
                            <Skeleton className="w-12 h-12 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="w-24 h-5 rounded-full" />
                                <Skeleton className="w-48 h-8" />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="w-full h-4" />
                            <Skeleton className="w-2/3 h-4" />
                        </div>
                        <div className="mt-6">
                            <Skeleton className="w-full h-16 rounded-xl" />
                        </div>
                    </Card>

                    <Card className="bg-card/50 backdrop-blur-xl border border-border rounded-2xl p-8 md:p-12 shadow-xl relative overflow-hidden">
                        <div className="mb-8 text-center space-y-4 flex flex-col items-center">
                            <Skeleton className="w-48 h-10" />
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="w-full h-11 rounded-full" />
                            <Skeleton className="w-full h-11 rounded-full" />
                        </div>
                    </Card>
                </div>
            </section>
        </div>
    )
}
