// app/register/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner"; // Dùng toast

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password !== confirmPassword) {
      toast.error("Đăng ký thất bại", {
        description: "Mật khẩu xác nhận không khớp. Vui lòng thử lại.",
      });
      setIsLoading(false);
      return;
    }
    
    if (password.length < 6) {
       toast.error("Đăng ký thất bại", {
        description: "Mật khẩu phải có ít nhất 6 ký tự.",
      });
      setIsLoading(false);
      return;
    }

    try {
      await api.post("/register", {
        full_name: fullName,
        email,
        password,
      });

      toast.success("Đăng ký thành công!", {
        description: "Chào mừng bạn! Giờ hãy đăng nhập để bắt đầu.",
      });

      router.push("/login");

    } catch (err: any) {
      console.error("Lỗi đăng ký:", err);
      const errorMessage = err.response?.data?.error || "Đã xảy ra lỗi. Vui lòng thử lại.";
      
      toast.error("Đăng ký thất bại", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center p-8">
            <CardTitle className="text-4xl font-extrabold text-primary">
              Tạo Tài Khoản
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              Chỉ mất vài giây để bắt đầu hành trình của bạn.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 px-8 mb-4">
            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-lg font-medium">
                Họ và Tên
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Trần Đức An"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="h-12 text-lg" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg font-medium">
                Địa chỉ Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="antd63@gmail.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-12 text-lg" 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-lg font-medium">
                Mật khẩu
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-lg"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-lg font-medium">
                Xác nhận Mật khẩu
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12 text-lg"
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 px-8 pb-8">
            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isLoading}>
              {isLoading ? "Đang tạo tài khoản..." : "Đăng Ký"}
            </Button>
            <div className="text-center text-muted-foreground text-base">
              Đã có tài khoản?{" "}
              <Link
                href="/login"
                className="font-semibold text-primary hover:underline"
              >
                Đăng nhập ngay
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}