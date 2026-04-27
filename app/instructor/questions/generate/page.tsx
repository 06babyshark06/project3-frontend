"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AddTopicDialog } from "@/components/AddTopicDialog";
import { AddSectionDialog } from "@/components/AddSectionDialog";
import { Upload, FileText, AlertCircle, Loader2, CheckCircle, Save, Plus, Trash2, Edit, Image as ImageIcon, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const AttachmentPreview = ({ url, onRemove }: { url: string, onRemove?: () => void }) => {
    if (!url) return null;
    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
    const isVideo = url.match(/\.(mp4|webm)$/i);

    return (
        <div className="relative inline-block group mt-2">
            {isImage ? (
                <img src={url} alt="Attachment" className="h-20 w-auto rounded-md border object-cover bg-muted" />
            ) : isVideo ? (
                <video src={url} controls className="h-20 w-auto rounded-md border bg-black" />
            ) : (
                <div className="p-2 border rounded bg-muted text-xs break-all max-w-[200px]">{url}</div>
            )}
            {onRemove && (
                <button
                    type="button"
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
                    onClick={onRemove}
                >
                    <X className="h-3 w-3" />
                </button>
            )}
        </div>
    );
};

interface AIOption {
  content: string;
  is_correct: boolean;
}

interface AIQuestion {
  question_text: string;
  choices: AIOption[];
  explanation: string;
  difficulty: string;
  attachment_url?: string;
}

export default function AIGeneratePage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState("5");
  const [questionType, setQuestionType] = useState("Một đáp án đúng");
  const [language, setLanguage] = useState("Tiếng Việt");
  const [focusTopic, setFocusTopic] = useState("");
  const [maxOptions, setMaxOptions] = useState("4");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<AIQuestion[]>([]);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  interface Topic { id: number; name: string; }
  interface Section { id: number; name: string; topic_id: number; }

  const [topics, setTopics] = useState<Topic[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("");

  const [isAddTopicDialogOpen, setIsAddTopicDialogOpen] = useState(false);
  const [isAddSectionDialogOpen, setIsAddSectionDialogOpen] = useState(false);
  const [uploadingImageIndex, setUploadingImageIndex] = useState<number | null>(null);

  const fetchTopics = useCallback(async () => {
    try {
      const res = await api.get("/topics");
      setTopics(res.data.data.topics || []);
    } catch (error) {
      console.error("Fetch topics error:", error);
    }
  }, []);

  const fetchSections = useCallback(async () => {
    if (!selectedTopic) return;
    try {
      const res = await api.get(`/exam-sections?topic_id=${selectedTopic}`);
      setSections(res.data.data.sections || []);
    } catch (error) {
      console.error("Fetch sections error:", error);
    }
  }, [selectedTopic]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  useEffect(() => {
    if (!selectedTopic) {
      setSections([]);
      setSelectedSection("");
      return;
    }
    fetchSections();
  }, [selectedTopic, fetchSections]);

  // Thêm state cho chế độ xem trước form
  const [editingMode, setEditingMode] = useState<boolean>(true);
  
  // Drag and Drop state
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError("");
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
      const isExtensionValid = droppedFile.name.match(/\.(pdf|docx|txt|pptx)$/i);
      
      if (isExtensionValid) {
        setFile(droppedFile);
        setError("");
      } else {
        setError("Định dạng file không hỗ trợ. Vui lòng chọn PDF, DOCX, TXT hoặc PPTX.");
      }
    }
  };

  const handleGenerate = async () => {
    if (!file) {
      setError("Vui lòng tải lên tài liệu mẫu (PDF hoặc DOCX)");
      return;
    }

    setLoading(true);
    setError("");
    setQuestions([]);
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append("document", file);
      formData.append("difficulty", difficulty);
      formData.append("question_count", count);
      formData.append("question_type", questionType);
      formData.append("language", language);
      formData.append("focus_topic", focusTopic);
      formData.append("max_options", maxOptions);
      formData.append("title", file.name);

      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api/v1/ai/generate-questions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Có lỗi xảy ra khi sinh câu hỏi");
      }

      const data = await response.json();
      if (data.questions && Array.isArray(data.questions)) {
        setQuestions(data.questions);
        setEditingMode(true);
      } else {
        throw new Error("Dữ liệu trả về không hợp lệ");
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Lỗi giao tiếp với AI server");
      } else {
        setError("Lỗi giao tiếp với AI server");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionChange = (index: number, field: keyof AIQuestion, value: string) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], [field]: value };
    setQuestions(updated);
  };

  const uploadFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
        toast.error("File quá lớn (Tối đa 10MB)");
        return null;
    }
    try {
        const { data } = await api.post("/questions/upload-url", {
            file_name: file.name,
            content_type: file.type,
            folder: "questions"
        });
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

  const handleQuestionImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImageIndex(index);
    const url = await uploadFile(file);
    if (url) {
        handleQuestionChange(index, 'attachment_url', url);
        toast.success("Đã tải ảnh thành công!");
    }
    setUploadingImageIndex(null);
    e.target.value = ""; 
  };

  const handleOptionChange = (qIndex: number, optIndex: number, value: string) => {
    const updated = [...questions];
    updated[qIndex].choices[optIndex].content = value;
    setQuestions(updated);
  };

  const toggleCorrectAnswer = (qIndex: number, optIndex: number) => {
    const updated = [...questions];
    if (questionType === "Một đáp án đúng") {
      updated[qIndex].choices.forEach((c, idx) => {
        c.is_correct = (idx === optIndex);
      });
    } else {
      updated[qIndex].choices[optIndex].is_correct = !updated[qIndex].choices[optIndex].is_correct;
    }
    setQuestions(updated);
  };

  const handleSaveToDB = async () => {
    if (questions.length === 0) return;
    
    setSaving(true);
    setError("");

    if (!selectedSection) {
      setError("Vui lòng chọn Môn học và Chuyên đề để lưu câu hỏi.");
      setSaving(false);
      return;
    }

    try {
      const token = localStorage.getItem("accessToken") || sessionStorage.getItem("accessToken");
      
      const payload = {
        questions: questions.map(q => ({
          section_id: parseInt(selectedSection), 
          content: q.question_text,
          question_type: questionType === "Một đáp án đúng" ? "single_choice" : 
                         questionType === "Nhiều đáp án đúng" ? "multiple_choice" : "short_answer",
          difficulty: q.difficulty.toLowerCase(),
          explanation: q.explanation,
          attachment_url: q.attachment_url || "",
          choices: q.choices.map(opt => ({
              content: opt.content,
              is_correct: opt.is_correct
          }))
        }))
      };

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8081'}/api/v1/questions/bulk`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload),
      });

      if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || "Lỗi lưu câu hỏi hàng loạt");
      }
      
      setSuccess(true);
      toast.success("Lưu bộ câu hỏi thành công!");
      setTimeout(() => {
          router.push(`/instructor/questions`); 
      }, 2000);

    } catch (err: unknown) {
      if (err instanceof Error) {
        setError("Lỗi khi lưu câu hỏi vào hệ thống: " + err.message);
      } else {
        setError("Lỗi không xác định khi lưu câu hỏi");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8 animate-in fade-in zoom-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
          <span>Sinh Câu Hỏi Bằng </span>
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">AI Gemini</span>
        </h1>
        <p className="text-gray-500 mt-2">
          Hệ thống sẽ tự động bóc tách tài liệu và tạo ra bộ câu hỏi bám sát nội dung. 
          Vui lòng kiểm tra lại cấu trúc câu hỏi trước khi lưu.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Upload Column */}
        <div className="col-span-1 space-y-6">
          <div className="p-6 bg-white border border-gray-200 rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Cấu hình</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tài liệu tham khảo (PDF, DOCX, PPTX)</label>
                <div 
                  className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
                    isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-blue-500"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="space-y-1 text-center">
                    <Upload className={`mx-auto h-12 w-12 ${isDragging ? "text-blue-500" : "text-gray-400"}`} />
                    <div className="flex text-sm text-gray-600">
                      <label className="relative cursor-pointer bg-transparent rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                        <span>Tải file lên</span>
                        <input type="file" className="sr-only" onChange={handleFileChange} accept=".pdf,.docx,.txt,.pptx" />
                      </label>
                      <p className="pl-1">hoặc kéo thả vào đây</p>
                    </div>
                    {file && <p className="text-sm text-green-600 font-medium truncate">{file.name}</p>}
                  </div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Môn học (Topic)</label>
                  <button type="button" onClick={() => setIsAddTopicDialogOpen(true)} className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1">
                    <Plus className="w-3 h-3"/> Thêm mới
                  </button>
                </div>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger className="mt-1 w-full bg-white">
                    <SelectValue placeholder="-- Chọn Môn học --" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">Chuyên đề (Section)</label>
                  <button type="button" onClick={() => setIsAddSectionDialogOpen(true)} className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1" disabled={!selectedTopic}>
                    <Plus className="w-3 h-3"/> Thêm mới
                  </button>
                </div>
                <Select value={selectedSection} onValueChange={setSelectedSection} disabled={!selectedTopic}>
                  <SelectTrigger className="mt-1 w-full bg-white">
                    <SelectValue placeholder="-- Chọn Chuyên đề --" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Độ khó</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="mt-1 w-full bg-white">
                    <SelectValue placeholder="Chọn độ khó" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Dễ</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="hard">Khó</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loại câu hỏi</label>
                <Select value={questionType} onValueChange={setQuestionType}>
                  <SelectTrigger className="mt-1 w-full bg-white">
                    <SelectValue placeholder="Chọn loại câu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Một đáp án đúng">Một đáp án đúng</SelectItem>
                    <SelectItem value="Nhiều đáp án đúng">Nhiều đáp án đúng</SelectItem>
                    <SelectItem value="Trả lời ngắn">Trả lời ngắn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ngôn ngữ câu hỏi</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="mt-1 w-full bg-white">
                    <SelectValue placeholder="Chọn ngôn ngữ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tiếng Việt">Tiếng Việt</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lượng sinh ra</label>
                  <Input 
                    type="number" min="1" max="50"
                    className="mt-1 w-full bg-white"
                    placeholder="VD: 10"
                    value={count} onChange={(e) => setCount(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số đáp án / câu</label>
                  <Input 
                    type="number" min="2" max="6"
                    className="mt-1 w-full bg-white"
                    placeholder="VD: 4"
                    value={maxOptions} onChange={(e) => setMaxOptions(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trọng tâm / Yêu cầu thêm (Tùy chọn)</label>
                <textarea
                  placeholder="VD: Chỉ hỏi về công thức. Tập trung vào chương 2. Đáp án nhiễu phải rất khó nhận biết."
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white min-h-[80px]"
                  value={focusTopic} onChange={(e) => setFocusTopic(e.target.value)}
                />
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || !file}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02]"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <FileText className="w-5 h-5 mr-2" />}
                {loading ? "AI Đang xử lý tài liệu..." : "Bắt Đầu Generate"}
              </button>
              
              {error && (
                <div className="flex items-center p-3 text-red-700 bg-red-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Results Column */}
        <div className="col-span-1 md:col-span-2 space-y-6">
          {questions.length === 0 && !loading && (
            <div className="p-12 bg-white border border-gray-200 border-dashed rounded-xl flex flex-col items-center justify-center text-gray-400">
              <div className="bg-gray-50 p-4 rounded-full mb-4">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <p>Kết quả từ AI sẽ hiển thị ở đây để bạn kiểm duyệt.</p>
            </div>
          )}

          {loading && (
             <div className="p-12 bg-white border border-gray-200 rounded-xl flex flex-col items-center justify-center space-y-4">
               <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
               <p className="text-gray-500 font-medium">Model Gemini đang đọc và phân tích tài liệu...</p>
             </div>
          )}

          {questions.length > 0 && (
            <div className="bg-white border text-gray-900 border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                  Kết Quả Kiểm Duyệt ({questions.length} câu)
                </h3>
                <button
                  onClick={handleSaveToDB}
                  disabled={saving || success}
                  className="flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {success ? "Đã lưu thành công" : "Approve & Lưu Vào Kho"}
                </button>
              </div>

              <div className="p-6 space-y-8 max-h-[70vh] overflow-y-auto">
                {questions.map((q, qIndex) => (
                  <div key={qIndex} className="p-4 border border-blue-100 rounded-lg bg-blue-50/50 space-y-4 relative group">
                    <div className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm">
                        {qIndex + 1}
                      </span>
                      <div className="flex-1 space-y-2">
                        <textarea
                          className="w-full text-base font-semibold bg-transparent border-0 border-b border-transparent hover:border-blue-300 focus:border-blue-500 focus:ring-0 p-0 resize-none overflow-hidden"
                          value={q.question_text}
                          onChange={(e) => handleQuestionChange(qIndex, 'question_text', e.target.value)}
                          rows={2}
                        />

                        {/* Rendering Image Preview */}
                        <AttachmentPreview 
                          url={q.attachment_url || ""} 
                          onRemove={() => handleQuestionChange(qIndex, 'attachment_url', '')} 
                        />

                        <div className="flex items-center gap-3 text-xs mt-2">
                          <span className={`px-2 py-0.5 rounded-full font-medium ${
                            q.difficulty === 'EASY' || q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                            q.difficulty === 'MEDIUM' || q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {q.difficulty.toUpperCase()}
                          </span>

                          <label className={`flex items-center gap-1 cursor-pointer text-gray-500 hover:text-blue-600 transition-colors ${uploadingImageIndex === qIndex ? 'opacity-50 pointer-events-none' : ''}`}>
                            {uploadingImageIndex === qIndex ? (
                              < Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5" />
                            )}
                            <span>{uploadingImageIndex === qIndex ? 'Đang tải lên...' : 'Thêm ảnh đính kèm'}</span>
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*,video/*"
                              onChange={(e) => handleQuestionImageUpload(qIndex, e)}
                              disabled={uploadingImageIndex === qIndex}
                            />
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="ml-12 grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.choices?.map((opt, optIndex) => (
                        <div 
                          key={optIndex} 
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
                            opt.is_correct 
                              ? 'border-green-500 bg-green-50' 
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                          onClick={() => toggleCorrectAnswer(qIndex, optIndex)}
                        >
                          <div className={`w-4 h-4 flex-shrink-0 mr-3 flex items-center justify-center border ${
                            questionType === "Một đáp án đúng" ? "rounded-full" : "rounded-sm"
                          } ${
                            opt.is_correct ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300 bg-white'
                          }`}>
                            {opt.is_correct && (
                              questionType === "Một đáp án đúng" ? 
                                <div className="w-2 h-2 rounded-full bg-white" /> : 
                                <CheckCircle className="w-3 h-3" />
                            )}
                          </div>
                          <input
                            type="text"
                            className="w-full text-sm bg-transparent border-none focus:ring-0 p-0"
                            value={opt.content}
                            onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                            onClick={(e) => e.stopPropagation()} // Ngăn click lan ra ngoài
                          />
                        </div>
                      ))}
                    </div>

                    <div className="ml-12 p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800 border border-yellow-100 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                      <textarea
                          className="w-full bg-transparent border-none focus:ring-0 p-0 resize-none text-yellow-800"
                          value={q.explanation || "Không có giải thích"}
                          onChange={(e) => handleQuestionChange(qIndex, 'explanation', e.target.value)}
                          rows={2}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <AddTopicDialog
        open={isAddTopicDialogOpen}
        onOpenChange={setIsAddTopicDialogOpen}
        onSuccess={fetchTopics}
      />

      <AddSectionDialog
        open={isAddSectionDialogOpen}
        onOpenChange={setIsAddSectionDialogOpen}
        onSuccess={fetchSections}
        defaultTopicId={selectedTopic ? parseInt(selectedTopic) : undefined}
      />
    </div>
  );
}
