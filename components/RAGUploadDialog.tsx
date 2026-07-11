"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Loader2, Upload, FileText, CheckCircle2, AlertCircle,
  Database, Trash2, Sparkles, X, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

interface RAGUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sectionId: number | null;
  sectionName: string;
}

export function RAGUploadDialog({
  open,
  onOpenChange,
  sectionId,
  sectionName,
}: RAGUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [activeMode, setActiveMode] = useState<"file" | "text">("file");
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [hasRAG, setHasRAG] = useState(false);
  const [chunkCount, setChunkCount] = useState(0);
  const [clearExisting, setClearExisting] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

  const fetchRAGStatus = useCallback(async () => {
    if (!sectionId) return;
    setIsLoadingStatus(true);
    try {
      const res = await api.get(`/ai/sections/${sectionId}/status`);
      if (res.data && res.data.data) {
        setHasRAG(res.data.data.has_rag);
        setChunkCount(res.data.data.chunk_count);
      }
    } catch (error) {
      console.error("Fetch RAG status error:", error);
    } finally {
      setIsLoadingStatus(false);
    }
  }, [sectionId]);

  useEffect(() => {
    if (open && sectionId) {
      fetchRAGStatus();
      setFile(null);
      setText("");
    }
  }, [open, sectionId, fetchRAGStatus]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const isExtensionValid = selectedFile.name.match(/\.(pdf|docx|pptx|txt)$/i);
      if (isExtensionValid) {
        setFile(selectedFile);
      } else {
        toast.error("Định dạng file không hỗ trợ. Vui lòng chọn PDF, DOCX, PPTX hoặc TXT.");
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const isExtensionValid = droppedFile.name.match(/\.(pdf|docx|pptx|txt)$/i);

      if (isExtensionValid) {
        setFile(droppedFile);
      } else {
        toast.error("Định dạng file không hỗ trợ. Vui lòng chọn PDF, DOCX, PPTX hoặc TXT.");
      }
    }
  };

  const handleUpload = async () => {
    if (!sectionId) return;

    if (activeMode === "file" && !file) {
      toast.error("Vui lòng chọn hoặc kéo thả file tài liệu.");
      return;
    }
    if (activeMode === "text" && !text.trim()) {
      toast.error("Vui lòng nhập nội dung tài liệu.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("clear_existing", String(clearExisting));

      if (activeMode === "file" && file) {
        formData.append("document", file);
      } else {
        formData.append("text", text);
      }

      const res = await api.post(`/ai/sections/${sectionId}/document`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.success) {
        toast.success("Tải tài liệu và huấn luyện AI thành công!");
        setFile(null);
        setText("");
        fetchRAGStatus();
      } else {
        throw new Error(res.data?.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Upload RAG error:", error);
      toast.error(error.response?.data?.error || "Huấn luyện AI thất bại.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleClearRAG = async () => {
    if (!sectionId) return;

    if (!confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu tham khảo RAG của chương này? AI sẽ không có ngữ cảnh để giải thích các câu hỏi thuộc chương này nữa.")) {
      return;
    }

    setIsUploading(true);
    try {
      const res = await api.post(`/ai/sections/${sectionId}/document`, {
        text: "",
        clear_existing: true
      });

      if (res.data && res.data.success) {
        toast.success("Đã xóa dữ liệu tham khảo RAG thành công!");
        fetchRAGStatus();
      } else {
        throw new Error(res.data?.message || "Có lỗi xảy ra");
      }
    } catch (error: any) {
      console.error("Clear RAG error:", error);
      toast.error(error.response?.data?.error || "Xóa dữ liệu thất bại.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
            <Sparkles className="h-6 w-6 text-blue-500" />
            Quản lý Tài liệu RAG
          </DialogTitle>
          <DialogDescription className="text-muted-foreground mt-1">
            Chương: <strong className="text-foreground">{sectionName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1 py-4 space-y-6">
          {/* Trạng thái hiện tại */}
          <div className="p-4 rounded-lg border bg-muted/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Database className="h-10 w-10 text-primary bg-primary/10 p-2 rounded-lg" />
              <div>
                <h4 className="text-sm font-semibold">Cơ sở dữ liệu tri thức</h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isLoadingStatus ? (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="h-3 w-3 animate-spin" /> Đang tải trạng thái...
                    </span>
                  ) : hasRAG ? (
                    <span className="text-green-600 dark:text-green-400 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Đang có {chunkCount} chunk dữ liệu
                    </span>
                  ) : (
                    <span className="text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                      <AlertCircle className="h-3.5 w-3.5" /> Chưa có tài liệu tham khảo
                    </span>
                  )}
                </p>
              </div>
            </div>
            {hasRAG && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearRAG}
                disabled={isUploading}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
              >
                <Trash2 className="h-4 w-4 mr-1.5" /> Xóa dữ liệu
              </Button>
            )}
          </div>

          {/* Chọn chế độ nhập liệu */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Phương thức tải lên</label>
            <div className="grid grid-cols-2 p-1 border rounded-lg bg-muted/40">
              <button
                type="button"
                className={`py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeMode === "file"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setActiveMode("file");
                  setFile(null);
                }}
              >
                Tải lên File
              </button>
              <button
                type="button"
                className={`py-1.5 text-sm font-medium rounded-md transition-colors ${
                  activeMode === "text"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                onClick={() => {
                  setActiveMode("text");
                  setText("");
                }}
              >
                Nhập văn bản trực tiếp
              </button>
            </div>
          </div>

          {/* Nội dung tương ứng */}
          {activeMode === "file" ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Chọn tài liệu (PDF, DOCX, PPTX, TXT)</label>
              <div
                className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                  isDragging
                    ? "border-blue-500 bg-blue-50/10 dark:bg-blue-950/20"
                    : "border-border hover:border-blue-500 bg-card"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById("rag-file-input")?.click()}
              >
                <input
                  type="file"
                  id="rag-file-input"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.pptx,.txt"
                />
                <Upload className={`h-10 w-10 mb-3 ${isDragging ? "text-blue-500" : "text-muted-foreground"}`} />
                <p className="text-sm font-medium">Kéo thả file vào đây hoặc click để chọn</p>
                <p className="text-xs text-muted-foreground mt-1">Hỗ trợ PDF, DOCX, PPTX, TXT tối đa 10MB</p>
                {file && (
                  <div className="mt-4 p-2 bg-muted rounded-lg flex items-center gap-2 max-w-full">
                    <FileText className="h-4 w-4 shrink-0 text-blue-500" />
                    <span className="text-xs font-semibold truncate max-w-[200px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-sm font-medium">Nội dung tài liệu tham khảo</label>
              <textarea
                className="w-full h-44 p-3 border rounded-xl bg-background text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-muted-foreground resize-none"
                placeholder="Nhập hoặc dán văn bản bài giảng, slide hỗ trợ giải thích câu hỏi..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          )}

          {/* Cấu hình bổ sung */}
          <div className="flex items-center space-x-2 pt-2">
            <Checkbox
              id="clear-existing-rag"
              checked={clearExisting}
              onCheckedChange={(checked) => setClearExisting(checked === true)}
            />
            <label
              htmlFor="clear-existing-rag"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Ghi đè/Xóa dữ liệu cũ của chương này trước khi lưu
            </label>
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
          >
            Hủy
          </Button>
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                AI Đang Xử Lý...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Huấn luyện AI
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
