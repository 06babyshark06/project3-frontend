"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Users, Search, Plus, MoreHorizontal, 
  Trash2, Edit, ExternalLink, Loader2 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { AddClassDialog } from "@/components/AddClassDialog";

export default function ClassListPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/classes"); // API này đã tạo ở Backend
      setClasses(res.data.data.classes || []);
    } catch (error) {
      toast.error("Lỗi tải danh sách lớp");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa lớp này? Mọi dữ liệu thành viên sẽ bị mất.")) return;
    try {
        await api.delete(`/classes/${id}`);
        toast.success("Đã xóa lớp học");
        fetchClasses();
    } catch (error) {
        toast.error("Xóa thất bại");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Quản lý Lớp học</h1>
          <p className="text-muted-foreground mt-1">Tổ chức học sinh theo nhóm để dễ dàng giao bài tập và thi cử.</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tạo lớp mới
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>
      ) : classes.length === 0 ? (
        <div className="text-center py-16 border rounded-lg bg-muted/10">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium">Chưa có lớp học nào</h3>
            <p className="text-muted-foreground mb-4">Hãy tạo lớp đầu tiên để bắt đầu quản lý học sinh.</p>
            <Button variant="outline" onClick={() => setIsAddOpen(true)}>Tạo ngay</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <Card key={cls.id} className="hover:shadow-md transition-shadow group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            <Link href={`/admin/classes/${cls.id}`}>{cls.name}</Link>
                        </CardTitle>
                        <Badge variant="secondary" className="mt-2 font-mono text-xs">{cls.code}</Badge>
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4"/></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                                <Link href={`/admin/classes/${cls.id}`}><Edit className="mr-2 h-4 w-4"/> Chi tiết</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(cls.id)}>
                                <Trash2 className="mr-2 h-4 w-4"/> Xóa lớp
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-3">
                <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
                    {cls.description || "Không có mô tả."}
                </p>
              </CardContent>
              <CardFooter className="pt-3 border-t bg-muted/5 flex justify-between items-center text-sm">
                <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-1.5" />
                    <span className="font-medium text-foreground">{cls.student_count || 0}</span>
                    <span className="ml-1">học sinh</span>
                </div>
                <Button variant="ghost" size="sm" asChild className="text-primary hover:text-primary/80 px-0">
                    <Link href={`/admin/classes/${cls.id}`}>
                        Quản lý <ExternalLink className="ml-1 h-3 w-3" />
                    </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <AddClassDialog open={isAddOpen} onOpenChange={setIsAddOpen} onSuccess={fetchClasses} />
    </div>
  );
}