"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Loader2, Clock, AlertTriangle, ChevronLeft, ChevronRight,
  Circle, CheckCircle2, Square, CheckSquare, Lock, Maximize, Image as ImageIcon
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
  attachment_url?: string;
}
interface Question {
  id: number;
  content: string;
  question_type: string;
  attachment_url?: string;
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

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ✅ Component hiển thị Media
const MediaContent = ({ url }: { url?: string }) => {
  if (!url) return null;
  const isVideo = url.match(/\.(mp4|webm|mov)$/i);
  return (
    <div className="my-3 flex justify-center">
      {isVideo ? (
        <video src={url} controls className="max-h-[300px] rounded-lg border bg-black" />
      ) : (
        <img src={url} alt="Minh họa" className="max-h-[300px] rounded-lg border object-contain" />
      )}
    </div>
  );
};

export default function ExamTakingPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const examId = params.id as string;

  // ===== STATE =====
  const [exam, setExam] = useState<ExamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number[]>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  
  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Refs
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedAnswers = useRef<string>("");
  const hasStartedRef = useRef(false); // Tránh gọi API start nhiều lần

  // ===== 1. FETCH EXAM & CHECK PASSWORD =====
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await api.get(`/exams/${examId}`);
        const data = response.data.data;

        if (!data.questions) data.questions = [];

        // Shuffle logic (Chỉ shuffle nếu là lần đầu, nếu resume thì nên giữ nguyên thứ tự hoặc lưu thứ tự vào DB - phần này nâng cao, tạm thời shuffle ở client)
        if (data.settings?.shuffle_questions) {
          data.questions = shuffleArray(data.questions);
          data.questions = data.questions.map((q: Question) => ({
            ...q,
            choices: shuffleArray(q.choices)
          }));
        }

        setExam(data);
        
        // Mặc định thời gian (sẽ bị ghi đè nếu resume từ server)
        setTimeLeft(data.settings.duration_minutes * 60);

        if (data.settings?.password) {
          setIsPasswordDialogOpen(true);
        } else {
          setIsPasswordCorrect(true);
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

  // ===== ✅ 2. START / RESUME EXAM (QUAN TRỌNG) =====
  const startOrResumeExam = useCallback(async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    try {
      const res = await api.post(`/exams/${examId}/start`); 
      const { submission_id, remaining_seconds, current_answers } = res.data.data;

      setSubmissionId(submission_id);
      
      if (remaining_seconds !== undefined && remaining_seconds !== null) {
        setTimeLeft(remaining_seconds);
      }

      if (current_answers) {
        setUserAnswers(current_answers);
        toast.info("Đã khôi phục bài làm trước đó.");
      } else {
        toast.success("Bắt đầu tính giờ làm bài!");
      }

      requestFullscreen();

    } catch (error: any) {
        toast.error(error.response?.data?.error?.message || "Không thể bắt đầu bài thi");
        router.push(`/exams/${examId}`);
    }
  }, [examId, router]);

  useEffect(() => {
    if (isPasswordCorrect && exam) {
        startOrResumeExam();
    }
  }, [isPasswordCorrect, exam, startOrResumeExam]);


  const handlePasswordSubmit = () => {
    if (!exam?.settings?.password) return;
    if (passwordInput === exam.settings.password) {
      setIsPasswordCorrect(true);
      setIsPasswordDialogOpen(false);
    } else {
      toast.error("Mật khẩu không đúng!");
      setPasswordInput("");
    }
  };

