"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Loader2, AlertCircle, CheckCircle2, Circle } from "lucide-react";
import RichTextDisplay from "./RichTextDisplay";
import { Badge } from "@/components/ui/badge";

interface Choice {
  id: number;
  content: string;
  attachment_url?: string;
}

interface Question {
  id: number;
  content: string;
  choices: Choice[];
  question_type: string;
  difficulty: string;
  section_name?: string;
}

interface ExamPreviewData {
  id: number;
  title: string;
  description: string;
  questions: Question[];
}

interface ExamPreviewDialogProps {
  examId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExamPreviewDialog({ examId, isOpen, onClose }: ExamPreviewDialogProps) {
  const [data, setData] = useState<ExamPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && examId) {
      const fetchPreview = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await api.get(`/exams/${examId}/preview`);
          setData(res.data.data);
        } catch (err: any) {
          setError(err.response?.data?.error || "Không thể tải bản xem trước đề thi.");
        } finally {
          setIsLoading(false);
        }
      };
      fetchPreview();
    }
  }, [isOpen, examId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Xem trước nội dung đề thi (Mẫu ngẫu nhiên)</DialogTitle>
          <DialogDescription>
            Đây là danh sách câu hỏi mẫu được sinh ra dựa trên cấu hình đề thi động của bạn.
            Mỗi học sinh sẽ nhận được một bộ câu hỏi khác nhau.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Đang sinh đề thi mẫu...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-destructive">
            <AlertCircle className="h-8 w-8" />
            <p className="font-medium">{error}</p>
          </div>
        ) : data ? (
          <div className="overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-8 py-4">
              <div className="bg-muted/30 p-4 rounded-lg border">
                <h3 className="font-bold text-lg mb-1">{data.title}</h3>
                <p className="text-sm text-muted-foreground">{data.description || "Không có mô tả"}</p>
                <div className="mt-2 flex gap-4 text-xs">
                    <span>Tổng số câu: <span className="font-bold">{data.questions.length}</span></span>
                </div>
              </div>

              {data.questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-xl">
                  Chưa có câu hỏi nào được sinh ra. Kiểm tra lại cấu hình đề thi.
                </div>
              ) : (
                data.questions.map((q, idx) => (
                  <div key={q.id} className="space-y-3 border-b pb-8 last:border-0 last:pb-0">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 bg-primary/10 text-primary font-bold w-8 h-8 rounded-full flex items-center justify-center text-sm">
                        {idx + 1}
                      </span>
                      <div className="flex-grow space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline">{q.difficulty === 'easy' ? 'Dễ' : q.difficulty === 'hard' ? 'Khó' : 'Trung bình'}</Badge>
                          <Badge variant="secondary">{q.section_name || 'Chung'}</Badge>
                          <Badge variant="outline" className="opacity-70">
                            {q.question_type === 'multiple_choice' ? 'Nhiều lựa chọn' :
                              q.question_type === 'single_choice' ? 'Một lựa chọn' :
                                q.question_type === 'short_answer' ? 'Trả lời ngắn' :
                                  q.question_type === 'essay' ? 'Tự luận' : 'Điền vào chỗ trống'}
                          </Badge>
                        </div>
                        <div className="text-base font-medium">
                          <RichTextDisplay content={q.content} />
                        </div>
                        
                        {q.question_type !== 'essay' && q.question_type !== 'short_answer' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                            {q.choices.map((choice) => (
                              <div key={choice.id} className="flex items-start gap-3 p-3 rounded-md border bg-card/50">
                                <Circle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div className="text-sm">
                                  <RichTextDisplay content={choice.content} />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="mt-4 p-4 border rounded-md bg-muted/20 border-dashed">
                            <p className="text-sm text-muted-foreground italic">
                              Học sinh sẽ nhập câu trả lời văn bản cho loại câu hỏi này.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
