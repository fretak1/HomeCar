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
    const listRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        const activeElement = listRef.current?.querySelector('[data-state="active"]');
        if (activeElement) {
            activeElement.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center'
            });
        }
    }, [activeTab]);

    return (
        <TabsPrimitive.Root
            value={activeTab}
            onValueChange={onTabChange}
            className={cn("w-full", className)}
        >
            <div className="mb-8 relative group">
                <TabsPrimitive.List
                    ref={listRef}
                    className={cn(
                        "flex items-center gap-1.5 p-1.5 bg-white border border-border shadow-sm rounded-[24px] w-full md:max-w-fit overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth",
                        "scrollbar-hide" // For some browsers
                    )}
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {tabs.map((tab) => (
                        <TabsPrimitive.Trigger
                            key={tab.value}
                            value={tab.value}
                            className={cn(
                                "px-5 md:px-6 py-2.5 text-xs md:text-sm font-bold transition-all rounded-[20px] whitespace-nowrap snap-center",
                                "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                                "data-[state=active]:bg-[#005a41] data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-[#005a41]/20"
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

