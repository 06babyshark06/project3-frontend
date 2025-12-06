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

// ===== INTERFACES =====
interface Choice {
  id: number;
  content: string;
  is_correct: boolean;
}

interface Question {
  id: number;
  content: string;
  question_type: string;
  choices: Choice[];
}

interface Answer {
  question_id: number;
  chosen_choice_ids: number[];
  is_correct: boolean;
}

interface Submission {
  id: number;
  student_name: string;
  student_email: string;
  score: number;
  submitted_at: string;
  exam_title: string;
  questions: Question[];
  answers: Answer[];
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
  const totalQuestions = submission.questions.length;
  const correctCount = submission.answers.filter(a => a.is_correct).length;
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
              <p className="text-4xl font-bold text-primary">{submission.score.toFixed(2)}</p>
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
            Nộp bài lúc: {format(new Date(submission.submitted_at), "HH:mm:ss, dd/MM/yyyy", { locale: vi })}
          </p>
        </CardContent>
      </Card>

      {/* QUESTIONS & ANSWERS */}
      <div className="space-y-6">
        {submission.questions.map((question, idx) => {
          const answer = submission.answers.find(a => a.question_id === question.id);
          const chosenIds = answer?.chosen_choice_ids || [];
          const isCorrect = answer?.is_correct || false;

          return (
            <Card key={question.id} className={isCorrect ? "border-green-500" : "border-red-500"}>
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
                      {question.question_type === "multiple_choice" && (
                        <Badge variant="secondary">Nhiều đáp án</Badge>
                      )}
                    </div>
                    <p className="text-base font-medium">{question.content}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {question.choices.map((choice) => {
                    const isChosen = chosenIds.includes(choice.id);
                    const isCorrectChoice = choice.is_correct;

                    let bgColor = "";
                    let borderColor = "";
                    let textColor = "";

                    if (isChosen && isCorrectChoice) {
                      // Học sinh chọn đúng
                      bgColor = "bg-green-50 dark:bg-green-950";
                      borderColor = "border-green-500";
                      textColor = "text-green-700 dark:text-green-300";
                    } else if (isChosen && !isCorrectChoice) {
                      // Học sinh chọn sai
                      bgColor = "bg-red-50 dark:bg-red-950";
                      borderColor = "border-red-500";
                      textColor = "text-red-700 dark:text-red-300";
                    } else if (!isChosen && isCorrectChoice) {
                      // Đáp án đúng nhưng học sinh không chọn
                      bgColor = "bg-blue-50 dark:bg-blue-950";
                      borderColor = "border-blue-500";
                      textColor = "text-blue-700 dark:text-blue-300";
                    } else {
                      // Đáp án sai và không được chọn
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
                            <p className={`text-sm ${textColor}`}>{choice.content}</p>
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