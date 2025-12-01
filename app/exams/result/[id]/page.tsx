// app/exams/result/[id]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import confetti from "canvas-confetti"; // Nhớ npm install canvas-confetti @types/canvas-confetti
import { Loader2, CheckCircle, XCircle, Trophy, ArrowRight, RefreshCcw, Calendar } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

// Interface khớp với API GetSubmissionResponse
interface SubmissionResult {
  id: number;
  exam_title: string;
  score: number;
  correct_count: number;
  total_questions: number;
  status: string;
  submitted_at: string;
}

export default function ExamResultPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id;

  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        // === GỌI API MỚI ===
        const response = await api.get(`/submissions/${submissionId}`);
        const data = response.data.data;
        setResult(data);

        // Hiệu ứng pháo hoa nếu điểm >= 8
        if (data.score >= 8.0) {
          triggerConfetti();
        }

      } catch (error) {
        console.error("Lỗi tải kết quả:", error);
        toast.error("Không tìm thấy kết quả bài thi.");
        router.push("/dashboard"); // Quay về nếu lỗi
      } finally {
        setIsLoading(false);
      }
    };

    if (submissionId) fetchResult();
  }, [submissionId, router]);

  // Hàm bắn pháo hoa
  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!result) return null;

  // Logic hiển thị
  const isPass = result.score >= 5.0; 
  const percentage = Math.round((result.correct_count / result.total_questions) * 100);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg shadow-2xl border-t-8 border-t-primary">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-secondary shadow-inner">
            {isPass ? (
              <Trophy className="h-12 w-12 text-yellow-500 drop-shadow-sm" />
            ) : (
              <XCircle className="h-12 w-12 text-destructive drop-shadow-sm" />
            )}
          </div>
          <CardTitle className="text-3xl font-extrabold text-foreground">
            {isPass ? "Xin Chúc Mừng!" : "Cố Gắng Lần Sau!"}
          </CardTitle>
          <p className="text-muted-foreground text-lg mt-2 font-medium px-4">
            {result.exam_title}
          </p>
        </CardHeader>

        <CardContent className="space-y-8 pt-4">
          {/* Điểm Số Lớn */}
          <div className="flex justify-center items-baseline gap-1">
            <span className="text-7xl font-black text-primary tracking-tighter">
              {result.score}
            </span>
            <span className="text-2xl text-muted-foreground font-medium">/10</span>
          </div>

          {/* Chi tiết thống kê */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-4 bg-green-500/10 rounded-xl border border-green-500/20">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-bold text-green-700 dark:text-green-400 uppercase">Đúng</span>
              </div>
              <span className="text-3xl font-bold text-foreground">
                {result.correct_count}
              </span>
            </div>
            
            <div className="flex flex-col items-center p-4 bg-red-500/10 rounded-xl border border-red-500/20">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-bold text-red-700 dark:text-red-400 uppercase">Sai</span>
              </div>
              <span className="text-3xl font-bold text-foreground">
                {result.total_questions - result.correct_count}
              </span>
            </div>
          </div>

          <Separator />
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Nộp bài lúc: {new Date(result.submitted_at).toLocaleString('vi-VN')}</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2 pb-8 px-8">
          <Button className="w-full h-12 text-lg font-bold shadow-md hover:shadow-lg transition-all" asChild>
            <Link href="/dashboard">
              Về Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" className="w-full h-11 text-base" asChild>
            <Link href="/exams">
              <RefreshCcw className="mr-2 h-4 w-4" /> Danh sách bài thi
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}