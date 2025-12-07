"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Search, Loader2, CheckSquare, Square, Filter } from "lucide-react";
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
  existingQuestionIds: number[]; // Để disable các câu đã có trong bài thi
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

  // Fetch Sections khi Topic thay đổi
  useEffect(() => {
    if (open && topicId) {
      api.get(`/exam-sections?topic_id=${topicId}`)
        .then(res => setSections(res.data.data.sections || []))
        .catch(err => console.error(err));
    }
  }, [open, topicId]);

  // Fetch Questions
  useEffect(() => {
    if (open && topicId) {
      fetchQuestions();
    }
  }, [open, topicId, search, selectedSection, difficulty]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: 50, // Lấy nhiều để chọn
        topic_id: topicId // Quan trọng: Lọc theo Topic của bài thi
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
    setSelectedIds([]); // Reset selection
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Chọn câu hỏi từ Ngân hàng</DialogTitle>
        </DialogHeader>

        {/* FILTERS */}
        <div className="grid grid-cols-12 gap-3 py-4">
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

        {/* LIST */}
        <ScrollArea className="flex-1 border rounded-md h-[400px] p-2">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : questions.length === 0 ? (
            <div className="text-center text-muted-foreground py-10">
              Không tìm thấy câu hỏi nào trong chủ đề này.
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
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      isExisting ? "opacity-50 bg-muted cursor-not-allowed" : 
                      isSelected ? "bg-primary/5 border-primary" : "hover:bg-muted/50"
                    }`}
                  >
                    <div className="mt-1">
                      {isExisting ? (
                        <CheckSquare className="h-5 w-5 text-muted-foreground" />
                      ) : isSelected ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium line-clamp-2">{q.content}</p>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">{q.section_name}</Badge>
                        <Badge variant="secondary" className="text-xs">
                          {q.question_type === "single_choice" ? "1 Đ.A" : "Nhiều Đ.A"}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${
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

        <DialogFooter className="mt-4 flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Đã chọn: <strong>{selectedIds.length}</strong> câu hỏi
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
            <Button onClick={handleConfirm} disabled={selectedIds.length === 0}>
              Thêm vào bài thi
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}