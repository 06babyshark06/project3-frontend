"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";

interface Topic {
  id: number;
  name: string;
  description?: string;
}

interface AddTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  topicToEdit?: Topic | null;
}

export function AddTopicDialog({
  open,
  onOpenChange,
  onSuccess,
  topicToEdit,
}: AddTopicDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // Update form when topicToEdit changes
  useEffect(() => {
    if (topicToEdit) {
      setName(topicToEdit.name);
      setDescription(topicToEdit.description || "");
    } else {
      setName("");
      setDescription("");
    }
  }, [topicToEdit, open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      return toast.error("Tên chủ đề là bắt buộc");
    }

    setLoading(true);
    try {
      if (topicToEdit) {
        await api.put(`/topics/${topicToEdit.id}`, {
          id: topicToEdit.id,
          name: name.trim(),
          description: description.trim(),
        });
        toast.success("Cập nhật chủ đề thành công!");
      } else {
        await api.post("/topics", {
          name: name.trim(),
          description: description.trim(),
        });
        toast.success("Tạo chủ đề thành công!");
      }
      
      setName("");
      setDescription("");
      onSuccess(); // Refresh danh sách topic bên ngoài
      onOpenChange(false);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error?.message || "Lỗi khi tạo chủ đề");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{topicToEdit ? "Cập nhật chủ đề" : "Tạo chủ đề mới"}</DialogTitle>
          <DialogDescription>
            {topicToEdit ? "Chỉnh sửa thông tin chủ đề kiến thức." : "Tạo các chủ đề lớn (ví dụ: Toán cao cấp, Lập trình C++) để quản lý các chương và câu hỏi."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên chủ đề <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              placeholder="Ví dụ: Lập trình mạng"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Mô tả (Tùy chọn)</Label>
            <Textarea
              id="desc"
              placeholder="Mô tả ngắn về nội dung kiến thức..."
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
                {topicToEdit ? "Đang cập nhật..." : "Đang tạo..."}
              </>
            ) : (
              <>
                {topicToEdit ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                {topicToEdit ? "Cập nhật chủ đề" : "Tạo chủ đề mới"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}