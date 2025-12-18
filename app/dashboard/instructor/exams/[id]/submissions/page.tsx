"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import {
    Loader2, ArrowLeft, Eye, FileText, CheckCircle, XCircle, Clock, Search
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
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

interface ExamSubmissionsResponse {
    submissions: SubmissionSummary[];
    total: number;
    page: number;
    total_pages: number;
}

export default function TeacherExamSubmissionsPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id;

    const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [examTitle, setExamTitle] = useState(""); // Optional: Fetch exam title if needed

    useEffect(() => {
        fetchSubmissions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [examId, page]); // Reload when page changes

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/exams/${examId}/submissions`, {
                params: {
                    page: page,
                    limit: 10,
                    search: searchTerm,
                },
            });
            const data = res.data.data;
            setSubmissions(data.submissions || []);
            setTotalPages(data.total_pages || 1);
        } catch (error) {
            console.error("Failed to fetch submissions:", error);
            toast.error("Không thể tải danh sách bài nộp.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1); // Reset to page 1
        fetchSubmissions();
    };

    return (
        <div className="container mx-auto py-8 space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard/instructor">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Danh sách bài nộp</h1>
                    <p className="text-muted-foreground">
                        Xem và chấm điểm bài làm của học viên
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Bài nộp</CardTitle>
                            <CardDescription>Danh sách học viên đã hoàn thành bài thi</CardDescription>
                        </div>
                        <form onSubmit={handleSearch} className="flex items-center gap-2">
                            <Input
                                placeholder="Tìm kiếm học viên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-[250px]"
                            />
                            <Button type="submit" size="icon" variant="secondary"><Search className="h-4 w-4" /></Button>
                        </form>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : submissions.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            Chưa có bài nộp nào cho bài thi này.
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Học viên</TableHead>
                                        <TableHead>Điểm số</TableHead>
                                        <TableHead>Trạng thái</TableHead>
                                        <TableHead>Thời gian nộp</TableHead>
                                        <TableHead className="text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {submissions.map((sub) => (
                                        <TableRow key={sub.submission_id}>
                                            <TableCell className="font-medium">
                                                {sub.student_name || `User #${sub.user_id}`}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={sub.score >= 5 ? "default" : "destructive"}>
                                                    {sub.score.toFixed(2)} / 10
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {sub.status === 'completed' ? (
                                                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">Hoàn thành</Badge>
                                                ) : (
                                                    <Badge variant="outline">{sub.status}</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(sub.submitted_at).toLocaleString('vi-VN')}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" asChild>
                                                    <Link href={`/exams/result/${sub.submission_id}`}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Xem chi tiết
                                                    </Link>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1}
                            >
                                Trước
                            </Button>
                            <span className="flex items-center px-4 text-sm font-medium">
                                Trang {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Sau
                            </Button>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
}
