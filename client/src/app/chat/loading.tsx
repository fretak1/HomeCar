import { Skeleton } from "@/components/ui/skeleton";

export default function ChatLoading() {
    return (
        <div className="h-[calc(100vh-73px)] w-full bg-background flex flex-col">
            <div className="flex-1 w-full bg-card border-t border-border overflow-hidden flex">
                <div className="flex w-full h-full">

                    {/* Contacts Sidebar Skeleton */}
                    <div className="w-96 border-r border-border flex flex-col">
                        <div className="p-4 border-b border-border">
                            <Skeleton className="h-10 w-full rounded-md" />
                        </div>
                        <div className="flex-1 p-2 space-y-2">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="flex flex-row items-center space-x-3 p-3">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between">
                                            <Skeleton className="h-4 w-24 rounded" />
                                            <Skeleton className="h-3 w-12 rounded" />
                                        </div>
                                        <Skeleton className="h-3 w-3/4 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Chat Area Skeleton */}
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Header */}
                        <div className="p-4 border-b border-border flex items-center space-x-3">
                            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                            <Skeleton className="h-5 w-32 rounded" />
                        </div>
                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            <div className="flex justify-start">
                                <Skeleton className="h-8 w-8 rounded-full mr-2 flex-shrink-0" />
                                <Skeleton className="h-16 w-64 rounded-2xl" />
                            </div>
                            <div className="flex justify-end">
                                <Skeleton className="h-12 w-48 rounded-2xl" />
                            </div>
                            <div className="flex justify-start">
                                <Skeleton className="h-8 w-8 rounded-full mr-2 flex-shrink-0" />
                                <Skeleton className="h-20 w-72 rounded-2xl" />
                            </div>
                        </div>
                        {/* Input */}
                        <div className="p-4 border-t border-border">
                            <div className="flex items-center space-x-2">
                                <Skeleton className="h-10 flex-1 rounded-md" />
                                <Skeleton className="h-10 w-12 rounded-md" />
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
