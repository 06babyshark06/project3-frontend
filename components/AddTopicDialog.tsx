"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
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

interface AddTopicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddTopicDialog({
  open,
  onOpenChange,
  onSuccess,
}: AddTopicDialogProps) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!name.trim()) {
      return toast.error("Tên chủ đề là bắt buộc");
    }

    setLoading(true);
    try {
      await api.post("/topics", {
        name: name.trim(),
        description: description.trim(),
      });
      
      toast.success("Tạo chủ đề thành công!");
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
          <DialogTitle>Tạo chủ đề mới</DialogTitle>
          <DialogDescription>
            Tạo các chủ đề lớn (ví dụ: Toán cao cấp, Lập trình C++) để quản lý các chương và câu hỏi.
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
                Đang tạo...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Tạo chủ đề
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}