"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Import router
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Loader2, MoreHorizontal, Trash2, UserCog, Shield,
  GraduationCap, User as UserIcon, ArrowLeft, Search, Filter
} from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent, DropdownMenuRadioGroup, DropdownMenuRadioItem
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input"; // Thêm Input
import { Card, CardContent } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"; // Thêm Select
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  id: number;
  full_name: string;
  email: string;
  role: string;
}

export default function UserManagementPage() {
  const router = useRouter(); // Hook điều hướng
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  // Search & Filter state (UI only for now)
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  // Dialog state
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchUsers = async (pageNumber = 1) => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams({
        page: pageNumber.toString(),
        limit: "10",
        search: searchQuery,
        role: roleFilter === "all" ? "" : roleFilter,
      });

      const response = await api.get(`/users?${queryParams.toString()}`);
      const data = response.data.data;

      setUsers(data.users || []);
      setTotalPages(data.total_pages || 1);
      setTotalUsers(data.total || 0);
      setPage(data.page || 1);
    } catch (error) {
      toast.error("Không thể tải danh sách người dùng.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchUsers(1); }, [roleFilter]);

  // 2. Xử lý Xóa
  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success("Đã xóa người dùng thành công.");

      if (users.length === 1 && page > 1) {
        fetchUsers(page - 1);
      } else {
        fetchUsers(page);
      }
    } catch (error) {
      toast.error("Xóa thất bại. Có thể do lỗi server.");
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  // 3. Xử lý Đổi Role
  const handleChangeRole = async (userId: number, newRole: string) => {
    const oldUsers = [...users];
    setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));

    try {
      await api.put(`/users/${userId}/role`, { role: newRole });
      toast.success(`Đã cập nhật vai trò thành công!`);
    } catch (error: any) {
      setUsers(oldUsers);
      toast.error("Cập nhật vai trò thất bại.");
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin": return <Badge variant="destructive" className="gap-1 px-2.5"><Shield className="w-3 h-3" /> Admin</Badge>;
      case "instructor": return <Badge className="bg-blue-600 hover:bg-blue-700 gap-1 px-2.5"><GraduationCap className="w-3 h-3" /> Giảng viên</Badge>;
      default: return <Badge variant="secondary" className="gap-1 px-2.5"><UserIcon className="w-3 h-3" /> Học viên</Badge>;
    }
  };

  return (
    <div className="container mx-auto max-w-7xl p-6">

      {/* === 1. TOP BAR ĐIỀU HƯỚNG === */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Quản Lý Người Dùng</h1>
            <p className="text-sm text-muted-foreground">Tổng số: {totalUsers} tài khoản trong hệ thống.</p>
          </div>
        </div>
        {/* (Có thể thêm nút "Tạo User" ở đây nếu cần) */}
      </div>

      {/* === 2. TOOLBAR (TÌM KIẾM & LỌC) === */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm theo tên hoặc email..."
            className="pl-9 bg-background"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchUsers(1)}
          // (Logic search client hoặc server sẽ được gắn vào đây sau)
          />
        </div>
        <div className="w-full sm:w-[200px]">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger>
              <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Lọc theo vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="student">Học viên</SelectItem>
              <SelectItem value="instructor">Giảng viên</SelectItem>
              <SelectItem value="admin">Quản trị viên</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* === 3. BẢNG DỮ LIỆU === */}
      <Card className="shadow-sm border">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[80px] pl-6">Avatar</TableHead>
                      <TableHead className="min-w-[180px]">Họ và Tên</TableHead>
                      <TableHead className="min-w-[200px]">Email</TableHead>
                      <TableHead>Vai trò</TableHead>
                      <TableHead className="text-right pr-6">Hành động</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                          Không tìm thấy người dùng nào.
                        </TableCell>
                      </TableRow>
                    ) : (
                      users.map((user) => (
                        <TableRow key={user.id} className="hover:bg-muted/5 transition-colors">
                          <TableCell className="pl-6">
                            <Avatar className="h-10 w-10 border bg-white">
                              <AvatarFallback className="bg-primary/5 text-primary font-bold">
                                {user.full_name?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{user.full_name}</div>
                            <div className="text-xs text-muted-foreground md:hidden">{user.email}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground hidden md:table-cell">{user.email}</TableCell>
                          <TableCell>{getRoleBadge(user.role)}</TableCell>
                          <TableCell className="text-right pr-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-muted">
                                  <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel className="font-normal">
                                  <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium leading-none">{user.full_name}</p>
                                    <p className="text-xs leading-none text-muted-foreground truncate">{user.email}</p>
                                  </div>
                                </DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => {
                                  navigator.clipboard.writeText(user.email);
                                  toast.success("Đã sao chép email");
                                }}>
                                  Sao chép Email
                                </DropdownMenuItem>

                                <DropdownMenuSub>
                                  <DropdownMenuSubTrigger>
                                    <UserCog className="mr-2 h-4 w-4" />
                                    <span>Đổi vai trò</span>
                                  </DropdownMenuSubTrigger>
                                  <DropdownMenuSubContent>
                                    <DropdownMenuRadioGroup value={user.role} onValueChange={(val) => handleChangeRole(user.id, val)}>
                                      <DropdownMenuRadioItem value="student">Học viên</DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="instructor">Giảng viên</DropdownMenuRadioItem>
                                      <DropdownMenuRadioItem value="admin">Quản trị viên</DropdownMenuRadioItem>
                                    </DropdownMenuRadioGroup>
                                  </DropdownMenuSubContent>
                                </DropdownMenuSub>

                                <DropdownMenuItem
                                  onClick={() => setUserToDelete(user)}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10 mt-1"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Xóa tài khoản
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 border-t">
                <div className="text-sm text-muted-foreground">
                  Trang {page} trên {totalPages}
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => fetchUsers(page - 1)} disabled={page <= 1}>Trước</Button>
                  <Button variant="outline" size="sm" onClick={() => fetchUsers(page + 1)} disabled={page >= totalPages}>Sau</Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Alert Dialog Xóa User */}
      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-destructive">Xóa người dùng?</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Bạn đang chuẩn bị xóa tài khoản <b>{userToDelete?.email}</b>.<br />
              Hành động này sẽ xóa toàn bộ dữ liệu liên quan (kết quả thi, khóa học) và <b>không thể hoàn tác</b>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} className="h-10">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDeleteUser(); }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10"
            >
              {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Xóa Vĩnh Viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}