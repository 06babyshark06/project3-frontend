"use client";

import { Sidebar } from "@/components/Sidebar";
import { LayoutDashboard, Users, FileText, BookCopy, School, FolderCog, FileQuestion } from "lucide-react";

export function AdminSidebar() {
    const items = [
        { title: "Tổng quan", href: "/admin/dashboard", icon: LayoutDashboard },
        { title: "Quản lý Người dùng", href: "/admin/users", icon: Users },
        { title: "Quản lý Bài thi", href: "/admin/manage/exams", icon: FileText },
        { title: "Ngân hàng Câu hỏi", href: "/admin/manage/questions", icon: FileQuestion },
        { title: "Quản lý Khóa học", href: "/admin/manage/courses", icon: BookCopy },
        { title: "Quản lý Lớp học", href: "/admin/manage/classes", icon: School },
        { title: "Quản lý Danh mục", href: "/admin/manage/categories", icon: FolderCog },
    ];

    return (
        <Sidebar
            items={items}
            className="h-[calc(100vh-64px)]"
        />
    );
}
