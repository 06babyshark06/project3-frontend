// app/admin/exams/[id]/stats/page.tsx
// ✅ HOÀN THIỆN: Dashboard thống kê với biểu đồ và export Excel
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend
} from "recharts";
import {
  Loader2, Download, ArrowLeft, Users, Trophy,
  TrendingUp, TrendingDown, FileSpreadsheet
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// ===== INTERFACES =====
interface ExamStats {
  total_students: number;
  submitted_count: number;
  average_score: number;
  highest_score: number;
  lowest_score: number;
  score_distribution: Record<string, number>; // {"0-2": 5, "2-4": 10, ...}
}

export default function ExamStatsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [stats, setStats] = useState<ExamStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // ===== FETCH STATS =====
  useEffect(() => {
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/exams/${examId}/stats`);
        setStats(response.data.data);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải dữ liệu thống kê.");
      } finally {
        setIsLoading(false);
      }
    };

    if (examId) fetchStats();
  }, [examId]);

  // ===== EXPORT EXCEL =====
  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      toast.info("Đang tạo file báo cáo...");
      const res = await api.get(`/exams/${examId}/export`);
      
      // Backend trả về file_url từ R2
      const fileUrl = res.data.data.file_url;
      
      // Open in new tab để download
      window.open(fileUrl, "_blank");
      
      toast.success("Đã tải xuống file báo cáo!");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error?.message || "Xuất file thất bại!");
    } finally {
      setIsExporting(false);
    }
  };

  // ===== LOADING =====
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-center text-muted-foreground">Không có dữ liệu thống kê.</p>
      </div>
    );
  }

  // ===== PREPARE CHART DATA =====
  const chartData = Object.entries(stats.score_distribution || {}).map(([range, count]) => ({
    range,
    count
  }));

  // Pie chart data
  const passCount = Object.entries(stats.score_distribution || {})
    .filter(([range]) => {
      const minScore = parseFloat(range.split("-")[0]);
      return minScore >= 5;
    })
    .reduce((sum, [_, count]) => sum + count, 0);

  const failCount = stats.submitted_count - passCount;
  const passRate = stats.submitted_count > 0 ? (passCount / stats.submitted_count) * 100 : 0;

  const pieData = [
    { name: "Đạt (≥5)", value: passCount, fill: "#22c55e" },
    { name: "Không đạt (<5)", value: failCount, fill: "#ef4444" }
  ];

  // Color for bars
  const COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#10b981"];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Thống kê bài thi</h1>
            <p className="text-muted-foreground">Phân tích chi tiết kết quả học sinh</p>
          </div>
        </div>

        <Button onClick={handleExportExcel} disabled={isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Đang xuất...
            </>
          ) : (
            <>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Xuất Excel
            </>
          )}
        </Button>
      </div>

      {/* OVERVIEW CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Tổng số học sinh</CardDescription>
            <CardTitle className="text-4xl flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-500" />
              {stats.total_students}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Đã nộp bài: <strong>{stats.submitted_count}</strong>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Điểm trung bình</CardDescription>
            <CardTitle className="text-4xl flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
              {stats.average_score.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant={stats.average_score >= 5 ? "default" : "destructive"}>
              {stats.average_score >= 5 ? "Khá tốt" : "Cần cải thiện"}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Điểm cao nhất</CardDescription>
            <CardTitle className="text-4xl flex items-center gap-2">
              <Trophy className="h-8 w-8 text-yellow-500" />
              {stats.highest_score.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-green-600 dark:text-green-400">
              🎉 Xuất sắc!
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Điểm thấp nhất</CardDescription>
            <CardTitle className="text-4xl flex items-center gap-2">
              <TrendingDown className="h-8 w-8 text-red-500" />
              {stats.lowest_score.toFixed(2)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cần hỗ trợ thêm
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* BAR CHART - Score Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Phân bố điểm số</CardTitle>
            <CardDescription>
              Số lượng học sinh theo từng khoảng điểm
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {chartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* PIE CHART - Pass/Fail Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Tỷ lệ đạt/trượt</CardTitle>
            <CardDescription>
              Dựa trên điểm chuẩn 5.0
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            <div className="mt-4 text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {passRate.toFixed(1)}%
              </p>
              <p className="text-sm text-muted-foreground">Tỷ lệ đạt yêu cầu</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* INSIGHTS */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Nhận xét và đề xuất</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.average_score >= 7 && (
            <div className="p-4 bg-green-50 dark:bg-green-950 border-l-4 border-green-500 rounded">
              <p className="text-sm text-green-700 dark:text-green-300">
                ✅ Kết quả tốt! Lớp đã nắm vững kiến thức.
              </p>
            </div>
          )}

          {stats.average_score < 5 && (
            <div className="p-4 bg-red-50 dark:bg-red-950 border-l-4 border-red-500 rounded">
              <p className="text-sm text-red-700 dark:text-red-300">
                ⚠️ Điểm trung bình thấp. Cần ôn lại kiến thức và tổ chức buổi học phụ đạo.
              </p>
            </div>
          )}

          {passRate < 50 && (
            <div className="p-4 bg-orange-50 dark:bg-orange-950 border-l-4 border-orange-500 rounded">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                💡 Chưa đến 50% học sinh đạt yêu cầu. Đề xuất xem xét lại nội dung giảng dạy.
              </p>
            </div>
          )}

          {stats.highest_score === 10 && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 rounded">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                🏆 Có học sinh đạt điểm tuyệt đối! Nên khen thưởng và động viên.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}