"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PlusCircle, Eye, Edit, ArrowLeft, Loader2, Clock, Activity, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Exam {
  id: number;
  title: string;
  duration_minutes: number;
  is_published: boolean;
}

export default function InstructorExamsPage() {
  const router = useRouter();
  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true);
        const res = await api.get("/instructor/exams");
        setExams(res.data.data.exams || []);
      } catch (error) {
        console.error("Lỗi tải danh sách bài thi:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchExams();
  }, []);

  const publishedExams = exams.filter(e => e.is_published);
  const draftExams = exams.filter(e => !e.is_published);

  const ExamTable = ({ data }: { data: Exam[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Tên bài thi</TableHead>
          <TableHead>Thời gian</TableHead>
          <TableHead>Trạng thái</TableHead>
          <TableHead className="text-right">Hành động</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((exam) => (
          <TableRow key={exam.id}>
            <TableCell className="font-medium">{exam.title}</TableCell>
            <TableCell>
               <span className="flex items-center gap-1 text-muted-foreground">
                 <Clock className="h-3 w-3" /> {exam.duration_minutes} phút
               </span>
            </TableCell>
            <TableCell>
              {exam.is_published ?
                <Badge className="bg-green-600 hover:bg-green-700">Đã xuất bản</Badge> :
                <Badge variant="secondary">Bản nháp</Badge>
              }
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                
                {/* 1. Nút Giám sát (Monitor) - Chỉ hiện khi đã xuất bản */}
                {exam.is_published && (
                  <Button variant="ghost" size="icon" asChild className="text-red-600 hover:text-red-700 hover:bg-red-50" title="Giám sát phòng thi">
                    <Link href={`/admin/exams/${exam.id}/monitor`}>
                      <Activity className="h-4 w-4" />
                    </Link>
                  </Button>
                )}

                {/* 2. Nút Thống kê (Stats) - Chỉ hiện khi đã xuất bản */}
                {exam.is_published && (
                  <Button variant="ghost" size="icon" asChild className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" title="Xem thống kê">
                    <Link href={`/admin/exams/${exam.id}/stats`}>
                      <BarChart3 className="h-4 w-4" />
                    </Link>
                  </Button>
                )}

                {/* 3. Nút Xem thử (Preview) */}
                <Button variant="ghost" size="icon" asChild title="Xem thử đề thi">
                  <Link href={`/exams/${exam.id}/take`} target="_blank"><Eye className="h-4 w-4" /></Link>
                </Button>

                {/* 4. Nút Sửa (Edit) */}
                <Button variant="ghost" size="icon" asChild title="Chỉnh sửa">
                  <Link href={`/admin/exams/edit/${exam.id}`}><Edit className="h-4 w-4" /></Link>
                </Button>

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
      {/* === TOP BAR === */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản lý bài thi</h1>
            <p className="text-sm text-muted-foreground">Danh sách các bài thi bạn đã tạo.</p>
          </div>
        </div>
        
        <Button asChild>
          <Link href="/admin/exams/create">
            <PlusCircle className="mr-2 h-4 w-4" /> Tạo bài thi mới
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="published" className="space-y-4">
        <TabsList>
          <TabsTrigger value="published">Đã xuất bản ({publishedExams.length})</TabsTrigger>
          <TabsTrigger value="drafts">Bản nháp ({draftExams.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="published">
          <Card>
            <CardContent className="pt-6">
              {publishedExams.length > 0 ? <ExamTable data={publishedExams} /> : 
                <div className="text-center py-12">
                  <p className="text-muted-foreground mb-4">Bạn chưa xuất bản bài thi nào.</p>
                  <Button variant="outline" asChild><Link href="/admin/exams/create">Tạo ngay</Link></Button>
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drafts">
          <Card>
            <CardContent className="pt-6">
              {draftExams.length > 0 ? <ExamTable data={draftExams} /> : 
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Không có bản nháp nào.</p>
                </div>
              }
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}