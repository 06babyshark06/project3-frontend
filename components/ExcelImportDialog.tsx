"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, FileSpreadsheet, Download, UploadCloud } from "lucide-react";
import { toast } from "sonner";

interface Section {
  id: number;
  name: string;
}

export function ExcelImportDialog({ topicId, onImportSuccess }: { topicId: number, onImportSuccess: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedSection, setSelectedSection] = useState<string>("");

  // Tải danh sách Section (Chương/Phần) của Topic để import vào đúng chỗ
  const fetchSections = async () => {
    try {
      const res = await api.get(`/exam-sections?topic_id=${topicId}`);
      setSections(res.data.data.sections || []);
    } catch (error) {
      toast.error("Không thể tải danh sách chương/phần");
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) fetchSections();
  };

  const handleImport = async () => {
    if (!file) return toast.error("Vui lòng chọn file Excel");
    if (!selectedSection) return toast.error("Vui lòng chọn chương/phần để nhập câu hỏi");
    
    setIsLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("section_id", selectedSection);

    try {
      const res = await api.post("/questions/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      const { success_count, error_count } = res.data.data;
      
      if (success_count > 0) {
        toast.success(`Đã nhập thành công ${success_count} câu hỏi!`, {
          description: error_count > 0 ? `Có ${error_count} dòng bị lỗi, vui lòng kiểm tra lại.` : "Tất cả đều hợp lệ."
        });
        setIsOpen(false);
        onImportSuccess();
      } else {
        toast.error("Import thất bại", { description: `Lỗi ${error_count} dòng. Kiểm tra định dạng file.` });
      }
    } catch (error) {
      toast.error("Lỗi kết nối khi import");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-green-50 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-800">
          <FileSpreadsheet className="h-4 w-4" /> Import Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import câu hỏi từ Excel</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Chọn Section */}
          <div className="space-y-2">
            <Label>Chọn Chương/Phần (Ngân hàng câu hỏi)</Label>
            <Select onValueChange={setSelectedSection} value={selectedSection}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn chương..." />
              </SelectTrigger>
              <SelectContent>
                {sections.length > 0 ? (
                  sections.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">Chưa có chương nào trong chủ đề này</div>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Chọn File */}
          <div className="space-y-2">
            <Label htmlFor="excel">File Excel (.xlsx)</Label>
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition cursor-pointer relative">
                <input 
                    id="excel" 
                    type="file" 
                    accept=".xlsx, .xls" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => setFile(e.target.files?.[0] || null)} 
                />
                <UploadCloud className="h-8 w-8 text-muted-foreground mb-2" />
                <span className="text-sm font-medium">{file ? file.name : "Kéo thả hoặc click để chọn file"}</span>
            </div>
          </div>

          {/* Hướng dẫn mẫu */}
          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-800 flex gap-2 items-start">
            <Download className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
                <p className="font-semibold">Cấu trúc file mẫu:</p>
                <p>Cột A: Nội dung | Cột B: Loại (single/multiple) | Cột C: Độ khó (easy/medium/hard) | Cột D: Giải thích | Cột E: Ảnh (URL) | Cột F: Đáp án đúng (A,C) | Cột G trở đi: Các lựa chọn.</p>
                <a href="#" className="underline mt-1 block">Tải file mẫu tại đây</a>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleImport} disabled={!file || !selectedSection || isLoading} className="w-full">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 
            {isLoading ? "Đang xử lý..." : "Tiến hành Import"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}