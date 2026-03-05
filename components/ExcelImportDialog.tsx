"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, FileSpreadsheet, UploadCloud, AlertCircle, FileDown } from "lucide-react";
import { toast } from "sonner";

interface ExcelImportDialogProps {
  onImportSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExcelImportDialog({
  onImportSuccess,
  open,
  onOpenChange,
}: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];

      // Validate file type
      const validTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ];

      if (!validTypes.includes(selectedFile.type)) {
        toast.error("Chỉ chấp nhận file Excel (.xls, .xlsx)");
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleDownloadTemplate = () => {
    // Đảm bảo bạn đã tạo file này trong folder public/templates/
    const fileUrl = "/templates/question_template.xlsx";
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = "question_template.xlsx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!file) {
      return toast.error("Vui lòng chọn file Excel");
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await api.post("/questions/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { success_count, error_count } = res.data.data;

      if (success_count > 0) {
        toast.success(`Đã import thành công ${success_count} câu hỏi!`, {
          description: error_count > 0 ? `Có ${error_count} dòng bị lỗi, vui lòng kiểm tra lại.` : "Tất cả dữ liệu hợp lệ."
        });
        onImportSuccess();
        onOpenChange(false);
      } else {
        toast.error("Import thất bại", { description: "Không có câu hỏi nào được thêm. Vui lòng kiểm tra file." });
      }

    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Lỗi khi import dữ liệu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            Import Câu hỏi từ Excel
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* ALERT HƯỚNG DẪN TỔNG QUAN */}
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex gap-3 items-start">
            <div className="bg-blue-100 p-2 rounded-full shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-sm text-blue-900 space-y-1">
              <p className="font-medium">Tự động phân loại thông minh</p>
              <p className="opacity-90">
                Hệ thống sẽ tự động tạo hoặc tìm <strong>Chủ đề (Topic)</strong> và <strong>Chương (Section)</strong> dựa trên dữ liệu trong file Excel của bạn.
              </p>
              <Button
                variant="link"
                className="p-0 h-auto text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-1 mt-1"
                onClick={handleDownloadTemplate}
              >
                <FileDown className="h-4 w-4" /> Tải file mẫu chuẩn tại đây
              </Button>
            </div>
          </div>

          {/* KHU VỰC UPLOAD */}
          <div className="space-y-2">
            <Label>Chọn file Excel (.xlsx, .xls) <span className="text-red-500">*</span></Label>
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer relative group">
              <input
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="excel-file-input"
              />
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-muted rounded-full group-hover:bg-background transition-colors">
                  <UploadCloud className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                {file ? (
                  <div className="text-sm">
                    <p className="font-medium text-primary text-base">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Kích thước: {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium text-foreground">Kéo thả hoặc click để tải lên</p>
                    <p className="text-xs mt-1">Hỗ trợ định dạng chuẩn Excel 2007+</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* HƯỚNG DẪN CHI TIẾT CẤU TRÚC FILE */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
            <div className="p-4 bg-muted/40 border-b">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                📋 Cấu trúc cột bắt buộc (Thứ tự từ A → J)
              </h4>
            </div>
            <div className="p-4 text-xs grid grid-cols-2 gap-x-8 gap-y-3 text-muted-foreground">
              <div className="flex justify-between border-b border-dashed pb-1">
                <span>Cột A</span>
                <span className="font-medium text-foreground">Tên Chủ đề (Topic)</span>
              </div>
              <div className="flex justify-between border-b border-dashed pb-1">
                <span>Cột B</span>
                <span className="font-medium text-foreground">Tên Chương (Section)</span>
              </div>
              <div className="flex justify-between border-b border-dashed pb-1">
                <span>Cột C</span>
                <span className="font-medium text-foreground">Nội dung câu hỏi</span>
              </div>
              <div className="flex justify-between border-b border-dashed pb-1">
                <span>Cột D</span>
                <span className="font-medium text-foreground">Loại (single/multiple_choice)</span>
              </div>
              <div className="flex justify-between border-b border-dashed pb-1">
                <span>Cột E</span>
                <span className="font-medium text-foreground">Độ khó (easy/medium/hard)</span>
              </div>
              <div className="flex justify-between border-b border-dashed pb-1">
                <span>Cột F</span>
                <span className="font-medium text-foreground">Giải thích (Explanation)</span>
              </div>
              <div className="flex justify-between border-b border-dashed pb-1">
                <span>Cột G</span>
                <span className="font-medium text-foreground">Link Ảnh/Video (nếu có)</span>
              </div>
              <div className="flex justify-between border-b border-dashed pb-1">
                <span>Cột H</span>
                <span className="font-medium text-foreground">Đáp án đúng (VD: A,C)</span>
              </div>
              <div className="col-span-2 flex justify-between bg-muted/30 p-1.5 rounded">
                <span>Cột I, J, K, L...</span>
                <span className="font-medium text-foreground">Nội dung các lựa chọn A, B, C, D...</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Đóng
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || !file}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang xử lý...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Tiến hành Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}