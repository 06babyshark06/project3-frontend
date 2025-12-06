"use client";

import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BookCopy, Edit, PlusCircle, ArrowRight, BarChart3, FileQuestion } from "lucide-react";

export default function InstructorDashboardPage() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-8">
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

      {/* Khu vực thống kê nhanh (Mockup - có thể nối API sau) */}
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

      {/* Khu vực Quản lý */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card Quản lý Khóa học */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookCopy className="h-5 w-5 text-primary" /> Quản lý Khóa học
            </CardTitle>
            <CardDescription>
              Xem danh sách, chỉnh sửa và xuất bản các khóa học của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/courses">
                Đi tới danh sách <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Card Quản lý Bài thi */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-yellow-500" /> Ngân hàng Đề thi
            </CardTitle>
            <CardDescription>
              Tạo đề thi trắc nghiệm, quản lý câu hỏi và đáp án.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/exams">
                Quản lý đề thi <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Card Tạo nội dung mới */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-green-600" /> Tạo nội dung mới
            </CardTitle>
            <CardDescription>
              Bắt đầu soạn thảo một khóa học hoặc bài kiểm tra mới ngay lập tức.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/admin/courses/new">Tạo Khóa Học Mới</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/admin/exams/new">Tạo Bài Thi Mới</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/admin/questions">
                <FileQuestion className="mr-2 h-4 w-4" /> Ngân hàng Câu hỏi
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}