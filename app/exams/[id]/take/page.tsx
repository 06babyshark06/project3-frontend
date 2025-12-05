"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Loader2, Clock, CheckCircle, AlertTriangle,
  ChevronLeft, ChevronRight, Circle, CheckCircle2, Square, CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";

// --- Interfaces ---
interface Choice {
  id: number;
  content: string;
}
interface Question {
  id: number;
  content: string;
  question_type: string; // "single_choice" | "multiple_choice"
  choices: Choice[];
}
interface ExamData {
  id: number;
  title: string;
  duration_minutes: number;
  questions: Question[];
}

// --- Helper Format Thời Gian (MM:SS) ---
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

export default function ExamTakingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const examId = params.id as string;

  const [exam, setExam] = useState<ExamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // [CẬP NHẬT STATE]: Lưu mảng ID các đáp án đã chọn
  // Key: QuestionID, Value: Array of ChoiceID
  const [userAnswers, setUserAnswers] = useState<Record<number, number[]>>({});

  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  // 1. Fetch Đề Thi
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await api.get(`/exams/${examId}`);
        const data = response.data.data;

        if (!data.questions) {
          data.questions = [];
        }

        setExam(data);
        setTimeLeft(data.duration_minutes * 60);
      } catch (error) {
        toast.error("Không thể tải đề thi.");
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    fetchExam();
  }, [examId, router]);

  // 2. Logic Timer
  useEffect(() => {
    if (!exam || !exam.questions || exam.questions.length === 0 || isSubmitting) return;

    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, exam, isSubmitting]);

  // 3. [CẬP NHẬT] Xử lý chọn đáp án thông minh
  const handleSelectAnswer = (question: Question, choiceId: number) => {
    setUserAnswers((prev) => {
      const currentSelected = prev[question.id] || [];

      if (question.question_type === "multiple_choice") {
        // Logic Checkbox (Toggle)
        if (currentSelected.includes(choiceId)) {
          // Nếu đã chọn -> Bỏ chọn
          return {
            ...prev,
            [question.id]: currentSelected.filter((id) => id !== choiceId)
          };
        } else {
          // Nếu chưa chọn -> Thêm vào
          return {
            ...prev,
            [question.id]: [...currentSelected, choiceId]
          };
        }
      } else {
        // Logic Radio (Single Choice): Thay thế luôn
        return {
          ...prev,
          [question.id]: [choiceId]
        };
      }
    });
  };

  // 4. [CẬP NHẬT] Xử lý Nộp bài
  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (isSubmitting || !exam) return;
    setIsSubmitting(true);

    // Làm phẳng (Flatten) object userAnswers thành mảng API yêu cầu
    // API mong đợi nhiều dòng cho 1 câu hỏi nếu chọn nhiều đáp án
    const formattedAnswers = Object.entries(userAnswers).flatMap(([qId, cIds]) =>
      cIds.map((cId) => ({
        question_id: Number(qId),
        chosen_choice_id: Number(cId),
      }))
    );

    try {
      const response = await api.post("/exams/submit", {
        exam_id: Number(examId),
        user_id: user?.id,
        answers: formattedAnswers,
      });

      const result = response.data.data;

      if (autoSubmit) {
        toast.warning("Hết giờ! Hệ thống đã tự động nộp bài.");
      } else {
        toast.success("Nộp bài thành công!");
      }

      router.push(`/exams/result/${result.submission_id}`);

    } catch (error) {
      toast.error("Nộp bài thất bại. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  }, [exam, userAnswers, isSubmitting, examId, user, router]);

  useEffect(() => {
    if (!exam || isSubmitting) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        const newCount = violationCount + 1;
        setViolationCount(newCount);

        toast.error(`CẢNH BÁO: Bạn đã rời khỏi màn hình thi! (${newCount}/3)`, {
          description: "Hành vi này đã được ghi lại. Quá 3 lần bài thi sẽ bị hủy."
        });

        try {
          await api.post("/exams/log-violation", {
            exam_id: Number(examId),
            violation_type: "tab_switch",
          });
        } catch (err) {
          console.error("Log violation failed");
        }

        if (newCount >= 3) {
          handleSubmit(true);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", handleContextMenu);
    };
  }, [exam, isSubmitting, violationCount, examId, handleSubmit]);

  // --- Render UI ---
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!exam) return null;

  if (!exam.questions || exam.questions.length === 0) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
        <h1 className="text-2xl font-bold mb-2">{exam.title}</h1>
        <p className="text-muted-foreground mb-6">Bài thi này chưa có câu hỏi nào.</p>
        <Button onClick={() => router.push("/dashboard")}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Quay về Dashboard
        </Button>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  // Tính toán tiến độ dựa trên số câu hỏi ĐÃ CÓ ít nhất 1 đáp án được chọn
  const answeredCount = Object.values(userAnswers).filter(ans => ans.length > 0).length;
  const progress = (answeredCount / exam.questions.length) * 100;

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* HEADER */}
      <header className="h-16 border-b px-6 flex items-center justify-between bg-card z-10 shadow-sm">
        <h1 className="text-xl font-bold truncate max-w-[60%]">{exam.title}</h1>

        <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-md ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-secondary'}`}>
          <Clock className="h-5 w-5" />
          {formatTime(timeLeft)}
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">

        {/* MAIN CONTENT */}
        <main className="flex-1 overflow-y-auto p-6 md:p-12 flex justify-center">
          <div className="w-full max-w-3xl">
            <Card className="border-2 min-h-[400px] flex flex-col shadow-sm">
              <CardHeader className="bg-muted/20 border-b pb-6">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                    Câu hỏi {currentQuestionIndex + 1} / {exam.questions.length}
                  </span>
                  {currentQuestion.question_type === 'multiple_choice' && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                      Nhiều đáp án
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-2xl font-medium leading-relaxed">
                  {currentQuestion.content}
                </CardTitle>
              </CardHeader>

              <CardContent className="pt-8 flex-1">
                {/* Thay thế RadioGroup bằng Custom UI để hỗ trợ cả 2 loại */}
                <div className="space-y-3">
                  {currentQuestion.choices && currentQuestion.choices.map((choice) => {
                    const isSelected = userAnswers[currentQuestion.id]?.includes(choice.id);

                    return (
                      <div
                        key={choice.id}
                        onClick={() => handleSelectAnswer(currentQuestion, choice.id)}
                        className={`
                                flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-all
                                ${isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:bg-muted/50"
                          }
                            `}
                      >
                        <div className="mt-0.5 shrink-0 text-primary">
                          {currentQuestion.question_type === 'single_choice' ? (
                            // Icon Tròn cho Single
                            isSelected ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5 text-muted-foreground" />
                          ) : (
                            // Icon Vuông cho Multiple
                            isSelected ? <CheckSquare className="h-5 w-5" /> : <Square className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <span className={`text-lg leading-relaxed ${isSelected ? "font-medium text-primary" : "font-normal"}`}>
                          {choice.content}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Điều hướng */}
            <div className="flex justify-between mt-8 pb-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="mr-2 h-4 w-4" /> Câu trước
              </Button>

              {currentQuestionIndex < exam.questions.length - 1 ? (
                <Button
                  size="lg"
                  onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                >
                  Câu tiếp theo <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="lg" variant="default" className="bg-green-600 hover:bg-green-700">
                      Nộp bài <CheckCircle className="ml-2 h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Bạn có chắc chắn muốn nộp bài?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn đã trả lời {answeredCount}/{exam.questions.length} câu hỏi.
                        Hành động này không thể hoàn tác.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Kiểm tra lại</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleSubmit(false)} disabled={isSubmitting}>
                        {isSubmitting ? "Đang nộp..." : "Nộp bài ngay"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </main>

        {/* SIDEBAR */}
        <aside className="w-80 border-l bg-card hidden lg:flex flex-col">
          <div className="p-6 border-b">
            <h3 className="font-bold mb-2">Tổng quan bài thi</h3>
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Đã làm: {answeredCount}/{exam.questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <ScrollArea className="flex-1 p-6">
            <div className="grid grid-cols-4 gap-3 p-1">
              {exam.questions.map((q, idx) => {
                // Kiểm tra xem câu hỏi này đã có câu trả lời nào chưa
                const hasAnswer = userAnswers[q.id] && userAnswers[q.id].length > 0;
                const isCurrent = currentQuestionIndex === idx;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`
                      h-10 w-10 rounded-md text-sm font-bold flex items-center justify-center transition-all
                      ${isCurrent ? "ring-2 ring-offset-2 ring-primary border-primary bg-background" : ""}
                      ${hasAnswer ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"}
                    `}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </ScrollArea>

          <div className="p-6 border-t bg-muted/20">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <div className="w-4 h-4 bg-primary rounded-sm"></div> Đã làm
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 bg-secondary border rounded-sm"></div> Chưa làm
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// Helper Progress Component (nếu chưa có)
function Progress({ value, className }: { value: number, className?: string }) {
  return (
    <div className={`w-full bg-secondary rounded-full overflow-hidden ${className}`}>
      <div
        className="bg-primary h-full transition-all duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  )
}