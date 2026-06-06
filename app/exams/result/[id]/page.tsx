"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  Loader2, CheckCircle, XCircle, Trophy, ArrowRight,
  RefreshCcw, Calendar, Check, X, AlertCircle, Sparkles, MessageSquare, Send
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import RichTextDisplay from "@/components/RichTextDisplay";
import { MediaRenderer } from "@/components/MediaRenderer";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface ChoiceReview {
  id: number;
  content: string;
  is_correct: boolean;
  user_selected: boolean;
  attachment_url?: string;
}

interface ChatTurn {
  role: 'user' | 'model';
  content: string;
}

interface SubmissionDetail {
  question_id: number;
  question_content: string;
  explanation: string;
  question_type: string;
  is_correct: boolean;
  choices: ChoiceReview[];
  attachment_url?: string;
  text_answer?: string;
  is_graded?: boolean;
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
  const [aiExplanations, setAiExplanations] = useState<Record<number, string>>({});
  const [loadingAI, setLoadingAI] = useState<Record<number, boolean>>({});
  const [chatHistories, setChatHistories] = useState<Record<number, ChatTurn[]>>({});
  const [inputTexts, setInputTexts] = useState<Record<number, string>>({});
  const [isChatLoading, setIsChatLoading] = useState<Record<number, boolean>>({});

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/submissions/${submissionId}`);
        const data = response.data.data;

        console.log("Submission Data:", data);

        setResult(data);

        if ((data.score ?? 0) >= 8.0) {
          triggerConfetti();
        }
      } catch (error) {
        console.error("Lỗi tải kết quả:", error);
        toast.error("Không tìm thấy kết quả bài thi.");
      } finally {
        setIsLoading(false);
      }
    };

    if (submissionId) fetchResult();
  }, [submissionId, router]);

  const handleAskAI = async (item: SubmissionDetail) => {
    const qId = item.question_id;
    if (aiExplanations[qId]) return;

    try {
      setLoadingAI(prev => ({ ...prev, [qId]: true }));

      const payload = {
        question_content: item.question_content,
        choices: item.choices.map(c => c.content),
        correct_choice: (item.question_type === "short_answer") ? item.choices.map(c => c.content).join(" hoặc ") : (item.choices.find(c => c.is_correct)?.content || ""),
        user_choice: (item.question_type === "short_answer" || item.question_type === "essay") ? (item.text_answer || "Không chọn") : (item.choices.find(c => c.user_selected)?.content || "Không chọn")
      };

      const response = await api.post("/ai/explain", payload);

      if (response.data.success) {
        const explanation = response.data.data.explanation;
        setAiExplanations(prev => ({
          ...prev,
          [qId]: explanation
        }));
        setChatHistories(prev => ({
          ...prev,
          [qId]: [{ role: 'model', content: explanation }]
        }));
      } else {
        toast.error("Không thể lấy giải thích từ AI");
      }
    } catch (error) {
      console.error("AI Explain Error:", error);
      toast.error("Lỗi khi kết nối với dịch vụ AI");
    } finally {
      setLoadingAI(prev => ({ ...prev, [qId]: false }));
    }
  };

  const handleSendMessage = async (item: SubmissionDetail) => {
    const qId = item.question_id;
    const message = inputTexts[qId]?.trim();
    if (!message || isChatLoading[qId]) return;

    setInputTexts(prev => ({ ...prev, [qId]: "" }));

    const newUserTurn: ChatTurn = { role: 'user', content: message };
    const currentHistory = chatHistories[qId] || [];
    const updatedHistory = [...currentHistory, newUserTurn];

    setChatHistories(prev => ({ ...prev, [qId]: updatedHistory }));

    try {
      setIsChatLoading(prev => ({ ...prev, [qId]: true }));

      const payload = {
        question_content: item.question_content,
        choices: item.choices.map(c => c.content),
        correct_choice: (item.question_type === "short_answer") ? item.choices.map(c => c.content).join(" hoặc ") : (item.choices.find(c => c.is_correct)?.content || ""),
        user_choice: (item.question_type === "short_answer" || item.question_type === "essay") ? (item.text_answer || "Không chọn") : (item.choices.find(c => c.user_selected)?.content || "Không chọn"),
        history: currentHistory,
        new_message: message
      };

      const response = await api.post("/ai/chat", payload);

      if (response.data.success) {
        const reply = response.data.data.reply;
        setChatHistories(prev => ({
          ...prev,
          [qId]: [...updatedHistory, { role: 'model', content: reply }]
        }));
      } else {
        toast.error("AI không thể phản hồi lúc này.");
      }
    } catch (error) {
      console.error("AI Chat Error:", error);
      toast.error("Lỗi kết nối khi chat với AI");
    } finally {
      setIsChatLoading(prev => ({ ...prev, [qId]: false }));
    }
  };

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

  const score = result.score ?? 0;
  const correctCount = result.correct_count ?? 0;
  const totalQuestions = result.total_questions ?? 0;
  const ungradedCount = result.details?.filter(item => item.question_type === "essay" && !item.is_graded).length ?? 0;
  const wrongCount = Math.max(0, totalQuestions - correctCount - ungradedCount);
  const isPass = score >= 5.0;
  const isAwaitingGrading = ungradedCount > 0 && score < 5.0;
  const submittedDate = result.submitted_at ? new Date(result.submitted_at).toLocaleString('vi-VN') : "N/A";

  return (
    <div className="min-h-screen w-full bg-muted/30 py-8 px-4 flex flex-col items-center">
      <Card className={`w-full max-w-2xl shadow-xl border-t-8 ${isAwaitingGrading ? "border-t-amber-500" : (isPass ? "border-t-green-500" : "border-t-red-500")} mb-8`}>
          <CardHeader className="text-center pb-2">
            <div className={`mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full ${isAwaitingGrading ? "bg-amber-100 dark:bg-amber-950/30" : (isPass ? "bg-green-100 dark:bg-green-950/30" : "bg-red-100 dark:bg-red-950/30")}`}>
              {isAwaitingGrading ? (
                <AlertCircle className="h-12 w-12 text-amber-600 dark:text-amber-400 drop-shadow-sm" />
              ) : isPass ? (
                <Trophy className="h-12 w-12 text-green-600 dark:text-green-400 drop-shadow-sm" />
              ) : (
                <XCircle className="h-12 w-12 text-red-600 dark:text-red-400 drop-shadow-sm" />
              )}
            </div>
            <CardTitle className={`text-4xl font-black tracking-tight ${isAwaitingGrading ? "text-amber-700 dark:text-amber-400" : (isPass ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}`}>
              {isAwaitingGrading ? "ĐANG CHỜ CHẤM ĐIỂM" : (isPass ? "XIN CHÚC MỪNG!" : "CỐ GẮNG LẦN SAU NHÉ!")}
            </CardTitle>
            <p className="text-muted-foreground text-xl mt-2 font-medium">
              {result.exam_title || "Bài thi không tên"}
            </p>
          </CardHeader>

          <CardContent className="space-y-8 pt-6">
            <div className="flex flex-col items-center justify-center">
              <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">Tổng Điểm</span>
              <div className="flex items-baseline">
                <span className="text-7xl font-black text-foreground tracking-tighter">
                  {score}
                </span>
                <span className="text-3xl text-muted-foreground font-medium">/10</span>
              </div>
              {ungradedCount > 0 && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg text-amber-900 dark:text-amber-300 text-xs font-semibold max-w-md text-center flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>
                    Bài thi có <strong>{ungradedCount} câu tự luận chưa được chấm điểm</strong>. Điểm số hiện tại là tạm thời và có thể thay đổi sau khi giáo viên chấm bài.
                  </span>
                </div>
              )}
            </div>

            <div className={`grid ${ungradedCount > 0 ? "grid-cols-3" : "grid-cols-2"} gap-4`}>
              <div className="flex flex-col items-center p-5 bg-green-50/50 dark:bg-green-950/10 border border-green-100 dark:border-green-900/30 rounded-xl justify-center text-center">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="text-xs sm:text-sm font-bold text-green-700 dark:text-green-400 uppercase">Câu Đúng</span>
                </div>
                <span className="text-3xl font-bold text-foreground">
                  {correctCount}
                </span>
              </div>

              <div className="flex flex-col items-center p-5 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-xl justify-center text-center">
                <div className="flex items-center gap-2 mb-1">
                  <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                  <span className="text-xs sm:text-sm font-bold text-red-700 dark:text-red-400 uppercase">Câu Sai</span>
                </div>
                <span className="text-3xl font-bold text-foreground">
                  {wrongCount >= 0 ? wrongCount : 0}
                </span>
              </div>

              {ungradedCount > 0 && (
                <div className="flex flex-col items-center p-5 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/30 rounded-xl justify-center text-center">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 uppercase">Chờ Chấm</span>
                  </div>
                  <span className="text-3xl font-bold text-foreground">
                    {ungradedCount}
                  </span>
                </div>
              )}
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

      {result.details && result.details.length > 0 ? (
        <div className="w-full max-w-2xl space-y-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-2xl font-bold">Xem lại bài làm</h2>
            <Badge variant="outline" className="text-sm">{result.details.length} câu hỏi</Badge>
          </div>

          {result.details.map((item, idx) => (
            <Card key={item.question_id || idx} className={`overflow-hidden border-l-4 ${(item.question_type === "essay" && !item.is_graded) ? "border-l-amber-500 bg-amber-50/5" : (item.is_correct ? "border-l-green-500" : "border-l-red-500")}`}>
              <CardHeader className="pb-3 bg-muted/5">
                <div className="flex items-start gap-4">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${(item.question_type === "essay" && !item.is_graded) ? "bg-amber-500" : (item.is_correct ? "bg-green-600" : "bg-red-600")}`}>
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <RichTextDisplay content={item.question_content} className="text-lg font-medium leading-relaxed" />
                    <MediaRenderer url={item.attachment_url} />
                  </div>
                  {(item.question_type === "essay" && !item.is_graded) ? (
                    <Badge className="bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-950/40 border-amber-200 dark:border-amber-900/30 shrink-0"><AlertCircle className="w-3 h-3 mr-1" /> Chờ chấm</Badge>
                  ) : item.is_correct ? (
                    <Badge className="bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-950/40 border-green-200 dark:border-green-900/30 shrink-0"><Check className="w-3 h-3 mr-1" /> Đúng</Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 border-red-200 dark:border-red-900/30 shrink-0"><X className="w-3 h-3 mr-1" /> Sai</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="pt-4 space-y-4">
                {(item.question_type === "short_answer" || item.question_type === "essay") ? (
                  <div className="space-y-4">
                     <div className={`p-4 rounded-lg border ${item.question_type === "essay" ? "bg-background/50 border-border text-foreground" : (item.is_correct ? "border-green-500 dark:border-green-800 bg-green-50 dark:bg-green-950/20 text-green-900 dark:text-green-300" : "border-red-500 dark:border-red-850 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-300")}`}>
                        <span className={`text-sm font-semibold uppercase mb-2 block ${item.question_type === "essay" ? "text-muted-foreground" : (item.is_correct ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400")}`}>Câu trả lời của bạn:</span>
                        <div className="text-base whitespace-pre-wrap">{item.text_answer || (item.choices && item.choices.some(c => c.user_selected) ? "" : <span className="italic opacity-70">Không có câu trả lời văn bản</span>)}</div>

                        {item.choices && item.choices.some(c => c.user_selected) && (
                           <div className="mt-3 pt-3 border-t border-dashed border-muted-foreground/20 space-y-2">
                              <span className="text-xs font-semibold text-muted-foreground uppercase block">Lựa chọn đã chọn:</span>
                              {item.choices.filter(c => c.user_selected).map(c => (
                                 <div key={c.id} className={`p-2 rounded flex items-center gap-2 text-sm ${c.is_correct ? "bg-green-100/50 dark:bg-green-950/30 text-green-800 dark:text-green-300" : "bg-red-100/50 dark:bg-red-950/30 text-red-800 dark:text-red-300"}`}>
                                    {c.is_correct ? <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" /> : <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />}
                                    <RichTextDisplay content={c.content} />
                                 </div>
                              ))}
                           </div>
                        )}
                     </div>
                     {item.question_type !== "essay" && (
                         <div className="p-4 rounded-lg border border-green-500 dark:border-green-800 bg-green-50/40 dark:bg-green-950/20 text-green-900 dark:text-green-300">
                            <span className="text-sm font-semibold text-green-700 dark:text-green-400 uppercase mb-2 block">Đáp án được chấp nhận:</span>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                               {item.choices?.map(c => <li key={c.id} className="font-medium">{c.content}</li>)}
                            </ul>
                         </div>
                     )}
                  </div>
                ) : (
                <div className="space-y-2">
                  {item.choices?.map((choice) => {
                    let styleClass = "border bg-background/50";
                    let icon = <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />;

                    if (choice.is_correct) {
                      styleClass = "border-green-500 dark:border-green-800 bg-green-50/40 dark:bg-green-950/20 text-green-900 dark:text-green-300";
                      icon = <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 fill-green-100 dark:fill-green-950/40" />;
                    }

                    if (choice.user_selected) {
                      if (choice.is_correct) {
                        styleClass = "border-green-600 dark:border-green-700 bg-green-100 dark:bg-green-950/30 text-green-900 dark:text-green-300 font-medium ring-1 ring-green-600 dark:ring-green-700";
                        icon = <CheckCircle className="w-5 h-5 text-green-700 dark:text-green-400 fill-green-200 dark:fill-green-900/40" />;
                      } else {
                        styleClass = "border-red-500 dark:border-red-800 bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-300 ring-1 ring-red-500 dark:ring-red-800";
                        icon = <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 fill-red-100 dark:fill-red-950/40" />;
                      }
                    }

                    return (
                      <div key={choice.id} className={`p-3 rounded-lg text-sm flex items-center gap-3 transition-colors ${styleClass}`}>
                        <div className="shrink-0">{icon}</div>
                        <div className="flex-1">
                          <RichTextDisplay content={choice.content} className={choice.is_correct ? "font-bold" : ""} />
                          <MediaRenderer url={choice.attachment_url} />
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {choice.user_selected && <span className="text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded text-foreground">Bạn chọn</span>}
                          {choice.is_correct && <span className="text-[10px] font-bold uppercase tracking-wider bg-green-200 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">Đáp án đúng</span>}
                        </div>
                      </div>
                    )
                  })}
                </div>
                )}

                {item.explanation && (
                  <div className="mt-4 p-4 bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-lg text-blue-900 dark:text-blue-300 flex gap-3 items-start">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-blue-700 dark:text-blue-400 block mb-1 text-xs uppercase tracking-wider">Giải thích từ giáo viên:</span>
                      <RichTextDisplay content={item.explanation} className="text-sm leading-relaxed opacity-90 text-foreground" />
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-dashed">
                  {!aiExplanations[item.question_id] ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAskAI(item)}
                      disabled={loadingAI[item.question_id]}
                      className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-400 text-indigo-700 transition-all duration-300 group shadow-sm dark:from-indigo-950/20 dark:to-purple-950/20 dark:border-indigo-800 dark:text-indigo-300"
                    >
                      {loadingAI[item.question_id] ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
                      )}
                      Hỏi AI Trợ Giảng giải thích
                    </Button>
                  ) : (
                    <div className="bg-gradient-to-br from-indigo-50/80 via-white to-purple-50/80 dark:from-indigo-950/10 dark:via-background dark:to-purple-950/10 border border-indigo-100 dark:border-indigo-900/40 rounded-xl p-5 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Sparkles className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
                      </div>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="bg-indigo-600 p-1.5 rounded-lg shadow-indigo-200 shadow-lg dark:shadow-none">
                          <MessageSquare className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-indigo-900 dark:text-indigo-300 text-sm uppercase tracking-tighter">AI Tutor Conversation</span>
                        <Badge variant="secondary" className="ml-auto text-[10px] bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800">✨ Interactive</Badge>
                      </div>

                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mb-4">
                        {chatHistories[item.question_id]?.map((chat, cIdx) => (
                          <div key={cIdx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                              chat.role === 'user'
                                ? 'bg-indigo-600 text-white rounded-tr-none'
                                : 'bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950 text-slate-700 dark:text-slate-350 rounded-tl-none'
                            }`}>
                              {chat.role === 'user' ? (
                                <RichTextDisplay content={chat.content} className="text-white" />
                              ) : (
                                <div className="prose prose-sm prose-indigo dark:prose-invert max-w-none break-words">
                                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                    {chat.content}
                                  </ReactMarkdown>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                        {isChatLoading[item.question_id] && (
                           <div className="flex justify-start">
                             <div className="bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-950 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-2">
                               <div className="flex gap-1">
                                 <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                 <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                 <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" />
                               </div>
                               <span className="text-xs text-muted-foreground font-medium italic">Gia sư đang gõ...</span>
                             </div>
                           </div>
                        )}
                      </div>

                      <div className="flex gap-2 relative mt-2 pt-3 border-t border-indigo-100/50">
                        <input
                          type="text"
                          placeholder="Hỏi thêm gia sư về câu này..."
                          value={inputTexts[item.question_id] || ""}
                          onChange={(e) => setInputTexts(prev => ({ ...prev, [item.question_id]: e.target.value }))}
                          onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(item)}
                          className="flex-1 bg-white/50 dark:bg-background border border-indigo-200 dark:border-indigo-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-450 text-foreground"
                        />
                        <Button
                          size="icon"
                          onClick={() => handleSendMessage(item)}
                          disabled={isChatLoading[item.question_id] || !inputTexts[item.question_id]?.trim()}
                          className="rounded-full bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 shrink-0"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="w-full max-w-2xl border-yellow-200 dark:border-yellow-900/30 bg-yellow-50 dark:bg-yellow-950/10 shadow-lg text-foreground">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className="bg-white/60 dark:bg-yellow-950/30 p-4 rounded-full inline-block mb-2">
              <AlertCircle className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h3 className="text-2xl font-bold text-yellow-800 dark:text-yellow-450">Chi tiết đáp án không hiển thị</h3>
            <p className="text-yellow-700 dark:text-yellow-350 max-w-md mx-auto">
              Bài thi này được cấu hình ẩn đáp án chi tiết. Điểm số và trạng thái bài làm của bạn đã được ghi nhận thành công.
            </p>
            <div className="py-4">
              <div className="inline-flex flex-col items-start gap-2 bg-white/50 dark:bg-yellow-950/20 p-4 rounded-lg text-sm text-yellow-900 dark:text-yellow-300 border border-yellow-100 dark:border-yellow-900/30">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <p><strong>Trạng thái:</strong> {result.status === 'completed' ? 'Đã nộp bài thành công' : result.status}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <p><strong>Thời gian nộp:</strong> {submittedDate}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <Button variant="outline" className="bg-white dark:bg-slate-900 hover:bg-yellow-50 dark:hover:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900/30 text-yellow-900 dark:text-yellow-400" asChild>
                <Link href="/exams">
                  <RefreshCcw className="mr-2 h-4 w-4" /> Danh sách bài thi
                </Link>
              </Button>
              <Button className="bg-yellow-600 hover:bg-yellow-700 text-white dark:text-yellow-100 border-none shadow-md" asChild>
                <Link href="/dashboard">
                  Về Dashboard <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
