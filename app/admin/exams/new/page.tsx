// app/admin/exams/new/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

interface Topic {
  id: number; // ID từ API thường là number
  name: string;
}

export default function CreateExamPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  
  // QUAN TRỌNG: State này sẽ lưu ID dưới dạng STRING để khớp với Select
  const [selectedTopic, setSelectedTopic] = useState<string>("");

  // Form State Topic Mới
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [newTopicName, setNewTopicName] = useState("");
  const [newTopicDesc, setNewTopicDesc] = useState("");
  const [isCreatingTopic, setIsCreatingTopic] = useState(false);

  const fetchTopics = async () => {
    try {
      const res = await api.get("/topics");
      const list = res.data.data?.topics || [];
      setTopics(list);
    } catch (error) {
      toast.error("Không thể tải danh sách chủ đề");
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic) {
      toast.error("Vui lòng chọn chủ đề");
      return;
    }
    setIsLoading(true);

    try {
      const response = await api.post("/exams", {
        title,
        description, 
        duration_minutes: Number(duration),
        topic_id: Number(selectedTopic), // Chuyển lại thành số khi gửi đi
        question_ids: []
      });

      const newExam = response.data.data;
      toast.success("Tạo bài thi thành công!");
      router.push(`/admin/exams/edit/${newExam.id}`);

    } catch (error: any) {
      toast.error("Lỗi tạo bài thi", { description: error.response?.data?.error });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTopic = async () => {
    if (!newTopicName) return;
    setIsCreatingTopic(true);
    try {
      const res = await api.post("/topics", {
        name: newTopicName,
        description: newTopicDesc
      });
      
      toast.success("Đã thêm chủ đề mới!");
      
      setNewTopicName("");
      setNewTopicDesc("");
      setIsTopicModalOpen(false);

      // Tải lại danh sách để có topic mới
      await fetchTopics();
      
      // Tự động chọn topic vừa tạo
      // Ép kiểu ID sang string để Select nhận diện được
      const newTopicId = String(res.data.data.topic.id);
      setSelectedTopic(newTopicId);

    } catch (error: any) {
      toast.error("Tạo chủ đề thất bại", { description: error.response?.data?.error });
    } finally {
      setIsCreatingTopic(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Tạo Bài Thi Mới</CardTitle>
          <CardDescription>Thiết lập thông tin cơ bản cho bài kiểm tra.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Tiêu đề bài thi</Label>
              <Input 
                required 
                placeholder="Ví dụ: Kiểm tra giữa kỳ Go Basic" 
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>
            
             <div className="space-y-2">
              <Label>Mô tả ngắn</Label>
              <Textarea
                placeholder="Nội dung bài thi bao gồm..." 
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Chủ đề</Label>
                <div className="flex gap-2">
                    <Select 
                      onValueChange={setSelectedTopic} 
                      value={selectedTopic}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Chọn chủ đề" />
                      </SelectTrigger>
                      <SelectContent>
                        {topics.map(t => (
                          // QUAN TRỌNG: value phải là string
                          <SelectItem key={t.id} value={String(t.id)}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Button type="button" variant="outline" size="icon" onClick={() => setIsTopicModalOpen(true)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Thời gian làm bài (phút)</Label>
                <Input 
                  type="number" 
                  min="1" 
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Lưu và Thêm Câu Hỏi
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Modal Tạo Topic */}
      <Dialog open={isTopicModalOpen} onOpenChange={setIsTopicModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Thêm Chủ Đề Mới</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
                <div className="space-y-2">
                    <Label>Tên chủ đề</Label>
                    <Input 
                        placeholder="Ví dụ: ReactJS..." 
                        value={newTopicName}
                        onChange={e => setNewTopicName(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Mô tả (Tùy chọn)</Label>
                    <Input 
                        placeholder="Mô tả ngắn gọn..." 
                        value={newTopicDesc}
                        onChange={e => setNewTopicDesc(e.target.value)}
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsTopicModalOpen(false)}>Hủy</Button>
                <Button onClick={handleCreateTopic} disabled={isCreatingTopic}>
                    {isCreatingTopic && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Tạo Mới
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}