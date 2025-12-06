// app/admin/questions/page.tsx
// ✅ HOÀN THIỆN: Filter questions (section, difficulty, search, pagination)
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2, Search, PlusCircle, MoreHorizontal, Pencil,
  Trash2, ArrowLeft, Upload, Filter, Eye, RefreshCw
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger
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
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

import { AddQuestionDialog } from "@/components/AddQuestionDialog";
import { ExcelImportDialog } from "@/components/ExcelImportDialog";

// ===== INTERFACES =====
interface Question {
  id: number;
  content: string;
  question_type: "single_choice" | "multiple_choice";
  difficulty: "easy" | "medium" | "hard";
  section_id: number;
  section_name?: string;
  created_at: string;
  choices?: Array<{
    id: number;
    content: string;
    is_correct: boolean;
  }>;
}

interface Section {
  id: number;
  name: string;
  topic_id: number;
}

interface Topic {
  id: number;
  name: string;
}

export default function QuestionBankPage() {
  const router = useRouter();

  // ===== STATE MANAGEMENT =====
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // ===== FILTER STATE =====
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  // ===== PAGINATION STATE =====
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const LIMIT = 20;

  // ===== DIALOG STATES =====
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const [questionToView, setQuestionToView] = useState<Question | null>(null);

  // ===== FETCH TOPICS =====
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await api.get("/topics");
        setTopics(res.data.data.topics || []);
      } catch (error) {
        console.error("Fetch topics error:", error);
      }
    };
    fetchTopics();
  }, []);

  // ===== FETCH SECTIONS when topic changes =====
  useEffect(() => {
    if (selectedTopic === "all") {
      setSections([]);
      setSelectedSection("all");
      return;
    }

    const fetchSections = async () => {
      try {
        const res = await api.get(`/exam-sections?topic_id=${selectedTopic}`);
        setSections(res.data.data.sections || []);
        setSelectedSection("all");
      } catch (error) {
        console.error("Fetch sections error:", error);
      }
    };
    fetchSections();
  }, [selectedTopic]);

  // ===== FETCH QUESTIONS (with filters) =====
  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit: LIMIT
      };

      if (searchTerm) params.search = searchTerm;
      if (selectedSection !== "all") params.section_id = selectedSection;
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

  // ===== AUTO FETCH with debounce =====
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedSection, selectedDifficulty, page]);

  // ===== RESET FILTERS =====
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedTopic("all");
    setSelectedSection("all");
    setSelectedDifficulty("all");
    setPage(1);
  };

  // ===== DELETE QUESTION =====
  const handleDelete = async () => {
    if (!questionToDelete) return;

    try {
      await api.delete(`/questions/${questionToDelete}`);
      toast.success("Đã xóa câu hỏi thành công!");
      fetchQuestions();
    } catch (error) {
      toast.error("Xóa câu hỏi thất bại!");
    } finally {
      setQuestionToDelete(null);
    }
  };

  // ===== DIFFICULTY BADGE =====
  const getDifficultyBadge = (difficulty: string) => {
    const variants: Record<string, any> = {
      easy: { variant: "default", label: "Dễ", color: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300" },
      medium: { variant: "secondary", label: "Trung bình", color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300" },
      hard: { variant: "destructive", label: "Khó", color: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" }
    };

    const config = variants[difficulty] || variants.easy;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="container mx-auto py-8 px-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Ngân hàng câu hỏi</h1>
          <p className="text-muted-foreground">
            Quản lý toàn bộ câu hỏi cho bài thi
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsImportDialogOpen(true)}
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Excel
          </Button>

          <Button onClick={() => setIsAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Thêm câu hỏi
          </Button>
        </div>
      </div>

      {/* FILTERS */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Bộ lọc</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm kiếm nội dung câu hỏi..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Topic Filter */}
          <div>
            <Select
              value={selectedTopic}
              onValueChange={(val) => {
                setSelectedTopic(val);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn chủ đề" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chủ đề</SelectItem>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <Select
              value={selectedDifficulty}
              onValueChange={(val) => {
                setSelectedDifficulty(val);
                setPage(1);
              }}
            >
              <SelectTrigger>
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
        </div>

        {/* Section Filter - Show only if topic selected */}
        {selectedTopic !== "all" && sections.length > 0 && (
          <div className="mt-4">
            <Select
              value={selectedSection}
              onValueChange={(val) => {
                setSelectedSection(val);
                setPage(1);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả section</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Tìm thấy <strong>{totalQuestions}</strong> câu hỏi
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetFilters}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Xóa bộ lọc
          </Button>
        </div>
      </Card>

      {/* TABLE */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : questions.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg mb-2">Không tìm thấy câu hỏi nào</p>
            <p className="text-sm">Thử thay đổi bộ lọc hoặc thêm câu hỏi mới</p>
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">ID</TableHead>
                  <TableHead>Nội dung</TableHead>
                  <TableHead className="w-[120px]">Section</TableHead>
                  <TableHead className="w-[100px]">Loại</TableHead>
                  <TableHead className="w-[100px]">Độ khó</TableHead>
                  <TableHead className="w-[80px] text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questions.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-mono text-xs">{q.id}</TableCell>
                    <TableCell className="max-w-md">
                      <p className="truncate">{q.content}</p>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{q.section_name || "N/A"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={q.question_type === "multiple_choice" ? "secondary" : "default"}>
                        {q.question_type === "multiple_choice" ? "Nhiều đáp án" : "Một đáp án"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getDifficultyBadge(q.difficulty)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setQuestionToView(q)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditingQuestion(q)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setQuestionToDelete(q.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* PAGINATION */}
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              Trang {page} / {totalPages}
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Trước
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        </>
      )}

      {/* DIALOGS */}
      <AddQuestionDialog
        open={isAddDialogOpen || !!editingQuestion}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingQuestion(null);
        }}
        onSuccess={fetchQuestions}
        editingQuestion={editingQuestion}
      />

      <ExcelImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onSuccess={fetchQuestions}
      />

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!questionToDelete} onOpenChange={() => setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa câu hỏi</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Câu hỏi sẽ bị xóa vĩnh viễn.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* VIEW QUESTION DETAIL */}
      <Dialog open={!!questionToView} onOpenChange={() => setQuestionToView(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết câu hỏi</DialogTitle>
          </DialogHeader>
          {questionToView && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nội dung:</p>
                <p className="text-base font-medium">{questionToView.content}</p>
              </div>

              <div className="flex items-center gap-3">
                {getDifficultyBadge(questionToView.difficulty)}
                <Badge variant={questionToView.question_type === "multiple_choice" ? "secondary" : "default"}>
                  {questionToView.question_type === "multiple_choice" ? "Nhiều đáp án" : "Một đáp án"}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Các đáp án:</p>
                <div className="space-y-2">
                  {questionToView.choices?.map((choice) => (
                    <div
                      key={choice.id}
                      className={`p-3 border rounded-lg ${
                        choice.is_correct
                          ? "bg-green-50 dark:bg-green-950 border-green-500"
                          : "bg-muted/30"
                      }`}
                    >
                      <p className="text-sm">{choice.content}</p>
                      {choice.is_correct && (
                        <Badge variant="default" className="mt-2">Đáp án đúng</Badge>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}