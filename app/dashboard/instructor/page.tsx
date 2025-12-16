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
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        {/* 1. Quản lý Khóa học */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookCopy className="h-5 w-5 text-primary" /> Quản lý Khóa học
            </CardTitle>
            <CardDescription>
              Danh sách khóa học, bài giảng và tài liệu.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/courses">
                Xem danh sách <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 2. ✅ MỚI: Quản lý Lớp học */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5 text-indigo-500" /> Quản lý Lớp học
            </CardTitle>
            <CardDescription>
              Tổ chức lớp học, quản lý danh sách học viên.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/classes">
                Danh sách lớp <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 3. Ngân hàng Đề thi */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-yellow-500" /> Quản lý Đề thi
            </CardTitle>
            <CardDescription>
              Tổ chức các kỳ thi, thiết lập thời gian và cấu hình.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/exams">
                Danh sách đề thi <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 4. Ngân hàng Câu hỏi */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5 text-purple-600" /> Ngân hàng Câu hỏi
            </CardTitle>
            <CardDescription>
              Kho lưu trữ câu hỏi, phân loại theo chủ đề/chương.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/questions">
                Quản lý câu hỏi <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 5. Quản lý Danh mục */}
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderCog className="h-5 w-5 text-blue-600" /> Quản lý Danh mục
            </CardTitle>
            <CardDescription>
              Chỉnh sửa, sắp xếp cây thư mục Chủ đề và Chương.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/admin/categories">
                Đi tới quản lý <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* 6. Shortcuts / Tạo mới */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-green-600" /> Tạo nhanh
            </CardTitle>
            <CardDescription>
              Lối tắt để tạo mới các nội dung đào tạo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full h-9" size="sm">
              <Link href="/admin/courses/new">Khóa Học Mới</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full h-9" size="sm">
              <Link href="/admin/exams/create">Đề Thi Mới</Link>
            </Button>
            <Button asChild variant="outline" className="w-full h-9" size="sm">
              <Link href="/admin/questions">
                 <PlusCircle className="mr-2 h-3.5 w-3.5" /> Thêm Câu Hỏi
              </Link>
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}