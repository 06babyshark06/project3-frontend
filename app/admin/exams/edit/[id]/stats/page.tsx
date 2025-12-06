// app/admin/exams/[id]/stats/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
    Loader2, Download, ArrowLeft, Users, Trophy,
    TrendingUp, TrendingDown, FileSpreadsheet, Eye
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// --- Interfaces ---
interface StudentSubmission {
    id: number;
    student_name: string;
    student_email: string;
    score: number;
    submitted_at: string;
    status: 'passed' | 'failed';
}

interface ExamStats {
    exam_title: string;
    total_attempts: number;
    avg_score: number;
    max_score: number;
    min_score: number;
    pass_rate: number;
    score_distribution: { range: string; count: number }[]; // Dữ liệu cho biểu đồ
}

export default function ExamStatsPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id;

    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<ExamStats | null>(null);
    const [submissions, setSubmissions] = useState<StudentSubmission[]>([]);

    useEffect(() => {
        const fetchStats = async () => {
            setIsLoading(true);
            try {
                // GỌI API THẬT
                const response = await api.get(`/exams/${examId}/stats`);
                setStats(response.data.data);

                // Lưu ý: Backend API hiện tại chưa trả về danh sách submissions chi tiết (list sinh viên).
                // Bạn cần gọi thêm 1 API nữa nếu muốn hiển thị bảng danh sách bên dưới:
                // const subResponse = await api.get(`/exams/${examId}/submissions`);
                // setSubmissions(subResponse.data.data);
            } catch (error) {
                console.error(error);
                toast.error("Không thể tải dữ liệu thống kê.");
            } finally {
                setIsLoading(false);
            }
        };

        if (examId) fetchStats();
    }, [examId]);

    const handleExportExcel = async () => {
    try {
        toast.info("Đang tạo file báo cáo...");
        const res = await api.post(`/exams/${examId}/export`);
        window.open(res.data.data.file_url, '_blank');
        toast.success("Đã tải xuống thành công!");
    } catch (err) {
        toast.error("Lỗi khi xuất file Excel");
    }
};

    if (!stats) return <div>Không tìm thấy dữ liệu.</div>;

    return (
        <div className="container mx-auto max-w-7xl p-4 md:p-8 space-y-8">
            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Link href="/admin/exams" className="hover:text-primary flex items-center gap-1">
                            <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                        </Link>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">{stats.exam_title}</h1>
                    <p className="text-muted-foreground">Báo cáo chi tiết và phân tích kết quả thi.</p>
                </div>
                <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Xuất Excel
                </Button>
            </div>

            {/* 1. Dashboard Overview Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tổng lượt thi</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total_attempts}</div>
                        <p className="text-xs text-muted-foreground">thí sinh đã nộp bài</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Điểm trung bình</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">{stats.avg_score}</div>
                        <p className="text-xs text-muted-foreground">trên thang điểm 10</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Điểm cao nhất</CardTitle>
                        <Trophy className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">{stats.max_score}</div>
                        <p className="text-xs text-muted-foreground">Thấp nhất: {stats.min_score}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Tỷ lệ đạt</CardTitle>
                        <TrendingDown className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.pass_rate}%</div>
                        <p className="text-xs text-muted-foreground">sinh viên qua môn (≥ 5.0)</p>
                    </CardContent>
                </Card>
            </div>

            {/* 2. Biểu đồ Phổ điểm (Score Distribution Chart) */}
            <Card className="col-span-4">
                <CardHeader>
                    <CardTitle>Phổ điểm</CardTitle>
                    <CardDescription>Biểu đồ phân bố điểm số của toàn bộ thí sinh.</CardDescription>
                </CardHeader>
                <CardContent className="pl-2">
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.score_distribution}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="range"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value}`}
                                />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="count" name="Số lượng" radius={[4, 4, 0, 0]}>
                                    {stats.score_distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index > 2 ? '#22c55e' : '#eab308'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Danh sách chi tiết sinh viên */}
            <Card>
                <CardHeader>
                    <CardTitle>Danh sách bài làm chi tiết</CardTitle>
                    <CardDescription>Kết quả thi chi tiết của {submissions.length} thí sinh gần nhất.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sinh viên</TableHead>
                                <TableHead>Điểm số</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Thời gian nộp</TableHead>
                                <TableHead className="text-right">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {submissions.map((sub) => (
                                <TableRow key={sub.id}>
                                    <TableCell>
                                        <div className="font-medium">{sub.student_name}</div>
                                        <div className="text-sm text-muted-foreground">{sub.student_email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <span className={`font-bold ${sub.score >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                                            {sub.score}/10
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        {sub.score >= 5 ? (
                                            <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Đạt</Badge>
                                        ) : (
                                            <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">Trượt</Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {format(new Date(sub.submitted_at), "HH:mm dd/MM/yyyy", { locale: vi })}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" asChild>
                                            <Link href={`/exams/result/${sub.id}`}>
                                                <Eye className="w-4 h-4 mr-1" /> Chi tiết
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}