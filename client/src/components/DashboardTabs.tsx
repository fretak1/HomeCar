"use client";

import React from 'react';
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

interface TabItem {
    value: string;
    label: string;
}

interface DashboardTabsProps {
    tabs: TabItem[];
    activeTab: string;
    onTabChange: (value: string) => void;
    children: React.ReactNode;
    className?: string;
}

const DashboardTabs: React.FC<DashboardTabsProps> = ({
    tabs,
    activeTab,
    onTabChange,
    children,
    className
}) => {
    return (
        <TabsPrimitive.Root
            value={activeTab}
            onValueChange={onTabChange}
            className={cn("w-full", className)}
        >
            <div className="mb-8">
                <TabsPrimitive.List
                    className="flex items-center gap-2 p-1.5 bg-white border border-border shadow-sm rounded-[24px] w-full max-w-fit overflow-x-auto no-scrollbar"
                >
                    {tabs.map((tab) => (
                        <TabsPrimitive.Trigger
                            key={tab.value}
                            value={tab.value}
                            className={cn(
                                "px-6 py-2.5 text-sm font-medium transition-all rounded-[20px] whitespace-nowrap",
                                "text-muted-foreground hover:text-foreground",
                                "data-[state=active]:bg-[#005a41] data-[state=active]:text-white data-[state=active]:shadow-md"
                            )}
                        >
                            {tab.label}
                        </TabsPrimitive.Trigger>
                    ))}
                </TabsPrimitive.List>
            </div>
            {children}
        </TabsPrimitive.Root>
    );
};

export default DashboardTabs;
