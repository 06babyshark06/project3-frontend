
"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, PlusCircle, Video, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  RadioGroup,
  RadioGroupItem
} from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";

interface AddLessonDialogProps {
  sectionId: number;
  onSuccess: () => void;
  lessonToEdit?: {
    id: number;
    title: string;
    lesson_type: string;
    content_url?: string;
  } | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type LessonType = "video" | "text";

export function AddLessonDialog({ sectionId, onSuccess, lessonToEdit, open, onOpenChange }: AddLessonDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const [isLoading, setIsLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [lessonType, setLessonType] = useState<LessonType>("video");
  const [file, setFile] = useState<File | null>(null);
  const [textContent, setTextContent] = useState("");

  useEffect(() => {
    if (lessonToEdit) {
      setTitle(lessonToEdit.title);
      setLessonType(lessonToEdit.lesson_type as "video" | "text");
      if (lessonToEdit.lesson_type === "text") {
        setTextContent(lessonToEdit.content_url || "");
      }

    } else {

      setTitle("");
      setLessonType("video");
      setTextContent("");
      setFile(null);
    }
  }, [lessonToEdit, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let contentUrl = lessonToEdit?.content_url || "";

      if (lessonType === "video") {
        const isChangingTypeToVideo = lessonToEdit && lessonToEdit.lesson_type !== "video";
        if (!file) {
          if (!lessonToEdit || isChangingTypeToVideo) {
            toast.error("Vui lòng chọn một file video.");
            setIsLoading(false);
            return;
          }
        } else {
          const uploadUrlResponse = await api.post("/lessons/upload-url", {
            file_name: file.name,
            content_type: file.type,
            section_id: sectionId,
          });

          const { upload_url, final_url } = uploadUrlResponse.data.data;
          contentUrl = final_url;

          const uploadResponse = await fetch(upload_url, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error("Tải file lên R2 thất bại.");
          }
        }
      }

      else {
        if (!textContent) {
          toast.error("Vui lòng nhập nội dung bài học.");
          setIsLoading(false);
          return;
        }

        contentUrl = textContent;
      }

      if (lessonToEdit) {

        await api.put(`/lessons/${lessonToEdit.id}`, {
          title,
          lesson_type: lessonType,
          content_url: contentUrl,
        });
        toast.success("Cập nhật bài học thành công!");
      } else {

        await api.post("/lessons", {
          section_id: sectionId,
          title,
          lesson_type: lessonType,
          content_url: contentUrl,
          order_index: 0,
        });
        toast.success("Thêm bài học thành công!");
      }

      onSuccess();
      setIsOpen(false);

    } catch (err: any) {
      console.error(err);
      toast.error("Thêm bài học thất bại", {
        description: err.message || "Đã xảy ra lỗi.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {lessonToEdit ? "Chỉnh Sửa Bài Học" : "Thêm Bài Học Mới"}
            </DialogTitle>
            <DialogDescription>
              Điền thông tin cho bài học của bạn.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-lg font-medium">Tiêu đề bài học</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Cài đặt môi trường Go"
                required
              />
            </div>

            <div className="space-y-3">
              <Label className="text-lg font-medium">Loại bài học</Label>
              <RadioGroup
                value={lessonType}
                onValueChange={(value: any) => setLessonType(value)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="video" id="r-video" />
                  <Label htmlFor="r-video" className="flex items-center gap-2 text-base">
                    <Video className="h-5 w-5" /> Video
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="text" id="r-text" />
                  <Label htmlFor="r-text" className="flex items-center gap-2 text-base">
                    <FileText className="h-5 w-5" /> Bài đọc (Text)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {}
            {lessonType === "video" && (
              <div className="space-y-2">
                <Label htmlFor="file" className="text-lg font-medium">File video</Label>
                {lessonToEdit && lessonToEdit.lesson_type === "video" && lessonToEdit.content_url && (
                  <p className="text-sm text-muted-foreground truncate mb-1">
                    Video hiện tại: <a href={lessonToEdit.content_url} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline">{lessonToEdit.content_url.split('/').pop()}</a>
                  </p>
                )}
                <Input
                  id="file"
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                  required={!lessonToEdit || lessonToEdit.lesson_type !== "video"}
                />
              </div>
            )}

            {lessonType === "text" && (
              <div className="space-y-2">
                <Label htmlFor="text-content" className="text-lg font-medium">Nội dung</Label>
                <Textarea
                  id="text-content"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Viết nội dung bài học của bạn ở đây..."
                  className="min-h-[200px]"
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">Hủy</Button>
            </DialogClose>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
