"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Import useRouter
import { api } from "@/lib/api";
import { PlusCircle, Eye, Edit, Trash2, ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Course {
  id: number;
  title: string;
  price: number;
  is_published: boolean;
  created_at: string;
}

export default function InstructorCoursesPage() {
  const router = useRouter(); // Hook điều hướng
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true); // Thêm state loading

  const fetchCourses = async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/instructor/courses");
      setCourses(res.data.data.courses || []);
    } catch (error) {
      console.error("Lỗi tải danh sách khóa học:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDeleteCourse = async (id: number) => {
    try {
      await api.delete(`/courses/${id}`);
      toast.success("Xóa khóa học thành công");
      fetchCourses();
    } catch (error) {
      toast.error("Lỗi khi xóa khóa học");
      console.error(error);
    }
  };

  const publishedCourses = courses.filter(c => c.is_published);
  const draftCourses = courses.filter(c => !c.is_published);

  const CourseTable = ({ data }: { data: Course[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tên khóa học</TableHead>
          <TableHead>Giá</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className="text-right">Hành động</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((course) => (
          <TableRow key={course.id}>
            <TableCell className="font-medium">{course.title}</TableCell>
            <TableCell>{(course.price || 0) === 0 ? "Miễn phí" : (course.price || 0).toLocaleString()} đ</TableCell>
            <TableCell>
              {course.is_published ?
                <Badge className="bg-green-600 hover:bg-green-700">Đã xuất bản</Badge> :
                <Badge variant="secondary">Bản nháp</Badge>
              }
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/courses/${course.id}`} target="_blank"><Eye className="h-4 w-4" /></Link>
                </Button>
                <Button variant="ghost" size="icon" asChild title="Chỉnh sửa">
                  <Link href={`/instructor/courses/edit/${course.id}`}><Edit className="h-4 w-4" /></Link>
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" title="Xóa" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Hành động này không thể hoàn tác. Khóa học "<strong>{course.title}</strong>" và tất cả các bài học liên quan sẽ bị xóa vĩnh viễn.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Hủy</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteCourse(course.id)} className="bg-red-600 hover:bg-red-700">
                        Xác nhận xóa
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      {/* === TOP BAR ĐIỀU HƯỚNG === */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý khóa học</h1>
          <p className="text-sm text-muted-foreground">Danh sách các khóa học bạn đã tạo.</p>
        </div>

        <Button asChild>
          <Link href="/instructor/courses/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Tạo khóa học mới
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="published" className="space-y-4">
        <TabsList>
          <TabsTrigger value="published">Đã xuất bản ({publishedCourses.length})</TabsTrigger>
          <TabsTrigger value="drafts">Bản nháp ({draftCourses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="published">
          <Card>
            <CardContent className="pt-6">
              {publishedCourses.length > 0 ? <CourseTable data={publishedCourses} /> :
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Bạn chưa xuất bản khóa học nào.</p>
                  <Button variant="outline" asChild><Link href="/instructor/courses/new">Tạo ngay</Link></Button>
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drafts">
          <Card>
            <CardContent className="pt-6">
              {draftCourses.length > 0 ? <CourseTable data={draftCourses} /> :
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Không có bản nháp nào.</p>
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  );
}