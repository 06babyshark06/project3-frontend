"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  ArrowLeft, BookOpen, Clock,
  FileText, PlayCircle, Users, Mail
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table";

// Interface khớp với Backend
interface ClassDetail {
  id: number;
  name: string;
  code: string;
  description: string;
  teacher_name: string;
  student_count: number;
}

interface ClassMember {
  user_id: number;
  full_name: string;
  email: string;
  role: string;
  joined_at: string;
}

interface ClassExam {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  question_count: number; // Sửa từ total_questions
  status: string;
  start_time?: string;
  end_time?: string;
}

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [classInfo, setClassInfo] = useState<ClassDetail | null>(null);
  const [members, setMembers] = useState<ClassMember[]>([]);
  const [exams, setExams] = useState<ClassExam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClassData = async () => {
      try {
        setLoading(true);
        const classId = params.id;

        // 1. Gọi API lấy thông tin lớp & thành viên
        const resClass = await api.get(`/classes/${classId}`);
        setClassInfo(resClass.data.data.class);
        setMembers(resClass.data.data.members || []);

        // 2. Gọi API lấy bài thi của lớp
        const resExams = await api.get(`/classes/${classId}/exams`);
        setExams(resExams.data.data || []);

      } catch (error: any) {
        console.error("Lỗi tải lớp học:", error);
        toast.error("Không thể tải thông tin lớp học.");
        router.push("/dashboard/classes"); // Redirect về danh sách lớp
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchClassData();
    }
  }, [params.id, router]);

  const handleStartExam = (examId: number) => {
    router.push(`/exams/${examId}/take`);
  };

  if (loading) {
    return <ClassDetailSkeleton />;
  }

  if (!classInfo) return null;

  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-8">
      {/* Nút quay lại */}
      <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách lớp
      </Button>

      {/* Header thông tin lớp */}
      <div className="flex flex-col md:flex-row gap-6 items-start justify-between bg-card p-6 rounded-xl border shadow-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-primary border-primary font-mono">
              {classInfo.code}
            </Badge>
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> {classInfo.student_count} thành viên
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">{classInfo.name}</h1>
          <p className="text-muted-foreground max-w-2xl">{classInfo.description || "Không có mô tả"}</p>
          <div className="flex items-center gap-2 pt-2">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{classInfo.teacher_name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium">GV: {classInfo.teacher_name}</span>
          </div>
        </div>
      </div>

      {/* Nội dung chính: Tabs */}
      <Tabs defaultValue="exams" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="exams">Bài kiểm tra</TabsTrigger>
          <TabsTrigger value="members">Bạn cùng lớp</TabsTrigger>
        </TabsList>

        {/* Tab: Bài kiểm tra */}
        <TabsContent value="exams" className="mt-6 space-y-4">
          {exams.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {exams.map((exam) => (
                <Card key={exam.id} className="hover:shadow-md transition-all border-l-4 border-l-primary/50 cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-lg line-clamp-1">{exam.title}</CardTitle>
                        <CardDescription className="line-clamp-1">{exam.description || "Không có mô tả"}</CardDescription>
                      </div>
                      <Badge variant={exam.status !== 'draft' ? 'default' : 'secondary'}>
                        {exam.status !== 'draft' ? 'Đang mở' : 'Đóng'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> {exam.duration_minutes} phút
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" /> {exam.question_count || 0} câu hỏi
                      </div>
                    </div>

                    <Button
                      className="w-full"
                      onClick={() => handleStartExam(exam.id)}
                      disabled={exam.status === 'draft'}
                    >
                      <PlayCircle className="mr-2 h-4 w-4" /> Làm bài thi
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium text-muted-foreground">Chưa có bài kiểm tra nào</h3>
              <p className="text-sm text-muted-foreground">Giảng viên chưa giao bài tập cho lớp này.</p>
            </div>
          )}
        </TabsContent>

        {/* Tab: Thành viên */}
        <TabsContent value="members" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách thành viên ({members.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="text-right">Ngày tham gia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.length === 0 ? (
                    <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">Chưa có thành viên nào.</TableCell></TableRow>
                  ) : (
                    members.map((mem) => (
                      <TableRow key={mem.user_id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback>{mem.full_name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {mem.full_name}
                            {mem.user_id === user?.id && <Badge variant="secondary" className="ml-2 text-xs">Bạn</Badge>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Mail className="h-3 w-3" /> {mem.email}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-xs">
                          {new Date(mem.joined_at).toLocaleDateString('vi-VN')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Component Skeleton khi đang tải
function ClassDetailSkeleton() {
  return (
    <div className="container mx-auto max-w-6xl p-6 space-y-8">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-[300px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    </div>
  );
}