// app/admin/exams/create-new/page.tsx
// ✅ HOÀN CHỈNH: Tạo bài thi với 2 mode - Manual (chọn câu) và Auto (random)
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Loader2, ArrowLeft, PlusCircle, Trash2, Eye, Search,
  Shuffle, ListChecks, Settings
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";

// ===== INTERFACES =====
interface Topic {
  id: number;
  name: string;
}

interface Section {
  id: number;
  name: string;
}

interface Question {
  id: number;
  content: string;
  question_type: string;
  difficulty: string;
  section_name?: string;
  choices?: Choice[];
}

interface Choice {
  id: number;
  content: string;
  is_correct: boolean;
}

interface SectionConfig {
  section_id: number;
  count: number;
  difficulty: string;
}

export default function CreateExamPageNew() {
  const router = useRouter();

  // ===== BASIC INFO =====
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [password, setPassword] = useState("");
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [showResultImmediately, setShowResultImmediately] = useState(true);

  // ===== TOPIC & SECTIONS =====
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<number>(0);
  const [sections, setSections] = useState<Section[]>([]);

  // ===== MODE: "manual" hoặc "auto" =====
  const [mode, setMode] = useState<"manual" | "auto">("manual");

  // ===== MANUAL MODE STATE =====
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSection, setFilterSection] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // ===== AUTO MODE STATE =====
  const [sectionConfigs, setSectionConfigs] = useState<SectionConfig[]>([]);

  // ===== DIALOG =====
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  // ===== CREATING =====
  const [isCreating, setIsCreating] = useState(false);

  // ===== FETCH TOPICS =====
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await api.get("/topics");
        setTopics(res.data.data.topics || []);
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    };
    fetchTopics();
  }, []);

  // ===== FETCH SECTIONS when topic changes =====
  useEffect(() => {
    if (!selectedTopic) return;

    const fetchSections = async () => {
      try {
        const res = await api.get(`/exam-sections?topic_id=${selectedTopic}`);
        setSections(res.data.data.sections || []);
      } catch (error) {
        console.error("Error fetching sections:", error);
      }
    };
    fetchSections();
  }, [selectedTopic]);

  // ===== MANUAL MODE: FETCH QUESTIONS =====
  const fetchQuestions = async (page = 1) => {
    if (!selectedTopic) return;
    
    setIsLoadingQuestions(true);
    try {
      const params: any = {
        topic_id: selectedTopic,
        page,
        limit: 20
      };

      if (searchTerm) params.search = searchTerm;
      if (filterSection !== "all") params.section_id = filterSection;
      if (filterDifficulty !== "all") params.difficulty = filterDifficulty;

      const res = await api.get("/questions", { params });
      const data = res.data.data;

      setAvailableQuestions(data.questions || []);
      setTotalPages(data.total_pages || 1);
      setCurrentPage(data.page || 1);
    } catch (error) {
      console.error("Error fetching questions:", error);
      toast.error("Không thể tải câu hỏi");
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  // ===== MANUAL: TOGGLE SELECT QUESTION =====
  const toggleSelectQuestion = (question: Question) => {
    const isSelected = selectedQuestions.some(q => q.id === question.id);
    
    if (isSelected) {
      setSelectedQuestions(selectedQuestions.filter(q => q.id !== question.id));
    } else {
      setSelectedQuestions([...selectedQuestions, question]);
    }
  };

  // ===== MANUAL: REMOVE SELECTED QUESTION =====
  const removeSelectedQuestion = (questionId: number) => {
    setSelectedQuestions(selectedQuestions.filter(q => q.id !== questionId));
  };

  // ===== AUTO MODE: ADD SECTION CONFIG =====
  const handleAddSectionConfig = () => {
    if (sections.length === 0) {
      toast.error("Chọn chủ đề trước để thêm section!");
      return;
    }

    setSectionConfigs([
      ...sectionConfigs,
      { section_id: sections[0].id, count: 5, difficulty: "easy" }
    ]);
  };

  const handleRemoveSectionConfig = (index: number) => {
    setSectionConfigs(sectionConfigs.filter((_, i) => i !== index));
  };

  const handleSectionConfigChange = (
    index: number,
    field: keyof SectionConfig,
    value: any
  ) => {
    const updated = [...sectionConfigs];
    updated[index] = { ...updated[index], [field]: value };
    setSectionConfigs(updated);
  };

  // ===== CREATE EXAM =====
  const handleCreateExam = async () => {
    if (!title || !selectedTopic) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    if (mode === "manual" && selectedQuestions.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 câu hỏi!");
      return;
    }

    if (mode === "auto" && sectionConfigs.length === 0) {
      toast.error("Vui lòng thêm ít nhất 1 section config!");
      return;
    }

    setIsCreating(true);

    try {
      const settings = {
        duration_minutes: duration,
        max_attempts: maxAttempts,
        password: password || "",
        shuffle_questions: shuffleQuestions,
        requires_approval: requiresApproval,
        show_result_immediately: showResultImmediately
      };

      let response;

      if (mode === "manual") {
        // ===== TẠO EXAM VỚI CÂU HỎI THỦ CÔNG =====
        response = await api.post("/exams", {
          title,
          description,
          topic_id: selectedTopic,
          question_ids: selectedQuestions.map(q => q.id),
          settings
        });
      } else {
        // ===== TẠO EXAM TỰ ĐỘNG (RANDOM) =====
        response = await api.post("/exams/generate", {
          title,
          description,
          topic_id: selectedTopic,
          section_configs: sectionConfigs,
          settings
        });
      }

      toast.success("Tạo bài thi thành công!");
      router.push(`/admin/exams/edit/${response.data.data.id}`);
    } catch (error: any) {
      toast.error(
        error.response?.data?.error?.message || "Tạo bài thi thất bại!"
      );
    } finally {
      setIsCreating(false);
    }
  };

  // ===== GET DIFFICULTY BADGE =====
  const getDifficultyBadge = (difficulty: string) => {
    const variants: Record<string, any> = {
      easy: { variant: "secondary", label: "Dễ" },
      medium: { variant: "default", label: "Trung bình" },
      hard: { variant: "destructive", label: "Khó" }
    };
    const { variant, label } = variants[difficulty] || variants.easy;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* HEADER */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Tạo bài thi mới</h1>
          <p className="text-muted-foreground">Chọn câu hỏi thủ công hoặc tạo tự động</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT PANEL - BASIC INFO */}
        <div className="lg:col-span-2 space-y-6">
          {/* BASIC INFO CARD */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tiêu đề bài thi *</Label>
                <Input
                  placeholder="VD: Kiểm tra giữa kỳ - Toán 10"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <Label>Mô tả</Label>
                <Textarea
                  placeholder="Mô tả về bài thi..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Chủ đề *</Label>
                  <Select
                    value={selectedTopic.toString()}
                    onValueChange={(val) => {
                      setSelectedTopic(Number(val));
                      setSelectedQuestions([]);
                      setSectionConfigs([]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn chủ đề" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map((t) => (
                        <SelectItem key={t.id} value={t.id.toString()}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Thời gian (phút)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MODE SELECTION & QUESTIONS */}
          <Card>
            <CardHeader>
              <CardTitle>Chọn câu hỏi</CardTitle>
              <CardDescription>
                Chọn thủ công từng câu hoặc để hệ thống random tự động
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={mode} onValueChange={(v) => setMode(v as "manual" | "auto")}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="manual">
                    <ListChecks className="mr-2 h-4 w-4" />
                    Chọn thủ công
                  </TabsTrigger>
                  <TabsTrigger value="auto">
                    <Shuffle className="mr-2 h-4 w-4" />
                    Random tự động
                  </TabsTrigger>
                </TabsList>

                {/* ===== MANUAL MODE ===== */}
                <TabsContent value="manual" className="space-y-4">
                  {!selectedTopic ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Vui lòng chọn chủ đề trước
                    </p>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => setIsQuestionDialogOpen(true)}
                          className="w-full"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Thêm câu hỏi ({selectedQuestions.length} đã chọn)
                        </Button>
                      </div>

                      {selectedQuestions.length > 0 && (
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Câu hỏi đã chọn</h4>
                            <Badge variant="secondary">
                              {selectedQuestions.length} câu
                            </Badge>
                          </div>
                          <div className="space-y-2 max-h-[400px] overflow-y-auto">
                            {selectedQuestions.map((q, idx) => (
                              <div
                                key={q.id}
                                className="flex items-start justify-between p-3 bg-muted rounded-md"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-sm">#{idx + 1}</span>
                                    {getDifficultyBadge(q.difficulty)}
                                    {q.section_name && (
                                      <Badge variant="outline" className="text-xs">
                                        {q.section_name}
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm line-clamp-2">{q.content}</p>
                                </div>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => removeSelectedQuestion(q.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>

                {/* ===== AUTO MODE ===== */}
                <TabsContent value="auto" className="space-y-4">
                  {!selectedTopic || sections.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Vui lòng chọn chủ đề có sections
                    </p>
                  ) : (
                    <>
                      <Button onClick={handleAddSectionConfig} variant="outline" className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Thêm Section
                      </Button>

                      {sectionConfigs.length > 0 && (
                        <div className="space-y-3">
                          {sectionConfigs.map((config, index) => (
                            <Card key={index}>
                              <CardContent className="pt-4">
                                <div className="flex items-end gap-3">
                                  <div className="flex-1 grid grid-cols-3 gap-2">
                                    <div>
                                      <Label className="text-xs">Section</Label>
                                      <Select
                                        value={config.section_id.toString()}
                                        onValueChange={(val) =>
                                          handleSectionConfigChange(index, "section_id", Number(val))
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {sections.map((s) => (
                                            <SelectItem key={s.id} value={s.id.toString()}>
                                              {s.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>

                                    <div>
                                      <Label className="text-xs">Số câu</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={config.count}
                                        onChange={(e) =>
                                          handleSectionConfigChange(index, "count", Number(e.target.value))
                                        }
                                      />
                                    </div>

                                    <div>
                                      <Label className="text-xs">Độ khó</Label>
                                      <Select
                                        value={config.difficulty}
                                        onValueChange={(val) =>
                                          handleSectionConfigChange(index, "difficulty", val)
                                        }
                                      >
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

                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleRemoveSectionConfig(index)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT PANEL - SETTINGS */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Cài đặt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Mật khẩu phòng thi</Label>
                <Input
                  type="text"
                  placeholder="Để trống nếu không cần"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>Số lần thi tối đa</Label>
                <Input
                  type="number"
                  min="1"
                  value={maxAttempts}
                  onChange={(e) => setMaxAttempts(Number(e.target.value))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <Label htmlFor="shuffle">Đảo câu hỏi</Label>
                <Switch
                  id="shuffle"
                  checked={shuffleQuestions}
                  onCheckedChange={setShuffleQuestions}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="approval">Yêu cầu duyệt</Label>
                <Switch
                  id="approval"
                  checked={requiresApproval}
                  onCheckedChange={setRequiresApproval}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="showResult">Hiện điểm ngay</Label>
                <Switch
                  id="showResult"
                  checked={showResultImmediately}
                  onCheckedChange={setShowResultImmediately}
                />
              </div>
            </CardContent>
          </Card>

          {/* CREATE BUTTON */}
          <Button
            onClick={handleCreateExam}
            disabled={isCreating}
            className="w-full"
            size="lg"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo...
              </>
            ) : (
              <>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tạo bài thi
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ===== DIALOG CHỌN CÂU HỎI ===== */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Chọn câu hỏi từ ngân hàng</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* FILTERS */}
            <div className="flex gap-2">
              <Input
                placeholder="Tìm kiếm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={filterSection} onValueChange={setFilterSection}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Section" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả sections</SelectItem>
                  {sections.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Độ khó" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="easy">Dễ</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="hard">Khó</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={() => fetchQuestions(1)}>
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* QUESTION LIST */}
            <ScrollArea className="h-[500px] border rounded-lg">
              {isLoadingQuestions ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : availableQuestions.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  Không tìm thấy câu hỏi
                </p>
              ) : (
                <div className="p-4 space-y-2">
                  {availableQuestions.map((q) => {
                    const isSelected = selectedQuestions.some(sq => sq.id === q.id);
                    return (
                      <div
                        key={q.id}
                        className={`p-4 border rounded-lg cursor-pointer hover:bg-muted transition ${
                          isSelected ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => toggleSelectQuestion(q)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox checked={isSelected} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getDifficultyBadge(q.difficulty)}
                              {q.section_name && (
                                <Badge variant="outline">{q.section_name}</Badge>
                              )}
                              <Badge variant="secondary">{q.question_type}</Badge>
                            </div>
                            <p className="text-sm font-medium">{q.content}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* PAGINATION */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => fetchQuestions(currentPage - 1)}
                >
                  Trước
                </Button>
                <span className="flex items-center px-4 text-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === totalPages}
                  onClick={() => fetchQuestions(currentPage + 1)}
                >
                  Sau
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
              Đóng
            </Button>
            <Button onClick={() => setIsQuestionDialogOpen(false)}>
              Xong ({selectedQuestions.length} câu)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}