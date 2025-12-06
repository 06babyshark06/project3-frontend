"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AddQuestionDialog } from "@/components/AddQuestionDialog";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import { toast } from "sonner";
import {
  Loader2, ArrowLeft, Trash2, Clock, Pencil, PlusCircle,
  FileQuestion, BarChart3
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

interface ExamSettings {
  duration_minutes: number;
  password?: string;
  shuffle_questions?: boolean;
  max_attempts?: number;
  requires_approval?: boolean;
  show_result_immediately?: boolean;
}

interface Exam {
  id: number;
  title: string;
  description: string;
  is_published: boolean;
  topic_id: number;
  settings: ExamSettings;
  questions: any[];
}

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ===== FORM INFO STATE =====
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);

  // ===== SETTINGS STATE =====
  const [password, setPassword] = useState("");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [showResultImmediately, setShowResultImmediately] = useState(true);

  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);

  // ===== DIALOG STATE =====
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);

  // ===== 1. FETCH EXAM =====
  const fetchExam = async () => {
    try {
      const res = await api.get(`/exams/${examId}`);
      const data = res.data.data;
      setExam(data);

      setTitle(data.title);
      setDescription(data.description || "");
      setDuration(data.settings?.duration_minutes || 60);
      setPassword(data.settings?.password || "");
      setShuffleQuestions(data.settings?.shuffle_questions || false);
      setMaxAttempts(data.settings?.max_attempts || 1);
      setRequiresApproval(data.settings?.requires_approval || false);
      setShowResultImmediately(data.settings?.show_result_immediately || true);
    } catch (error) {
      toast.error("Không thể tải bài thi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (examId) fetchExam();
  }, [examId]);

  // ===== 2. UPDATE INFO =====
  const handleUpdateInfo = async () => {
    setIsUpdatingInfo(true);
    try {
      await api.put(`/exams/${examId}`, {
        title,
        description: description || "",
        topic_id: exam?.topic_id,
        settings: {
          duration_minutes: Number(duration),
          password: password || "",
          shuffle_questions: shuffleQuestions,
          max_attempts: maxAttempts,
          requires_approval: requiresApproval,
          show_result_immediately: showResultImmediately
        }
      });
      toast.success("Cập nhật thông tin thành công!");
      fetchExam();
    } catch (error) {
      toast.error("Cập nhật thất bại");
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  // ===== 3. PUBLISH =====
  const handlePublish = async () => {
    if (!exam) return;
    const newStatus = !exam.is_published;
    const action = newStatus ? "publish" : "unpublish";

    try {
      await api.put(`/exams/${examId}/${action}`);
      toast.success(newStatus ? "Đã xuất bản bài thi!" : "Đã gỡ bài thi!");
      fetchExam();
    } catch (error) {
      toast.error("Thao tác thất bại");
    }
  };

  // ===== 4. DELETE QUESTION =====
  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;

    try {
      await api.delete(`/exams/${examId}/questions/${questionToDelete}`);
      toast.success("Đã xóa câu hỏi!");
      fetchExam();
    } catch (error) {
      toast.error("Xóa câu hỏi thất bại");
    } finally {
      setQuestionToDelete(null);
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

  if (!exam) {
    return (
      <div className="container mx-auto py-8">
        <p className="text-center text-muted-foreground">Không tìm thấy bài thi.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/admin/exams")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{exam.title}</h1>
              <Badge variant={exam.is_published ? "default" : "secondary"}>
                {exam.is_published ? "Đã xuất bản" : "Bản nháp"}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground mt-1">
              <Clock className="h-4 w-4" />
              <span>{exam.settings.duration_minutes} phút</span>
              <Separator orientation="vertical" className="h-4" />
              <FileQuestion className="h-4 w-4" />
              <span>{exam.questions.length} câu hỏi</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/exams/${examId}/stats`)}
          >
            <BarChart3 className="mr-2 h-4 w-4" />
            Thống kê
          </Button>

          <Button
            onClick={handlePublish}
            variant={exam.is_published ? "outline" : "default"}
            className={!exam.is_published ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {exam.is_published ? "Gỡ xuống" : "Xuất bản ngay"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* LEFT COLUMN - EDIT INFO */}
        <div className="space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tiêu đề bài thi</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <Label>Mô tả</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div>
                <Label>Thời gian (phút)</Label>
                <Input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Cài đặt bài thi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Mật khẩu phòng thi</Label>
                <Input
                  type="text"
                  placeholder="Để trống nếu không cần"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Trộn câu hỏi & đáp án</Label>
                  <p className="text-sm text-muted-foreground">
                    Thứ tự ngẫu nhiên cho mỗi học sinh
                  </p>
                </div>
                <Switch
                  checked={shuffleQuestions}
                  onCheckedChange={setShuffleQuestions}
                />
              </div>

              <div>
                <Label>Số lần thi tối đa</Label>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Hiển thị kết quả ngay</Label>
                  <p className="text-sm text-muted-foreground">
                    Học sinh xem điểm ngay sau khi nộp
                  </p>
                </div>
                <Switch
                  checked={showResultImmediately}
                  onCheckedChange={setShowResultImmediately}
                />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-0.5">
                  <Label>Yêu cầu phê duyệt</Label>
                  <p className="text-sm text-muted-foreground">
                    Giáo viên duyệt học sinh trước khi thi
                  </p>
                </div>
                <Switch
                  checked={requiresApproval}
                  onCheckedChange={setRequiresApproval}
                />
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleUpdateInfo}
            disabled={isUpdatingInfo}
            className="w-full"
            size="lg"
          >
            {isUpdatingInfo ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang cập nhật...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </div>

        {/* RIGHT COLUMN - QUESTIONS LIST */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Danh sách câu hỏi ({exam.questions.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImportDialogOpen(true)}
                  >
                    Import Excel
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setIsQuestionModalOpen(true)}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Thêm câu hỏi
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {exam.questions.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileQuestion className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">Chưa có câu hỏi nào</p>
                  <p className="text-sm">Nhấn "Thêm câu hỏi" để bắt đầu</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {exam.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Câu {idx + 1}</Badge>
                            <Badge
                              variant={q.question_type === "multiple_choice" ? "secondary" : "default"}
                            >
                              {q.question_type === "multiple_choice" ? "Nhiều đáp án" : "Một đáp án"}
                            </Badge>
                            <Badge
                              className={
                                q.difficulty === "easy"
                                  ? "bg-green-100 text-green-700 dark:bg-green-950"
                                  : q.difficulty === "medium"
                                    ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950"
                                    : "bg-red-100 text-red-700 dark:bg-red-950"
                              }
                            >
                              {q.difficulty === "easy" ? "Dễ" : q.difficulty === "medium" ? "TB" : "Khó"}
                            </Badge>
                          </div>
                          <p className="text-sm">{q.content}</p>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingQuestion(q)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setQuestionToDelete(q.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* DIALOGS */}
      <AddQuestionDialog
        open={isQuestionModalOpen || !!editingQuestion}
        onOpenChange={(open) => {
          setIsQuestionModalOpen(open);
          if (!open) setEditingQuestion(null);
        }}
        onSuccess={fetchExam}
        questionToEdit={editingQuestion}
        examId={Number(examId)}
        topicId={exam?.topic_id || 0}
      />

      <ExcelImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportSuccess={fetchExam}
        topicId={exam?.topic_id}
        examId={Number(examId)}
      />

      <AlertDialog
        open={!!questionToDelete}
        onOpenChange={() => setQuestionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa câu hỏi</AlertDialogTitle>
            <AlertDialogDescription>
              Câu hỏi sẽ bị xóa khỏi bài thi này. Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteQuestion}
              className="bg-red-600 hover:bg-red-700"
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}