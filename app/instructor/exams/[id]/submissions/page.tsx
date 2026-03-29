"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Loader2, ArrowLeft, Search, Eye, 
  FileCheck, Clock, User, ChevronLeft, ChevronRight 
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { toast } from "sonner";

interface SubmissionSummary {
  submission_id: number;
  user_id: number;
  student_name: string;
  score: number;
  submitted_at: string;
  status: string;
}

export default function ExamSubmissionsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const limit = 10;

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const res = await api.get(`/exams/${examId}/submissions`, {
        params: {
          page,
          limit,
          search
        }
      });
      const data = res.data.data;
      setSubmissions(data.submissions || []);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách bài nộp.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (examId) fetchSubmissions();
  }, [examId, page, search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSubmissions();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
        return <Badge className="bg-green-600 hover:bg-green-700">Đã nộp</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Đang thi</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileCheck className="h-6 w-6 text-orange-600" />
            Danh sách bài nộp
          </h1>
          <p className="text-sm text-muted-foreground">Theo dõi và chấm điểm kết quả bài thi</p>
        </div>
      </div>

      {/* FILTERS */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên hoặc ID sinh viên..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit">Tìm kiếm</Button>
          </form>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Sinh viên</TableHead>
              <TableHead className="text-center">Điểm số</TableHead>
              <TableHead>Thời gian nộp</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                </TableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Chưa có bài nộp nào.
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((sub) => (
                <TableRow key={sub.submission_id}>
                  <TableCell className="font-mono text-xs">#{sub.user_id}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <User className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium">{sub.student_name || `Thí sinh ${sub.user_id}`}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-lg font-bold text-primary">
                      {sub.score !== undefined ? sub.score.toFixed(2) : "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <div className="flex items-center gap-1">
                         <Clock className="h-3 w-3" />
                         {sub.submitted_at ? format(new Date(sub.submitted_at), "HH:mm:ss") : "-"}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {sub.submitted_at ? format(new Date(sub.submitted_at), "dd/MM/yyyy") : ""}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(sub.status)}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => router.push(`/instructor/exams/${examId}/submissions/${sub.submission_id}`)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> Chi tiết
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        
        {/* PAGINATION */}
        {totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Trang {page} / {totalPages} (Tổng {total} bản ghi)
            </p>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Trước
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Sau <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
