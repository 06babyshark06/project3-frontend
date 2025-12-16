"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  ArrowLeft, Users, UserPlus, Trash2, Mail, Loader2, 
  FileText, Clock, BookOpen 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";

// Import Component thêm bài thi mới tạo
import { AddExamToClassDialog } from "@/components/AddExamToClassDialog";

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id;

  const [classData, setClassData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]); // State cho danh sách bài thi
  const [loading, setLoading] = useState(true);
  
  // Add Member State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [emailsInput, setEmailsInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      // 1. Lấy thông tin lớp và thành viên
      const resClass = await api.get(`/classes/${classId}`);
      setClassData(resClass.data.data.class);
      setMembers(resClass.data.data.members || []);

      // 2. Lấy danh sách bài thi của lớp
      const resExams = await api.get(`/classes/${classId}/exams`);
      setExams(resExams.data.data || []);

    } catch (error) {
      console.error(error);
      toast.error("Không tìm thấy thông tin lớp học");
      // router.push("/admin/classes"); // Có thể bật lại nếu muốn redirect khi lỗi
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) fetchData();
  }, [classId]);

  const handleAddMembers = async () => {
    if (!emailsInput.trim()) return;
    
    const emails = emailsInput.split(/[\n,]+/).map(e => e.trim()).filter(e => e);
    
    setIsAdding(true);
    try {
        const res = await api.post("/classes/members", {
            class_id: Number(classId),
            emails: emails
        });
        
        const { success_count, failed_emails } = res.data.data;
        
        if (success_count > 0) toast.success(`Đã thêm ${success_count} học sinh thành công!`);
        if (failed_emails && failed_emails.length > 0) {
            toast.warning(`Không tìm thấy ${failed_emails.length} email: ${failed_emails.join(", ")}`);
        }
        
        setEmailsInput("");
        setIsAddMemberOpen(false);
        fetchData(); 
    } catch (error) {
        toast.error("Thêm thành viên thất bại");
    } finally {
        setIsAdding(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
      if(!confirm("Xóa học sinh này khỏi lớp?")) return;
      try {
          await api.delete(`/classes/members`, { params: { class_id: classId, user_id: userId } });
          toast.success("Đã xóa thành viên");
          setMembers(prev => prev.filter(m => m.user_id !== userId));
      } catch (error) {
          toast.error("Xóa thất bại");
      }
  };

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!classData) return null;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      <Button variant="ghost" className="mb-4 pl-0 hover:pl-2 transition-all" onClick={() => router.back()}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh sách
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT: INFO CARD */}
        <Card className="h-fit">
            <CardHeader>
                <CardTitle>Thông tin lớp học</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label className="text-muted-foreground text-xs uppercase">Tên lớp</Label>
                    <p className="font-semibold text-xl">{classData.name}</p>
                </div>
                <div>
                    <Label className="text-muted-foreground text-xs uppercase">Mã lớp</Label>
                    <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-base px-3 py-1 font-mono tracking-widest">{classData.code}</Badge>
                    </div>
                </div>
                <div>
                    <Label className="text-muted-foreground text-xs uppercase">Sĩ số</Label>
                    <p className="text-lg font-medium flex items-center gap-2 mt-1">
                        <Users className="h-5 w-5 text-primary" /> {members.length} học sinh
                    </p>
                </div>
                <div>
                    <Label className="text-muted-foreground text-xs uppercase">Mô tả</Label>
                    <p className="text-sm mt-1 text-muted-foreground">{classData.description || "Chưa có mô tả."}</p>
                </div>
                <div className="pt-4 border-t">
                    <Button className="w-full" onClick={() => setIsAddMemberOpen(true)}>
                        <UserPlus className="mr-2 h-4 w-4" /> Thêm học sinh
                    </Button>
                </div>
            </CardContent>
        </Card>

        {/* RIGHT: TABS CONTENT */}
        <div className="lg:col-span-2">
            <Tabs defaultValue="exams" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                    <TabsTrigger value="exams">Bài thi & Kiểm tra</TabsTrigger>
                    <TabsTrigger value="students">Danh sách học viên</TabsTrigger>
                </TabsList>

                {/* TAB 1: BÀI THI */}
                <TabsContent value="exams" className="space-y-4">
                    <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
                        <div>
                            <h3 className="font-semibold">Bài tập đã giao</h3>
                            <p className="text-sm text-muted-foreground">Quản lý các bài thi của lớp</p>
                        </div>
                        {/* Nút thêm bài thi */}
                        <AddExamToClassDialog 
                            classId={classId as string} 
                            onSuccess={fetchData} 
                        />
                    </div>

                    <div className="grid gap-4">
                        {exams.length === 0 ? (
                            <div className="py-12 text-center border-2 border-dashed rounded-lg bg-muted/10">
                                <BookOpen className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                                <h3 className="font-medium text-muted-foreground">Chưa có bài thi nào</h3>
                            </div>
                        ) : (
                            exams.map((exam) => (
                                <Card key={exam.id} className="hover:border-primary/50 transition-colors">
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <CardTitle className="text-lg line-clamp-1">{exam.title}</CardTitle>
                                                <CardDescription className="line-clamp-1">{exam.description || "Không có mô tả"}</CardDescription>
                                            </div>
                                            <Badge variant={exam.is_published ? "default" : "secondary"}>
                                                {exam.is_published ? "Đã mở" : "Đóng"}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1">
                                                <Clock className="h-4 w-4" /> {exam.duration_minutes} phút
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <FileText className="h-4 w-4" /> {exam.question_count || 0} câu hỏi
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* TAB 2: HỌC VIÊN (Code cũ của bạn chuyển vào đây) */}
                <TabsContent value="students">
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách thành viên ({members.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Họ và tên</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Ngày tham gia</TableHead>
                                        <TableHead className="text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.length === 0 ? (
                                        <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Lớp chưa có học sinh nào.</TableCell></TableRow>
                                    ) : (
                                        members.map((m) => (
                                            <TableRow key={m.user_id}>
                                                <TableCell className="font-medium">{m.full_name}</TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Mail className="h-3 w-3" /> {m.email}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs text-muted-foreground">
                                                    {new Date(m.joined_at).toLocaleDateString('vi-VN')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleRemoveMember(m.user_id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
      </div>

      {/* DIALOG ADD MEMBER (Giữ nguyên) */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Thêm học sinh vào lớp</DialogTitle>
                <DialogDescription>Nhập email của học sinh (ngăn cách bằng dấu phẩy hoặc xuống dòng).</DialogDescription>
            </DialogHeader>
            <div className="py-4">
                <Textarea 
                    placeholder="vidu1@gmail.com, vidu2@gmail.com..." 
                    className="min-h-[150px]"
                    value={emailsInput}
                    onChange={(e) => setEmailsInput(e.target.value)}
                />
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddMemberOpen(false)}>Hủy</Button>
                <Button onClick={handleAddMembers} disabled={isAdding}>
                    {isAdding ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <UserPlus className="mr-2 h-4 w-4" />}
                    Thêm ngay
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}