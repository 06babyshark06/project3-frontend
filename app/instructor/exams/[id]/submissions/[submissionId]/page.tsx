"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import RichTextDisplay from "@/components/RichTextDisplay";

// ===== INTERFACES =====
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
  text_answer?: string;
}

interface Submission {
  id: number;
  student_name: string;
  student_email: string;
  score: number;
  correct_count: number;
  total_questions: number;
  submitted_at: string;
  exam_title: string;
  details: SubmissionDetail[];
}

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { id: examId, submissionId } = params;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ===== FETCH SUBMISSION =====
  useEffect(() => {
    const fetchSubmission = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/submissions/${submissionId}`);
        setSubmission(res.data.data);
      } catch (error) {
        console.error(error);
        toast.error("Không thể tải chi tiết bài làm.");
      } finally {
        setIsLoading(false);
      }
    };

    if (submissionId) fetchSubmission();
  }, [submissionId]);

  const handleGrade = async (questionId: number, isCorrect: boolean) => {
    try {
      await api.post(`/submissions/${submissionId}/grade`, {
        question_id: questionId,
        is_correct: isCorrect,
      });
      toast.success("Đã cập nhật kết quả.");
      // Refresh data
      const res = await api.get(`/submissions/${submissionId}`);
      setSubmission(res.data.data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể chấm điểm.");
    }
  };

  // ===== LOADING =====
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="container mx-auto py-8 px-4">
        <p className="text-center text-muted-foreground">Không tìm thấy bài làm.</p>
      </div>
    );
  }

  // ===== CALCULATE STATS =====
  const totalQuestions = submission.total_questions || 0;
  const correctCount = submission.correct_count || 0;
  const wrongCount = totalQuestions - correctCount;

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* HEADER */}
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
      </Button>

      {/* STUDENT INFO */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{submission.exam_title}</CardTitle>
              <p className="text-muted-foreground mt-1">
                Bài làm của <strong>{submission.student_name}</strong> ({submission.student_email})
              </p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold text-primary">{(submission.score ?? 0).toFixed(2)}</p>
              <p className="text-sm text-muted-foreground">điểm</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{correctCount}</p>
              <p className="text-sm text-muted-foreground">Đúng</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{wrongCount}</p>
              <p className="text-sm text-muted-foreground">Sai</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalQuestions}</p>
              <p className="text-sm text-muted-foreground">Tổng câu</p>
            </div>
          </div>
          <Separator className="my-4" />
          <p className="text-sm text-muted-foreground text-center">
            Nộp bài lúc: {submission.submitted_at ? format(new Date(submission.submitted_at), "HH:mm:ss, dd/MM/yyyy", { locale: vi }) : "Chưa xác định"}
          </p>
        </CardContent>
      </Card>

      {/* QUESTIONS & ANSWERS */}
      <div className="space-y-6">
        {(submission.details || []).map((detail, idx) => {
          const isCorrect = detail.is_correct;

          return (
            <Card key={detail.question_id} className={isCorrect ? "border-green-500" : "border-red-500"}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={isCorrect ? "default" : "destructive"}>
                        {isCorrect ? (
                          <><CheckCircle className="mr-1 h-3 w-3" /> Đúng</>
                        ) : (
                          <><XCircle className="mr-1 h-3 w-3" /> Sai</>
                        )}
                      </Badge>
                      <Badge variant="outline">Câu {idx + 1}</Badge>
                      {detail.question_type === "multiple_choice" && (
                        <Badge variant="secondary">Nhiều đáp án</Badge>
                      )}
                    </div>
                    <RichTextDisplay content={detail.question_content} className="text-base font-medium" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                  {detail.question_type !== "single_choice" && detail.question_type !== "multiple_choice" && (
                    <div className="mb-4 p-4 rounded-lg bg-muted/50 border">
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Câu trả lời của học sinh:</p>
                      <div className="text-sm italic">
                        {detail.text_answer || <span className="text-muted-foreground text-xs">(Không có nội dung)</span>}
                      </div>
                    </div>
                  )}

                  {(detail.question_type === "essay" || detail.question_type === "short_answer") && (
                    <div className="flex items-center gap-3 mt-4 pt-4 border-t border-dashed">
                      <p className="text-sm font-medium text-muted-foreground">Chấm điểm thủ công:</p>
                      <Button 
                        size="sm" 
                        variant={detail.is_correct ? "default" : "outline"}
                        className={detail.is_correct ? "bg-green-600 hover:bg-green-700 border-green-200" : ""}
                        onClick={() => handleGrade(detail.question_id, true)}
                      >
                        <CheckCircle className="mr-1 h-3 w-3" /> Đạt (Đúng)
                      </Button>
                      <Button 
                        size="sm" 
                        variant={!detail.is_correct ? "destructive" : "outline"}
                        className={!detail.is_correct ? "bg-red-600 hover:bg-red-700 border-red-200" : ""}
                        onClick={() => handleGrade(detail.question_id, false)}
                      >
                        <XCircle className="mr-1 h-3 w-3" /> Chưa đạt (Sai)
                      </Button>
                      <p className="text-[10px] text-muted-foreground italic ml-auto">
                        * Tự luận luôn cần chấm thủ công. Trả lời ngắn đã được tự động chấm nhưng bạn vẫn có thể thay đổi.
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    {detail.choices.length > 0 && (
                      <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                        {detail.question_type === "single_choice" || detail.question_type === "multiple_choice" ? "Các lựa chọn:" : "Các đáp án chấp nhận được:"}
                      </p>
                    )}
                    {detail.choices.map((choice) => {
                      const isChosen = choice.user_selected;
                      const isCorrectChoice = choice.is_correct;

                      let bgColor = "";
                      let borderColor = "";
                      let textColor = "";

                      if (isChosen && isCorrectChoice) {
                        bgColor = "bg-green-50 dark:bg-green-950";
                        borderColor = "border-green-500";
                        textColor = "text-green-700 dark:text-green-300";
                      } else if (isChosen && !isCorrectChoice) {
                        bgColor = "bg-red-50 dark:bg-red-950";
                        borderColor = "border-red-500";
                        textColor = "text-red-700 dark:text-red-300";
                      } else if (!isChosen && isCorrectChoice) {
                        bgColor = "bg-blue-50 dark:bg-blue-950";
                        borderColor = "border-blue-500";
                        textColor = "text-blue-700 dark:text-blue-300";
                      } else {
                        bgColor = "bg-muted/30";
                        borderColor = "border-border";
                        textColor = "text-muted-foreground";
                      }

                      return (
                        <div
                          key={choice.id}
                          className={`p-3 border-2 rounded-lg ${bgColor} ${borderColor}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 mt-0.5">
                              {isChosen && isCorrectChoice && <CheckCircle className="h-5 w-5 text-green-600" />}
                              {isChosen && !isCorrectChoice && <XCircle className="h-5 w-5 text-red-600" />}
                              {!isChosen && isCorrectChoice && <CheckCircle className="h-5 w-5 text-blue-600" />}
                            </div>
                            <div className="flex-1">
                               <RichTextDisplay content={choice.content} className={`text-sm ${textColor}`} />
                              {isChosen && <Badge variant="outline" className="mt-1">Đã chọn</Badge>}
                              {!isChosen && isCorrectChoice && (
                                <Badge variant="outline" className="mt-1 border-blue-500 text-blue-600">
                                  Đáp án đúng
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}