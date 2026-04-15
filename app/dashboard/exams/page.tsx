"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { 
  Loader2, Calendar, Award, ArrowRight, 
  History, Search, AlertCircle, CheckCircle,
  FileText, Clock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SubmissionSummary {
  submission_id: number;
  user_id: number;
  score: number;
  submitted_at: string;
  status: string;
  exam_title: string;
}

export default function ExamHistoryPage() {
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get("/exams/my-submissions");
      setSubmissions(response.data?.data?.submissions || []);
    } catch (error) {
      console.error("Lỗi tải lịch sử thi:", error);
      toast.error("Không thể tải lịch sử thi.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(sub => 
    sub.exam_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl p-6 md:p-8 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div>
          <div className="flex items-center gap-2 text-primary mb-2">
            <History className="h-5 w-5" />
            <span className="text-sm font-bold uppercase tracking-wider">Học tập</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
            Lịch sử bài thi
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Xem lại kết quả và chi tiết các bài thi bạn đã hoàn thành.
          </p>
        </div>
        
        <Button variant="outline" asChild className="rounded-full px-6">
          <Link href="/dashboard">Về Dashboard</Link>
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          className="pl-10 h-11 rounded-full border-muted-foreground/20 focus:ring-primary/20"
          placeholder="Tìm kiếm theo tên bài thi..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Content */}
      {filteredSubmissions.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredSubmissions.map((sub) => {
            const date = sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString("vi-VN", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit"
            }) : "N/A";
            
            const isReleased = sub.score > 0 || sub.status === "completed"; // Temporary check, backend logic hides score if not released
            // Actually, we should probably hide the score if it's 0 and not released yet.
            // But let's follow the standard pattern.

            return (
              <Card key={sub.submission_id} className="overflow-hidden hover:shadow-lg transition-all border-l-4 border-l-primary/40 group">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row items-center p-6 gap-6">
                    {/* Icon section */}
                    <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                      <FileText className="h-8 w-8 text-primary" />
                    </div>

                    {/* Main info */}
                    <div className="flex-1 text-center md:text-left">
                      <h3 className="text-xl font-bold line-clamp-1 mb-1">
                        {sub.exam_title}
                      </h3>
                      <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>{date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          <span className="capitalize">{sub.status === 'completed' ? 'Hoàn thành' : sub.status}</span>
                        </div>
                      </div>
                    </div>

                    {/* Score section */}
                    <div className="flex flex-col items-center justify-center px-8 border-x border-muted hidden md:flex min-w-[140px]">
                      {sub.score > 0 ? (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-black text-foreground">{sub.score.toFixed(1)}</span>
                            <span className="text-sm font-medium text-muted-foreground">/10</span>
                          </div>
                          <Badge variant={sub.score >= 5 ? "default" : "destructive"} className="mt-1">
                            {sub.score >= 5 ? "Đạt" : "Không đạt"}
                          </Badge>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-muted-foreground">
                          <span className="text-sm font-bold uppercase tracking-tighter">Chờ công bố</span>
                          <AlertCircle className="h-4 w-4 mt-1" />
                        </div>
                      )}
                    </div>

                    {/* Action */}
                    <div className="shrink-0 w-full md:w-auto">
                      <Button asChild className="w-full rounded-xl h-12 px-6 font-bold group-hover:translate-x-1 transition-transform">
                        <Link href={`/exams/result/${sub.submission_id}`}>
                          Xem chi tiết <ArrowRight className="ml-2 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-3xl border-2 border-dashed flex flex-col items-center">
          <History className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h3 className="text-xl font-bold text-muted-foreground">Chưa tìm thấy bài thi nào</h3>
          <p className="text-muted-foreground mt-2">
            {searchTerm ? "Thử tìm kiếm với từ khóa khác." : "Bạn chưa tham gia bài thi nào."}
          </p>
          {!searchTerm && (
            <Button asChild variant="link" className="mt-4 text-primary font-bold">
              <Link href="/exams">Khám phá các bài thi ngay</Link>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
