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

// ===== INTERFACE SỬA LỖI =====
interface AddQuestionDialogProps {
  examId: number;
  topicId: number;
  onSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionToEdit?: {
    id: number;
    content: string;
    question_type: string;
    difficulty: string;
    explanation?: string;
    choices?: Array<{
      id: number;
      content: string;
      is_correct: boolean;
    }>;
  } | null;
}

export function AddQuestionDialog({ 
  examId, 
  topicId, 
  onSuccess, 
  open, 
  onOpenChange, 
  questionToEdit 
}: AddQuestionDialogProps) {
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

  // ===== EFFECT: TỰ ĐỘNG ĐIỀN DỮ LIỆU KHI SỬA =====
  useEffect(() => {
    if (open) {
      if (questionToEdit) {
        // Chế độ Sửa: Fill dữ liệu
        setContent(questionToEdit.content);
        setDifficulty(questionToEdit.difficulty || "medium");
        setQuestionType(questionToEdit.question_type || "single_choice");
        setExplanation(questionToEdit.explanation || "");
        
        // Map choices từ API về format của state
        if (questionToEdit.choices && questionToEdit.choices.length > 0) {
          setChoices(questionToEdit.choices.map((c) => ({
            content: c.content,
            isCorrect: c.is_correct || false
          })));
        }
      } else {
        // Chế độ Tạo mới: Reset form
        setContent("");
        setDifficulty("medium");
        setQuestionType("single_choice");
        setExplanation("");
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
      // Single choice: Chỉ 1 đáp án đúng
      newChoices.forEach((c, i) => c.isCorrect = i === index);
    } else {
      // Multiple choice: Có thể nhiều đáp án đúng
      newChoices[index].isCorrect = !newChoices[index].isCorrect;
    }
    setChoices(newChoices);
  };

  const addChoice = () => {
    if (choices.length >= 6) {
      return toast.error("Tối đa 6 lựa chọn");
    }
    setChoices([...choices, { content: "", isCorrect: false }]);
  };

  const removeChoice = (index: number) => {
    if (choices.length <= 2) {
      return toast.error("Cần ít nhất 2 lựa chọn");
    }
    setChoices(choices.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    // Validation
    if (!content.trim()) {
      return toast.error("Chưa nhập nội dung câu hỏi");
    }

    const correctCount = choices.filter(c => c.isCorrect).length;
    if (correctCount === 0) {
      return toast.error("Phải có ít nhất 1 đáp án đúng");
    }

    const emptyChoices = choices.filter(c => !c.content.trim());
    if (emptyChoices.length > 0) {
      return toast.error("Có lựa chọn chưa điền nội dung");
    }

    setLoading(true);
    try {
      const payload = {
        topic_id: topicId,
        content,
        question_type: questionType,
        difficulty,
        explanation,
        choices: choices.map(c => ({ 
          content: c.content, 
          is_correct: c.isCorrect 
        })),
        exam_id: examId,
      };

      if (questionToEdit) {
        // ===== GỌI API UPDATE =====
        await api.put(`/questions/${questionToEdit.id}`, payload);
        toast.success("Cập nhật câu hỏi thành công!");
      } else {
        // ===== GỌI API CREATE =====
        await api.post("/questions", payload);
        toast.success("Thêm câu hỏi thành công!");
      }

      onOpenChange(false); // Đóng dialog
      onSuccess(); // Callback để refresh danh sách

    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error?.message || "Lỗi khi lưu câu hỏi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {questionToEdit ? "✏️ Sửa câu hỏi" : "➕ Thêm câu hỏi mới"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* CONTENT */}
          <div className="space-y-2">
            <Label>Nội dung câu hỏi *</Label>
            <Textarea
              placeholder="Nhập câu hỏi của bạn..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          {/* TYPE & DIFFICULTY */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loại câu hỏi</Label>
              <Select value={questionType} onValueChange={setQuestionType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_choice">Một đáp án đúng</SelectItem>
                  <SelectItem value="multiple_choice">Nhiều đáp án đúng</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Độ khó</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Dễ</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="hard">Khó</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* CHOICES */}
          <div className="space-y-2">
            <Label>Các lựa chọn *</Label>
            <div className="space-y-2">
              {choices.map((choice, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => toggleCorrectAnswer(index)}
                    className="shrink-0"
                  >
                    {choice.isCorrect ? (
                      questionType === "single_choice" ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      ) : (
                        <CheckSquare className="h-5 w-5 text-green-600" />
                      )
                    ) : (
                      questionType === "single_choice" ? (
                        <Circle className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )
                    )}
                  </button>

                  <Input
                    placeholder={`Lựa chọn ${String.fromCharCode(65 + index)}`}
                    value={choice.content}
                    onChange={(e) => handleChoiceChange(index, e.target.value)}
                    className="flex-1"
                  />

                  {choices.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeChoice(index)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addChoice}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Thêm lựa chọn
            </Button>
          </div>

          {/* EXPLANATION (Optional) */}
          <div className="space-y-2">
            <Label>Giải thích (tùy chọn)</Label>
            <Textarea
              placeholder="Giải thích đáp án đúng..."
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              questionToEdit ? "Cập nhật" : "Thêm câu hỏi"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}