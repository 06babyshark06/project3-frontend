"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InfoIcon, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center p-8">
          <div className="w-16 h-16 mx-auto bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-full flex items-center justify-center mb-6">
            <InfoIcon className="h-8 w-8" />
          </div>
          <CardTitle className="text-4xl font-extrabold text-primary">
            Quên Mật Khẩu?
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground pt-2">
            Thông tin khôi phục tài khoản học tập của bạn.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 px-8 text-center">
          <p className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
            Để đảm bảo bảo mật và bảo vệ dữ liệu học tập cá nhân, JQK Study không hỗ trợ tự đặt lại mật khẩu qua email công cộng.
          </p>
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-950/30 rounded-xl text-left">
            <p className="font-semibold text-rose-800 dark:text-rose-300 mb-1">Hướng dẫn khôi phục:</p>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Vui lòng liên hệ trực tiếp với **Quản trị viên (Admin)** hoặc bộ phận đào tạo của trung tâm qua kênh liên lạc chính thức để được xác minh danh tính và hỗ trợ cấp lại mật khẩu mới.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 px-8 pb-8">
          <Button asChild className="w-full h-12 text-lg font-bold">
            <Link href="/login" className="flex items-center justify-center gap-2">
              <ArrowLeft className="h-5 w-5" /> Quay lại Đăng nhập
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
