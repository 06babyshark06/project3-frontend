"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Search, Loader2, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Question {
  id: number;
  content: string;
  question_type: string;
  difficulty: string;
  section_name?: string;
}

interface Section {
  id: number;
  name: string;
}

interface QuestionBankSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  topicId: number;
  existingQuestionIds: number[];
  onAddQuestions: (selectedIds: number[]) => void;
}

export function QuestionBankSelector({
  open,
  onOpenChange,
  topicId,
  existingQuestionIds,
  onAddQuestions
}: QuestionBankSelectorProps) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  
  // Filters
  const [search, setSearch] = useState("");
  const [selectedSection, setSelectedSection] = useState("all");
  const [difficulty, setDifficulty] = useState("all");

  useEffect(() => {
    if (open && topicId) {
      api.get(`/exam-sections?topic_id=${topicId}`)
        .then(res => setSections(res.data.data.sections || []))
        .catch(err => console.error(err));
    }
  }, [open, topicId]);

  useEffect(() => {
    if (open && topicId) {
      fetchQuestions();
    }
  }, [open, topicId, search, selectedSection, difficulty]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: 100, 
        topic_id: topicId 
      };
      if (search) params.search = search;
      if (selectedSection !== "all") params.section_id = selectedSection;
      if (difficulty !== "all") params.difficulty = difficulty;

      const res = await api.get("/questions", { params });
      setQuestions(res.data.data.questions || []);
    } catch (error) {
      console.error("Failed to load questions", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: number) => {
    if (existingQuestionIds.includes(id)) return;
    
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(qId => qId !== id) 
        : [...prev, id]
    );
  };

  const handleConfirm = () => {
    onAddQuestions(selectedIds);
    setSelectedIds([]);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* FIX: 
         1. h-[90vh]: Cố định chiều cao 90% màn hình
         2. flex flex-col: Để chia layout dọc
         3. p-0 gap-0: Xóa padding mặc định để tự quản lý borders đẹp hơn
      */}
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col p-0 gap-0">
        
        {/* HEADER SECTION (Cố định) */}
        <div className="px-6 py-4 border-b">
          <DialogHeader className="mb-4">
            <DialogTitle>Chọn câu hỏi từ Ngân hàng</DialogTitle>
          </DialogHeader>

          {/* FILTERS */}
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-5 relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Tìm nội dung..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            
            <div className="col-span-4">
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Chương/Phần" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả chương</SelectItem>
                  {sections.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-3">
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger>
                  <SelectValue placeholder="Độ khó" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="easy">Dễ</SelectItem>
                  <SelectItem value="medium">Trung bình</SelectItem>
                  <SelectItem value="hard">Khó</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* BODY SECTION (Cuộn nội dung) */}
        {/* FIX: flex-1 overflow-hidden để chiếm hết khoảng trống còn lại */}
        <div className="flex-1 overflow-hidden bg-muted/5 p-4">
          <ScrollArea className="h-full pr-4">
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center text-muted-foreground py-10">
                Không tìm thấy câu hỏi nào phù hợp.
              </div>
            ) : (
              <div className="space-y-2">
                {questions.map((q) => {
                  const isExisting = existingQuestionIds.includes(q.id);
                  const isSelected = selectedIds.includes(q.id);

                  return (
                    <div 
                      key={q.id}
                      onClick={() => toggleSelection(q.id)}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all bg-card ${
                        isExisting ? "opacity-50 bg-muted cursor-not-allowed" : 
                        isSelected ? "bg-blue-50 border-blue-500 shadow-sm" : "hover:border-primary/50"
                      }`}
                    >
                      <div className="mt-1">
                        {isExisting ? (
                          <CheckSquare className="h-5 w-5 text-muted-foreground" />
                        ) : isSelected ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium line-clamp-2">{q.content}</p>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs bg-background">{q.section_name}</Badge>
                          <Badge variant="secondary" className="text-xs">
                            {q.question_type === "single_choice" ? "1 Đ.A" : "Nhiều Đ.A"}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={`text-xs bg-background ${
                              q.difficulty === 'easy' ? 'text-green-600 border-green-200' :
                              q.difficulty === 'medium' ? 'text-yellow-600 border-yellow-200' :
                              'text-red-600 border-red-200'
                            }`}
                          >
                            {q.difficulty}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* FOOTER SECTION (Cố định) */}
        <div className="p-4 border-t bg-background">
          <DialogFooter className="flex justify-between items-center w-full sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Đã chọn: <strong className="text-primary">{selectedIds.length}</strong> câu hỏi
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
              <Button onClick={handleConfirm} disabled={selectedIds.length === 0}>
                Thêm vào bài thi
              </Button>
            </div>
          </DialogFooter>
        </div>

      </DialogContent>
    </Dialog>
  );
}