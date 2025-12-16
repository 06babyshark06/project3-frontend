"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Plus, BookOpen } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Exam {
  id: number;
  title: string;
}

interface AddExamToClassDialogProps {
  classId: number | string;
  onSuccess: () => void;
}

export function AddExamToClassDialog({ classId, onSuccess }: AddExamToClassDialogProps) {
  const [open, setOpen] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Load danh sách bài thi của giảng viên khi mở Dialog
  useEffect(() => {
    if (open) {
      const fetchExams = async () => {
        try {
          setFetching(true);
          // Gọi API mới mà bạn vừa thêm ở Backend
          const res = await api.get("/instructor/all-exams");
          setExams(res.data.data.exams || []);
        } catch (error) {
          console.error(error);
          toast.error("Không thể tải danh sách bài thi");
        } finally {
          setFetching(false);
        }
      };
      fetchExams();
    }
  }, [open]);

  const handleAssign = async () => {
    if (!selectedExamId) {
      toast.error("Vui lòng chọn một bài thi");
      return;
    }

    try {
      setLoading(true);
      // Gọi API gán bài thi (lưu ý ép kiểu exam_id về number nếu backend yêu cầu int64)
      await api.post(`/classes/${classId}/exams`, {
        exam_id: parseInt(selectedExamId),
      });
      
      toast.success("Đã thêm bài thi vào lớp thành công!");
      setOpen(false);
      setSelectedExamId(""); // Reset selection
      onSuccess(); // Refresh lại danh sách bên ngoài
    } catch (error: any) {
      console.error(error);
      const msg = error.response?.data?.error || "Lỗi khi gán bài thi";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Thêm bài thi
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Gán bài thi cho lớp học</DialogTitle>
          <DialogDescription>
            Chọn bài thi từ thư viện của bạn để giao cho lớp này. Học sinh trong lớp sẽ nhìn thấy và có thể làm bài.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="exam" className="text-right">
              Bài thi
            </Label>
            <div className="col-span-3">
              <Select onValueChange={setSelectedExamId} value={selectedExamId} disabled={fetching}>
                <SelectTrigger>
                  <SelectValue placeholder={fetching ? "Đang tải..." : "Chọn bài thi..."} />
                </SelectTrigger>
                <SelectContent>
                  {exams.length === 0 && !fetching ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      Bạn chưa tạo bài thi nào.
                    </div>
                  ) : (
                    exams.map((exam) => (
                      <SelectItem key={exam.id} value={exam.id.toString()}>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="truncate max-w-[280px]">{exam.title}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Hủy
          </Button>
          <Button type="submit" onClick={handleAssign} disabled={loading || !selectedExamId}>
            {loading ? "Đang xử lý..." : "Xác nhận thêm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}