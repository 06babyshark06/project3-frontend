"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Loader2, PlayCircle, CheckCircle, FileText, 
  ChevronLeft, Menu, ChevronRight, ArrowLeft
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

// --- Interface ---
interface Lesson {
  id: number;
  title: string;
  lesson_type: "video" | "text";
  content_url: string;
  is_completed: boolean;
  duration_seconds?: number;
}

interface Section {
  id: number;
  title: string;
  lessons: Lesson[];
}

interface CourseData {
  id: number;
  title: string;
  sections: Section[];
  is_enrolled: boolean;
}

export default function LearningPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id;

  const [course, setCourse] = useState<CourseData | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [completingLesson, setCompletingLesson] = useState(false);

  // --- Helpers ---
  const getAllLessons = () => {
    if (!course) return [];
    return course.sections.flatMap(sec => sec.lessons || []);
  };

  const handleNextLesson = () => {
    const allLessons = getAllLessons();
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      setCurrentLesson(allLessons[currentIndex + 1]);
    } else {
      toast.success("Chúc mừng! Bạn đã hoàn thành khóa học.");
    }
  };

  const handlePrevLesson = () => {
    const allLessons = getAllLessons();
    const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
    if (currentIndex > 0) {
      setCurrentLesson(allLessons[currentIndex - 1]);
    }
  };

  // === Helper nhận diện loại bài học ===
  const detectLessonType = (lesson: any): "video" | "text" => {
    // 1. Ưu tiên dùng lesson_type từ API nếu có
    if (lesson.lesson_type === "video" || lesson.lesson_type === "text") {
      return lesson.lesson_type;
    }
    // 2. Nếu không, đoán dựa trên đuôi file
    if (lesson.content_url && /\.(mp4|mov|webm|mkv)$/i.test(lesson.content_url)) {
      return "video";
    }
    // 3. Mặc định là text
    return "text";
  };

  // 1. Fetch dữ liệu khóa học
  const fetchCourseContent = async () => {
    try {
      const response = await api.get(`/courses/${courseId}`);
      const data = response.data.data;
      
      if (!data.is_enrolled) {
        toast.error("Bạn chưa đăng ký khóa học này!");
        router.push(`/courses/${courseId}`);
        return;
      }

      // === MAP DỮ LIỆU VÀ XỬ LÝ LOẠI BÀI HỌC ===
      const fullCourse: CourseData = {
        ...data.course,
        sections: (data.sections || []).map((sec: any) => ({
          ...sec,
          lessons: (sec.lessons || []).map((les: any) => ({
            ...les,
            // Tự động gán lesson_type chuẩn
            lesson_type: detectLessonType(les)
          }))
        })),
        is_enrolled: data.is_enrolled
      };

      setCourse(fullCourse);

      // Chọn bài học đầu tiên
      if (!currentLesson) {
        for (const sec of fullCourse.sections) {
            if (sec.lessons && sec.lessons.length > 0) {
                setCurrentLesson(sec.lessons[0]);
                break;
            }
        }
      }

    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải nội dung khóa học.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) fetchCourseContent();
  }, [courseId]);

  // 2. Hàm xử lý "Hoàn thành bài học"
  const handleMarkCompleted = async () => {
    if (!currentLesson) return;
    setCompletingLesson(true);
    try {
      await api.post("/lessons/complete", {
        lesson_id: currentLesson.id
      });
      
      toast.success("Đã hoàn thành bài học!");
      
      // Cập nhật UI local
      setCourse(prev => {
        if (!prev) return null;
        const newSections = prev.sections.map(sec => ({
          ...sec,
          lessons: sec.lessons?.map(les => 
            les.id === currentLesson.id ? { ...les, is_completed: true } : les
          ) || []
        }));
        return { ...prev, sections: newSections };
      });
      
      setCurrentLesson(prev => prev ? { ...prev, is_completed: true } : null);
      setTimeout(() => handleNextLesson(), 1500);

    } catch (error) {
      toast.error("Không thể lưu tiến độ.");
    } finally {
      setCompletingLesson(false);
    }
  };

  const calculateProgress = () => {
    if (!course) return 0;
    let total = 0;
    let completed = 0;
    course.sections.forEach(sec => {
      sec.lessons?.forEach(les => {
        total++;
        if (les.is_completed) completed++;
      });
    });
    return total === 0 ? 0 : Math.round((completed / total) * 100);
  };

  // --- Component Sidebar ---
  const CourseSidebar = () => (
    <div className="h-full flex flex-col bg-card">
      <div className="p-4 border-b">
        <h2 className="font-bold text-lg line-clamp-1">{course?.title}</h2>
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1 text-muted-foreground">
            <span>Tiến độ</span>
            <span>{calculateProgress()}%</span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <Accordion type="multiple" defaultValue={course?.sections.map(s => `sec-${s.id}`) || []} className="w-full">
          {course?.sections.map((section) => (
            <AccordionItem value={`sec-${section.id}`} key={section.id}>
              <AccordionTrigger className="px-4 py-3 bg-muted/30 hover:no-underline">
                <span className="text-sm font-semibold text-left line-clamp-1">{section.title}</span>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                {(!section.lessons || section.lessons.length === 0) ? (
                    <p className="text-xs text-muted-foreground p-3 italic">Chưa có bài học</p>
                ) : (
                    section.lessons.map((lesson) => {
                    const isActive = currentLesson?.id === lesson.id;
                    return (
                        <button
                        key={lesson.id}
                        onClick={() => setCurrentLesson(lesson)}
                        className={`w-full flex items-center gap-3 p-3 text-left transition-colors border-b border-muted/50 
                            ${isActive ? "bg-primary/10 border-l-4 border-l-primary" : "hover:bg-muted/50 border-l-4 border-l-transparent"}
                        `}
                        >
                        <div className="mt-0.5 shrink-0">
                            {lesson.is_completed ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : lesson.lesson_type === "video" ? (
                            <PlayCircle className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                            ) : (
                            <FileText className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className={`text-sm truncate ${isActive ? "font-medium text-primary" : "text-foreground"}`}>
                            {lesson.title}
                            </p>
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                {lesson.lesson_type === 'video' ? 'Video' : 'Bài đọc'}
                            </span>
                        </div>
                        </button>
                    );
                    })
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </ScrollArea>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!course) return null;

  // Xác định trạng thái nút Previous/Next
  const allLessons = getAllLessons();
  const currentIndex = allLessons.findIndex(l => l.id === currentLesson?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allLessons.length - 1;

  return (
    <div className="flex h-screen flex-col md:flex-row overflow-hidden bg-background">
      
      {/* === KHUNG VIDEO / NỘI DUNG (Giữa) === */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header Mobile */}
        <div className="md:hidden p-4 border-b flex items-center justify-between bg-card">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <span className="font-bold truncate max-w-[200px]">{course.title}</span>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="right" className="p-0 w-[85%]">
              <CourseSidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Header Desktop */}
        <div className="hidden md:flex items-center p-4 border-b bg-card">
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/my-courses')}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại khóa học
            </Button>
            <h1 className="ml-4 font-bold text-lg truncate flex-1">{currentLesson?.title}</h1>
        </div>

        {/* NỘI DUNG CHÍNH (TỰ ĐỘNG CHỌN PLAYER) */}
        <div className="flex-1 bg-black flex items-center justify-center overflow-y-auto">
          {currentLesson ? (
            currentLesson.lesson_type === "video" ? (
              // === PLAYER VIDEO (Cho file MP4) ===
              <video 
                key={currentLesson.content_url} 
                controls 
                className="w-full h-full max-h-full object-contain outline-none"
                controlsList="nodownload"
                onEnded={() => !currentLesson.is_completed && handleMarkCompleted()} 
              >
                <source src={currentLesson.content_url} type="video/mp4" />
                Trình duyệt của bạn không hỗ trợ thẻ video.
              </video>
            ) : (
              // === BÀI ĐỌC TEXT ===
              <div className="bg-background text-foreground p-8 md:p-12 w-full h-full overflow-y-auto">
                 <div className="max-w-3xl mx-auto prose dark:prose-invert">
                    <h1>{currentLesson.title}</h1>
                    <div className="whitespace-pre-wrap text-lg leading-relaxed mt-6">
                        {/* Render nội dung text */}
                        {currentLesson.content_url}
                    </div>
                 </div>
              </div>
            )
          ) : (
            <p className="text-white">Chọn một bài học để bắt đầu</p>
          )}
        </div>

        {/* Footer điều hướng */}
        <div className="p-4 border-t bg-card flex justify-between items-center shadow-lg z-20">
          <Button 
            variant="outline" 
            onClick={handlePrevLesson} 
            disabled={!hasPrev}
            className="w-32"
          >
            <ChevronLeft className="mr-2 h-4 w-4" /> Bài trước
          </Button>
          
          <div className="flex gap-2">
            <Button 
              onClick={handleMarkCompleted} 
              disabled={completingLesson || currentLesson?.is_completed}
              variant={currentLesson?.is_completed ? "secondary" : "default"}
              className="w-40"
            >
              {completingLesson ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 
               currentLesson?.is_completed ? <CheckCircle className="mr-2 h-4 w-4" /> : null}
              {currentLesson?.is_completed ? "Đã hoàn thành" : "Hoàn thành"}
            </Button>

            <Button 
                onClick={handleNextLesson} 
                disabled={!hasNext}
                variant="outline"
                className="w-32"
            >
                Bài tiếp <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* SIDEBAR */}
      <div className="hidden md:block w-80 lg:w-96 border-l h-full bg-card z-10 shadow-lg">
        <CourseSidebar />
      </div>
    </div>
  );
}