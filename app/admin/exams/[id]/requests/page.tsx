"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Check, X, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

export default function ExamRequestsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id;

  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Hàm tải danh sách
  const fetchRequests = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/exams/${examId}/access-requests`);
      setRequests(res.data.data.requests || []);
    } catch (error) {
      toast.error("Lỗi tải danh sách yêu cầu");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [examId]);

  // Hàm xử lý duyệt/từ chối
  const handleApprove = async (studentId: number, isApproved: boolean) => {
    try {
      await api.put("/exams/access/approve", {
        exam_id: Number(examId),
        student_id: studentId,
        is_approved: isApproved
      });
      toast.success(isApproved ? "Đã duyệt yêu cầu" : "Đã từ chối yêu cầu");
      fetchRequests(); // Reload lại danh sách
    } catch (error) {
      toast.error("Thao tác thất bại");
    }
  };

  return (
    <div className="container mx-auto py-8 max-w-5xl">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
            <h1 className="text-2xl font-bold">Duyệt tham gia thi</h1>
            <p className="text-muted-foreground">Quản lý các yêu cầu truy cập cho bài thi #{examId}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Danh sách yêu cầu ({requests.filter(r => r.status === 'pending').length} chờ duyệt)</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Học sinh (ID)</TableHead>
                        <TableHead>Thời gian gửi</TableHead>
                        <TableHead>Trạng thái</TableHead>
                        <TableHead className="text-right">Hành động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="animate-spin h-6 w-6 mx-auto"/></TableCell></TableRow>
                    ) : requests.length === 0 ? (
                        <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">Chưa có yêu cầu nào.</TableCell></TableRow>
                    ) : (
                        requests.map((req) => (
                            <TableRow key={req.id}>
                                <TableCell className="font-medium">
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                        </div>
                                        <span>User #{req.user_id}</span>
                                    </div>
                                </TableCell>
                                <TableCell>{new Date(req.created_at).toLocaleString('vi-VN')}</TableCell>
                                <TableCell>
                                    <Badge variant={req.status === 'approved' ? 'default' : req.status === 'rejected' ? 'destructive' : 'secondary'}>
                                        {req.status === 'approved' ? 'Đã duyệt' : req.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    {req.status === 'pending' && (
                                        <div className="flex justify-end gap-2">
                                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleApprove(req.user_id, false)}>
                                                <X className="h-4 w-4 mr-1" /> Từ chối
                                            </Button>
                                            <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApprove(req.user_id, true)}>
                                                <Check className="h-4 w-4 mr-1" /> Duyệt
                                            </Button>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}