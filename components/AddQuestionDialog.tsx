// components/AddQuestionDialog.tsx
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Plus, Trash2, CheckCircle2, Circle, Square, CheckSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddQuestionDialogProps {
  examId: number;
  topicId: number;
  onSuccess: () => void;
  // === THÊM MỚI ===
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionToEdit?: any; // Dữ liệu câu hỏi cần sửa
}

export function AddQuestionDialog({ examId, topicId, onSuccess, open, onOpenChange, questionToEdit }: AddQuestionDialogProps) {
  const [loading, setLoading] = useState(false);

  const [content, setContent] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionType, setQuestionType] = useState("single_choice");
  const [explanation, setExplanation] = useState("");
  
  const [choices, setChoices] = useState([
    { content: "", isCorrect: true },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
    { content: "", isCorrect: false },
  ]);

  // === EFFECT: TỰ ĐỘNG ĐIỀN DỮ LIỆU KHI SỬA ===
  useEffect(() => {
    if (open) {
        if (questionToEdit) {
            // Chế độ Sửa
            setContent(questionToEdit.content);
            setDifficulty(questionToEdit.difficulty || "medium");
            setExplanation(questionToEdit.explanation || "");
            // Map choices từ API về format của state
            if (questionToEdit.choices) {
                setChoices(questionToEdit.choices.map((c: any) => ({
                    content: c.content,
                    isCorrect: c.is_correct || false
                })));
            }
            // (Tạm thời hardcode single_choice nếu API chưa trả về type)
            setQuestionType(questionToEdit.question_type || "single_choice"); 
        } else {
            // Chế độ Tạo mới: Reset form
            setContent("");
            setExplanation("");
            setQuestionType("single_choice");
            setChoices([
                { content: "", isCorrect: true },
                { content: "", isCorrect: false },
                { content: "", isCorrect: false },
                { content: "", isCorrect: false },
            ]);
        }
    }
  }, [open, questionToEdit]);

  const handleChoiceChange = (index: number, val: string) => {
    const newChoices = [...choices];
    newChoices[index].content = val;
    setChoices(newChoices);
  };

  const toggleCorrectAnswer = (index: number) => {
    const newChoices = [...choices];
    if (questionType === "single_choice") {
      newChoices.forEach((c, i) => c.isCorrect = i === index);
    } else {
      newChoices[index].isCorrect = !newChoices[index].isCorrect;
    }
    setChoices(newChoices);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return toast.error("Chưa nhập nội dung");
    const correctCount = choices.filter(c => c.isCorrect).length;
    if (correctCount === 0) return toast.error("Phải có đáp án đúng");

    setLoading(true);
    try {
      const payload = {
        topic_id: topicId,
        content,
        question_type: questionType,
        difficulty,
        explanation,
        choices: choices.map(c => ({ content: c.content, is_correct: c.isCorrect })),
        exam_id: examId,
      };

      if (questionToEdit) {
        // === GỌI API UPDATE ===
        await api.put(`/questions/${questionToEdit.id}`, payload);
        toast.success("Cập nhật câu hỏi thành công!");
      } else {
        // === GỌI API CREATE ===
        await api.post("/questions", payload);
        toast.success("Thêm câu hỏi thành công!");
      }

      onOpenChange(false);
      onSuccess();

    } catch (error) {
      toast.error("Lỗi khi lưu câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{questionToEdit ? "Chỉnh Sửa Câu Hỏi" : "Thêm Câu Hỏi Mới"}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-2">
                <Label>Loại câu hỏi</Label>
                <Select value={questionType} onValueChange={setQuestionType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_choice">Một đáp án đúng</SelectItem>
                    <SelectItem value="multiple_choice">Nhiều đáp án đúng</SelectItem>
                  </SelectContent>
                </Select>
             </div>
             <div className="space-y-2">
                <Label>Độ khó</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Dễ</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="hard">Khó</SelectItem>
                  </SelectContent>
                </Select>
             </div>
          </div>

          <div className="space-y-2">
            <Label>Nội dung câu hỏi</Label>
            <Textarea value={content} onChange={e => setContent(e.target.value)} />
          </div>

          <div className="space-y-3">
            <Label>Các lựa chọn</Label>
            {choices.map((choice, index) => (
              <div key={index} className="flex items-center gap-3">
                <button onClick={() => toggleCorrectAnswer(index)} type="button">
                  {questionType === "single_choice" ? (
                      choice.isCorrect ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : <Circle className="h-6 w-6 text-muted-foreground" />
                  ) : (
                      choice.isCorrect ? <CheckSquare className="h-6 w-6 text-blue-600" /> : <Square className="h-6 w-6 text-muted-foreground" />
                  )}
                </button>
                <Input 
                  value={choice.content} 
                  onChange={e => handleChoiceChange(index, e.target.value)} 
                  className={choice.isCorrect ? "border-green-500 ring-1 ring-green-500 bg-green-50/30" : ""}
                />
                <Button variant="ghost" size="icon" onClick={() => {
                    const newChoices = choices.filter((_, i) => i !== index);
                    setChoices(newChoices);
                }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setChoices([...choices, { content: "", isCorrect: false }])}>
              <Plus className="mr-2 h-3 w-3" /> Thêm lựa chọn
            </Button>
          </div>

          <div className="space-y-2">
             <Label>Giải thích đáp án</Label>
             <Textarea value={explanation} onChange={e => setExplanation(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Đang lưu..." : "Lưu Câu Hỏi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}