"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  ArrowLeft, Users, UserPlus, Trash2, Mail, Calendar, Loader2 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function ClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.id;

  const [classData, setClassData] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add Member State
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [emailsInput, setEmailsInput] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/classes/${classId}`);
      setClassData(res.data.data.class);
      setMembers(res.data.data.members || []);
    } catch (error) {
      toast.error("Không tìm thấy lớp học");
      router.push("/admin/classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [classId]);

  const handleAddMembers = async () => {
    if (!emailsInput.trim()) return;
    
    // Tách email theo dòng hoặc dấu phẩy
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
        fetchData(); // Reload list
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
      <Button variant="ghost" className="mb-4 pl-0" onClick={() => router.back()}>
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

        {/* RIGHT: MEMBERS LIST */}
        <Card className="lg:col-span-2">
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
      </div>

      {/* DIALOG ADD MEMBER */}
      <Dialog open={isAddMemberOpen} onOpenChange={setIsAddMemberOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Thêm học sinh vào lớp</DialogTitle>
                <DialogDescription>Nhập email của học sinh (ngăn cách bằng dấu phẩy hoặc xuống dòng). Lưu ý: Học sinh phải có tài khoản trên hệ thống.</DialogDescription>
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