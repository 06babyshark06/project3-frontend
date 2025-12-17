"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Import useRouter
import { Loader2, Eye, Trash2, MoreHorizontal, ArrowLeft } from "lucide-react"; // Thêm ArrowLeft

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Course {
  id: number;
  title: string;
  instructor_id: number;
  price: number;
  is_published: boolean;
  created_at: string;
}

export default function ManageAllCoursesPage() {
  const router = useRouter(); // Hook điều hướng
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // State cho dialog xóa
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAllCourses = async () => {
    try {
      setIsLoading(true);
      // Admin gọi API public (hoặc API admin riêng nếu backend hỗ trợ)
      // Tạm thời dùng /courses với limit lớn
      const response = await api.get("/courses?limit=100");
      setCourses(response.data.data.courses || []);
    } catch (error) {
      toast.error("Không thể tải danh sách khóa học.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAllCourses(); }, []);

  const handleDeleteCourse = async () => {
    if (!courseToDelete) return;
    setIsDeleting(true);
    try {
      // Gọi API DELETE /courses/:id (Admin Only)
      // Đảm bảo bạn đã có route này ở backend
      await api.delete(`/courses/${courseToDelete.id}`);
      toast.success("Đã xóa khóa học thành công.");
      fetchAllCourses(); // Refresh danh sách
    } catch (error) {
      toast.error("Xóa thất bại (Có thể do lỗi server hoặc quyền hạn).");
    } finally {
      setIsDeleting(false);
      setCourseToDelete(null);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl p-6">

      {/* === TOP BAR ĐIỀU HƯỚNG === */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản Lý Tất Cả Khóa Học</h1>
          <p className="text-sm text-muted-foreground">Kiểm soát toàn bộ nội dung học tập trên hệ thống.</p>
        </div>
        {/* (Có thể thêm nút Export hoặc Filter ở đây nếu cần) */}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
              {courses.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <p>Không tìm thấy khóa học nào.</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-[50px]">ID</TableHead>
                        <TableHead>Tên khóa học</TableHead>
                        <TableHead>Giảng viên (ID)</TableHead>
                        <TableHead>Giá</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {courses.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell>{course.id}</TableCell>
                          <TableCell className="font-medium">{course.title}</TableCell>
                          <TableCell>
                            <span className="text-xs bg-secondary px-2 py-1 rounded-full">ID: {course.instructor_id}</span>
                          </TableCell>
                          <TableCell>{(course.price || 0).toLocaleString()} đ</TableCell>
                          <TableCell>
                            {course.is_published ?
                              <Badge className="bg-green-600 hover:bg-green-700">Public</Badge> :
                              <Badge variant="secondary">Draft</Badge>
                            }
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/courses/${course.id}`} target="_blank" className="cursor-pointer">
                                    <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                                  </Link>
                                </DropdownMenuItem>

                                {/* Admin có quyền xóa bất kỳ khóa học nào */}
                                <DropdownMenuItem
                                  onClick={() => setCourseToDelete(course)}
                                  className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Xóa (Admin)
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Alert Dialog Xóa */}
      <AlertDialog open={!!courseToDelete} onOpenChange={(open) => !open && setCourseToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa khóa học này?</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đang chuẩn bị xóa khóa học <b>"{courseToDelete?.title}"</b> (ID: {courseToDelete?.id}).<br />
              Hành động này sẽ xóa vĩnh viễn khóa học và toàn bộ nội dung liên quan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteCourse(); }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Xóa Vĩnh Viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}