"use client";

import { Sidebar } from "@/components/Sidebar";
import { LayoutDashboard, BookCopy, School, Edit, Database, FolderCog } from "lucide-react";

export function InstructorSidebar({ className }: { className?: string }) {
    const items = [
        { title: "Bảng Hiệu Suất", href: "/instructor/dashboard", icon: LayoutDashboard },
        { title: "Quản lý Khóa học", href: "/instructor/courses", icon: BookCopy },
        { title: "Quản lý Lớp học", href: "/instructor/classes", icon: School },
        { title: "Quản lý Đề thi", href: "/instructor/exams", icon: Edit },
        { title: "Ngân hàng Câu hỏi", href: "/instructor/questions", icon: Database },
        { title: "Quản lý Danh mục", href: "/instructor/categories", icon: FolderCog },
    ];

    return (
        <Sidebar
            items={items}
            className={className || "h-[calc(100vh-64px)]"}
        />
    );
}
