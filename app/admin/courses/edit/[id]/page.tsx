"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Loader2, PlusCircle, Video, FileText, 
  ArrowLeft, Save, Trash2, Pencil, Image as ImageIcon, Eye
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge"; // Thêm Badge
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from "@/components/ui/dialog";
import { AddLessonDialog } from "@/components/AddLessonDialog";

// --- Interfaces ---
interface Lesson {
  id: number;
  title: string;
  lesson_type: string;
}
interface Section {
  id: number;
  title: string;
  lessons: Lesson[];
}
interface Course {
  id: number;
  title: string;
  description: string;
  is_published: boolean;
  thumbnail_url: string;
  price: number;
  sections: Section[];
}

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // State cho Info Form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState(0);
  const [thumbnail, setThumbnail] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);

  // State cho Section
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
  const [isSavingSection, setIsSavingSection] = useState(false);

  // State cho Lesson
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<number>(0);

  // --- 1. Fetch Data ---
  const fetchCourse = async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      const data = response.data.data;
      if (data && data.course) {
        const c = data.course;
        // Backend đôi khi trả về null cho sections nếu rỗng, cần xử lý
        const fullCourse = { ...c, sections: data.sections || [] };
        setCourse(fullCourse);
        
        // Fill data vào form
        setTitle(c.title);
        setDescription(c.description);
        setPrice(c.price);
        setThumbnail(c.thumbnail_url || "");
      }
    } catch (err) {
      toast.error("Lỗi tải dữ liệu.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (courseId) fetchCourse(); }, [courseId]);

  // --- 2. Xử lý Info ---
  const handleUpdateInfo = async () => {
    setIsUpdatingInfo(true);
    try {
      let finalThumbnailUrl = thumbnail;

      if (thumbnailFile) {
        const uploadRes = await api.post("/lessons/upload-url", {
          file_name: `thumb_${Date.now()}_${thumbnailFile.name}`,
          content_type: thumbnailFile.type,
          section_id: 0,
        });
        const { upload_url, final_url } = uploadRes.data.data;
        await fetch(upload_url, {
          method: "PUT", body: thumbnailFile, headers: { "Content-Type": thumbnailFile.type },
        });
        finalThumbnailUrl = final_url;
      }

      await api.put(`/courses/${courseId}`, {
        title,
        description,
        price: Number(price),
        thumbnail_url: finalThumbnailUrl,
      });

      toast.success("Thông tin đã được lưu!");
      setThumbnail(finalThumbnailUrl);
      setThumbnailFile(null);
      fetchCourse();

    } catch (error) {
      toast.error("Cập nhật thất bại.");
    } finally {
      setIsUpdatingInfo(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setThumbnail(URL.createObjectURL(file));
    }
  };

  // --- 3. Xử lý Section ---
  const openCreateSectionModal = () => {
    setEditingSectionId(null);
    setSectionTitle("");
    setIsSectionModalOpen(true);
  }

  const openEditSectionModal = (id: number, currentTitle: string) => {
    setEditingSectionId(id);
    setSectionTitle(currentTitle);
    setIsSectionModalOpen(true);
  }

  const handleSaveSection = async () => {
    if (!sectionTitle) return;
    setIsSavingSection(true);
    try {
      if (editingSectionId) {
        await api.put(`/sections/${editingSectionId}`, { title: sectionTitle });
        toast.success("Đã cập nhật tên chương!");
      } else {
        await api.post("/sections", {
          course_id: parseInt(courseId),
          title: sectionTitle,
          order_index: course?.sections?.length || 0,
        });
        toast.success("Đã thêm chương mới!");
      }
      await fetchCourse();
      setIsSectionModalOpen(false);
    } catch (err) {
      toast.error("Thao tác thất bại.");
    } finally {
      setIsSavingSection(false);
    }
  };

  const handleDeleteSection = async (id: number) => {
    if (!confirm("Bạn chắc chắn muốn xóa chương này?")) return;
    try {
      await api.delete(`/sections/${id}`);
      toast.success("Đã xóa chương.");
      await fetchCourse();
    } catch (error) { toast.error("Xóa thất bại"); }
  };

  // --- 4. Xử lý Lesson ---
  const handleDeleteLesson = async (id: number) => {
    if (!confirm("Xóa bài này?")) return;
    try {
      await api.delete(`/lessons/${id}`);
      toast.success("Đã xóa bài học");
      await fetchCourse();
    } catch (e) { toast.error("Xóa thất bại"); }
  };

  // --- 5. XUẤT BẢN / HẠ XUỐNG (TOGGLE) ---
  const handlePublishToggle = async () => {
    if (!course) return;
    
    const newStatus = !course.is_published; // Đảo ngược trạng thái hiện tại
    const actionText = newStatus ? "Xuất bản" : "Gỡ xuống (Về nháp)";

    if (!confirm(`Bạn có chắc muốn ${actionText} khóa học này?`)) return;

    try {
      // Gọi API riêng biệt để update status
      await api.put(`/courses/${courseId}/publish`, { is_published: newStatus });
      
      toast.success(`Đã ${actionText} thành công!`);
      
      // Tải lại dữ liệu để cập nhật UI
      fetchCourse(); 
      
      // (Tùy chọn) Nếu xuất bản thành công thì quay về list, còn gỡ xuống thì ở lại edit
      if (newStatus) {
         router.push("/admin/courses");
      }

    } catch (error) { 
      toast.error("Lỗi cập nhật trạng thái"); 
    }
  };

  // Helpers cho modal Lesson
  const openAddLessonModal = (sectionId: number) => {
    setEditingLesson(null);
    setActiveSectionId(sectionId);
    setIsLessonModalOpen(true);
  };

  const openEditLessonModal = (lesson: Lesson, sectionId: number) => {
    setEditingLesson(lesson);
    setActiveSectionId(sectionId);
    setIsLessonModalOpen(true);
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!course) return null;

  return (
    <div className="container mx-auto max-w-5xl p-6">
      
      {/* === TOP BAR === */}
      <div className="flex items-center justify-between mb-8 pb-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/admin/courses')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Biên tập khóa học</h1>
            <div className="flex items-center gap-2 mt-1">
                {/* Badge hiển thị trạng thái */}
                <Badge variant={course.is_published ? "default" : "secondary"} className={course.is_published ? "bg-green-600 hover:bg-green-700" : ""}>
                    {course.is_published ? "Đã xuất bản" : "Bản nháp"}
                </Badge>
                <span className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]">{course.title}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
            <Button variant="secondary" onClick={() => window.open(`/courses/${courseId}`, '_blank')}>
                <Eye className="mr-2 h-4 w-4" /> Xem thử
            </Button>
            
            {/* NÚT TOGGLE TRẠNG THÁI */}
            <Button 
                onClick={handlePublishToggle} 
                variant={course.is_published ? "outline" : "default"}
                className={!course.is_published ? "bg-green-600 hover:bg-green-700" : "border-yellow-600 text-yellow-700 hover:bg-yellow-50"}
            >
                <Save className="mr-2 h-4 w-4" /> 
                {course.is_published ? "Gỡ xuống (Về nháp)" : "Xuất bản ngay"}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* === CỘT TRÁI: FORM THÔNG TIN === */}
        <div className="lg:col-span-1 space-y-6">
            <Card>
                <CardHeader><CardTitle>Thông tin chung</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                    {/* Thumbnail Upload */}
                    <div className="space-y-2">
                        <Label>Ảnh bìa</Label>
                        <div className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center relative overflow-hidden group h-40 bg-muted/10">
                            {thumbnail ? (
                                <>
                                    <Image src={thumbnail} alt="Thumbnail" layout="fill" objectFit="cover" className="rounded-md" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                        <p className="text-white text-sm font-medium">Nhấn để thay đổi</p>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center text-muted-foreground pointer-events-none">
                                    <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <span className="text-xs">Tải ảnh lên</span>
                                </div>
                            )}
                            <Input type="file" accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleFileChange} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Tiêu đề</Label>
                        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Mô tả ngắn</Label>
                        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[100px]" />
                    </div>
                    {/* Field Giá Tiền */}
                    <div className="space-y-2">
                        <Label>Giá (VNĐ)</Label>
                        <Input 
                            type="number" 
                            value={price} 
                            onChange={(e) => setPrice(Number(e.target.value))} 
                            min="0"
                        />
                        <p className="text-xs text-muted-foreground">Nhập 0 để miễn phí.</p>
                    </div>
                    
                    <Button onClick={handleUpdateInfo} disabled={isUpdatingInfo} className="w-full">
                        {isUpdatingInfo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Lưu thông tin
                    </Button>
                </CardContent>
            </Card>
        </div>

        {/* === CỘT PHẢI: NỘI DUNG === */}
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>Nội dung chi tiết</CardTitle>
                    <Button onClick={openCreateSectionModal} size="sm" variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" /> Thêm Chương
                    </Button>
                </CardHeader>
                <CardContent>
                    {!course.sections || course.sections.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border rounded-lg bg-muted/10">
                            <p>Chưa có nội dung.</p>
                            <p className="text-sm mt-1">Hãy bắt đầu bằng việc thêm chương.</p>
                        </div>
                    ) : (
                        <Accordion type="multiple" className="w-full">
                            {course.sections.map((section) => (
                                <AccordionItem value={`section-${section.id}`} key={section.id}>
                                    <AccordionTrigger className="hover:no-underline bg-muted/20 px-4 rounded-md mb-2 data-[state=open]:rounded-b-none">
                                        <div className="flex items-center justify-between w-full pr-2">
                                            <span className="font-medium">{section.title}</span>
                                            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="sm" className="h-8 w-8" onClick={() => openEditSectionModal(section.id, section.title)}>
                                                    <Pencil className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 hover:text-destructive" onClick={() => handleDeleteSection(section.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pl-4 pt-2 pb-4 border border-t-0 rounded-b-md mb-2">
                                        <div className="space-y-2">
                                            {section.lessons?.map(lesson => (
                                                <div key={lesson.id} className="flex items-center justify-between p-3 bg-background border rounded shadow-sm group">
                                                    <div className="flex items-center gap-3">
                                                        {lesson.lesson_type === 'video' ? <Video className="h-4 w-4 text-blue-500"/> : <FileText className="h-4 w-4 text-orange-500"/>}
                                                        <span className="text-sm font-medium">{lesson.title}</span>
                                                    </div>
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {/* Nút Edit Lesson (Gọi Dialog) */}
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditLessonModal(lesson, section.id)}>
                                                            <Pencil className="h-3 w-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteLesson(lesson.id)}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            <Button 
                                                variant="outline" className="mt-4 w-full border-dashed" 
                                                onClick={() => openAddLessonModal(section.id)}
                                            >
                                                <PlusCircle className="mr-2 h-4 w-4" /> Thêm Bài Học
                                            </Button>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Modal Tạo/Sửa Chương */}
      <Dialog open={isSectionModalOpen} onOpenChange={setIsSectionModalOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{editingSectionId ? "Sửa tên chương" : "Tạo chương mới"}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
                <Label>Tên chương</Label>
                <Input value={sectionTitle} onChange={(e) => setSectionTitle(e.target.value)} placeholder="Ví dụ: Chương 1" />
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setIsSectionModalOpen(false)}>Hủy</Button>
                <Button onClick={handleSaveSection} disabled={isSavingSection}>
                    {isSavingSection && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Lưu
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Thêm/Sửa Bài Học */}
      <AddLessonDialog
        open={isLessonModalOpen}
        onOpenChange={setIsLessonModalOpen}
        sectionId={activeSectionId}
        lessonToEdit={editingLesson}
        onSuccess={fetchCourse}
      />
    </div>
  );
}