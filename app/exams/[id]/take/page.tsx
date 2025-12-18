"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Loader2, Clock, AlertTriangle, ChevronLeft, ChevronRight,
  Circle, CheckCircle2, Square, CheckSquare, Lock, Maximize,
  Image as ImageIcon, Calendar, Ban, UserPlus, Hourglass, Menu
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
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
  start_time?: string;
  end_time?: string;
  requires_approval?: boolean; // ✅ Thêm trường này
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

  // Trạng thái hiển thị (Blocker)
  const [examStatus, setExamStatus] = useState<"open" | "not_started" | "ended" | "need_approval" | "pending" | "rejected">("open");
  const [statusMessage, setStatusMessage] = useState("");

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
  const [isResuming, setIsResuming] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false); // State nút đăng ký

  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedAnswers = useRef<string>("");
  const hasStartedRef = useRef(false);

  // ===== 1. FETCH EXAM & CHECK CONDITIONS =====
  useEffect(() => {
    const fetchExam = async () => {
      try {
        const response = await api.get(`/exams/${examId}`);
        const data = response.data.data;

        if (!data.questions) data.questions = [];

        if (data.settings?.shuffle_questions) {
          data.questions = shuffleArray(data.questions);
          data.questions = data.questions.map((q: Question) => ({
            ...q,
            choices: shuffleArray(q.choices)
          }));
        }

        setExam(data);
        setTimeLeft(data.settings.duration_minutes * 60);

        // 1.1 Check Thời gian
        const now = new Date();
        const start = data.settings.start_time ? new Date(data.settings.start_time) : null;
        const end = data.settings.end_time ? new Date(data.settings.end_time) : null;

        if (start && now < start) {
          setExamStatus("not_started");
          setStatusMessage(`Bài thi sẽ mở vào: ${start.toLocaleString('vi-VN')}`);
          setIsLoading(false);
          return;
        }
        if (end && now > end) {
          setExamStatus("ended");
          setStatusMessage(`Bài thi đã kết thúc vào: ${end.toLocaleString('vi-VN')}`);
          setIsLoading(false);
          return;
        }

        // 1.2 Check Quyền truy cập (Approval)
        if (data.settings?.requires_approval) {
          // Gọi API check status
          try {
            const accessRes = await api.get("/exams/access/check", { params: { exam_id: examId } });
            const { can_access, message } = accessRes.data.data;

            if (!can_access) {
              if (message === "none") {
                setExamStatus("need_approval");
                setStatusMessage("Bài thi yêu cầu đăng ký trước.");
              } else if (message === "pending") {
                setExamStatus("pending");
                setStatusMessage("Yêu cầu của bạn đang chờ giáo viên duyệt.");
              } else if (message === "rejected") {
                setExamStatus("rejected");
                setStatusMessage("Yêu cầu tham gia của bạn đã bị từ chối.");
              } else {
                // Các lỗi khác (max_attempts...)
                setExamStatus("ended");
                setStatusMessage("Bạn không đủ điều kiện tham gia (Hết lượt hoặc bị chặn).");
              }
              setIsLoading(false);
              return;
            }
          } catch (e) {
            console.error("Check access failed", e);
          }
        }

        // Nếu qua hết các cửa ải -> Check Password
        if (data.settings?.password) {
          setIsPasswordDialogOpen(true);
        } else {
          setIsPasswordCorrect(true);
        }

      } catch (error) {
        toast.error("Không thể tải đề thi.");
        router.push("/exams");
      } finally {
        setIsLoading(false);
      }
    };
    fetchExam();
  }, [examId, router]);

  // ===== HANDLE REQUEST ACCESS =====
  const handleRequestAccess = async () => {
    setIsRequesting(true);
    try {
      await api.post("/exams/access/request", { exam_id: Number(examId) });
      toast.success("Đã gửi yêu cầu! Vui lòng chờ duyệt.");
      setExamStatus("pending");
      setStatusMessage("Yêu cầu của bạn đang chờ giáo viên duyệt.");
    } catch (error) {
      toast.error("Gửi yêu cầu thất bại.");
    } finally {
      setIsRequesting(false);
    }
  };

  // ===== START / RESUME EXAM =====
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
        const formattedAnswers: Record<number, number[]> = {};
        Object.entries(current_answers).forEach(([key, val]: [string, any]) => {
          const choices = val.values ? val.values : val;
          if (Array.isArray(choices)) {
            formattedAnswers[Number(key)] = choices.map(Number);
          }
        });
        setUserAnswers(formattedAnswers);

        if (Object.keys(formattedAnswers).length > 0) {
          setIsResuming(true);
        } else {
          requestFullscreen();
        }
      } else {
        requestFullscreen();
      }

    } catch (error: any) {
      // Fallback check lỗi từ backend
      const msg = error.response?.data?.error?.message || "";
      toast.error(msg || "Không thể bắt đầu bài thi");

      // Nếu lỗi liên quan đến access, quay về màn hình chặn
      if (msg.includes("pending")) { setExamStatus("pending"); }
      else if (msg.includes("rejected")) { setExamStatus("rejected"); }
      else { router.push(`/exams`); }
    }
  }, [examId, router]);

  const handleResumeClick = () => {
    requestFullscreen();
    setIsResuming(false);
    toast.success("Đã khôi phục bài làm!");
  };

  useEffect(() => {
    if (isPasswordCorrect && exam && examStatus === "open") {
      startOrResumeExam();
    }
  }, [isPasswordCorrect, exam, examStatus, startOrResumeExam]);

  // ... (Các hàm handlePasswordSubmit, requestFullscreen, handleFullscreenChange giữ nguyên) ...
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

  const requestFullscreen = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) elem.requestFullscreen().catch(() => { });
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement && isPasswordCorrect && !isSubmitting && submissionId) {
        const newCount = violationCount + 1;
        setViolationCount(newCount);
        toast.error(`⚠️ CẢNH BÁO: Thoát toàn màn hình! (${newCount}/3)`);
        api.post("/exams/log-violation", { exam_id: Number(examId), violation_type: "exit_fullscreen" }).catch(console.error);
        if (newCount >= 3) handleSubmit(true);
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isPasswordCorrect, isSubmitting, violationCount, submissionId, examId]);

  // ... (Các hàm Timer, AutoSave, SelectAnswer, Submit giữ nguyên) ...
  useEffect(() => {
    if (!submissionId || isSubmitting) return;
    if (timeLeft <= 0) { handleSubmit(true); return; }
    const timerId = setInterval(() => setTimeLeft(p => p - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft, submissionId, isSubmitting]);

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
              submission_id: submissionId
            })
          )
        );
        await Promise.all(promises);
        lastSavedAnswers.current = currentAnswersStr;
      } catch (err) { console.error("Auto-save failed"); }
    };
    autoSaveTimerRef.current = setInterval(saveAnswers, 30000);
    return () => { if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current); };
  }, [examId, userAnswers, submissionId, isSubmitting]);

  const handleSelectAnswer = (question: Question, choiceId: number) => {
    if (isSubmitting) return;
    setUserAnswers(prev => {
      const currentSelected = prev[question.id] || [];
      if (question.question_type === "multiple_choice") {
        return currentSelected.includes(choiceId) ? { ...prev, [question.id]: currentSelected.filter(id => id !== choiceId) } : { ...prev, [question.id]: [...currentSelected, choiceId] };
      }
      return { ...prev, [question.id]: [choiceId] };
    });
  };

  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (isSubmitting || !exam) return;
    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(userAnswers).flatMap(([qId, cIds]) => cIds.map(cId => ({ question_id: Number(qId), chosen_choice_id: Number(cId) })));
      const response = await api.post("/exams/submit", { exam_id: Number(examId), submission_id: submissionId, answers: formattedAnswers });
      if (document.fullscreenElement) document.exitFullscreen().catch(() => { });
      router.replace(`/exams/result/${response.data.data.submission_id || submissionId}`);
    } catch (error) { setIsSubmitting(false); }
  }, [exam, userAnswers, isSubmitting, examId, submissionId, router]);


  // ===== RENDER =====
  if (isLoading) return <div className="flex h-screen w-full items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  if (!exam) return null;

  // ✅ UI CHẶN / YÊU CẦU THAM GIA
  if (examStatus !== "open") {
    let icon = <Ban className="h-16 w-16" />;
    let bgClass = "bg-red-100 text-red-600";
    let action = null;

    if (examStatus === 'not_started') {
      icon = <Calendar className="h-16 w-16" />;
      bgClass = "bg-blue-100 text-blue-600";
    } else if (examStatus === 'need_approval') {
      icon = <UserPlus className="h-16 w-16" />;
      bgClass = "bg-purple-100 text-purple-600";
      action = (
        <Button size="lg" className="mt-4 bg-purple-600 hover:bg-purple-700" onClick={handleRequestAccess} disabled={isRequesting}>
          {isRequesting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
          Đăng ký tham gia
        </Button>
      );
    } else if (examStatus === 'pending') {
      icon = <Hourglass className="h-16 w-16" />;
      bgClass = "bg-yellow-100 text-yellow-600";
    }

    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background p-6 text-center space-y-6">
        <div className={`p-6 rounded-full ${bgClass}`}>{icon}</div>

        <h1 className="text-3xl font-bold">{exam.title}</h1>

        <div className="max-w-md p-4 bg-muted/50 border rounded-lg">
          <p className="text-lg font-medium text-muted-foreground">{statusMessage}</p>
        </div>

        {action}

        <Button variant="outline" size="lg" onClick={() => router.push("/exams")}>
          <ChevronLeft className="mr-2 h-5 w-5" /> Quay về danh sách
        </Button>
      </div>
    );
  }

  // ✅ RENDER BÀI THI (Giữ nguyên)
  const currentQuestion = exam.questions[currentQuestionIndex];
  const answeredCount = Object.values(userAnswers).filter(ans => ans.length > 0).length;
  const progress = (answeredCount / exam.questions.length) * 100;

  return (
    <>
      <Dialog open={isPasswordDialogOpen} onOpenChange={() => { }}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Lock className="h-5 w-5" /> Nhập mật khẩu</DialogTitle>
            <DialogDescription>Bài thi <strong>{exam?.title}</strong> yêu cầu mật khẩu.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Input type="password" placeholder="Nhập mật khẩu..." value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handlePasswordSubmit()} autoFocus />
          </div>
          <DialogFooter>
            <Button onClick={() => router.push("/exams")} variant="outline">Hủy</Button>
            <Button onClick={handlePasswordSubmit}>Xác nhận</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isResuming && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center">
          <div className="max-w-md space-y-6">
            <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto" />
            <h2 className="text-2xl font-bold">Phát hiện gián đoạn!</h2>
            <p className="text-muted-foreground">
              Hệ thống đã khôi phục bài làm của bạn.
              Vui lòng nhấn nút bên dưới để quay lại chế độ toàn màn hình và tiếp tục làm bài.
            </p>
            <Button size="lg" onClick={handleResumeClick} className="w-full text-lg animate-pulse">
              <Maximize className="mr-2 h-5 w-5" /> Tiếp tục làm bài
            </Button>
          </div>
        </div>
      )}

      {isPasswordCorrect && (
        <div className="flex flex-col h-screen bg-background">
          {/* HEADER */}
          <header className="h-16 border-b px-4 md:px-6 flex items-center justify-between bg-card z-10 shadow-sm shrink-0">
            <div className="flex items-center gap-3 max-w-[70%]">
              {/* MOBILE MENU TRIGGER */}
              <div className="md:hidden">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[85%] sm:w-[350px] p-0">
                    <div className="flex flex-col h-full">
                      <SheetHeader className="p-4 border-b">
                        <SheetTitle>Danh sách câu hỏi</SheetTitle>
                      </SheetHeader>
                      {/* REUSE SIDEBAR CONTENT HERE */}
                      <div className="flex-1 flex flex-col overflow-hidden">
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
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
              <h1 className="text-lg md:text-xl font-bold truncate">{exam.title}</h1>
            </div>

            <div className={`flex items-center gap-2 font-mono text-lg md:text-xl font-bold px-3 py-1.5 md:px-4 md:py-2 rounded-md ${timeLeft < 300 ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground'}`}>
              <Clock className="h-4 w-4 md:h-5 md:w-5" /><span>{formatTime(timeLeft)}</span>
            </div>
          </header>

          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
              <Card className="max-w-3xl mx-auto shadow-none md:shadow-sm border-0 md:border">
                <CardHeader className="px-0 md:px-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Câu {currentQuestionIndex + 1}/{exam.questions.length}</CardTitle>
                    <Badge variant="outline">{currentQuestion.question_type === "multiple_choice" ? "Nhiều đáp án" : "Một đáp án"}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 px-0 md:px-6">
                  <div className="text-base leading-relaxed prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: currentQuestion.content }} />
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
                            <MediaContent url={choice.attachment_url} />
                          </Label>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="max-w-3xl mx-auto mt-6 flex items-center justify-between pb-8">
                <Button variant="outline" onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))} disabled={currentQuestionIndex === 0}><ChevronLeft className="mr-2 h-4 w-4" /> Câu trước</Button>
                <Button variant="outline" onClick={() => setCurrentQuestionIndex(prev => Math.min(exam.questions.length - 1, prev + 1))} disabled={currentQuestionIndex === exam.questions.length - 1}>Câu sau <ChevronRight className="ml-2 h-4 w-4" /></Button>
              </div>
            </div>

            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex w-80 border-l bg-muted/30 flex-col">
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