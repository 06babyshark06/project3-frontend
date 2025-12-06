// app/admin/questions/page.tsx
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2, Search, PlusCircle, MoreHorizontal, Pencil, 
  Trash2, ArrowLeft, Upload, Download, Filter, Eye
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

import { AddQuestionDialog } from "@/components/AddQuestionDialog";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";

// === INTERFACES ===
interface Question {
  id: number;
  content: string;
  question_type: "single_choice" | "multiple_choice";
  difficulty: "easy" | "medium" | "hard";
  topic_id: number;
  topic_name?: string;
  created_at: string;
  choices?: Array<{
    id: number;
    content: string;
    is_correct: boolean;
  }>;
}

interface Topic {
  id: number;
  name: string;
  description?: string;
}

export default function QuestionBankPage() {
  const router = useRouter();

  // === STATE MANAGEMENT ===
  const [questions, setQuestions] = useState<Question[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  // Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Dialog States
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const [questionToView, setQuestionToView] = useState<Question | null>(null);

  // === FETCH DATA ===
  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit: 20,
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedTopic !== "all") params.topic_id = selectedTopic;
      if (selectedDifficulty !== "all") params.difficulty = selectedDifficulty;

      const res = await api.get("/questions", { params });
      const data = res.data.data;

      setQuestions(data.questions || []);
      setTotalPages(data.total_pages || 1);
      setTotalQuestions(data.total || 0);
      setPage(data.page || 1);

    } catch (error) {
      console.error("Fetch questions error:", error);
      toast.error("Không thể tải danh sách câu hỏi");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTopics = async () => {
    try {
      const res = await api.get("/topics");
      setTopics(res.data.data?.topics || []);
    } catch (error) {
      console.error("Fetch topics error:", error);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions();
    }, 300); // Debounce search

    return () => clearTimeout(timer);
  }, [searchTerm, selectedTopic, selectedDifficulty, page]);

  // === HANDLERS ===
  const handleDelete = async () => {
    if (!questionToDelete) return;

    try {
      await api.delete(`/questions/${questionToDelete}`);
      toast.success("Đã xóa câu hỏi thành công!");
      fetchQuestions();
    } catch (error) {
      toast.error("Xóa câu hỏi thất bại");
    } finally {
      setQuestionToDelete(null);
    }
  };

  const openEditDialog = async (questionId: number) => {
    try {
      // Fetch full question data với choices
      const res = await api.get(`/questions/${questionId}`);
      setEditingQuestion(res.data.data);
      setIsAddDialogOpen(true);
    } catch (error) {
      toast.error("Không thể tải dữ liệu câu hỏi");
    }
  };

  const openAddDialog = () => {
    setEditingQuestion(null);
    setIsAddDialogOpen(true);
  };

  const handleExportExcel = async () => {
    try {
      toast.info("Đang xuất file Excel...");
      const params: any = {};
      if (selectedTopic !== "all") params.topic_id = selectedTopic;
      if (selectedDifficulty !== "all") params.difficulty = selectedDifficulty;

      const res = await api.post("/questions/export", params, {
        responseType: "blob",
      });

      // Download file
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `questions_${Date.now()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Đã xuất file Excel thành công!");
    } catch (error) {
      toast.error("Xuất file thất bại");
    }
  };

  // === UI HELPERS ===
  const getDifficultyBadge = (difficulty: string) => {
    const styles = {
      easy: "bg-green-100 text-green-700 border-green-200",
      medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
      hard: "bg-red-100 text-red-700 border-red-200",
    };
    const labels = {
      easy: "Dễ",
      medium: "Trung bình",
      hard: "Khó",
    };
    return (
      <Badge
        variant="outline"
        className={styles[difficulty as keyof typeof styles] || ""}
      >
        {labels[difficulty as keyof typeof labels] || difficulty}
      </Badge>
    );
  };

  const getTypeBadge = (type: string) => {
    return (
      <Badge variant="secondary">
        {type === "single_choice" ? "Đơn" : "Nhiều đáp án"}
      </Badge>
    );
  };

  // === RENDER ===
  return (
    <div className="container mx-auto max-w-7xl p-6 md:p-8">
      {/* === HEADER === */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 pb-6 border-b">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => router.push("/admin/dashboard")}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              Ngân hàng Câu hỏi
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý {totalQuestions} câu hỏi trắc nghiệm trong hệ thống
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportExcel}>
            <Download className="mr-2 h-4 w-4" /> Xuất Excel
          </Button>
          <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" /> Import
          </Button>
          <Button onClick={openAddDialog}>
            <PlusCircle className="mr-2 h-4 w-4" /> Thêm câu hỏi
          </Button>
        </div>
      </div>

      {/* === FILTERS === */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm câu hỏi theo nội dung..."
            className="pl-10 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Topic Filter */}
        <Select value={selectedTopic} onValueChange={setSelectedTopic}>
          <SelectTrigger className="w-full md:w-[200px]">
            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Lọc theo chủ đề" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả chủ đề</SelectItem>
            {topics.map((topic) => (
              <SelectItem key={topic.id} value={String(topic.id)}>
                {topic.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Difficulty Filter */}
        <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder="Độ khó" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả độ khó</SelectItem>
            <SelectItem value="easy">Dễ</SelectItem>
            <SelectItem value="medium">Trung bình</SelectItem>
            <SelectItem value="hard">Khó</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* === TABLE === */}
      <Card className="border shadow-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-[60px] pl-6">ID</TableHead>
                      <TableHead className="min-w-[400px]">Nội dung câu hỏi</TableHead>
                      <TableHead className="w-[120px]">Loại</TableHead>
                      <TableHead className="w-[120px]">Độ khó</TableHead>
                      <TableHead className="w-[150px]">Chủ đề</TableHead>
                      <TableHead className="w-[100px] text-right pr-6">
                        Thao tác
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {questions.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center h-32 text-muted-foreground"
                        >
                          {searchTerm || selectedTopic !== "all" || selectedDifficulty !== "all"
                            ? "Không tìm thấy câu hỏi nào phù hợp."
                            : "Chưa có câu hỏi nào. Hãy bắt đầu thêm câu hỏi mới!"}
                        </TableCell>
                      </TableRow>
                    ) : (
                      questions.map((question) => (
                        <TableRow
                          key={question.id}
                          className="hover:bg-muted/5 transition-colors"
                        >
                          <TableCell className="pl-6 font-mono text-xs text-muted-foreground">
                            #{question.id}
                          </TableCell>
                          <TableCell>
                            <p className="line-clamp-2 text-sm leading-relaxed">
                              {question.content}
                            </p>
                          </TableCell>
                          <TableCell>{getTypeBadge(question.question_type)}</TableCell>
                          <TableCell>{getDifficultyBadge(question.difficulty)}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                              {question.topic_name || `Topic #${question.topic_id}`}
                            </span>
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-muted"
                                >
                                  <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
                                  Thao tác
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                
                                <DropdownMenuItem
                                  onClick={() => setQuestionToView(question)}
                                  className="cursor-pointer"
                                >
                                  <Eye className="mr-2 h-4 w-4" /> Xem chi tiết
                                </DropdownMenuItem>

                                <DropdownMenuItem
                                  onClick={() => openEditDialog(question.id)}
                                  className="cursor-pointer"
                                >
                                  <Pencil className="mr-2 h-4 w-4" /> Chỉnh sửa
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                  onClick={() => setQuestionToDelete(question.id)}
                                  className="text-destructive focus:text-destructive cursor-pointer"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" /> Xóa câu hỏi
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-muted-foreground">
                    Trang {page} / {totalPages} • Tổng {totalQuestions} câu hỏi
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                    >
                      Trước
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                    >
                      Sau
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* === DIALOGS === */}
      
      {/* Add/Edit Question Dialog */}
      <AddQuestionDialog
        open={isAddDialogOpen}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingQuestion(null);
        }}
        examId={0} // Không gắn với exam cụ thể
        topicId={selectedTopic !== "all" ? Number(selectedTopic) : 0}
        questionToEdit={editingQuestion}
        onSuccess={() => {
          fetchQuestions();
          setIsAddDialogOpen(false);
          setEditingQuestion(null);
        }}
      />

      {/* Import Excel Dialog */}
      <ExcelImportDialog
        topicId={selectedTopic !== "all" ? Number(selectedTopic) : 0}
        onImportSuccess={() => {
          fetchQuestions();
          setIsImportDialogOpen(false);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!questionToDelete}
        onOpenChange={(open) => !open && setQuestionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl text-destructive">
              Xóa câu hỏi này?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              Hành động này sẽ xóa vĩnh viễn câu hỏi và tất cả đáp án liên quan.
              <br />
              <b>Không thể hoàn tác!</b>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-10">Hủy bỏ</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa Vĩnh Viễn
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Question Preview Dialog */}
      {questionToView && (
        <AlertDialog
          open={!!questionToView}
          onOpenChange={(open) => !open && setQuestionToView(null)}
        >
          <AlertDialogContent className="max-w-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-xl">
                Chi tiết câu hỏi
              </AlertDialogTitle>
            </AlertDialogHeader>

            <div className="space-y-4 py-4">
              {/* Metadata */}
              <div className="flex gap-2 flex-wrap">
                {getTypeBadge(questionToView.question_type)}
                {getDifficultyBadge(questionToView.difficulty)}
                <Badge variant="outline">
                  {questionToView.topic_name || `Topic #${questionToView.topic_id}`}
                </Badge>
              </div>

              {/* Question Content */}
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-lg font-medium leading-relaxed">
                  {questionToView.content}
                </p>
              </div>

              {/* Choices */}
              {questionToView.choices && questionToView.choices.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    Các đáp án:
                  </p>
                  <div className="grid gap-2">
                    {questionToView.choices.map((choice, idx) => (
                      <div
                        key={choice.id}
                        className={`p-3 rounded-lg border flex items-center gap-3 ${
                          choice.is_correct
                            ? "bg-green-50 border-green-200"
                            : "bg-background"
                        }`}
                      >
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            choice.is_correct
                              ? "bg-green-600 text-white"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span
                          className={
                            choice.is_correct ? "font-medium text-green-700" : ""
                          }
                        >
                          {choice.content}
                        </span>
                        {choice.is_correct && (
                          <Badge className="ml-auto bg-green-600">Đáp án đúng</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <AlertDialogFooter>
              <AlertDialogCancel>Đóng</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}