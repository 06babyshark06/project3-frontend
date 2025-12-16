"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Plus, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";

interface AddClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddClassDialog({ open, onOpenChange, onSuccess }: AddClassDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", code: "", description: "" });

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.code.trim()) {
      return toast.error("Tên lớp và Mã lớp là bắt buộc");
    }

    setLoading(true);
    try {
      await api.post("/classes", formData);
      toast.success("Tạo lớp thành công!");
      setFormData({ name: "", code: "", description: "" });
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Lỗi khi tạo lớp");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="h-5 w-5" /> Tạo lớp học mới
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Tên lớp <span className="text-red-500">*</span></Label>
            <Input
              placeholder="VD: Java Cơ bản 01"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Mã lớp (Code) <span className="text-red-500">*</span></Label>
            <Input
              placeholder="VD: JAVA01 (Dùng để tra cứu)"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '') })}
            />
          </div>
          <div className="space-y-2">
            <Label>Mô tả</Label>
            <Textarea
              placeholder="Thông tin thêm về lớp học..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Tạo lớp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}