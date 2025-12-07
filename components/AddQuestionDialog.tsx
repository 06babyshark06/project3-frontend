"use client";

import { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Plus, Trash2, CheckCircle2, Circle, Square, CheckSquare, 
  Loader2, Image as ImageIcon, X, Video 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AddQuestionDialogProps {
  examId?: number;
  defaultTopicId?: number;
  defaultSectionId?: number;
  onSuccess: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  questionToEdit?: {
    id: number;
    content: string;
    question_type: string;
    difficulty: string;
    explanation?: string;
    section_id: number;
    topic_id?: number;
    attachment_url?: string;
    choices?: Array<{
      id: number;
      content: string;
      is_correct: boolean;
      attachment_url?: string; // <--- Cập nhật Interface
    }>;
  } | null;
}

interface Topic { id: number; name: string; }
interface Section { id: number; name: string; }

// Helper component để hiển thị preview ảnh/video nhỏ gọn
const AttachmentPreview = ({ url, onRemove }: { url: string, onRemove?: () => void }) => {
    if (!url) return null;
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    const isVideo = url.match(/\.(mp4|webm)$/i);

    return (
        <div className="relative inline-block group mt-2">
            {isImage ? (
                <img src={url} alt="Attachment" className="h-20 w-auto rounded-md border object-cover" />
            ) : isVideo ? (
                <video src={url} controls className="h-20 w-auto rounded-md border" />
            ) : (
                <div className="p-2 border rounded bg-muted text-xs break-all max-w-[200px]">{url}</div>
            )}
            {onRemove && (
                <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    onClick={onRemove}
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
};

export function AddQuestionDialog({ 
  examId, defaultTopicId, defaultSectionId,
  onSuccess, open, onOpenChange, questionToEdit 
}: AddQuestionDialogProps) {
  const [loading, setLoading] = useState(false);
  
  // Upload State cho Question
  const [isUploading, setIsUploading] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const questionFileInputRef = useRef<HTMLInputElement>(null);

  // Data Select options
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // Form State
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [content, setContent] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [questionType, setQuestionType] = useState("single_choice");
  const [explanation, setExplanation] = useState("");
  
  // Choices State (Thêm attachmentUrl)
  const [choices, setChoices] = useState([
    { content: "", isCorrect: true, attachmentUrl: "" },
    { content: "", isCorrect: false, attachmentUrl: "" },
    { content: "", isCorrect: false, attachmentUrl: "" },
    { content: "", isCorrect: false, attachmentUrl: "" },
  ]);
  
  // State theo dõi choice nào đang upload (để hiện loading spinner đúng chỗ)
  const [uploadingChoiceIndex, setUploadingChoiceIndex] = useState<number | null>(null);

  // 1. Fetch Topics
  useEffect(() => {
    if (open) {
      api.get("/topics").then(res => setTopics(res.data.data.topics || [])).catch(console.error);
    }
  }, [open]);

  // 2. Fetch Sections
  useEffect(() => {
    if (!selectedTopic || !open) return;
    api.get(`/exam-sections?topic_id=${selectedTopic}`)
       .then(res => setSections(res.data.data.sections || []))
       .catch(console.error);
  }, [selectedTopic, open]);

  // 3. Fill dữ liệu
  useEffect(() => {
    if (open) {
      if (questionToEdit) {
        setContent(questionToEdit.content);
        setDifficulty(questionToEdit.difficulty || "medium");
        setQuestionType(questionToEdit.question_type || "single_choice");
        setExplanation(questionToEdit.explanation || "");
        setAttachmentUrl(questionToEdit.attachment_url || "");
        
        if (questionToEdit.topic_id) setSelectedTopic(questionToEdit.topic_id.toString());
        if (questionToEdit.section_id) setTimeout(() => setSelectedSection(questionToEdit.section_id.toString()), 100);

        if (questionToEdit.choices && questionToEdit.choices.length > 0) {
          setChoices(questionToEdit.choices.map((c) => ({
            content: c.content, 
            isCorrect: c.is_correct || false,
            attachmentUrl: c.attachment_url || "" // <--- Map URL
          })));
        }
      } else {
        resetForm();
        if (defaultTopicId) setSelectedTopic(defaultTopicId.toString());
        if (defaultSectionId) setSelectedSection(defaultSectionId.toString());
      }
    }
  }, [open, questionToEdit, defaultTopicId, defaultSectionId]);

  const resetForm = () => {
    setContent("");
    setDifficulty("medium");
    setQuestionType("single_choice");
    setExplanation("");
    setAttachmentUrl("");
    setSelectedSection("");
    setChoices([
      { content: "", isCorrect: true, attachmentUrl: "" },
      { content: "", isCorrect: false, attachmentUrl: "" },
      { content: "", isCorrect: false, attachmentUrl: "" },
      { content: "", isCorrect: false, attachmentUrl: "" },
    ]);
  };

  // --- GENERAL UPLOAD FUNCTION ---
  const uploadFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
        toast.error("File quá lớn (Tối đa 10MB)");
        return null;
    }
    try {
        // 1. Get Presigned URL
        const { data } = await api.post("/questions/upload-url", {
            file_name: file.name,
            content_type: file.type,
            folder: "questions"
        });
        // 2. Upload to Cloud
        const uploadRes = await fetch(data.data.upload_url, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type }
        });
        if (!uploadRes.ok) throw new Error("Upload failed");
        
        return data.data.final_url;
    } catch (error) {
        console.error(error);
        toast.error("Lỗi khi tải file");
        return null;
    }
  };

  // --- QUESTION UPLOAD HANDLER ---
  const handleQuestionFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const url = await uploadFile(file);
    if (url) {
        setAttachmentUrl(url);
        toast.success("Đã tải file câu hỏi!");
    }
    setIsUploading(false);
    if (questionFileInputRef.current) questionFileInputRef.current.value = "";
  };

  // --- CHOICE UPLOAD HANDLER ---
  const handleChoiceFileSelect = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingChoiceIndex(index); // Show loading spinner at specific row
    const url = await uploadFile(file);
    
    if (url) {
        const newChoices = [...choices];
        newChoices[index].attachmentUrl = url;
        setChoices(newChoices);
        toast.success("Đã tải ảnh đáp án!");
    }
    setUploadingChoiceIndex(null);
    e.target.value = ""; // Reset input
  };

  const removeChoiceAttachment = (index: number) => {
    const newChoices = [...choices];
    newChoices[index].attachmentUrl = "";
    setChoices(newChoices);
  };

  // --- CHOICE HANDLERS ---
  const handleChoiceChange = (index: number, val: string) => {
    const newChoices = [...choices]; newChoices[index].content = val; setChoices(newChoices);
  };
  const toggleCorrectAnswer = (index: number) => {
    const newChoices = [...choices];
    if (questionType === "single_choice") newChoices.forEach((c, i) => c.isCorrect = i === index);
    else newChoices[index].isCorrect = !newChoices[index].isCorrect;
    setChoices(newChoices);
  };
  const addChoice = () => { if (choices.length >= 6) return toast.error("Tối đa 6 lựa chọn"); setChoices([...choices, { content: "", isCorrect: false, attachmentUrl: "" }]); };
  const removeChoice = (index: number) => { if (choices.length <= 2) return toast.error("Cần ít nhất 2 lựa chọn"); setChoices(choices.filter((_, i) => i !== index)); };

  // --- SUBMIT ---
  const handleSubmit = async () => {
    if (!selectedSection) return toast.error("Vui lòng chọn Chương/Phần");
    if (!content.trim()) return toast.error("Chưa nhập nội dung câu hỏi");
    if (choices.filter(c => c.isCorrect).length === 0) return toast.error("Phải có ít nhất 1 đáp án đúng");
    if (questionType === "single_choice" && choices.filter(c => c.isCorrect).length > 1) return toast.error("Loại 1 đáp án chỉ được chọn 1 câu đúng");

    setLoading(true);
    try {
      const payload = {
        section_id: parseInt(selectedSection),
        content,
        question_type: questionType,
        difficulty,
        explanation,
        attachment_url: attachmentUrl,
        choices: choices.map(c => ({ 
            content: c.content, 
            is_correct: c.isCorrect,
            attachment_url: c.attachmentUrl // <--- Gửi URL đáp án
        })),
        ...(examId ? { exam_id: examId } : {}) 
      };

      if (questionToEdit) {
        await api.put(`/questions/${questionToEdit.id}`, payload);
        toast.success("Cập nhật câu hỏi thành công!");
      } else {
        await api.post("/questions", payload);
        toast.success("Thêm câu hỏi thành công!");
      }
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Lỗi khi lưu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{questionToEdit ? "✏️ Sửa câu hỏi" : "➕ Thêm câu hỏi mới"}</DialogTitle></DialogHeader>

        <div className="space-y-5 py-2">
          {/* TOPIC & SECTION */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border">
            <div className="space-y-2">
                <Label>Chủ đề <span className="text-red-500">*</span></Label>
                <Select value={selectedTopic} onValueChange={(val) => { setSelectedTopic(val); setSelectedSection(""); }} disabled={!!questionToEdit}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Chọn chủ đề" /></SelectTrigger>
                    <SelectContent>{topics.map((t) => (<SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>))}</SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Chương <span className="text-red-500">*</span></Label>
                <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedTopic}>
                    <SelectTrigger className="bg-background"><SelectValue placeholder="Chọn chương" /></SelectTrigger>
                    <SelectContent>{sections.map((s) => (<SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>))}</SelectContent>
                </Select>
            </div>
          </div>

          {/* QUESTION CONTENT & ATTACHMENT */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
                <Label>Nội dung câu hỏi <span className="text-red-500">*</span></Label>
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-xs text-primary"
                    onClick={() => questionFileInputRef.current?.click()}
                    disabled={isUploading}
                >
                    {isUploading ? <Loader2 className="h-3 w-3 animate-spin mr-1"/> : <ImageIcon className="h-3 w-3 mr-1"/>}
                    {attachmentUrl ? "Thay đổi ảnh/video" : "Thêm ảnh/video minh họa"}
                </Button>
                <input type="file" ref={questionFileInputRef} className="hidden" accept="image/*,video/*" onChange={handleQuestionFileSelect} />
            </div>
            
            <Textarea placeholder="Nhập câu hỏi..." value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[80px] max-h-[200px]" />
            <AttachmentPreview url={attachmentUrl} onRemove={() => setAttachmentUrl("")} />
          </div>

          {/* TYPE & DIFFICULTY */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label>Loại</Label>
                <Select value={questionType} onValueChange={setQuestionType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="single_choice">Một đáp án đúng</SelectItem><SelectItem value="multiple_choice">Nhiều đáp án đúng</SelectItem></SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <Label>Độ khó</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="easy">Dễ</SelectItem><SelectItem value="medium">Trung bình</SelectItem><SelectItem value="hard">Khó</SelectItem></SelectContent>
                </Select>
            </div>
          </div>

          {/* CHOICES LIST */}
          <div className="space-y-3">
            <Label>Các lựa chọn <span className="text-red-500">*</span></Label>
            <div className="space-y-4">
              {choices.map((choice, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-lg bg-card hover:bg-accent/5 transition-colors">
                    <div className="flex gap-3 items-center">
                        <button type="button" onClick={() => toggleCorrectAnswer(index)} className="shrink-0 pt-1">
                            {choice.isCorrect ? 
                                (questionType === "single_choice" ? <CheckCircle2 className="h-6 w-6 text-green-600" /> : <CheckSquare className="h-6 w-6 text-green-600" />) : 
                                (questionType === "single_choice" ? <Circle className="h-6 w-6 text-gray-300" /> : <Square className="h-6 w-6 text-gray-300" />)
                            }
                        </button>
                        
                        <div className="flex-1">
                            <Input 
                                value={choice.content} 
                                onChange={(e) => handleChoiceChange(index, e.target.value)} 
                                placeholder={`Nội dung đáp án ${String.fromCharCode(65 + index)}`} 
                                className={choice.isCorrect ? "border-green-500 bg-green-50/50" : ""}
                            />
                        </div>

                        {/* Button Upload Choice Image */}
                        <div className="flex items-center gap-1">
                            <Label 
                                htmlFor={`choice-file-${index}`} 
                                className={`cursor-pointer p-2 rounded-md hover:bg-muted transition-colors ${choice.attachmentUrl ? "text-blue-600 bg-blue-50" : "text-muted-foreground"}`}
                                title="Đính kèm ảnh"
                            >
                                {uploadingChoiceIndex === index ? (
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                ) : (
                                    <ImageIcon className="h-5 w-5" />
                                )}
                            </Label>
                            <input 
                                id={`choice-file-${index}`}
                                type="file" 
                                className="hidden" 
                                accept="image/*" 
                                onChange={(e) => handleChoiceFileSelect(index, e)} 
                            />

                            {choices.length > 2 && (
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeChoice(index)} className="text-muted-foreground hover:text-red-500">
                                <Trash2 className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </div>
                    
                    {/* Preview ảnh của choice */}
                    {choice.attachmentUrl && (
                        <div className="ml-9">
                            <AttachmentPreview url={choice.attachmentUrl} onRemove={() => removeChoiceAttachment(index)} />
                        </div>
                    )}
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" onClick={addChoice} className="w-full border-dashed"><Plus className="h-4 w-4 mr-2" /> Thêm lựa chọn</Button>
          </div>

          <div className="space-y-2"><Label>Giải thích</Label><Textarea value={explanation} onChange={(e) => setExplanation(e.target.value)} placeholder="Giải thích đáp án..." className="min-h-[80px]" /></div>
        </div>

        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Hủy</Button><Button onClick={handleSubmit} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (questionToEdit ? "Lưu" : "Tạo")}</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}