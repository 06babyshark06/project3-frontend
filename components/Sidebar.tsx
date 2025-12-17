"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LucideIcon } from "lucide-react";

interface SidebarItem {
    title: string;
    href: string;
    icon: LucideIcon;
    variant?: "default" | "ghost";
}

interface SidebarProps {
    items: SidebarItem[];
    header?: React.ReactNode;
    className?: string;
}

export function Sidebar({ items, header, className }: SidebarProps) {
    const pathname = usePathname();

    return (
        <div className={cn("hidden border-r bg-muted/10 md:block w-[240px] shrink-0", className)}>
            <div className="flex h-full max-h-screen flex-col gap-2">
                {header && (
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        {header}
                    </div>
                )}
                <ScrollArea className="flex-1 px-3 py-3">
                    <nav className="grid items-start gap-1 font-medium text-sm">
                        {items.map((item, index) => {
                            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                            return (
                                <Button
                                    key={index}
                                    asChild
                                    variant={isActive ? "secondary" : "ghost"}
                                    className={cn(
                                        "justify-start gap-3 px-3 py-2 h-10",
                                        isActive ? "bg-secondary text-secondary-foreground" : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    <Link href={item.href}>
                                        <item.icon className="h-4 w-4" />
                                        {item.title}
                                    </Link>
                                </Button>
                            );
                        })}
                    </nav>
                </ScrollArea>
                <div className="mt-auto p-4 border-t">
                    {/* Placeholder for footer or logout if needed later */}
                </div>
            </div>
        </div>
    );
}
