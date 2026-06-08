"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, Cell, PieChart, Pie, Legend,
  ScatterChart, Scatter, ZAxis, Brush
} from "recharts";
import {
  Loader2, ArrowLeft, Users, Trophy,
  TrendingUp, TrendingDown, FileSpreadsheet, RefreshCcw, AlertCircle,
  BarChart3, CircleDot
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ExamStats {
  total_students: number;
  submitted_count: number;

  average_score?: number;
  highest_score?: number;
  lowest_score?: number;
  score_distribution: Record<string, number>;
}

interface SubmissionSummary {
  submission_id: number;
  user_id: number;
  student_name: string;
  score: number;
  submitted_at: string;
  status: string;
}

export default function ExamStatsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [stats, setStats] = useState<ExamStats | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [chartType, setChartType] = useState<"bar" | "scatter">("bar");
  const [xDomain, setXDomain] = useState<[number, number]>([0, 10]);
  const [brushKey, setBrushKey] = useState(0);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const [statsRes, subsRes] = await Promise.all([
        api.get(`/exams/${examId}/stats`),
        api.get(`/exams/${examId}/submissions`, { params: { limit: 1000 } })
      ]);
      setStats(statsRes.data.data);
      setSubmissions(subsRes.data.data.submissions || []);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải dữ liệu thống kê.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (examId) fetchStats();
  }, [examId]);

  const handleExportExcel = async () => {
    setIsExporting(true);
    try {
      toast.info("Đang xử lý xuất báo cáo...");
      const res = await api.get(`/exams/${examId}/export`);

      const fileUrl = res.data.data.file_url;
      if (fileUrl) {
        window.open(fileUrl, "_blank");
        toast.success("Tải xuống thành công!");
      } else {
        toast.error("Không nhận được link tải xuống.");
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error?.message || "Xuất file thất bại!");
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Đang phân tích dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-12 px-4 text-center">
        <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-4">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold">Chưa có dữ liệu thống kê</h3>
        <p className="text-muted-foreground mb-6">Có thể bài thi chưa có thí sinh nào nộp bài.</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
      </div>
    );
  }

  const avgScore = stats.average_score || 0;
  const highScore = stats.highest_score || 0;
  const lowScore = stats.lowest_score || 0;

  const sortOrder = [
    "0-1", "1-2", "2-3", "3-4", "4-5",
    "5-6", "6-7", "7-8", "8-9", "9-10"
  ];
  const rangeDisplayMap: Record<string, string> = {
    "0-1": "[0 - 1)",
    "1-2": "[1 - 2)",
    "2-3": "[2 - 3)",
    "3-4": "[3 - 4)",
    "4-5": "[4 - 5)",
    "5-6": "[5 - 6)",
    "6-7": "[6 - 7)",
    "7-8": "[7 - 8)",
    "8-9": "[8 - 9)",
    "9-10": "[9 - 10]"
  };
  const chartData = sortOrder.map(range => ({
    range: rangeDisplayMap[range] || range,
    rangeKey: range,
    count: stats.score_distribution?.[range] || 0
  }));

  // Process data for the Scatter chart (Stacked Dot Plot)
  const validSubmissions = (submissions || [])
    .filter(sub => sub.status === "submitted" || sub.status === "completed")
    .map(sub => ({
      ...sub,
      score: typeof sub.score === "number" ? sub.score : 0
    }))
    .sort((a, b) => a.score - b.score);

  const scoreCounts: Record<number, number> = {};
  const scatterData = validSubmissions.map(sub => {
    const scoreVal = Math.round(sub.score * 100) / 100;
    if (scoreCounts[scoreVal] === undefined) {
      scoreCounts[scoreVal] = 0;
    }
    scoreCounts[scoreVal] += 1;
    return {
      x: scoreVal,
      y: scoreCounts[scoreVal],
      student_name: sub.student_name || `Thí sinh #${sub.user_id}`,
      user_id: sub.user_id,
      submission_id: sub.submission_id,
      score: sub.score
    };
  });

  // Calculate start/end index for brush sync
  let brushStartIndex = scatterData.length > 0 ? scatterData.findIndex(d => d.x >= xDomain[0]) : 0;
  if (brushStartIndex === -1) brushStartIndex = 0;

  const lastIndex = scatterData.length > 0 ? scatterData.length - 1 : 0;
  let brushEndIndex = lastIndex;
  if (scatterData.length > 0) {
    for (let i = lastIndex; i >= 0; i--) {
      if (scatterData[i].x <= xDomain[1]) {
        brushEndIndex = i;
        break;
      }
    }
  }
  if (brushEndIndex === -1) brushEndIndex = lastIndex;
  if (brushStartIndex > brushEndIndex) {
    const temp = brushStartIndex;
    brushStartIndex = brushEndIndex;
    brushEndIndex = temp;
  }

  const handlePresetClick = (min: number, max: number) => {
    setXDomain([min, max]);
    setBrushKey(prev => prev + 1);
  };

  const passCount = Object.entries(stats.score_distribution || {})
    .filter(([range]) => {
      const minScore = parseFloat(range.split("-")[0]);
      return minScore >= 5;
    })
    .reduce((sum, [_, count]) => sum + count, 0);

  const failCount = stats.submitted_count - passCount;

  const passRate = stats.submitted_count > 0
    ? (passCount / stats.submitted_count) * 100
    : 0;

  const pieData = [
    { name: "Đạt (≥5)", value: passCount, fill: "#22c55e" },
    { name: "Chưa đạt (<5)", value: failCount, fill: "#ef4444" }
  ];

  const BAR_COLORS = [
    "#ef4444",
    "#f87171",
    "#fb923c",
    "#facc15",
    "#fde047",
    "#a3e635",
    "#4ade80",
    "#22c55e",
    "#16a34a",
    "#15803d"
  ];

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl space-y-8">
      {}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => router.back()} title="Quay lại">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Thống kê kết quả thi</h1>
            <p className="text-sm text-muted-foreground">Báo cáo chi tiết hiệu suất và phổ điểm</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchStats} disabled={isLoading}>
            <RefreshCcw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button onClick={handleExportExcel} disabled={isExporting} className="bg-green-600 hover:bg-green-700 text-white">
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="mr-2 h-4 w-4" />
            )}
            Xuất Excel
          </Button>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Tổng thí sinh"
          value={stats.total_students}
          subValue={`Đã nộp: ${stats.submitted_count}`}
          icon={Users}
          iconColor="text-blue-500"
        />
        <MetricCard
          title="Điểm trung bình"

          value={avgScore.toFixed(2)}
          subValue={
            <Badge variant={avgScore >= 5 ? "secondary" : "destructive"} className="mt-1">
              {avgScore >= 5 ? "Đạt yêu cầu" : "Cần cải thiện"}
            </Badge>
          }
          icon={TrendingUp}
          iconColor="text-green-500"
        />
        <MetricCard
          title="Cao nhất"

          value={highScore.toFixed(2)}
          subValue="Điểm số cao nhất"
          icon={Trophy}
          iconColor="text-yellow-500"
        />
        <MetricCard
          title="Thấp nhất"

          value={lowScore.toFixed(2)}
          subValue="Điểm số thấp nhất"
          icon={TrendingDown}
          iconColor="text-red-500"
        />
      </div>

      {}
      {isMounted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {}
          <Card className="lg:col-span-2 shadow-sm">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <div>
                <CardTitle>Phổ điểm chi tiết</CardTitle>
                <CardDescription>
                  Số lượng thí sinh theo các khoảng điểm hoặc tọa độ điểm chi tiết.
                  <span className="block text-xs mt-1 text-muted-foreground italic font-normal">
                    * Ký hiệu: [a - b) nghĩa là điểm từ a đến dưới b (không bao gồm b); [9 - 10] nghĩa là từ 9 đến 10 (bao gồm cả 10).
                  </span>
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5 bg-muted p-1 rounded-lg self-start sm:self-center border border-border">
                <Button
                  variant={chartType === "bar" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-3 shadow-none"
                  onClick={() => setChartType("bar")}
                >
                  <BarChart3 className="h-3.5 w-3.5 mr-1" />
                  Biểu đồ cột
                </Button>
                <Button
                  variant={chartType === "scatter" ? "secondary" : "ghost"}
                  size="sm"
                  className="h-7 text-xs px-3 shadow-none"
                  onClick={() => setChartType("scatter")}
                >
                  <CircleDot className="h-3.5 w-3.5 mr-1" />
                  Tọa độ điểm
                </Button>
              </div>
            </CardHeader>
            <CardContent className={chartType === "scatter" ? "h-[420px] flex flex-col justify-between" : "h-[350px]"}>
              {chartType === "bar" ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis
                      dataKey="range"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      dy={10}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 12, fill: "#6b7280" }}
                      allowDecimals={false}
                    />
                    <RechartsTooltip
                      cursor={{ fill: 'transparent' }}
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          let detailText = "";
                          if (data.rangeKey === "9-10") {
                            detailText = "Điểm từ 9.0 đến 10.0 (bao gồm cả 10.0)";
                          } else {
                            const [min, max] = data.rangeKey.split("-");
                            detailText = `Điểm từ ${min}.0 đến dưới ${max}.0`;
                          }
                          return (
                            <div className="bg-background p-3 rounded-lg border shadow-md">
                              <p className="font-bold text-sm">{data.range}</p>
                              <p className="text-sm text-muted-foreground">{detailText}</p>
                              <p className="text-sm font-semibold text-primary mt-1">Số thí sinh: {data.count}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" name="Số lượng" radius={[6, 6, 0, 0]} barSize={50}>
                      {chartData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col h-full justify-between">
                  {/* Preset zoom buttons */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-muted/40 p-2 rounded-lg border border-border">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-muted-foreground font-semibold px-1">Khoảng điểm nhanh:</span>
                      <Button
                        variant={xDomain[0] === 0 && xDomain[1] === 10 ? "secondary" : "outline"}
                        size="sm"
                        className="h-7 text-xs px-2.5 shadow-none"
                        onClick={() => handlePresetClick(0, 10)}
                      >
                        Tất cả (0-10)
                      </Button>
                      <Button
                        variant={xDomain[0] === 0 && xDomain[1] === 5 ? "secondary" : "outline"}
                        size="sm"
                        className="h-7 text-xs px-2.5 shadow-none"
                        onClick={() => handlePresetClick(0, 5)}
                      >
                        Dưới trung bình (0-5)
                      </Button>
                      <Button
                        variant={xDomain[0] === 5 && xDomain[1] === 8 ? "secondary" : "outline"}
                        size="sm"
                        className="h-7 text-xs px-2.5 shadow-none"
                        onClick={() => handlePresetClick(5, 8)}
                      >
                        Trung bình - Khá (5-8)
                      </Button>
                      <Button
                        variant={xDomain[0] === 8 && xDomain[1] === 10 ? "secondary" : "outline"}
                        size="sm"
                        className="h-7 text-xs px-2.5 shadow-none"
                        onClick={() => handlePresetClick(8, 10)}
                      >
                        Giỏi - Xuất sắc (8-10)
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground pr-1 font-medium">
                      Đang zoom: <span className="font-mono font-bold text-primary">{xDomain[0]} - {xDomain[1]} đ</span>
                    </div>
                  </div>

                  {/* Scatter Chart */}
                  <div className="flex-1 min-h-[290px]">
                    {scatterData.length === 0 ? (
                      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                        Chưa có dữ liệu thí sinh nộp bài.
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 30, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                          <XAxis
                            type="number"
                            dataKey="x"
                            name="Điểm"
                            unit="đ"
                            domain={xDomain}
                            ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                          />
                          <YAxis
                            type="number"
                            dataKey="y"
                            name="Thứ tự xếp chồng"
                            allowDecimals={false}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: "#6b7280" }}
                          />
                          <ZAxis type="number" range={[64, 64]} />
                          <RechartsTooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }: any) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-background p-3 rounded-lg border shadow-md space-y-1 border-border">
                                    <p className="font-bold text-sm text-primary">{data.student_name}</p>
                                    <p className="text-xs text-muted-foreground font-mono">ID học sinh: #{data.user_id}</p>
                                    <div className="h-px bg-border my-1" />
                                    <p className="text-sm font-semibold text-foreground">
                                      Điểm số: <span className="text-blue-600 font-bold">{data.score.toFixed(2)}</span>
                                    </p>
                                    <p className="text-xs text-muted-foreground italic">
                                      Thứ tự cùng mức điểm: {data.y}
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Scatter name="Thí sinh" data={scatterData} fill="#3b82f6" />
                          <Brush
                            key={`brush-${brushKey}`}
                            dataKey="x"
                            height={30}
                            stroke="#3b82f6"
                            fill="#f9fafb"
                            tickFormatter={(v) => typeof v === 'number' ? v.toFixed(1) : v}
                            startIndex={brushStartIndex}
                            endIndex={brushEndIndex}
                            onChange={(obj) => {
                              if (obj && typeof obj.startIndex === 'number' && typeof obj.endIndex === 'number') {
                                const startScore = scatterData[obj.startIndex]?.x ?? 0;
                                const endScore = scatterData[obj.endIndex]?.x ?? 10;
                                setXDomain([startScore, endScore]);
                              }
                            }}
                          />
                        </ScatterChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {}
          <Card className="shadow-sm flex flex-col">
            <CardHeader>
              <CardTitle>Tỷ lệ Đạt / Trượt</CardTitle>
              <CardDescription>Trên tổng số bài đã nộp</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 min-h-[300px] flex flex-col items-center justify-center relative">
              {stats.submitted_count > 0 ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <span className="text-3xl font-bold text-foreground">{passRate.toFixed(1)}%</span>
                      <p className="text-xs text-muted-foreground uppercase">Tỷ lệ đạt</p>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </>
              ) : (
                <div className="text-center text-muted-foreground">Chưa có dữ liệu</div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {}
      <Card className="bg-primary/5 border-primary/20 shadow-none">
        <CardHeader>
          <CardTitle className="text-primary flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Nhận xét tổng quan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {}
          {avgScore >= 8 ? (
            <InsightItem type="success" text="Xuất sắc! Lớp có thành tích rất cao, đa số sinh viên nắm vững kiến thức." />
          ) : avgScore >= 6.5 ? (
            <InsightItem type="info" text="Khá tốt. Phần lớn sinh viên đạt yêu cầu, tuy nhiên vẫn còn một số điểm yếu cần cải thiện." />
          ) : avgScore >= 5 ? (
            <InsightItem type="warning" text="Trung bình. Cần tổ chức thêm các buổi ôn tập để củng cố kiến thức cho sinh viên." />
          ) : (
            <InsightItem type="danger" text="Đáng báo động. Kết quả thi thấp, cần xem xét lại phương pháp giảng dạy hoặc độ khó của đề thi." />
          )}

          {highScore === 10 && (
            <InsightItem type="success" text="Có sinh viên đạt điểm tuyệt đối (10/10). Nên có hình thức khen thưởng." />
          )}

          {passRate < 50 && (
            <InsightItem type="danger" text="Hơn 50% sinh viên không đạt yêu cầu. Cần phân tích kỹ các câu hỏi có tỷ lệ sai cao." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({ title, value, subValue, icon: Icon, iconColor }: any) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground mt-1">
          {subValue}
        </div>
      </CardContent>
    </Card>
  );
}

function InsightItem({ type, text }: { type: 'success' | 'info' | 'warning' | 'danger', text: string }) {
  const styles = {
    success: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
    info: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800",
    warning: "bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
    danger: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  };

  return (
    <div className={`p-3 rounded-lg border text-sm font-medium ${styles[type]}`}>
      {text}
    </div>
  );
}
