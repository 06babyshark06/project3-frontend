"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileSpreadsheet, Download, UploadCloud, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface Topic {
  id: number;
  name: string;
}

// ===== INTERFACE SỬA LỖI =====
interface ExcelImportDialogProps {
  topicId?: number; // Optional vì có thể không truyền
  onImportSuccess: () => void;
  // ✅ THÊM CÁC PROPS BỊ THIẾU
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId?: number; // Optional nếu cần
}

export function ExcelImportDialog({ 
  topicId, 
  onImportSuccess, 
  open, 
  onOpenChange,
  examId 
}: ExcelImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>(topicId ? String(topicId) : "");

  // ===== FETCH TOPICS KHI MỞ DIALOG =====
  useEffect(() => {
    if (open) {
      fetchTopics();
      setFile(null); // Reset file
      if (topicId) {
        setSelectedTopic(String(topicId));
      }
    }
  }, [open, topicId]);

  const fetchTopics = async () => {
    try {
      const res = await api.get("/topics");
      setTopics(res.data.data?.topics || []);
    } catch (error) {
      console.error("Error fetching topics:", error);
      toast.error("Không thể tải danh sách chủ đề");
    }
  };

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

  const handleImport = async () => {
    if (!file) {
      return toast.error("Vui lòng chọn file Excel");
    }
    
    if (!selectedTopic) {
      return toast.error("Vui lòng chọn chủ đề");
    }
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("topic_id", selectedTopic);
    
    // Nếu có examId thì thêm vào (tùy backend có xử lý hay không)
    if (examId) {
      formData.append("exam_id", String(examId));
    }

    try {
      const res = await api.post("/questions/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const data = res.data.data;
      const successCount = data.success_count || 0;
      const errorCount = data.error_count || 0;
      const errors = data.errors || [];
      
      if (successCount > 0) {
        toast.success(`✅ Đã nhập thành công ${successCount} câu hỏi!`, {
          description: errorCount > 0 
            ? `⚠️ Có ${errorCount} dòng bị lỗi. Kiểm tra console để xem chi tiết.` 
            : "Tất cả câu hỏi đều hợp lệ."
        });
        
        // Log errors to console for debugging
        if (errors.length > 0) {
          console.error("Import errors:", errors);
        }
        
        // Reset và đóng dialog
        setFile(null);
        onOpenChange(false);
        onImportSuccess();
      } else {
        toast.error("❌ Import thất bại", { 
          description: `${errorCount} dòng bị lỗi. Kiểm tra định dạng file.` 
        });
        
        if (errors.length > 0) {
          console.error("Import errors:", errors);
        }
      }
    } catch (error: any) {
      console.error("Import error:", error);
      const errorMsg = error.response?.data?.error?.message || "Lỗi kết nối khi import";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Download file mẫu từ backend (nếu có endpoint)
    const templateUrl = "/api/v1/questions/template";
    window.open(templateUrl, "_blank");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Import Câu hỏi từ Excel
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* ALERT HƯỚNG DẪN */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-sm text-blue-900">
              File Excel cần có định dạng đúng theo mẫu.
              <Button 
                variant="link" 
                className="p-0 h-auto ml-1 text-blue-600 hover:text-blue-800 underline"
                onClick={handleDownloadTemplate}
              >
                Tải file mẫu tại đây
              </Button>
            </div>
          </div>

          {/* CHỌN TOPIC */}
          <div className="space-y-2">
            <Label>Chủ đề / Môn học *</Label>
            <Select 
              onValueChange={setSelectedTopic} 
              value={selectedTopic}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn chủ đề để phân loại câu hỏi" />
              </SelectTrigger>
              <SelectContent>
                {topics.length > 0 ? (
                  topics.map((topic) => (
                    <SelectItem key={topic.id} value={String(topic.id)}>
                      {topic.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>
                    Chưa có chủ đề nào
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* CHỌN FILE */}
          <div className="space-y-2">
            <Label>File Excel *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition">
              <input
                type="file"
                accept=".xls,.xlsx"
                onChange={handleFileChange}
                className="hidden"
                id="excel-file-input"
              />
              <label
                htmlFor="excel-file-input"
                className="cursor-pointer flex flex-col items-center gap-2"
              >
                <UploadCloud className="h-10 w-10 text-gray-400" />
                {file ? (
                  <div className="text-sm">
                    <p className="font-medium text-primary">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    <p className="font-medium">Click để chọn file Excel</p>
                    <p className="text-xs">Hỗ trợ .xls, .xlsx</p>
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* FORMAT GUIDE */}
          <div className="bg-gray-50 border p-3 rounded-lg text-xs space-y-1">
            <p className="font-semibold">📋 Định dạng file Excel:</p>
            <ul className="list-disc list-inside space-y-0.5 text-muted-foreground ml-2">
              <li>Cột A: Nội dung câu hỏi</li>
              <li>Cột B-E: Các lựa chọn (A, B, C, D)</li>
              <li>Cột F: Đáp án đúng (ví dụ: "A,C" nếu nhiều đáp án)</li>
              <li>Cột G: Độ khó (easy/medium/hard)</li>
              <li>Cột H: Giải thích (tùy chọn)</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleImport}
            disabled={isLoading || !file || !selectedTopic}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang import...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Import
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}