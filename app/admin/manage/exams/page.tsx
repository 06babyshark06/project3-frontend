"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Loader2, Eye, Trash2, MoreHorizontal, FileQuestion, Edit, Clock, ArrowLeft, PlusCircle
} from "lucide-react";

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

interface Exam {
  id: number;
  title: string;
  duration_minutes: number;
  is_published: boolean;
  creator_id: number;
}

export default function ManageAllExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State cho việc xóa
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAllExams = async () => {
    try {
      setIsLoading(true);
      // Gọi API lấy danh sách bài thi (Public)
      // Lưu ý: Hiện tại API này trả về các bài đã xuất bản. 
      // Để Admin thấy cả bài nháp của người khác, Backend cần hỗ trợ logic role Admin trong GetExams.
      const res = await api.get("/exams?limit=100"); 
      setExams(res.data.data.exams || []); 
    } catch (error) {
      toast.error("Lỗi tải danh sách bài thi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAllExams(); }, []);

  const handleDeleteExam = async () => {
    if (!examToDelete) return;
    setIsDeleting(true);
    try {
        // Gọi API xóa bài thi
        await api.delete(`/exams/${examToDelete.id}`);
        toast.success("Đã xóa bài thi.");
        fetchAllExams();
    } catch (error) {
        toast.error("Xóa thất bại (Có thể do thiếu quyền hoặc lỗi server).");
    } finally {
        setIsDeleting(false);
        setExamToDelete(null);
    }
  };

  return (
    <div className="container mx-auto max-w-6xl p-6">
      {/* === TOP BAR ĐIỀU HƯỚNG === */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản Lý Tất Cả Bài Thi</h1>
            <p className="text-sm text-muted-foreground">Kiểm soát ngân hàng đề thi trên hệ thống.</p>
          </div>
        </div>
        
        <Button asChild>
          <Link href="/admin/exams/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Tạo bài thi mới
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : (
             <>
                {exams.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed rounded-lg m-4">
                        <FileQuestion className="h-10 w-10 mx-auto mb-2 opacity-50" />
                        <p>Không tìm thấy bài thi nào.</p>
                    </div>
                ) : (
                    <div className="rounded-md border">
                      <Table>
                      <TableHeader>
                          <TableRow className="bg-muted/50">
                          <TableHead className="w-[50px]">ID</TableHead>
                          <TableHead>Tên bài thi</TableHead>
                          <TableHead>Thời gian</TableHead>
                          <TableHead>Người tạo</TableHead>
                          <TableHead>Trạng thái</TableHead>
                          <TableHead className="text-right">Hành động</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {exams.map((exam) => (
                          <TableRow key={exam.id}>
                              <TableCell>{exam.id}</TableCell>
                              <TableCell className="font-medium">{exam.title}</TableCell>
                              <TableCell>
                                  <span className="flex items-center gap-1 text-muted-foreground">
                                      <Clock className="h-3 w-3" /> {exam.duration_minutes}p
                                  </span>
                              </TableCell>
                              <TableCell>
                                <span className="text-xs bg-secondary px-2 py-1 rounded-full">ID: {exam.creator_id}</span>
                              </TableCell>
                              <TableCell>
                                  {exam.is_published ? 
                                      <Badge className="bg-green-600 hover:bg-green-700">Đã xuất bản</Badge> : 
                                      <Badge variant="secondary">Bản nháp</Badge>
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
                                      <Link href={`/exams/${exam.id}/take`} target="_blank" className="cursor-pointer">
                                          <Eye className="mr-2 h-4 w-4" /> Xem / Làm thử
                                      </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                      <Link href={`/admin/exams/edit/${exam.id}`} className="cursor-pointer">
                                          <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
                                      </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                      onClick={() => setExamToDelete(exam)}
                                      className="text-destructive focus:text-destructive cursor-pointer"
                                  >
                                      <Trash2 className="mr-2 h-4 w-4" /> Xóa bài thi
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
      <AlertDialog open={!!examToDelete} onOpenChange={(open) => !open && setExamToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa bài thi này?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này sẽ xóa vĩnh viễn bài thi <b>"{examToDelete?.title}"</b> và toàn bộ câu hỏi bên trong.
              Dữ liệu kết quả thi của học viên cũng có thể bị ảnh hưởng.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => { e.preventDefault(); handleDeleteExam(); }} 
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