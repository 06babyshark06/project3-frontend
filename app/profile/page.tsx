// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, User, Lock, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { user, login } = useAuth(); // Lấy user từ context
  const [isLoading, setIsLoading] = useState(false);

  // State cho Form thông tin
  const [fullName, setFullName] = useState("");

  // State cho Form mật khẩu
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Load dữ liệu ban đầu
  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
    }
  }, [user]);

  // 1. Xử lý cập nhật thông tin
  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Gọi API PUT /users/me
      const response = await api.put("/users/me", {
        full_name: fullName,
      });

      // API trả về user mới, cập nhật lại Context
      // (Lưu ý: Bạn cần đảm bảo hàm login của AuthContext hỗ trợ cập nhật user mà không cần đổi token)
      // Hoặc đơn giản là reload lại trang để AuthContext tự fetch lại
      toast.success("Cập nhật thông tin thành công!");
      
      // Cách đơn giản nhất để đồng bộ: Reload lại trang (hoặc gọi api /users/me trong context)
      window.location.reload(); 

    } catch (error: any) {
      toast.error("Cập nhật thất bại", {
        description: error.response?.data?.error || "Đã xảy ra lỗi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Xử lý đổi mật khẩu
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }

    setIsLoading(true);
    try {
      // Gọi API PUT /users/password
      await api.put("/users/password", {
        old_password: oldPassword,
        new_password: newPassword,
      });

      toast.success("Đổi mật khẩu thành công!");
      
      // Reset form
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || "Đổi mật khẩu thất bại.";
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="container mx-auto max-w-4xl p-6 md:p-10">
      <h1 className="text-3xl font-bold mb-8">Cài đặt tài khoản</h1>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="general">Thông tin chung</TabsTrigger>
          <TabsTrigger value="security">Bảo mật & Mật khẩu</TabsTrigger>
        </TabsList>

        {/* TAB 1: THÔNG TIN CHUNG */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Cập nhật thông tin hiển thị của bạn trên hệ thống.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateInfo}>
              <CardContent className="space-y-6">
                {/* Avatar (Demo) */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                      {user.full_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ảnh đại diện</p>
                    <Button variant="outline" size="sm" className="mt-2" type="button" disabled>
                      Tải ảnh lên (Coming soon)
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Họ và Tên</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        className="pl-9"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" value={user.email} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground">Email không thể thay đổi.</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Vai trò</Label>
                    <div className="flex">
                      <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80 uppercase mb-4">
                        {user.role}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lưu thay đổi
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        {/* TAB 2: BẢO MẬT */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>
                Để bảo mật tài khoản, hãy sử dụng mật khẩu mạnh và không chia sẻ cho người khác.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleChangePassword}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="oldPassword">Mật khẩu hiện tại</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="oldPassword"
                      type="password"
                      className="pl-9"
                      required
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>

                <div className="space-y-2 mb-4">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu mới</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Đổi mật khẩu
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}