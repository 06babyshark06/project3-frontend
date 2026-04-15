"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { 
  Loader2, ArrowLeft, Search, Eye, 
  FileCheck, Clock, User, ChevronLeft, ChevronRight,
  ClipboardList
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
  student_id: number;
  student_name: string;
  exam_id: number;
  exam_title: string;
  score: number;
  submitted_at: string;
  status: string;
}

export default function InstructorSubmissionsPage() {
  const router = useRouter();

  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      // For now we use the recent-submissions endpoint with a larger limit
      // Since the backend doesn't support full pagination on this yet
      const res = await api.get("/instructor/recent-submissions", {
        params: {
          limit: 50
        }
      });
      const data = res.data.data;
      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách kết quả bài thi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled client-side for now as the backend doesn't support it for all submissions
    fetchSubmissions();
  };

  const filteredSubmissions = submissions.filter(sub => 
    sub.student_name?.toLowerCase().includes(search.toLowerCase()) ||
    sub.exam_title?.toLowerCase().includes(search.toLowerCase()) ||
    sub.submission_id.toString().includes(search)
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "submitted":
      case "completed":
        return <Badge className="bg-green-600 hover:bg-green-700">Đã hoàn thành</Badge>;
      case "in_progress":
        return <Badge variant="secondary" className="bg-blue-100 text-blue-700">Đang thực hiện</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl animate-in fade-in duration-500">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
              <ClipboardList className="h-8 w-8 text-primary" />
              Kết quả & Báo cáo
            </h1>
            <p className="text-muted-foreground mt-1">Xem tất cả bài nộp từ học viên trên toàn bộ các kỳ thi của bạn.</p>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <Card className="mb-8 border-none shadow-sm bg-muted/30">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm theo tên học viên, tên bài thi hoặc ID..."
                className="pl-10 h-11 bg-background"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Button type="submit" className="h-11 px-8 shadow-md">Tìm kiếm</Button>
          </form>
        </CardContent>
      </Card>

      {/* TABLE */}
      <Card className="border-none shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[80px]">ID</TableHead>
                <TableHead>Học viên</TableHead>
                <TableHead>Bài thi</TableHead>
                <TableHead className="text-center font-semibold">Kết quả</TableHead>
                <TableHead>Thời gian nộp</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Hành động</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="text-muted-foreground text-sm">Đang tải dữ liệu...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredSubmissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-64 text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <ClipboardList className="h-12 w-12 opacity-20" />
                      <p>Không tìm thấy bài nộp nào phù hợp.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubmissions.map((sub) => (
                  <TableRow key={sub.submission_id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-xs text-muted-foreground italic">#{sub.submission_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-semibold text-sm">{sub.student_name || "N/A"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col">
                        <span className="font-medium text-sm line-clamp-1">{sub.exam_title}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">Exam ID: #{sub.exam_id}</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className={`inline-flex items-center justify-center h-10 w-16 rounded-lg font-bold text-lg 
                        ${(sub.score ?? 0) >= 8 ? "bg-emerald-50 text-emerald-700" : (sub.score ?? 0) >= 5 ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                        {sub.score !== undefined ? sub.score.toFixed(1) : "-"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs gap-0.5">
                        <div className="flex items-center gap-1 font-medium">
                           <Clock className="h-3 w-3 text-muted-foreground" />
                           {sub.submitted_at ? format(new Date(sub.submitted_at), "HH:mm:ss") : "-"}
                        </div>
                        <span className="text-muted-foreground">
                          {sub.submitted_at ? format(new Date(sub.submitted_at), "dd/MM/yyyy") : ""}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(sub.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary hover:bg-primary/5 font-semibold"
                        onClick={() => router.push(`/instructor/exams/${sub.exam_id}/submissions/${sub.submission_id}`)}
                      >
                        <Eye className="h-4 w-4 mr-2" /> 
                        Chi tiết
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <div className="mt-6 flex justify-between items-center text-sm text-muted-foreground bg-muted/20 p-4 rounded-lg">
        <div className="flex items-center gap-2">
           <ClipboardList className="h-4 w-4" />
           <span>Hiển thị <strong>{filteredSubmissions.length}</strong> kết quả gần nhất.</span>
        </div>
        <p className="italic underline underline-offset-4 decoration-dotted">Dữ liệu được cập nhật thời gian thực</p>
      </div>
    </div>
  );
}
