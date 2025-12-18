"use client";

import { Sidebar } from "@/components/Sidebar";
import { LayoutDashboard, BookCopy, School, Edit, Database, FolderCog } from "lucide-react";

export function InstructorSidebar({ className }: { className?: string }) {
    const items = [
        { title: "Bảng Hiệu Suất", href: "/dashboard/instructor", icon: LayoutDashboard },
        { title: "Quản lý Khóa học", href: "/admin/courses", icon: BookCopy },
        { title: "Quản lý Lớp học", href: "/admin/classes", icon: School },
        { title: "Quản lý Đề thi", href: "/admin/exams", icon: Edit },
        { title: "Ngân hàng Câu hỏi", href: "/admin/questions", icon: Database },
        { title: "Quản lý Danh mục", href: "/admin/categories", icon: FolderCog },
    ];

    return (
        <Sidebar
            items={items}
            className={className || "h-[calc(100vh-64px)]"}
        />
    );
}
