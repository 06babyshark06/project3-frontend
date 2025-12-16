"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api"; // Import instance api đã cấu hình
import { PlusCircle } from "lucide-react"; // Nếu chưa có icon thì bỏ dòng này và thẻ <PlusCircle> bên dưới

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function JoinClassDialog() {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async () => {
    if (!code.trim()) {
      toast.error("Vui lòng nhập mã lớp học");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/classes/join", { code });

      toast.success("Tham gia lớp học thành công!");
      
      setCode("");
      setOpen(false);
      
      router.refresh(); 
      
    } catch (error: any) {
      console.error("Lỗi tham gia lớp:", error);
      const errorMessage = error.response?.data?.error || "Không thể tham gia lớp. Vui lòng kiểm tra lại mã.";
      
      toast.error("Tham gia thất bại", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tham gia lớp học
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Tham gia lớp học</DialogTitle>
          <DialogDescription>
            Nhập mã lớp (Class Code) do giảng viên cung cấp.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="code" className="text-right">
              Mã lớp
            </Label>
            <Input
              id="code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="VD: INT3306"
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={isLoading}>
            Hủy
          </Button>
          <Button type="submit" onClick={handleJoin} disabled={isLoading}>
            {isLoading ? "Đang xử lý..." : "Tham gia ngay"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}