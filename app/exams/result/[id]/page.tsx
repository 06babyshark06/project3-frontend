"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Loader2, CheckCircle, XCircle, Trophy, ArrowRight,
  RefreshCcw, Calendar, Check, X, AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

// --- Interfaces ---
interface ChoiceReview {
  id: number;
  content: string;
  is_correct: boolean;
  user_selected: boolean;
  attachment_url?: string;
}

interface SubmissionDetail {
  question_id: number;
  question_content: string;
  explanation: string;
  question_type: string;
  is_correct: boolean;
  choices: ChoiceReview[];
  attachment_url?: string;
}

interface SubmissionResult {
  id: number;
  exam_title: string;
  score: number;
  correct_count: number;
  total_questions: number;
  status: string;
  submitted_at: string;
  details: SubmissionDetail[];
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
        setIsLoading(true);
        const response = await api.get(`/submissions/${submissionId}`);
        const data = response.data.data;

        // Log dữ liệu để kiểm tra nếu vẫn bị lỗi
        console.log("Submission Data:", data);

        setResult(data);

        // Hiệu ứng pháo hoa nếu điểm cao
        if ((data.score ?? 0) >= 8.0) {
          triggerConfetti();
        }
      } catch (error) {
        console.error("Lỗi tải kết quả:", error);
        toast.error("Không tìm thấy kết quả bài thi.");
        // router.push("/dashboard"); // Tạm thời comment để debug
      } finally {
        setIsLoading(false);
      }
    };

    if (submissionId) fetchResult();
  }, [submissionId, router]);

  const triggerConfetti = () => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function () {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);
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

  // Sử dụng toán tử '??' để fallback về 0 nếu dữ liệu bị null/undefined
  const score = result.score ?? 0;
  const correctCount = result.correct_count ?? 0;
  const totalQuestions = result.total_questions ?? 0;
  const wrongCount = totalQuestions - correctCount;
  const isPass = score >= 5.0;
  const submittedDate = result.submitted_at ? new Date(result.submitted_at).toLocaleString('vi-VN') : "N/A";

  const MediaContent = ({ url }: { url?: string }) => {
    if (!url) return null;
    const isVideo = url.match(/\.(mp4|webm|mov)$/i);
    return (
      <div className="my-2">
        {isVideo ? (
          <video src={url} controls className="max-h-[200px] rounded-lg border bg-black" />
        ) : (
          <img src={url} alt="Media" className="max-h-[200px] rounded-lg border object-contain bg-muted" />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full bg-muted/30 py-8 px-4 flex flex-col items-center">

      {/* === 1. CARD TỔNG KẾT === */}
      <Card className={`w-full max-w-2xl shadow-xl border-t-8 ${isPass ? "border-t-green-500" : "border-t-red-500"} mb-8`}>
        <CardHeader className="text-center pb-2">
          <div className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full ${isPass ? "bg-green-100" : "bg-red-100"}`}>
            {isPass ? (
              <Trophy className="h-12 w-12 text-green-600 drop-shadow-sm" />
            ) : (
              <XCircle className="h-12 w-12 text-red-600 drop-shadow-sm" />
            )}
          </div>
          <CardTitle className={`text-4xl font-black tracking-tight ${isPass ? "text-green-700" : "text-red-700"}`}>
            {isPass ? "XIN CHÚC MỪNG!" : "CỐ GẮNG LẦN SAU NHÉ!"}
          </CardTitle>
          <p className="text-muted-foreground text-xl mt-2 font-medium">
            {result.exam_title || "Bài thi không tên"}
          </p>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {/* Điểm Số Lớn */}
          <div className="flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Tổng Điểm</span>
            <div className="flex items-baseline">
              <span className="text-7xl font-black text-foreground tracking-tighter">
                {score}
              </span>
              <span className="text-3xl text-muted-foreground font-medium">/10</span>
            </div>
          </div>

          {/* Thống kê chi tiết */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center p-5 bg-green-50/50 border border-green-100 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-bold text-green-700 uppercase">Câu Đúng</span>
              </div>
              <span className="text-3xl font-bold text-foreground">
                {correctCount}
              </span>
            </div>

            <div className="flex flex-col items-center p-5 bg-red-50/50 border border-red-100 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-sm font-bold text-red-700 uppercase">Câu Sai</span>
              </div>
              <span className="text-3xl font-bold text-foreground">
                {wrongCount >= 0 ? wrongCount : 0}
              </span>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Nộp bài lúc: {submittedDate}</span>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-col gap-3 pt-2 pb-8 px-8">
          <Button variant="outline" className="w-full h-12 text-base" asChild>
            <Link href="/exams">
              <RefreshCcw className="mr-2 h-4 w-4" /> Danh sách bài thi
            </Link>
          </Button>
          <Button className="w-full h-12 text-base font-bold shadow-md" asChild>
            <Link href="/dashboard">
              Về Dashboard <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </CardFooter>
      </Card>

      {/* === 2. CHI TIẾT CÂU TRẢ LỜI === */}
      {result.details && result.details.length > 0 && (
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">Xem lại bài làm</h2>
            <Badge variant="outline" className="text-sm">{result.details.length} câu hỏi</Badge>
          </div>

          {result.details.map((item, idx) => (
            <Card key={item.question_id || idx} className={`overflow-hidden border-l-4 ${item.is_correct ? "border-l-green-500" : "border-l-red-500"}`}>
              <CardHeader className="pb-3 bg-muted/5">
                <div className="flex items-start gap-4">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${item.is_correct ? "bg-green-600" : "bg-red-600"}`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <h3 className="text-lg font-medium leading-relaxed">{item.question_content}</h3>
                    <MediaContent url={item.attachment_url} />
                  </div>
                  {item.is_correct ? (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 shrink-0"><Check className="w-3 h-3 mr-1" /> Đúng</Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200 shrink-0"><X className="w-3 h-3 mr-1" /> Sai</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {/* Danh sách đáp án */}
                <div className="space-y-2">
                  {item.choices?.map((choice) => {
                    let styleClass = "border bg-background/50";
                    let icon = <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />; // Icon mặc định (chưa chọn)

                    // Logic tô màu
                    if (choice.is_correct) {
                      // Đáp án đúng của đề -> Luôn hiện Xanh
                      styleClass = "border-green-500 bg-green-50/40 text-green-900";
                      icon = <CheckCircle className="w-5 h-5 text-green-600 fill-green-100" />;
                    }

                    if (choice.user_selected) {
                      if (choice.is_correct) {
                        // User chọn đúng -> Xanh đậm hơn
                        styleClass = "border-green-600 bg-green-100 text-green-900 font-medium ring-1 ring-green-600";
                        icon = <CheckCircle className="w-5 h-5 text-green-700 fill-green-200" />;
                      } else {
                        // User chọn sai -> Đỏ
                        styleClass = "border-red-500 bg-red-50 text-red-900 ring-1 ring-red-500";
                        icon = <XCircle className="w-5 h-5 text-red-600 fill-red-100" />;
                      }
                    }

                    return (
                      <div key={choice.id} className={`p-3 rounded-lg text-sm flex items-center gap-3 transition-colors ${styleClass}`}>
                        <div className="shrink-0">{icon}</div>
                        <div className="flex-1">
                          <span>{choice.content}</span>
                          <MediaContent url={choice.attachment_url} />
                        </div>
                        {choice.user_selected && <span className="text-[10px] font-bold uppercase tracking-wider bg-black/5 px-2 py-0.5 rounded">Bạn chọn</span>}
                      </div>
                    )
                  })}
                </div>

                {/* Giải thích */}
                {item.explanation && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-blue-900 flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-700 block mb-1">Giải thích:</span>
                      <p className="text-sm leading-relaxed opacity-90">{item.explanation}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}