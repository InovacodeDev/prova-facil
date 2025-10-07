import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
    className?: string;
}

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
    return <div className={cn("animate-pulse rounded-md bg-muted", className)} />;
}

export function CardSkeleton() {
    return (
        <div className="rounded-lg border bg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
                <LoadingSkeleton className="h-4 w-24" />
                <LoadingSkeleton className="h-8 w-8 rounded-lg" />
            </div>
            <LoadingSkeleton className="h-10 w-20" />
            <LoadingSkeleton className="h-3 w-32" />
            <LoadingSkeleton className="h-1 w-full" />
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-8 space-y-2">
                    <LoadingSkeleton className="h-10 w-48" />
                    <LoadingSkeleton className="h-5 w-96" />
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    <CardSkeleton />
                    <CardSkeleton />
                    <CardSkeleton />
                </div>

                {/* Monthly Usage */}
                <div className="mb-8">
                    <div className="rounded-lg border bg-card p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <LoadingSkeleton className="h-4 w-24" />
                                <LoadingSkeleton className="h-3 w-16" />
                            </div>
                            <LoadingSkeleton className="h-10 w-10 rounded-lg" />
                        </div>
                        <LoadingSkeleton className="h-12 w-32" />
                        <LoadingSkeleton className="h-3 w-full" />
                        <LoadingSkeleton className="h-4 w-48" />
                    </div>
                </div>

                {/* Copy Insights */}
                <div className="grid gap-4 md:grid-cols-2 mb-8">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>

                {/* Action Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <CardSkeleton />
                    <CardSkeleton />
                </div>
            </div>
        </div>
    );
}

export function FormSkeleton() {
    return (
        <div className="max-w-[920px] mx-auto">
            <div className="rounded-lg border bg-card">
                <div className="p-6 space-y-2 border-b">
                    <div className="flex items-center gap-2">
                        <LoadingSkeleton className="h-5 w-5" />
                        <LoadingSkeleton className="h-6 w-56" />
                    </div>
                    <LoadingSkeleton className="h-4 w-96" />
                </div>
                <div className="p-6 space-y-6">
                    {/* Form fields */}
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <LoadingSkeleton className="h-4 w-32" />
                            <LoadingSkeleton className="h-10 w-full" />
                            <LoadingSkeleton className="h-3 w-64" />
                        </div>
                    ))}

                    {/* Question types grid */}
                    <div className="space-y-2">
                        <LoadingSkeleton className="h-4 w-40" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <LoadingSkeleton key={i} className="h-24 w-full" />
                            ))}
                        </div>
                    </div>

                    {/* Submit button */}
                    <LoadingSkeleton className="h-10 w-full" />
                </div>
            </div>
        </div>
    );
}

export function LoadingSpinner({ className }: { className?: string }) {
    return (
        <div className={cn("flex items-center justify-center", className)}>
            <div className="relative w-10 h-10">
                <div className="absolute top-0 left-0 w-full h-full">
                    <div className="w-full h-full rounded-full border-4 border-primary/20"></div>
                </div>
                <div className="absolute top-0 left-0 w-full h-full animate-spin">
                    <div className="w-full h-full rounded-full border-4 border-transparent border-t-primary"></div>
                </div>
            </div>
        </div>
    );
}

export function PageLoading() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center">
            <LoadingSpinner className="mb-4" />
            <p className="text-muted-foreground text-sm">Carregando...</p>
        </div>
    );
}
