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

interface ExcelImportDialogProps {
  topicId: number;
  onImportSuccess: () => void;
}

export function ExcelImportDialog({ topicId, onImportSuccess }: ExcelImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>(topicId ? String(topicId) : "");

  // Fetch danh sách Topic khi mở dialog
  const fetchTopics = async () => {
    try {
      const res = await api.get("/topics");
      setTopics(res.data.data?.topics || []);
    } catch (error) {
      toast.error("Không thể tải danh sách chủ đề");
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      fetchTopics();
      setFile(null); // Reset file khi mở lại
      if (topicId) setSelectedTopic(String(topicId));
    }
  };

  const handleImport = async () => {
    if (!file) return toast.error("Vui lòng chọn file Excel");
    if (!selectedTopic) return toast.error("Vui lòng chọn chủ đề");
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("topic_id", selectedTopic);

    try {
      const res = await api.post("/questions/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const { success_count, error_count, errors } = res.data.data;
      
      if (success_count > 0) {
        toast.success(`✅ Đã nhập thành công ${success_count} câu hỏi!`, {
          description: error_count > 0 
            ? `⚠️ Có ${error_count} dòng bị lỗi. Kiểm tra console để xem chi tiết.` 
            : "Tất cả câu hỏi đều hợp lệ."
        });
        
        // Log errors to console for debugging
        if (errors && errors.length > 0) {
          console.error("Import errors:", errors);
        }
        
        setIsOpen(false);
        setFile(null);
        onImportSuccess();
      } else {
        toast.error("❌ Import thất bại", { 
          description: `${error_count} dòng bị lỗi. Kiểm tra định dạng file.` 
        });
      }
    } catch (error: any) {
      console.error("Import error:", error);
      const errorMsg = error.response?.data?.error || "Lỗi kết nối khi import";
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Tạo link download file mẫu (nếu backend có endpoint)
    window.open("/api/v1/questions/template", "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Import Câu hỏi từ Excel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Alert hướng dẫn */}
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex gap-2 items-start">
            <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
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

          {/* Chọn Topic */}
          <div className="space-y-2">
            <Label>Chủ đề / Môn học *</Label>
            <Select onValueChange={setSelectedTopic} value={selectedTopic}>
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
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Chưa có chủ đề nào
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Upload File */}
          <div className="space-y-2">
            <Label htmlFor="excel">File Excel (.xlsx, .xls) *</Label>
            <div 
              className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition cursor-pointer relative ${
                file ? "border-primary bg-primary/5" : ""
              }`}
            >
              <input 
                id="excel" 
                type="file" 
                accept=".xlsx, .xls" 
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => setFile(e.target.files?.[0] || null)} 
              />
              {file ? (
                <>
                  <FileSpreadsheet className="h-12 w-12 text-primary mb-3" />
                  <span className="text-sm font-medium text-foreground">{file.name}</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {(file.size / 1024).toFixed(2)} KB
                  </span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-12 w-12 text-muted-foreground mb-3" />
                  <span className="text-sm font-medium">Kéo thả file hoặc click để chọn</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Hỗ trợ: .xlsx, .xls
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Hướng dẫn cấu trúc */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-sm">
            <div className="flex gap-2 items-start">
              <Download className="h-5 w-5 mt-0.5 shrink-0 text-slate-600" />
              <div className="space-y-2">
                <p className="font-semibold text-slate-800">Cấu trúc file Excel chuẩn:</p>
                <ul className="text-xs space-y-1 list-disc list-inside text-slate-700">
                  <li><b>Cột A:</b> Nội dung câu hỏi (bắt buộc)</li>
                  <li><b>Cột B:</b> Loại câu hỏi (single_choice / multiple_choice)</li>
                  <li><b>Cột C:</b> Độ khó (easy / medium / hard)</li>
                  <li><b>Cột D:</b> Giải thích đáp án (tùy chọn)</li>
                  <li><b>Cột E:</b> URL hình ảnh (tùy chọn)</li>
                  <li><b>Cột F:</b> Đáp án đúng (ví dụ: A hoặc A,C)</li>
                  <li><b>Cột G, H, I, J:</b> Đáp án A, B, C, D</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            disabled={isLoading}
          >
            Hủy
          </Button>
          <Button 
            onClick={handleImport} 
            disabled={!file || !selectedTopic || isLoading} 
            className="min-w-[140px]"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
            {isLoading ? "Đang xử lý..." : "Bắt đầu Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}