  // ===== 3. FULLSCREEN & ANTI-CHEAT =====
  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      // Chỉ cảnh báo nếu đã bắt đầu tính giờ (có submissionId)
      if (!document.fullscreenElement && isPasswordCorrect && !isSubmitting && submissionId) {
        const newCount = violationCount + 1;
        setViolationCount(newCount);
        
        toast.error(`⚠️ CẢNH BÁO: Thoát toàn màn hình! (${newCount}/3)`, {
          description: "Quá 3 lần bài thi sẽ bị nộp tự động."
        });

        api.post("/exams/log-violation", {
          exam_id: Number(examId),
          violation_type: "exit_fullscreen"
        }).catch(console.error);

        if (newCount >= 3) handleSubmit(true);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isPasswordCorrect, isSubmitting, violationCount, submissionId, examId]);

  // ===== 4. TIMER =====
  useEffect(() => {
    if (!submissionId || isSubmitting) return;

    if (timeLeft <= 0) {
      handleSubmit(true);
      return;
    }

    const timerId = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
            clearInterval(timerId);
            return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft, submissionId, isSubmitting]);

  // ===== 5. AUTO-SAVE =====
  useEffect(() => {
    if (!submissionId || isSubmitting) return;

    const saveAnswers = async () => {
      const currentAnswersStr = JSON.stringify(userAnswers);
      if (currentAnswersStr === lastSavedAnswers.current) return;

      try {
        const promises = Object.entries(userAnswers).flatMap(([qId, cIds]) =>
          cIds.map(cId => 
            api.post("/exams/save-answer", {
              exam_id: Number(examId),
              question_id: Number(qId),
              chosen_choice_id: cId,
              submission_id: submissionId // ✅ Gửi kèm submissionId
            })
          )
        );
        await Promise.all(promises);
        lastSavedAnswers.current = currentAnswersStr;
      } catch (err) {
        console.error("Auto-save failed");
      }
    };

    autoSaveTimerRef.current = setInterval(saveAnswers, 30000); // 30s
    return () => { if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current); };
  }, [examId, userAnswers, submissionId, isSubmitting]);

  const handleSelectAnswer = (question: Question, choiceId: number) => {
    if (isSubmitting) return;

    setUserAnswers(prev => {
      const currentSelected = prev[question.id] || [];
      if (question.question_type === "multiple_choice") {
        return currentSelected.includes(choiceId) 
            ? { ...prev, [question.id]: currentSelected.filter(id => id !== choiceId) }
            : { ...prev, [question.id]: [...currentSelected, choiceId] };
      } else {
        return { ...prev, [question.id]: [choiceId] };
      }
    });
  };

  // ===== 6. SUBMIT =====
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
      toast.info("Đang nộp bài...");
      const response = await api.post("/exams/submit", {
        exam_id: Number(examId),
        submission_id: submissionId,
        answers: formattedAnswers
      });

      const result = response.data.data;

      if (autoSubmit) toast.warning("Hệ thống đã tự động thu bài.");
      else toast.success("Nộp bài thành công!");

      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      
      router.replace(`/exams/result/${result.submission_id || submissionId}`);
      
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Nộp bài thất bại. Vui lòng thử lại.");
      setIsSubmitting(false);
    }
  }, [exam, userAnswers, isSubmitting, examId, submissionId, router]);

  // ===== 7. PREVENT RELOAD (F5) =====
  useEffect(() => {
    if (!isSubmitting && submissionId) {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = ''; // Trigger popup browser
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [isSubmitting, submissionId]);

  // ===== VISIBILITY CHECK =====
  useEffect(() => {
    if (!submissionId || isSubmitting) return;
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const newCount = violationCount + 1;
        setViolationCount(newCount);
        toast.error(`🚨 CẢNH BÁO: Rời khỏi màn hình thi! (${newCount}/3)`);
        api.post("/exams/log-violation", { exam_id: Number(examId), violation_type: "tab_switch" }).catch(() => {});
        if (newCount >= 3) handleSubmit(true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [submissionId, isSubmitting, violationCount, examId, handleSubmit]);

  // ===== RENDER =====
  if (isLoading) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!exam) return null;

  const currentQuestion = exam.questions[currentQuestionIndex];
  const answeredCount = Object.values(userAnswers).filter(ans => ans.length > 0).length;
  const progress = (answeredCount / exam.questions.length) * 100;

  return (
    <>
      <Dialog open={isPasswordDialogOpen} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Nhập mật khẩu</DialogTitle>
            <DialogDescription>Bài thi <strong>{exam?.title}</strong> yêu cầu mật khẩu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input type="password" placeholder="Nhập mật khẩu..." value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()} autoFocus />
          </div>
          <DialogFooter>
            <Button onClick={() => router.push("/dashboard")} variant="outline">Hủy</Button>
            <Button onClick={handlePasswordSubmit}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isPasswordCorrect && (
        <div className="flex flex-col h-screen bg-background">
          <header className="h-16 border-b px-6 flex items-center justify-between bg-card z-10 shadow-sm">
            <h1 className="text-xl font-bold truncate max-w-[60%]">{exam.title}</h1>
            <div className={`flex items-center gap-2 font-mono text-xl font-bold px-4 py-2 rounded-md ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground'}`}>
              <Clock className="h-5 w-5" /><span>{formatTime(timeLeft)}</span>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              <Card className="max-w-3xl mx-auto">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Câu {currentQuestionIndex + 1}/{exam.questions.length}</CardTitle>
                    <Badge variant="outline">{currentQuestion.question_type === "multiple_choice" ? "Nhiều đáp án" : "Một đáp án"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* ✅ Render nội dung câu hỏi (HTML) */}
                  <div className="text-base leading-relaxed prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: currentQuestion.content }} />
                  
                  {/* ✅ Render Ảnh/Video câu hỏi */}
                  <MediaContent url={currentQuestion.attachment_url} />

                  <div className="space-y-3">
                    {currentQuestion.choices.map((choice) => {
                      const isSelected = userAnswers[currentQuestion.id]?.includes(choice.id);
                      const isMultiple = currentQuestion.question_type === "multiple_choice";
                      return (
                        <div key={choice.id} onClick={() => handleSelectAnswer(currentQuestion, choice.id)} className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}>
                          <Label className="flex flex-col gap-2 cursor-pointer pointer-events-none">
                            <div className="flex items-center gap-3">
                                {isMultiple ? (isSelected ? <CheckSquare className="h-5 w-5 text-primary" /> : <Square className="h-5 w-5 text-muted-foreground" />) : (isSelected ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />)}
                                <span className="text-base">{choice.content}</span>
                            </div>
                            {/* ✅ Render Ảnh/Video đáp án */}
                            <MediaContent url={choice.attachment_url} />
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="max-w-3xl mx-auto mt-6 flex items-center justify-between">
                <Button variant="outline" onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0}><ChevronLeft className="mr-2 h-4 w-4" /> Câu trước</Button>
                <Button variant="outline" onClick={() => setCurrentQuestionIndex(prev => Math.min(exam.questions.length - 1, prev + 1))} disabled={currentQuestionIndex === exam.questions.length - 1}>Câu sau <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>

            <aside className="w-80 border-l bg-muted/30 flex flex-col">
              <div className="p-4 border-b">
                <h3 className="font-semibold mb-2">Tiến độ</h3>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-1"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
                <p className="text-xs text-right text-muted-foreground">{answeredCount}/{exam.questions.length} câu</p>
              </div>
              <ScrollArea className="flex-1 p-4">
                <div className="grid grid-cols-5 gap-2">
                  {exam.questions.map((_, idx) => {
                    const qId = exam.questions[idx].id;
                    const hasAns = userAnswers[qId]?.length > 0;
                    return <Button key={idx} variant={currentQuestionIndex === idx ? "default" : hasAns ? "secondary" : "outline"} size="sm" onClick={() => setCurrentQuestionIndex(idx)} className="h-10">{idx + 1}</Button>;
                  })}
                </div>
              </ScrollArea>
              <div className="p-4 border-t space-y-2">
                {violationCount > 0 && <div className="p-2 bg-red-100 text-red-700 text-xs rounded border border-red-200">⚠️ Vi phạm: {violationCount}/3</div>}
                {!isFullscreen && <Button onClick={requestFullscreen} variant="outline" className="w-full"><Maximize className="mr-2 h-4 w-4" /> Toàn màn hình</Button>}
                
                <AlertDialog>
                  <AlertDialogTrigger asChild><Button className="w-full" size="lg" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Nộp bài"}</Button></AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader><AlertDialogTitle>Xác nhận nộp bài</AlertDialogTitle><AlertDialogDescription>Bạn chắc chắn muốn kết thúc bài thi?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Xem lại</AlertDialogCancel><AlertDialogAction onClick={() => handleSubmit(false)}>Nộp ngay</AlertDialogAction></AlertDialogFooter>
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