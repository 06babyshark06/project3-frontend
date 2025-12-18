"use client";

import { Sidebar } from "@/components/Sidebar";
import { LayoutDashboard, BookOpen, FileText } from "lucide-react";

export function StudentSidebar({ className }: { className?: string }) {
    const items = [
        { title: "Tổng quan", href: "/dashboard", icon: LayoutDashboard },
        { title: "Lớp học của tôi", href: "/dashboard/classes", icon: BookOpen },
        // { title: "Kết quả thi", href: "/dashboard/results", icon: FileText },
    ];

    return (
        <Sidebar
            items={items}
            className={className || "h-[calc(100vh-64px)]"}
        />
    );
}
