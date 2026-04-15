"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, BookOpen, Save } from "lucide-react";
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

interface Section {
  id: number;
  name: string;
  description?: string;
  topic_id: number;
}

interface AddSectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  defaultTopicId?: number;
  sectionToEdit?: Section | null;
}

interface Topic {
  id: number;
  name: string;
}

export function AddSectionDialog({
  open,
  onOpenChange,
  onSuccess,
  defaultTopicId,
  sectionToEdit,
}: AddSectionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  
  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState<string>("");

  useEffect(() => {
    if (open) {
      api.get("/topics")
        .then(res => setTopics(res.data.data.topics || []))
        .catch(err => console.error("Load topics failed", err));
        
      if (sectionToEdit) {
        setName(sectionToEdit.name);
        setDescription(sectionToEdit.description || "");
        setTopicId(sectionToEdit.topic_id.toString());
      } else {
        setName("");
        setDescription("");
        if (defaultTopicId) {
          setTopicId(defaultTopicId.toString());
        } else {
          setTopicId("");
        }
      }
    }
  }, [open, defaultTopicId, sectionToEdit]);

  const handleSubmit = async () => {
    if (!topicId) {
      return toast.error("Vui lòng chọn Chủ đề (Topic)");
    }
    if (!name.trim()) {
      return toast.error("Tên chương là bắt buộc");
    }

    setLoading(true);
    try {
      if (sectionToEdit) {
        await api.put(`/exam-sections/${sectionToEdit.id}`, {
          id: sectionToEdit.id,
          name: name.trim(),
          description: description.trim(),
          topic_id: parseInt(topicId)
        });
        toast.success("Cập nhật chương thành công!");
      } else {
        await api.post("/exam-sections", {
          name: name.trim(),
          description: description.trim(),
          topic_id: parseInt(topicId)
        });
        toast.success("Tạo chương thành công!");
      }
      
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
          <DialogTitle>{sectionToEdit ? "Cập nhật chương" : "Tạo chương mới (Section)"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Thuộc Chủ đề (Topic) <span className="text-red-500">*</span></Label>
            <Select 
              value={topicId} 
              onValueChange={setTopicId} 
              disabled={!!defaultTopicId || !!sectionToEdit} // Khóa khi edit để tránh nhầm lẫn
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
                {sectionToEdit ? "Đang cập nhật..." : "Đang tạo..."}
              </>
            ) : (
              <>
                {sectionToEdit ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {sectionToEdit ? "Cập nhật chương" : "Lưu chương"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}