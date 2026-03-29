"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Loader2, Clock, AlertTriangle, ChevronLeft, ChevronRight,
  Circle, CheckCircle2, Square, CheckSquare, Lock, Maximize,
  Image as ImageIcon, Calendar, Ban, UserPlus, Hourglass, Menu, Flag
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
import RichTextDisplay from "@/components/RichTextDisplay";

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

// Hàm xáo trộn (Bị xoá do đã làm ở Backend để bảo mật hơn)

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
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violationCount, setViolationCount] = useState(0);

  const [submissionId, setSubmissionId] = useState<number | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [isPasswordCorrect, setIsPasswordCorrect] = useState(false);
  const [isAntiCheatWarningOpen, setIsAntiCheatWarningOpen] = useState(false);
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

        // Choices đã được Backend Shuffle (không cần Frontend Shuffle để tránh lặp)

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
      const { submission_id, remaining_seconds, current_answers, questions } = res.data.data;

      setSubmissionId(submission_id);

      if (remaining_seconds !== undefined && remaining_seconds !== null) {
        setTimeLeft(remaining_seconds);
      }

      // 🛠 CẬP NHẬT CÂU HỎI CHO ĐỀ THI ĐỘNG (Sinh ngẫu nhiên cho từng học sinh)
      if (questions && questions.length > 0) {
        setExam(prev => {
          if (!prev) return prev;
          // Backend đã lo việc shuffle
          return { ...prev, questions: questions };
        });
      }

      if (current_answers) {
        let formattedAnswers: Record<number, number[]> = {};
        Object.entries(current_answers).forEach(([key, val]: [string, any]) => {
          const choices = val.values ? val.values : val;
          if (Array.isArray(choices)) {
            formattedAnswers[Number(key)] = choices.map(Number);
          }
        });

        // Offline Fallback: Load saved draft from localStorage
        const localDraft = localStorage.getItem(`exam_draft_${examId}_${user?.id}`);
        if (localDraft) {
          try {
            const parsedDraft = JSON.parse(localDraft);
            formattedAnswers = { ...formattedAnswers, ...parsedDraft };
          } catch (e) {}
        }
        setUserAnswers(formattedAnswers);

        // Load Flagged Questions
        const localFlags = localStorage.getItem(`exam_flags_${examId}_${user?.id}`);
        if (localFlags) {
          try { setFlaggedQuestions(JSON.parse(localFlags)); } catch (e) {}
        }

        if (Object.keys(formattedAnswers).length > 0) {
          setIsResuming(true);
        } else {
          setIsAntiCheatWarningOpen(true);
        }
      } else {
        setIsAntiCheatWarningOpen(true);
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
    setIsResuming(false);
    toast.success("Đã khôi phục bài làm!");
    setIsAntiCheatWarningOpen(true);
  };

  const handleConfirmAntiCheat = () => {
    setIsAntiCheatWarningOpen(false);
    requestFullscreen();
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
    if (!isPasswordCorrect || isSubmitting || !submissionId || !examId) return;

    const logAndWarn = (type: string, message: string) => {
      const newCount = violationCount + 1;
      setViolationCount(newCount);
      toast.error(`⚠️ CẢNH BÁO: ${message} (${newCount}/3)`);
      api.post("/exams/log-violation", { exam_id: Number(examId), violation_type: type }).catch(console.error);
      if (newCount >= 3) handleSubmit(true);
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      if (!document.fullscreenElement) {
        logAndWarn("exit_fullscreen", "Thoát toàn màn hình!");
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        logAndWarn("tab_switch", "Chuyển Tab trình duyệt!");
      }
    };

    const handleWindowBlur = () => {
      logAndWarn("focus_lost", "Mất tiêu điểm cửa sổ!");
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error("Vui lòng không sử dụng chuột phải trong giờ thi!");
    };

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      toast.error("Chức năng Copy/Paste đã bị khóa!");
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Chặn F12
      if (e.key === "F12") {
        e.preventDefault();
        toast.error("Không được mở Developer Tools!");
        api.post("/exams/log-violation", { exam_id: Number(examId), violation_type: "devtools_opened" }).catch(console.error);
      }
      // Chặn Ctrl/Cmd shortcuts
      if (e.ctrlKey || e.metaKey) {
        const key = e.key.toLowerCase();
        if (["c", "v", "x", "p", "u", "s"].includes(key)) {
          e.preventDefault();
          toast.error(`Phím tắt Ctrl+${key.toUpperCase()} đã bị khóa!`);
        }
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopyPaste);
    document.addEventListener("cut", handleCopyPaste);
    document.addEventListener("paste", handleCopyPaste);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopyPaste);
      document.removeEventListener("cut", handleCopyPaste);
      document.removeEventListener("paste", handleCopyPaste);
      document.removeEventListener("keydown", handleKeyDown);
    };
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
      } catch (err: any) {
        if (err.response?.data?.error?.includes("gian lận thi hộ")) {
          toast.error("Phát hiện tài khoản đang mở bài thi ở nơi khác!", { duration: 5000 });
          router.replace("/");
          return;
        }
        console.error("Auto-save failed:", err);
      }
    };
    autoSaveTimerRef.current = setInterval(saveAnswers, 30000);
    return () => { if (autoSaveTimerRef.current) clearInterval(autoSaveTimerRef.current); };
  }, [examId, userAnswers, submissionId, isSubmitting]);

  const handleSelectAnswer = (question: Question, choiceId: number) => {
    if (isSubmitting) return;
    setUserAnswers(prev => {
      const currentSelected = prev[question.id] || [];
      let nextAnswers;
      if (question.question_type === "multiple_choice") {
        nextAnswers = currentSelected.includes(choiceId) ? { ...prev, [question.id]: currentSelected.filter(id => id !== choiceId) } : { ...prev, [question.id]: [...currentSelected, choiceId] };
      } else {
        nextAnswers = { ...prev, [question.id]: [choiceId] };
      }
      localStorage.setItem(`exam_draft_${examId}_${user?.id}`, JSON.stringify(nextAnswers));
      return nextAnswers;
    });
  };

  const toggleFlag = (questionId: number) => {
    setFlaggedQuestions(prev => {
      const nextFlags = prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId];
      localStorage.setItem(`exam_flags_${examId}_${user?.id}`, JSON.stringify(nextFlags));
      return nextFlags;
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
    } catch (error: any) {
      if (error.response?.data?.error?.includes("gian lận thi hộ")) {
        toast.error("Phát hiện tài khoản đang mở bài thi ở nơi khác! Đã tự động hủy bài.", { duration: 5000 });
        router.replace("/");
        return;
      }
      setIsSubmitting(false);
      toast.error("Nộp bài thất bại, vui lòng thử lại!");
    }
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
  if (!exam.questions || exam.questions.length === 0) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-background p-6 text-center space-y-6">
        <div className="p-6 rounded-full bg-red-100 text-red-600"><AlertTriangle className="h-16 w-16" /></div>
        <h1 className="text-3xl font-bold">{exam.title}</h1>
        <div className="max-w-md p-4 bg-muted/50 border rounded-lg">
          <p className="text-lg font-medium text-muted-foreground">Đề thi này chưa có câu hỏi nào. Vui lòng liên hệ giáo viên!</p>
        </div>
        <Button variant="outline" size="lg" onClick={() => router.push("/exams")}>
          <ChevronLeft className="mr-2 h-5 w-5" /> Quay về danh sách
        </Button>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const answeredCount = Object.values(userAnswers).filter(ans => ans.length > 0).length;
  const progress = (answeredCount / exam.questions.length) * 100;

  return (
    <>
      <AlertDialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Nhập mật khẩu bài thi</AlertDialogTitle>
            <AlertDialogDescription>Bài thi này yêu cầu mật khẩu để truy cập.</AlertDialogDescription>
            <Input type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} placeholder="Nhập mật khẩu..." className="mt-4" />
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => router.push(`/exams`)}>Quay lại</AlertDialogCancel>
            <Button onClick={handlePasswordSubmit}>Xác nhận</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                              const isFlagged = flaggedQuestions.includes(qId);
                              
                              let btnVariant = currentQuestionIndex === idx ? "default" : hasAns ? "secondary" : "outline";
                              let className = "h-10";
                              if (isFlagged && currentQuestionIndex !== idx) {
                                className += " bg-yellow-500 text-white hover:bg-yellow-600 border-0";
                                btnVariant = "default";
                              }
                              
                              return <Button key={idx} variant={btnVariant as any} size="sm" onClick={() => setCurrentQuestionIndex(idx)} className={className}>{idx + 1}</Button>;
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
                    <div className="flex items-center gap-2">
                       <Button variant="ghost" size="sm" onClick={() => toggleFlag(currentQuestion.id)} className={flaggedQuestions.includes(currentQuestion.id) ? "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30" : "text-muted-foreground"}>
                          <Flag className="w-4 h-4 mr-1" />
                          <span className="hidden sm:inline">{flaggedQuestions.includes(currentQuestion.id) ? "Đã đánh dấu" : "Đánh dấu"}</span>
                       </Button>
                       <Badge variant="outline">{currentQuestion.question_type === "multiple_choice" ? "Nhiều đáp án" : "Một đáp án"}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 px-0 md:px-6">
                  <RichTextDisplay content={currentQuestion.content} className="text-base leading-relaxed" />
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
                               <RichTextDisplay content={choice.content} className="text-base" />
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
                    const isFlagged = flaggedQuestions.includes(qId);
                    
                    let btnVariant = currentQuestionIndex === idx ? "default" : hasAns ? "secondary" : "outline";
                    let className = "h-10";
                    if (isFlagged && currentQuestionIndex !== idx) {
                      className += " bg-yellow-500 text-white hover:bg-yellow-600 border-0";
                      btnVariant = "default";
                    }
                    
                    return <Button key={idx} variant={btnVariant as any} size="sm" onClick={() => setCurrentQuestionIndex(idx)} className={className}>{idx + 1}</Button>;
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