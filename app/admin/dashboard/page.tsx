// app/admin/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Users, BookCopy, Edit, Loader2, ShieldAlert, FileQuestion } from "lucide-react";

export default function AdminDashboardPage() {
  const { user } = useAuth();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalExams: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get("/admin/stats");
        const data = response.data.data;
        setStats({
          totalUsers: Number(data.total_users),
          totalCourses: Number(data.total_courses),
          totalExams: Number(data.total_exams),
        });
      } catch (error) {
        console.error("Lỗi tải thống kê:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-8">
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
        Trang Quản Trị
      </h1>
      <p className="text-xl text-muted-foreground mb-10">
        Chào mừng, <span className="font-semibold text-primary">{user?.full_name}</span> ({user?.role}).
      </p>

      {/* Thống kê (Giữ nguyên) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">Người Dùng</CardTitle>
            <Users className="h-6 w-6 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">{stats.totalUsers}</p>
            <p className="text-muted-foreground">tổng số tài khoản</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">Khóa Học</CardTitle>
            <BookCopy className="h-6 w-6 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">{stats.totalCourses}</p>
            <p className="text-muted-foreground">khóa học trong hệ thống</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">Bài Thi</CardTitle>
            <Edit className="h-6 w-6 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold">{stats.totalExams}</p>
            <p className="text-muted-foreground">đề thi có sẵn</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Khu vực Giảng viên (Tạo nội dung) */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Dành cho Giảng viên</h2>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg">
              <Link href="/admin/courses/new">Tạo Khóa Học Mới</Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/admin/exams/create">Tạo Bài Thi Mới</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/admin/questions">
                <FileQuestion className="mr-2 h-4 w-4" /> Ngân hàng Câu hỏi
              </Link>
            </Button>

            <Button asChild size="lg" variant="outline">
              <Link href="/admin/courses">Khóa Học Của Tôi</Link>
            </Button>

            <Button asChild size="lg" variant="outline">
              <Link href="/admin/exams">Bài Thi Của Tôi</Link>
            </Button>
          </div>
        </div>

        {/* Khu vực Admin (Quản lý toàn hệ thống) */}
        {user?.role === 'admin' && (
          <div>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-destructive">
              <ShieldAlert className="w-6 h-6" /> Khu vực Admin
            </h2>
            <div className="flex flex-wrap gap-4">
              <Button asChild size="lg" variant="destructive">
                <Link href="/admin/users">Quản Lý User</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                <Link href="/admin/manage/courses">Quản Lý Tất Cả Khóa Học</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-destructive text-destructive hover:bg-destructive/10">
                <Link href="/admin/manage/exams">Quản Lý Tất Cả Bài Thi</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}