"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
    Users, Search, Plus, MoreHorizontal,
    Trash2, Edit, ExternalLink, Loader2, ArrowLeft
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function ManageAllClassesPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // State xoa
    const [classToDelete, setClassToDelete] = useState<any | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            // Admin fetch all classes
            // API backend can xu ly logic Admin de tra ve toan bo
            const res = await api.get("/classes?limit=100");
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

    const handleDelete = async () => {
        if (!classToDelete) return;
        setIsDeleting(true);
        try {
            await api.delete(`/classes/${classToDelete.id}`);
            toast.success("Đã xóa lớp học");
            fetchClasses();
        } catch (error) {
            toast.error("Xóa thất bại");
        } finally {
            setIsDeleting(false);
            setClassToDelete(null);
        }
    };

    return (
        <div className="container mx-auto max-w-6xl p-6">
            <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 border-b pb-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Quản Lý Tất Cả Lớp Học</h1>
                    <p className="text-sm text-muted-foreground">Kiểm soát toàn bộ lớp học trên hệ thống.</p>
                </div>
                {/* Admin co the tao lop hoac khong, hien tai de button o day */}
                {/* <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tạo lớp mới
        </Button> */}
            </div>

            <Card>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex justify-center py-10"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
                    ) : classes.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <p>Không tìm thấy lớp học nào.</p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="w-[50px]">ID</TableHead>
                                        <TableHead>Tên lớp</TableHead>
                                        <TableHead>Mã lớp</TableHead>
                                        <TableHead>Giảng viên</TableHead>
                                        <TableHead>Học sinh</TableHead>
                                        <TableHead className="text-right">Hành động</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {classes.map((cls) => (
                                        <TableRow key={cls.id}>
                                            <TableCell>{cls.id}</TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{cls.name}</span>
                                                    <span className="text-xs text-muted-foreground line-clamp-1">{cls.description}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell><Badge variant="outline" className="font-mono">{cls.code}</Badge></TableCell>
                                            <TableCell>
                                                <span className="text-sm font-medium">{cls.teacher_name || cls.teacherName || "Unknown"}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-3 w-3 text-muted-foreground" />
                                                    <span>{cls.student_count || 0}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/admin/classes/${cls.id}`}><Edit className="mr-2 h-4 w-4" /> Xem chi tiết</Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive cursor-pointer" onClick={() => setClassToDelete(cls)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Xóa lớp
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Alert Dialog Xóa */}
            <AlertDialog open={!!classToDelete} onOpenChange={(open) => !open && setClassToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xóa lớp học này?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn đang chuẩn bị xóa lớp <b>"{classToDelete?.name}"</b>.<br />
                            Hành động này sẽ xóa vĩnh viễn lớp học và loại bỏ tất cả thành viên khỏi lớp.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => { e.preventDefault(); handleDelete(); }}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Xóa Vĩnh Viễn
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
