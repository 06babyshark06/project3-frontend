"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { format } from "date-fns";
import {
  Loader2, ArrowLeft, AlertTriangle, ShieldAlert,
  RefreshCcw, UserX, Clock, Eye
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Violation {
  id: number;
  user_id: number;
  violation_type: string;
  violation_time: string;
}

interface StudentStatus {
  user_id: number;
  violation_count: number;
  last_violation: string | null;
  status: "safe" | "warning" | "danger";
  details: Violation[];
}

export default function ExamMonitorPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params.id as string;

  const [violations, setViolations] = useState<Violation[]>([]);
  const [studentMap, setStudentMap] = useState<Record<number, StudentStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchViolations = async () => {
    try {
      const res = await api.get(`/exams/${examId}/violations`);
      const data = res.data.data || [];
      setViolations(data);
      processData(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Lỗi tải log vi phạm:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý dữ liệu: Gom nhóm theo sinh viên
  const processData = (data: Violation[]) => {
    const map: Record<number, StudentStatus> = {};

    data.forEach((v) => {
      if (!map[v.user_id]) {
        map[v.user_id] = {
          user_id: v.user_id,
          violation_count: 0,
          last_violation: null,
          status: "safe",
          details: []
        };
      }
      
      const student = map[v.user_id];
      student.violation_count++;
      student.details.push(v);
      // Sắp xếp lấy vi phạm mới nhất
      if (!student.last_violation || new Date(v.violation_time) > new Date(student.last_violation)) {
        student.last_violation = v.violation_time;
      }

      // Đánh giá mức độ
      if (student.violation_count >= 5) student.status = "danger";
      else if (student.violation_count >= 2) student.status = "warning";
    });

    setStudentMap(map);
  };

  // Auto-refresh mỗi 15 giây
  useEffect(() => {
    if (examId) {
      fetchViolations();
      const interval = setInterval(fetchViolations, 15000);
      return () => clearInterval(interval);
    }
  }, [examId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "danger": return <Badge className="bg-red-600 hover:bg-red-700">Nguy hiểm</Badge>;
      case "warning": return <Badge className="bg-yellow-600 hover:bg-yellow-700">Cảnh báo</Badge>;
      default: return <Badge variant="outline" className="text-green-600 border-green-200">An toàn</Badge>;
    }
  };

  const translateViolation = (type: string) => {
    if (type === "tab_switch") return "Chuyển tab / Rời màn hình";
    if (type === "copy_paste") return "Sao chép / Dán";
    return type;
  };

  return (
    <div className="container mx-auto py-6 px-4 h-[calc(100vh-60px)] flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-red-600" />
              Giám sát phòng thi
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Cập nhật lúc: {format(lastUpdated, "HH:mm:ss")}
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchViolations}>
          <RefreshCcw className="mr-2 h-4 w-4" /> Làm mới ngay
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* CỘT TRÁI: DANH SÁCH SINH VIÊN VI PHẠM */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          <CardHeader className="pb-3 border-b">
            <CardTitle>Danh sách thí sinh có hành vi bất thường</CardTitle>
          </CardHeader>
          <div className="flex-1 overflow-auto bg-muted/5">
            <Table>
              <TableHeader className="bg-background sticky top-0 z-10">
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead className="text-center">Số lần vi phạm</TableHead>
                  <TableHead>Vi phạm gần nhất</TableHead>
                  <TableHead>Mức độ</TableHead>
                  <TableHead className="text-right">Hành động</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center">
                      <div className="flex justify-center"><Loader2 className="animate-spin" /></div>
                    </TableCell>
                  </TableRow>
                ) : Object.keys(studentMap).length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                      Chưa phát hiện vi phạm nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  Object.values(studentMap)
                    .sort((a, b) => b.violation_count - a.violation_count)
                    .map((s) => (
                    <TableRow key={s.user_id} className={s.status === 'danger' ? "bg-red-50/50" : ""}>
                      <TableCell className="font-medium">#{s.user_id}</TableCell>
                      <TableCell className="text-center font-bold text-lg">
                        {s.violation_count}
                      </TableCell>
                      <TableCell>
                        {s.last_violation ? format(new Date(s.last_violation), "HH:mm:ss") : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(s.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4 mr-1" /> Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>

        {/* CỘT PHẢI: LOG REALTIME */}
        <Card className="flex flex-col overflow-hidden bg-zinc-950 text-zinc-50 border-zinc-800">
          <CardHeader className="pb-3 border-b border-zinc-800 bg-zinc-900/50">
            <CardTitle className="text-sm font-mono flex items-center gap-2">
              <Clock className="h-4 w-4 text-green-500" />
              LIVE LOGS
            </CardTitle>
          </CardHeader>
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3 font-mono text-xs">
              {violations.length === 0 ? (
                <p className="text-zinc-500 text-center py-10">Waiting for events...</p>
              ) : (
                [...violations].reverse().map((v) => (
                  <div key={v.id} className="flex gap-2 items-start animate-in fade-in slide-in-from-left-2">
                    <span className="text-zinc-500 min-w-[60px]">
                      {format(new Date(v.violation_time), "HH:mm:ss")}
                    </span>
                    <div>
                      <span className="text-yellow-500 font-bold">User #{v.user_id}</span>
                      <span className="text-zinc-300"> đã </span>
                      <span className="text-red-400 font-semibold">
                        {translateViolation(v.violation_type)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}