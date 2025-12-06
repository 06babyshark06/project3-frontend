// app/exams/[id]/take/page.tsx
// ✅ HOÀN THIỆN: Auto-save, Fullscreen, Log Violations, Password Check
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Loader2, Clock, AlertTriangle, ChevronLeft, ChevronRight,
  Circle, CheckCircle2, Square, CheckSquare, Lock, Maximize
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader,
  DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";

// --- Interfaces ---
interface Choice {
  id: number;
  content: string;
}
interface Question {
  id: number;
  content: string;
  question_type: string;
  choices: Choice[];
}
interface ExamSettings {
  duration_minutes: number;
  password?: string;
  shuffle_questions?: boolean;
}
interface ExamData {
  id: number;
  title: string;
  settings: ExamSettings;
  questions: Question[];
}

// --- Format Time (MM:SS) ---
const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// --- Shuffle Array Helper ---
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ExamTakingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const examId = params.id as string;

  // ===== STATE MANAGEMENT =====
  const [exam, setExam] = useState<ExamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  
  // ===== NEW STATES =====
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-save timer ref
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedAnswers = useRef<string>("");

  // ===== 1. PASSWORD CHECK & FETCH EXAM =====
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await api.get(`/exams/${examId}`);
        const data = response.data.data;

        if (!data.questions) data.questions = [];

        // ✅ SHUFFLE QUESTIONS if enabled
        if (data.settings?.shuffle_questions) {
          data.questions = shuffleArray(data.questions);
          // Shuffle choices too
          data.questions = data.questions.map((q: Question) => ({
            ...q,
            choices: shuffleArray(q.choices)
          }));
        }

        setExam(data);
        setTimeLeft(data.settings.duration_minutes * 60);

        // ✅ PASSWORD CHECK
        if (data.settings?.password) {
          setIsPasswordDialogOpen(true);
        } else {
          setIsPasswordCorrect(true);
          requestFullscreen();
        }
      } catch (error) {
        toast.error("Không thể tải đề thi.");
        router.push("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };
    fetchExam();
  }, [examId, router]);

  // ===== PASSWORD VERIFY =====
  const handlePasswordSubmit = () => {
    if (!exam?.settings?.password) return;
    
    if (passwordInput === exam.settings.password) {
      setIsPasswordCorrect(true);
      setIsPasswordDialogOpen(false);
      requestFullscreen();
      toast.success("Mật khẩu đúng! Bắt đầu làm bài.");
    } else {
      toast.error("Mật khẩu không đúng!");
      setPasswordInput("");
    }
  };

  // ===== 2. FULLSCREEN MODE =====
  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(() => {
        toast.warning("Không thể bật chế độ toàn màn hình");
      });
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      
      if (!document.fullscreenElement && isPasswordCorrect && !isSubmitting) {
        const newCount = violationCount + 1;
        setViolationCount(newCount);
        
        toast.error(`⚠️ CẢNH BÁO: Thoát fullscreen! (${newCount}/3)`, {
          description: "Quá 3 lần bài thi sẽ bị nộp tự động."
        });

        api.post("/exams/log-violation", {
          exam_id: Number(examId),
          violation_type: "exit_fullscreen"
        });

        if (newCount >= 3) {
          handleSubmit(true);
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isPasswordCorrect, isSubmitting, violationCount]);

  // ===== 3. TIMER =====
  useEffect(() => {
    if (!exam || !isPasswordCorrect || isSubmitting) return;

    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, exam, isPasswordCorrect, isSubmitting]);

  // ===== 4. CREATE SUBMISSION ON START =====
  useEffect(() => {
    if (!exam || !isPasswordCorrect || submissionId) return;

    const createSubmission = async () => {
      try {
        // Backend tự tạo submission với status "in_progress"
        // Hoặc nếu chưa có API, bỏ qua bước này
      } catch (err) {
        console.error("Create submission failed:", err);
      }
    };

    createSubmission();
  }, [exam, isPasswordCorrect, submissionId]);

  // ===== 5. AUTO-SAVE (mỗi 30s) =====
  useEffect(() => {
    if (!exam || !isPasswordCorrect || isSubmitting) return;

    const saveAnswers = async () => {
      const currentAnswersStr = JSON.stringify(userAnswers);
      if (currentAnswersStr === lastSavedAnswers.current) return; // No changes

      try {
        // Save each answer
        const promises = Object.entries(userAnswers).flatMap(([qId, cIds]) =>
          cIds.map(cId => 
            api.post("/exams/save-answer", {
              exam_id: Number(examId),
              question_id: Number(qId),
              chosen_choice_id: cId
            })
          )
        );

        await Promise.all(promises);
        lastSavedAnswers.current = currentAnswersStr;
        console.log("✅ Auto-saved at", new Date().toLocaleTimeString());
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    };

    // Save every 30 seconds
    autoSaveTimerRef.current = setInterval(saveAnswers, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [exam, userAnswers, isPasswordCorrect, isSubmitting, examId]);

  // ===== 6. SELECT ANSWER =====
  const handleSelectAnswer = (question: Question, choiceId: number) => {
    setUserAnswers(prev => {
      const currentSelected = prev[question.id] || [];

      if (question.question_type === "multiple_choice") {
        if (currentSelected.includes(choiceId)) {
          return {
            ...prev,
            [question.id]: currentSelected.filter(id => id !== choiceId)
          };
        } else {
          return {
            ...prev,
            [question.id]: [...currentSelected, choiceId]
          };
        }
      } else {
        return {
          ...prev,
          [question.id]: [choiceId]
        };
      }
    });

    // ✅ INSTANT SAVE on answer change
    api.post("/exams/save-answer", {
      exam_id: Number(examId),
      question_id: question.id,
      chosen_choice_id: choiceId
    }).catch(err => console.error("Instant save failed:", err));
  };

  // ===== 7. SUBMIT EXAM =====
  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (isSubmitting || !exam) return;
    setIsSubmitting(true);

    const formattedAnswers = Object.entries(userAnswers).flatMap(([qId, cIds]) =>
      cIds.map(cId => ({
        question_id: Number(qId),
        chosen_choice_id: Number(cId)
      }))
    );

    try {
      const response = await api.post("/exams/submit", {
        exam_id: Number(examId),
        user_id: user?.id,
        answers: formattedAnswers
      });

      const result = response.data.data;

      if (autoSubmit) {
        toast.warning("Hết giờ hoặc vi phạm! Hệ thống đã tự động nộp bài.");
      } else {
        toast.success("Nộp bài thành công!");
      }

      // Exit fullscreen before redirect
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }

      router.push(`/exams/result/${result.submission_id}`);
    } catch (error) {
      toast.error("Nộp bài thất bại. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  }, [exam, userAnswers, isSubmitting, examId, user, router]);

  // ===== 8. ANTI-CHEAT: Tab Switch Detection =====
  useEffect(() => {
    if (!exam || !isPasswordCorrect || isSubmitting) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        const newCount = violationCount + 1;
        setViolationCount(newCount);

        toast.error(`🚨 CẢNH BÁO: Chuyển tab! (${newCount}/3)`, {
          description: "Hành vi này đã được ghi lại. Quá 3 lần bài thi sẽ bị hủy."
        });

        try {
          await api.post("/exams/log-violation", {
            exam_id: Number(examId),
            violation_type: "tab_switch"
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

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [exam, isPasswordCorrect, isSubmitting, violationCount, examId, handleSubmit]);

  // ===== 9. PREVENT COPY/PASTE =====
  useEffect(() => {
    if (!isPasswordCorrect) return;

    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error("Không được phép copy trong khi thi!");
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error("Không được phép paste trong khi thi!");
    };

    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);

    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, [isPasswordCorrect]);

  // ===== 10. AUTO-SUBMIT when time runs out =====
  useEffect(() => {
    if (timeLeft <= 0 && !isSubmitting && isPasswordCorrect) {
      toast.warning("⏰ Hết giờ! Đang tự động nộp bài...", { duration: 5000 });
      handleSubmit(true);
    }
  }, [timeLeft, isSubmitting, isPasswordCorrect, handleSubmit]);

  // ===== RENDER =====
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
  const answeredCount = Object.values(userAnswers).filter(ans => ans.length > 0).length;
  const progress = (answeredCount / exam.questions.length) * 100;

  return (
    <>
      {/* PASSWORD DIALOG */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Nhập mật khẩu để vào thi
            </DialogTitle>
            <DialogDescription>
              Bài thi <strong>{exam?.title}</strong> yêu cầu mật khẩu.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input
              type="password"
              placeholder="Nhập mật khẩu..."
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button onClick={() => router.push("/dashboard")} variant="outline">
              Hủy
            </Button>
            <Button onClick={handlePasswordSubmit}>
              Xác nhận
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MAIN EXAM UI - Only show when password correct */}
      {isPasswordCorrect && (
        <div className="flex flex-col h-screen bg-background">
          {/* HEADER */}
          <header className="h-16 border-b px-6 flex items-center justify-between bg-card z-10 shadow-sm">
            <h1 className="text-xl font-bold truncate max-w-[60%]">{exam.title}</h1>

            <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-md ${
              timeLeft < 300 ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400' :
              timeLeft < 600 ? 'bg-yellow-100 text-yellow-600 dark:bg-yellow-950 dark:text-yellow-400' :
              'bg-muted text-muted-foreground'
            }`}>
              <Clock className="h-5 w-5" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            {/* MAIN CONTENT */}
            <div className="flex-1 overflow-y-auto p-6">
              <Card className="max-w-3xl mx-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Câu {currentQuestionIndex + 1}/{exam.questions.length}
                    </CardTitle>
                    <Badge variant={currentQuestion.question_type === "multiple_choice" ? "secondary" : "outline"}>
                      {currentQuestion.question_type === "multiple_choice" ? "Nhiều đáp án" : "Một đáp án"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-base leading-relaxed">{currentQuestion.content}</p>

                  <div className="space-y-3">
                    {currentQuestion.choices.map((choice) => {
                      const isSelected = userAnswers[currentQuestion.id]?.includes(choice.id);
                      const isMultiple = currentQuestion.question_type === "multiple_choice";

                      return (
                        <div
                          key={choice.id}
                          onClick={() => handleSelectAnswer(currentQuestion, choice.id)}
                          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <Label className="flex items-center gap-3 cursor-pointer">
                            {isMultiple ? (
                              isSelected ? (
                                <CheckSquare className="h-5 w-5 text-primary flex-shrink-0" />
                              ) : (
                                <Square className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              )
                            ) : (
                              isSelected ? (
                                <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                              )
                            )}
                            <span className="text-base">{choice.content}</span>
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* NAVIGATION */}
              <div className="max-w-3xl mx-auto mt-6 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Câu trước
                </Button>

                <span className="text-sm text-muted-foreground">
                  {answeredCount}/{exam.questions.length} câu đã trả lời
                </span>

                <Button
                  variant="outline"
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(exam.questions.length - 1, prev + 1))}
                  disabled={currentQuestionIndex === exam.questions.length - 1}
                >
                  Câu sau <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* SIDEBAR */}
            <aside className="w-80 border-l bg-muted/30 flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold mb-2">Tổng quan bài thi</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Tổng số câu:</span>
                    <span className="font-medium">{exam.questions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Đã trả lời:</span>
                    <span className="font-medium text-green-600 dark:text-green-400">{answeredCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Chưa trả lời:</span>
                    <span className="font-medium text-orange-600 dark:text-orange-400">
                      {exam.questions.length - answeredCount}
                    </span>
                  </div>
                  <div className="pt-2">
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 text-center">
                      {Math.round(progress)}% hoàn thành
                    </p>
                  </div>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="grid grid-cols-5 gap-2">
                  {exam.questions.map((_, idx) => {
                    const questionId = exam.questions[idx].id;
                    const hasAnswer = userAnswers[questionId]?.length > 0;

                    return (
                      <Button
                        key={idx}
                        variant={currentQuestionIndex === idx ? "default" : hasAnswer ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className="h-10"
                      >
                        {idx + 1}
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="p-4 border-t space-y-2">
                {violationCount > 0 && (
                  <div className="p-3 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-md text-sm text-red-600 dark:text-red-400">
                    ⚠️ Vi phạm: {violationCount}/3
                  </div>
                )}

                {!isFullscreen && (
                  <Button
                    onClick={requestFullscreen}
                    variant="outline"
                    className="w-full"
                  >
                    <Maximize className="mr-2 h-4 w-4" />
                    Bật toàn màn hình
                  </Button>
                )}

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full" size="lg" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Đang nộp bài...
                        </>
                      ) : (
                        <>Nộp bài</>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Xác nhận nộp bài</AlertDialogTitle>
                      <AlertDialogDescription>
                        Bạn đã trả lời <strong>{answeredCount}/{exam.questions.length}</strong> câu hỏi.
                        <br />
                        Bạn có chắc chắn muốn nộp bài không?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Kiểm tra lại</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleSubmit(false)}>
                        Nộp bài ngay
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}