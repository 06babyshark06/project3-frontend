"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AddQuestionDialog } from "@/components/AddQuestionDialog";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";
import { toast } from "sonner";
import { 
  Loader2, ArrowLeft, Trash2, Clock, Pencil, PlusCircle,
  FileQuestion
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Exam {
  id: number;
  title: string;
  description: string;
  duration_minutes: number;
  is_published: boolean;
  topic_id: number;
  questions: any[];
}

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form Info State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(0);
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);

  // Dialog State
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);

  // 1. Fetch Data
  const fetchExam = async () => {
    try {
      const res = await api.get(`/exams/${examId}`);
      const data = res.data.data;
      setExam(data);
      
      setTitle(data.title);
      setDescription(data.description || "");
      setDuration(data.duration_minutes);
    } catch (error) {
      toast.error("Không thể tải bài thi");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (examId) fetchExam(); }, [examId]);

  // 2. Update Info
  const handleUpdateInfo = async () => {
    setIsUpdatingInfo(true);
    try {
      await api.put(`/exams/${examId}`, {
        title,
        duration_minutes: Number(duration),
        description: description || "",
        topic_id: exam?.topic_id,
      });
      toast.success("Cập nhật thông tin thành công!");
      fetchExam();
    } catch (error) {
      toast.error("Cập nhật thất bại");
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  // 3. Publish
  const handlePublish = async () => {
    if (!exam) return;
    const newStatus = !exam.is_published;
    const action = newStatus ? "Xuất bản" : "Gỡ xuống (Nháp)";
    if (!confirm(`Bạn có chắc muốn ${action}?`)) return;
    try {
      await api.put(`/exams/${examId}/publish`, { is_published: newStatus });
      toast.success(`Đã ${action} thành công!`);
      fetchExam(); // Reload để cập nhật badge
    } catch (error) { toast.error("Lỗi cập nhật trạng thái"); }
  };

  // 4. Xóa Question
  const handleDeleteQuestion = async () => {
    if (!questionToDelete) return;
    try {
        await api.delete(`/questions/${questionToDelete}`);
        toast.success("Đã xóa câu hỏi");
        fetchExam();
    } catch (error) { toast.error("Xóa thất bại"); } 
    finally { setQuestionToDelete(null); }
  };

  // 5. Mở Modal Sửa (Được gọi khi bấm nút Bút chì)
  const openEditQuestion = (question: any) => {
      setEditingQuestion(question);
      setIsQuestionModalOpen(true);
  }

  // 6. Mở Modal Thêm Mới
  const openAddQuestion = () => {
      setEditingQuestion(null); // Reset về null để component Dialog biết là tạo mới
      setIsQuestionModalOpen(true);
  }

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!exam) return <div className="text-center p-10">Không tìm thấy bài thi</div>;

  return (
    <div className="container mx-auto max-w-6xl p-6">
      {/* TOP BAR */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/exams')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Biên tập đề thi</h1>
            <div className="flex items-center gap-2 mt-1">
                <Badge variant={exam.is_published ? "default" : "secondary"} className={exam.is_published ? "bg-green-600" : ""}>
                    {exam.is_published ? "Đã xuất bản" : "Bản nháp"}
                </Badge>
                <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {exam.duration_minutes} phút
                </span>
            </div>
          </div>
        </div>
        <Button 
            onClick={handlePublish} 
            variant={exam.is_published ? "outline" : "default"}
            className={!exam.is_published ? "bg-green-600 hover:bg-green-700" : ""}
        >
            {exam.is_published ? "Gỡ xuống" : "Xuất bản ngay"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CỘT TRÁI: EDIT INFO */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader><CardTitle>Thông tin chung</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Tiêu đề bài thi</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Mô tả</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px]" />
                    </div>
                    <div className="space-y-2">
                        <Label>Thời gian (phút)</Label>
                        <Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
                    </div>
                    <Button onClick={handleUpdateInfo} disabled={isUpdatingInfo} className="w-full">
                        {isUpdatingInfo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Cập nhật
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* CỘT PHẢI: LIST CÂU HỎI */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Câu hỏi ({exam.questions?.length || 0})</h2>
                {/* Nút Thêm Mới */}
                <Button onClick={openAddQuestion} size="sm">
                    <PlusCircle className="mr-2 h-4 w-4" /> Thêm Câu Hỏi
                </Button>
            </div>

            <div className="space-y-4">
                {exam.questions && exam.questions.map((q: any, idx: number) => (
                <Card key={q.id} className="relative group hover:border-primary transition-colors">
                    <CardHeader className="pb-2 bg-muted/5">
                        <div className="flex justify-between items-start">
                            <div className="flex gap-3">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                                {idx + 1}
                                </span>
                                <CardTitle className="text-lg font-medium leading-relaxed mt-0.5">{q.content}</CardTitle>
                            </div>
                            
                            {/* === CẬP NHẬT: Khu vực nút thao tác === */}
                            <div className="flex items-center gap-1">
                                {/* Nút Sửa (Mới thêm) */}
                                <Button 
                                    variant="ghost" size="icon" 
                                    className="text-muted-foreground hover:text-primary h-8 w-8"
                                    onClick={() => openEditQuestion(q)} // Gọi hàm mở modal sửa
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                
                                {/* Nút Xóa */}
                                <Button 
                                    variant="ghost" size="icon" 
                                    className="text-muted-foreground hover:text-destructive h-8 w-8"
                                    onClick={() => setQuestionToDelete(q.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    {/* (Phần nội dung câu hỏi giữ nguyên) */}
                     <CardContent className="pt-4">
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {q.choices.map((c: any) => (
                            <li key={c.id} className={`p-2 border rounded text-sm flex items-center gap-2 ${c.is_correct ? 'bg-green-50 border-green-200' : 'bg-background'}`}>
                                <div className={`h-3 w-3 rounded-full border flex items-center justify-center ${c.is_correct ? 'border-green-600 bg-green-600' : 'border-muted-foreground'}`}>
                                    {c.is_correct && <div className="h-1 w-1 rounded-full bg-white" />}
                                </div>
                                <span className={c.is_correct ? 'font-medium text-green-700' : 'text-muted-foreground'}>{c.content}</span>
                            </li>
                            ))}
                        </ul>
                    </CardContent>
                </Card>
                ))}
                
                {(!exam.questions || exam.questions.length === 0) && (
                 <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-xl bg-muted/5">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4 mx-auto">
                        <FileQuestion className="h-8 w-8 opacity-50" />
                    </div>
                    <h3 className="text-lg font-semibold">Chưa có câu hỏi nào</h3>
                    <p className="text-sm mt-1">Hãy bắt đầu xây dựng bộ đề của bạn.</p>
                </div>
                )}
            </div>
        </div>
      </div>

      {/* Dialog & Modal */}
      <AddQuestionDialog 
          open={isQuestionModalOpen}
          onOpenChange={setIsQuestionModalOpen}
          examId={Number(examId)} 
          topicId={exam.topic_id} 
          onSuccess={fetchExam}
          questionToEdit={editingQuestion} // Truyền dữ liệu cần sửa vào
      />

      <AlertDialog open={!!questionToDelete} onOpenChange={(open) => !open && setQuestionToDelete(null)}>
         <AlertDialogContent>
             <AlertDialogHeader><AlertDialogTitle>Xóa câu hỏi này?</AlertDialogTitle></AlertDialogHeader>
             <AlertDialogFooter>
                 <AlertDialogCancel>Hủy</AlertDialogCancel>
                 <AlertDialogAction onClick={handleDeleteQuestion} className="bg-destructive">Xóa</AlertDialogAction>
             </AlertDialogFooter>
         </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}