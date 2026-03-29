"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { APP_CONFIG } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Loader2, Search, PlusCircle, MoreHorizontal, Pencil,
  Trash2, Upload, Filter, Eye, RefreshCw, Library,
  Book, Sparkles,
  X,
  Download
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
import { AddTopicDialog } from "@/components/AddTopicDialog";
import { AddSectionDialog } from "@/components/AddSectionDialog";
import { Checkbox } from "@/components/ui/checkbox";
import RichTextDisplay from "@/components/RichTextDisplay";

// ===== INTERFACES =====
interface Choice {
  id: number;
  content: string;
  is_correct: boolean;
  attachment_url?: string;
}
interface Question {
  id: number;
  content: string;
  question_type: "single_choice" | "multiple_choice";
  difficulty: "easy" | "medium" | "hard";
  section_id: number;
  section_name?: string;
  topic_id: number;
  topic_name?: string;
  created_at: string;
  explanation?: string;
  attachment_url?: string;
  choices?: Choice[];
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
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);

  // ===== FILTER STATE =====
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("all");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");

  // ===== PAGINATION STATE =====
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const LIMIT = APP_CONFIG.PAGINATION.DEFAULT_LIMIT;

  // ===== DIALOG STATES =====
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
  const [questionToView, setQuestionToView] = useState<Question | null>(null);
  const [isAddTopicDialogOpen, setIsAddTopicDialogOpen] = useState(false);
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);

  // ===== BULK ACTION STATE =====
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const [isExporting, setIsExporting] = useState(false);

  // ===== FETCH TOPICS =====
  const fetchTopics = useCallback(async () => {
    try {
      const res = await api.get("/topics");
      setTopics(res.data.data.topics || []);
    } catch (error) {
      console.error("Fetch topics error:", error);
    }
  }, []);
  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  // ===== FETCH SECTIONS (Khi chọn Topic) =====
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
        setSelectedSection("all"); // Reset section khi đổi topic
      } catch (error) {
        console.error("Fetch sections error:", error);
      }
    };
    fetchSections();
  }, [selectedTopic]);

  // ===== FETCH QUESTIONS (Search & Filter) =====
  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const params: any = {
        page,
        limit: LIMIT
      };

      if (searchTerm) params.search = searchTerm;

      // Logic lọc theo cấp bậc: Section -> Topic
      if (selectedSection !== "all") {
        params.section_id = selectedSection;
      } else if (selectedTopic !== "all") {
        params.topic_id = selectedTopic;
      }

      if (selectedDifficulty !== "all") params.difficulty = selectedDifficulty;

      const res = await api.get("/questions", { params });
      const data = res.data.data;

      setQuestions(data.questions || []);
      setTotalPages(data.total_pages || 1);
      setTotalQuestions(data.total || 0);

      // Nếu API trả về page khác page hiện tại (do filter làm giảm số trang)
      if (data.page && data.page !== page) setPage(data.page);

    } catch (error) {
      console.error("Fetch questions error:", error);
      toast.error("Không thể tải danh sách câu hỏi");
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch khi filter thay đổi (debounce search)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions();
    }, APP_CONFIG.PAGINATION.DEBOUNCE_DELAY);
    return () => clearTimeout(timer);
  }, [searchTerm, selectedSection, selectedTopic, selectedDifficulty, page]);

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

  const getDifficultyBadge = (difficulty: string) => {
    const variants: Record<string, { label: string, className: string }> = {
      easy: { label: "Dễ", className: "bg-green-100 text-green-700 hover:bg-green-100/80 border-green-200" },
      medium: { label: "Trung bình", className: "bg-yellow-100 text-yellow-700 hover:bg-yellow-100/80 border-yellow-200" },
      hard: { label: "Khó", className: "bg-red-100 text-red-700 hover:bg-red-100/80 border-red-200" }
    };
    const conf = variants[difficulty] || variants.easy;
    return <Badge variant="outline" className={conf.className}>{conf.label}</Badge>;
  };

  const handleTopicCreated = () => {
    fetchTopics();
  };

  const handleSectionCreated = () => {
    // Nếu đang chọn Topic cụ thể, load lại danh sách Section để thấy ngay Section mới
    if (selectedTopic !== "all") {
      const fetchSections = async () => {
        try {
          const res = await api.get(`/exam-sections?topic_id=${selectedTopic}`);
          setSections(res.data.data.sections || []);
          // Không cần reset selectedSection về 'all' để user đỡ phải chọn lại topic
        } catch (error) {
          console.error("Fetch sections error:", error);
        }
      };
      fetchSections();
    } else {
      toast.info("Chương mới đã được tạo. Vui lòng chọn Chủ đề để xem.");
    }
  };

  const handleViewDetail = async (id: number) => {
    setIsLoadingDetail(true);
    setQuestionToView({ id } as any);

    try {
      const res = await api.get(`/questions/${id}`);
      setQuestionToView(res.data.data);
    } catch (error) {
      toast.error("Không thể tải chi tiết câu hỏi");
      setQuestionToView(null);
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleImportSuccess = () => {
    fetchQuestions();
    fetchTopics();
    toast.success("Dữ liệu đã được làm mới");
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === questions.length && questions.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(questions.map(q => q.id));
    }
  };

  const toggleSelectOne = (id: number) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      setSelectedIds(prev => [...prev, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    if (!confirm(`Bạn có chắc chắn muốn xóa ${selectedIds.length} câu hỏi đã chọn?`)) return;

    setIsBulkDeleting(true);
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/questions/${id}`)));

      toast.success(`Đã xóa thành công ${selectedIds.length} câu hỏi!`);
      setSelectedIds([]);
      fetchQuestions();
    } catch (error) {
      console.error(error);
      toast.error("Có lỗi xảy ra khi xóa một số câu hỏi.");
    } finally {
      setIsBulkDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedTopic("all");
    setSelectedSection("all");
    setSelectedDifficulty("all");
    setPage(1);
  };

  const MediaDisplay = ({ url }: { url?: string }) => {
    if (!url) return null;

    const isVideo = url.match(/\.(mp4|webm|mov)$/i);
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);

    return (
      <div className="mt-2 block">
        {isVideo ? (
          <video src={url} controls className="max-h-[200px] max-w-full rounded-lg border bg-black" />
        ) : (
          <img
            src={url}
            alt="Minh họa"
            className="max-h-[200px] max-w-full rounded-lg border object-contain bg-muted/20"
            onError={(e) => {
              // Fallback nếu ảnh lỗi
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
      </div>
    );
  };

  const stripHtml = (html: string) => {
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
  }

  const handleExport = async () => {
    setIsExporting(true);
    try {
      toast.info("Đang tạo file Excel...");

      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedSection !== "all") params.section_id = selectedSection;
      else if (selectedTopic !== "all") params.topic_id = selectedTopic;
      if (selectedDifficulty !== "all") params.difficulty = selectedDifficulty;

      const res = await api.get("/questions/export", { params });

      const fileUrl = res.data.data.file_url;
      if (fileUrl) {
        window.open(fileUrl, "_blank");
        toast.success("Xuất file thành công!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Xuất file thất bại");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ngân hàng câu hỏi</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và tổ chức câu hỏi theo chủ đề và chương
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* DESKTOP ACTIONS */}
          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsAddTopicDialogOpen(true)}
              className="border"
            >
              <Library className="mr-2 h-4 w-4" />
              Thêm chủ đề
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsAddSectionDialogOpen(true)}
              className="border bg-background hover:bg-muted"
            >
              <Book className="mr-2 h-4 w-4 text-orange-600" />
              Thêm chương
            </Button>
            <Button variant="outline" onClick={handleExport} disabled={isExporting}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Export Excel
            </Button>
            <Button variant="outline" onClick={() => setIsImportDialogOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Import Excel
            </Button>
          </div>

          {/* MOBILE ACTIONS MENU */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setIsAddTopicDialogOpen(true)}>
                  <Library className="mr-2 h-4 w-4" /> Thêm chủ đề
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsAddSectionDialogOpen(true)}>
                  <Book className="mr-2 h-4 w-4 text-orange-600" /> Thêm chương
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} disabled={isExporting}>
                  <Download className="mr-2 h-4 w-4" /> Export Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                  <Upload className="mr-2 h-4 w-4" /> Import Excel
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* PRIMARY ACTION */}
          <div className="flex gap-2">
            <Button variant="outline" className="border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold" onClick={() => {
              // Note: Using a default ID of 1 for now since this form is global. 
              // Navigate to the global AI question generation page
              router.push('/instructor/questions/generate');
            }}>
              <Sparkles className="mr-2 h-4 w-4 text-blue-600" />
              <span className="hidden sm:inline">Sinh bằng AI</span>
              <span className="sm:hidden">AI</span>
            </Button>
            <Button onClick={() => {
              setEditingQuestion(null);
              setIsAddDialogOpen(true);
            }}>
              <PlusCircle className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Thêm câu hỏi</span>
              <span className="sm:hidden">Thêm</span>
            </Button>
          </div>
        </div>
      </div>

      {/* FILTERS CARD */}
      <Card className="p-5 mb-6 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-4 text-sm font-medium text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Bộ lọc tìm kiếm</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* 1. Chọn Chủ đề */}
          <div className="md:col-span-3">
            <Select value={selectedTopic} onValueChange={(val) => {
              setSelectedTopic(val);
              setPage(1); // Reset về trang 1 khi đổi chủ đề
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn chủ đề" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chủ đề</SelectItem>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Chọn Chương (Phụ thuộc Chủ đề) */}
          <div className="md:col-span-3">
            <Select
              value={selectedSection}
              onValueChange={(val) => {
                setSelectedSection(val);
                setPage(1);
              }}
              disabled={selectedTopic === "all"}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedTopic === "all" ? "Chọn chủ đề trước" : "Chọn chương/phần"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả chương</SelectItem>
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 3. Độ khó */}
          <div className="md:col-span-2">
            <Select value={selectedDifficulty} onValueChange={(val) => {
              setSelectedDifficulty(val);
              setPage(1);
            }}>
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

          {/* 4. Tìm kiếm */}
          <div className="md:col-span-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm nội dung câu hỏi..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        {/* Filter Summary & Reset */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            Hiển thị <strong>{questions.length}</strong> trên tổng số <strong>{totalQuestions}</strong> câu hỏi
          </p>
          {(searchTerm || selectedTopic !== "all" || selectedDifficulty !== "all") && (
            <Button variant="ghost" size="sm" onClick={handleResetFilters} className="h-8 px-2 text-xs">
              <RefreshCw className="mr-2 h-3 w-3" />
              Đặt lại bộ lọc
            </Button>
          )}
        </div>
      </Card>

      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-20 mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-2 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <Badge variant="default" className="bg-primary text-primary-foreground">
              Đã chọn {selectedIds.length}
            </Badge>
            <span className="text-sm text-muted-foreground">Bạn có thể thực hiện hành động hàng loạt</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedIds([])} className="hover:bg-background/50">
              <X className="h-4 w-4 mr-1" /> Bỏ chọn
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Trash2 className="h-4 w-4 mr-1" />}
              Xóa {selectedIds.length} câu hỏi
            </Button>
          </div>
        </div>
      )}

      {/* DATA TABLE */}
      <Card className="overflow-hidden border-border/50">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[40px] text-center">
                  <Checkbox
                    checked={selectedIds.length === questions.length && questions.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="w-[60px]">ID</TableHead>
                <TableHead className="min-w-[300px]">Nội dung câu hỏi</TableHead>
                <TableHead className="w-[180px]">Chủ đề (Topic)</TableHead>
                <TableHead className="w-[180px]">Chương (Section)</TableHead>
                <TableHead className="w-[100px]">Loại</TableHead>
                <TableHead className="w-[100px]">Độ khó</TableHead>
                <TableHead className="w-[70px] text-right">#</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center">
                    <div className="flex justify-center items-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Đang tải dữ liệu...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : questions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-32 text-center text-muted-foreground">
                    Không tìm thấy câu hỏi nào phù hợp.
                  </TableCell>
                </TableRow>
              ) : (
                questions.map((q) => (
                  <TableRow key={q.id} className="hover:bg-muted/30">
                    <TableCell className="text-center">
                      <Checkbox
                        checked={selectedIds.includes(q.id)}
                        onCheckedChange={() => toggleSelectOne(q.id)}
                        aria-label={`Select question ${q.id}`}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">#{q.id}</TableCell>
                    <TableCell>
                      <div className="line-clamp-2 font-medium" title={stripHtml(q.content)}>
                        {stripHtml(q.content)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-normal text-xs bg-blue-50 text-blue-700 border-blue-200 truncate max-w-[150px]">
                          {q.topic_name || "N/A"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground truncate max-w-[150px]" title={q.section_name}>
                        {q.section_name || "N/A"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={q.question_type === "multiple_choice" ? "secondary" : "outline"}>
                        {q.question_type === "multiple_choice" ? "Nhiều Đ.A" : "1 Đ.A"}
                      </Badge>
                    </TableCell>
                    <TableCell>{getDifficultyBadge(q.difficulty)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewDetail(q.id)}>
                            <Eye className="mr-2 h-4 w-4" /> Chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={async () => {
                            try {
                              const res = await api.get(`/questions/${q.id}`);
                              setEditingQuestion(res.data.data);
                              setIsAddDialogOpen(true);
                            } catch (error) {
                              toast.error("Không thể tải thông tin câu hỏi để sửa");
                            }
                          }}>
                            <Pencil className="mr-2 h-4 w-4" /> Sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setQuestionToDelete(q.id)} className="text-red-600 focus:text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" /> Xóa
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
      </Card>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Trước
          </Button>
          <div className="text-sm font-medium mx-2">
            Trang {page} / {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Sau
          </Button>
        </div>
      )}

      {/* DIALOGS */}
      <AddTopicDialog
        open={isAddTopicDialogOpen}
        onOpenChange={setIsAddTopicDialogOpen}
        onSuccess={handleTopicCreated}
      />

      <AddSectionDialog
        open={isAddSectionDialogOpen}
        onOpenChange={setIsAddSectionDialogOpen}
        onSuccess={handleSectionCreated}
        defaultTopicId={selectedTopic !== "all" ? Number(selectedTopic) : undefined}
      />

      <AddQuestionDialog
        open={isAddDialogOpen || !!editingQuestion}
        onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) setEditingQuestion(null);
        }}
        onSuccess={fetchQuestions}
        questionToEdit={editingQuestion}
        defaultTopicId={selectedTopic !== "all" ? Number(selectedTopic) : undefined}
        defaultSectionId={selectedSection !== "all" ? Number(selectedSection) : undefined}
      />

      <ExcelImportDialog
        open={isImportDialogOpen}
        onOpenChange={setIsImportDialogOpen}
        onImportSuccess={handleImportSuccess}
      />

      {/* VIEW DETAIL DIALOG */}
      <Dialog open={!!questionToView} onOpenChange={() => setQuestionToView(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết câu hỏi #{questionToView?.id}</DialogTitle>
          </DialogHeader>

          {questionToView && (
            <div className="grid gap-4 py-2">
              <div className="p-4 bg-muted/30 rounded-lg border">
                <div className="flex flex-wrap gap-2 mb-3">
                  {getDifficultyBadge(questionToView.difficulty)}
                  <Badge variant="outline">{questionToView.topic_name || "Chưa có chủ đề"}</Badge>
                  <Badge variant="outline">{questionToView.section_name || "Chưa có chương"}</Badge>
                </div>

                <RichTextDisplay content={questionToView.content} />

                {/* ẢNH/VIDEO CỦA CÂU HỎI */}
                <MediaDisplay url={questionToView.attachment_url} />
              </div>

              <div className="space-y-3">
                <h5 className="font-medium text-sm text-muted-foreground uppercase tracking-wide flex justify-between">
                  Đáp án
                  {isLoadingDetail && <Loader2 className="h-4 w-4 animate-spin" />}
                </h5>
                <div className="grid gap-3">
                  {questionToView.choices?.map((c, i) => (
                    <div key={c.id || i} className={`flex flex-col p-3 rounded-md border transition-colors ${c.is_correct ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800" : "bg-card"}`}>
                      <div className="flex items-start gap-3">
                        <div className={`shrink-0 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${c.is_correct ? "bg-green-600 text-white" : "bg-muted text-muted-foreground"}`}>
                          {String.fromCharCode(65 + i)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <RichTextDisplay content={c.content} className={c.is_correct ? "font-medium text-green-700 dark:text-green-400" : ""} />

                          {/* ẢNH/VIDEO CỦA ĐÁP ÁN */}
                          <MediaDisplay url={c.attachment_url} />
                        </div>
                        {c.is_correct && <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {questionToView.explanation && (
                <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                  <div className="font-semibold mb-1">💡 Giải thích chi tiết</div>
                  <RichTextDisplay content={questionToView.explanation} />
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DELETE ALERT */}
      <AlertDialog open={!!questionToDelete} onOpenChange={() => setQuestionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bạn có chắc chắn muốn xóa?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Câu hỏi sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Xóa câu hỏi
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Icon component import bổ sung nếu thiếu
function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}