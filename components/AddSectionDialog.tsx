"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultTopicId?: number; // Pre-fill nếu đang filter theo topic
}

interface Topic {
  id: number;
  name: string;
}

export function AddSectionDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultTopicId
}: AddSectionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  
  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState<string>("");

  // Load danh sách Topic khi mở dialog
  useEffect(() => {
    if (open) {
      api.get("/topics")
        .then(res => setTopics(res.data.data.topics || []))
        .catch(err => console.error("Load topics failed", err));
        
      // Reset form
      setName("");
      setDescription("");
      if (defaultTopicId) {
        setTopicId(defaultTopicId.toString());
      } else {
        setTopicId("");
      }
    }
  }, [open, defaultTopicId]);

  const handleSubmit = async () => {
    if (!topicId) {
      return toast.error("Vui lòng chọn Chủ đề (Topic)");
    }
    if (!name.trim()) {
      return toast.error("Tên chương là bắt buộc");
    }

    setLoading(true);
    try {
      await api.post("/exam-sections", {
        name: name.trim(),
        description: description.trim(),
        topic_id: parseInt(topicId)
      });
      
      toast.success("Tạo chương thành công!");
      onSuccess(); // Refresh danh sách bên ngoài
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error?.message || "Lỗi khi tạo chương");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo chương mới (Section)</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Thuộc Chủ đề (Topic) <span className="text-red-500">*</span></Label>
            <Select 
              value={topicId} 
              onValueChange={setTopicId} 
              disabled={!!defaultTopicId} // Nếu đã chọn ở ngoài thì khóa lại cho tiện
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn chủ đề..." />
              </SelectTrigger>
              <SelectContent>
                {topics.map((t) => (
                  <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Tên chương <span className="text-red-500">*</span></Label>
            <Input
              placeholder="Ví dụ: Chương 1 - Đại số tuyến tính"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Mô tả (Tùy chọn)</Label>
            <Textarea
              placeholder="Mô tả nội dung chương..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
                Đang tạo...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Lưu chương
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}