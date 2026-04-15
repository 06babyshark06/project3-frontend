"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  BookCopy, Edit, PlusCircle, ArrowRight,
  BarChart3, FileQuestion, Database, FolderCog,
  School, Loader2, Activity, Users, LayoutDashboard,
  Plus, CheckCircle2, AlertCircle
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface DashboardStats {
  totalCourses: number;
  totalExams: number;
  totalStudents: number;
}

export default function InstructorDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCourses: 0,
    totalExams: 0,
    totalStudents: 0
  });
  const [recentSubmissions, setRecentSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        // Fetch stats and activity in parallel
        const [coursesRes, examsRes, classesRes, recentRes] = await Promise.all([
          api.get("/instructor/courses?limit=1"),
          api.get("/instructor/exams?limit=1"),
          api.get("/classes"),
          api.get("/instructor/recent-submissions?limit=5")
        ]);

        const totalCourses = coursesRes.data.data.total || 0;
        const totalExams = examsRes.data.data.total || 0;
        
        // Calculate total students from classes
        const classes = classesRes.data.data.classes || [];
        const totalStudents = classes.reduce((acc: number, curr: any) => acc + (curr.student_count || 0), 0);

        setStats({
          totalCourses,
          totalExams,
          totalStudents
        });

        // Set recent submissions
        setRecentSubmissions(recentRes.data.data.submissions || []);
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatRelativeTime = (dateStr: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Vừa xong";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return date.toLocaleDateString("vi-VN");
  };

  const StatCard = ({ title, value, label, icon: Icon, color }: any) => (
    <Card className="overflow-hidden border-none shadow-md bg-gradient-to-br from-background to-muted/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-8 w-20 mb-1" />
        ) : (
          <div className="text-3xl font-bold">{value}</div>
        )}
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
            Bảng Hiệu Suất Giảng Dạy
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            Chào buổi sáng, <span className="font-semibold text-foreground">{user?.full_name}</span>. Đây là những gì đang diễn ra.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/instructor/submissions">
              Xem báo cáo
            </Link>
          </Button>
          <Button asChild className="shadow-lg shadow-primary/20">
            <Link href="/instructor/courses/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Tạo khóa học
            </Link>
          </Button>
        </div>
      </div>

      {/* Khu vực thống kê nhanh */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Tổng số khóa học" 
          value={stats.totalCourses} 
          label="khóa học đang giảng dạy" 
          icon={BookCopy} 
          color="bg-blue-500"
        />
        <StatCard 
          title="Tổng số bài thi" 
          value={stats.totalExams} 
          label="ngân hàng đề thi" 
          icon={Edit} 
          color="bg-indigo-500"
        />
        <StatCard 
          title="Học viên tham gia" 
          value={stats.totalStudents} 
          label="tổng học sinh của bạn" 
          icon={Users} 
          color="bg-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <Card className="lg:col-span-1 border-dashed bg-muted/10">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              Lối tắt nhanh
            </CardTitle>
            <CardDescription>Công việc cần làm hôm nay</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Button variant="outline" className="justify-start h-12" asChild>
              <Link href="/instructor/exams/new">
                <Plus className="mr-2 h-4 w-4 bg-orange-100 text-orange-600 rounded p-0.5" /> 
                Soạn đề thi mới
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-12" asChild>
              <Link href="/instructor/questions">
                <FileQuestion className="mr-2 h-4 w-4 bg-blue-100 text-blue-600 rounded p-0.5" /> 
                Ngân hàng câu hỏi
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-12" asChild>
              <Link href="/instructor/classes">
                <Users className="mr-2 h-4 w-4 bg-green-100 text-green-600 rounded p-0.5" /> 
                Quản lý lớp học
              </Link>
            </Button>
            <Button variant="outline" className="justify-start h-12" asChild>
              <Link href="/instructor/categories">
                <FolderCog className="mr-2 h-4 w-4 bg-purple-100 text-purple-600 rounded p-0.5" /> 
                Danh mục & Chủ đề
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Hoạt động gần đây
              </CardTitle>
              <CardDescription>Các sự kiện mới nhất từ học viên</CardDescription>
            </div>
            <Button variant="link" asChild className="text-xs">
              <Link href="/instructor/submissions">Xem tất cả</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : (
              <div className="space-y-6">
                {recentSubmissions.length > 0 ? (
                  recentSubmissions.map((sub: any) => (
                    <div key={sub.submission_id} className="flex items-start gap-4">
                      <div className={`p-2 rounded-lg ${(sub.score ?? 0) >= 5 ? "bg-emerald-100" : "bg-amber-100"}`}>
                        {(sub.score ?? 0) >= 5 ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold">
                            {sub.student_name} đã hoàn thành bài thi
                          </p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${(sub.score ?? 0) >= 8 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                            {(sub.score ?? 0).toFixed(1)} / 10
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80">
                          Bài kiểm tra: <span className="font-medium">{sub.exam_title}</span>
                        </p>
                        <p className="text-xs text-muted-foreground italic">
                          {formatRelativeTime(sub.submitted_at)} • Trạng thái: {sub.status}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-3">
                    <Activity className="h-10 w-10 opacity-20" />
                    <p className="text-sm">Chưa có hoạt động mới nào từ học viên của bạn.</p>
                  </div>
                )}

                {recentSubmissions.length > 0 && (
                  <Button variant="ghost" className="w-full text-muted-foreground text-xs" asChild>
                    <Link href="/instructor/submissions">Xem thêm kết quả bài thi</Link>
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Missing icon helper
function PlusSquare(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );
}