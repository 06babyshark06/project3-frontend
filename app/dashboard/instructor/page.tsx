"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  BookCopy, Edit, PlusCircle, ArrowRight,
  BarChart3, FileQuestion, Database, FolderCog,
  School // ✅ Thêm icon School
} from "lucide-react";

export default function InstructorDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
            Bảng Hiệu Suất Giảng Dạy
          </h1>
          <p className="text-xl text-muted-foreground">
            Xin chào, giảng viên <span className="font-semibold text-primary">{user?.full_name}</span>.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/admin/courses/new">
            <PlusCircle className="mr-2 h-5 w-5" /> Tạo khóa học mới
          </Link>
        </Button>
      </div>

      {/* Khu vực thống kê nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số khóa học</CardTitle>
            <BookCopy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">khóa học đang hoạt động</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số bài thi</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">đề thi đã tạo</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Học viên tham gia</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">lượt đăng ký mới tháng này</p>
          </CardContent>
        </Card>
      </div>

      {/* Khu vực Quản lý Chính */}
      {/* Navigation moved to Sidebar */}
    </div>

  );
}