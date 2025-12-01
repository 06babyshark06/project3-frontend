// app/login/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post("/login", {
        email,
        password,
      });

      const { access_token, user } = response.data;
      console.log(response.data);

      login(access_token, user);

      toast.success("Đăng nhập thành công!", {
        description: `Chào mừng trở lại, ${user?.full_name || "bạn"}!`,
      });

      if (user.role === 'admin') {
        router.push("/admin/dashboard");
      } else if (user.role === 'instructor') {
        router.push("/dashboard/instructor");
      } else {
        router.push("/dashboard");
      }

    } catch (err: any) {
      console.error("Lỗi đăng nhập:", err);
      const errorMessage = err.response?.data?.error || "Email hoặc mật khẩu không đúng. Vui lòng thử lại.";
      toast.error("Đăng nhập thất bại", {
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
              Chào Mừng Trở Lại!
            </CardTitle>
            <CardDescription className="text-lg text-muted-foreground pt-2">
              Đăng nhập để tiếp tục hành trình học tập của bạn.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 px-8">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-lg font-medium">
                Địa chỉ Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
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
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 text-lg"
              />

              <div className="flex justify-end mb-2">
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-primary hover:text-primary hover:underline transition-colors"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-4 px-8 pb-8">
            <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={isLoading}>
              {isLoading ? "Đang xử lý..." : "Đăng Nhập"}
            </Button>
            <div className="text-center text-muted-foreground text-base">
              Chưa có tài khoản?{" "}
              <Link
                href="/register"
                className="font-semibold text-primary hover:underline"
              >
                Đăng ký ngay
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}