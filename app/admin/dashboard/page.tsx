"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Users, BookCopy, Edit, Loader2, ShieldAlert,
  FileQuestion, FolderCog, PlusCircle, ListChecks,
  UserCog, Library, Layers, School // ✅ Đã thêm icon School
} from "lucide-react";

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

      {/* Thống kê */}
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

      {/* Navigation moved to Sidebar */}
    </div>
  );
}