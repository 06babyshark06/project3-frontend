"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Loader2, PlayCircle, ArrowLeft, BookOpen, Clock 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card, CardContent, CardFooter, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Interface cho khóa học đã đăng ký
interface EnrolledCourse {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  instructor_id: number;
  progress?: number; 
}

export default function MyCoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        setIsLoading(true);
        // 1. Lấy danh sách khóa học đã đăng ký
        const response = await api.get("/my-courses");
        const coursesData = response.data.data.courses || [];

        // 2. (FIX) Lấy chi tiết từng khóa học để tính tiến độ thực tế
        // Chúng ta gọi song song các request để tiết kiệm thời gian
        const coursesWithProgress = await Promise.all(
          coursesData.map(async (course: EnrolledCourse) => {
            try {
              // Gọi API chi tiết để lấy danh sách bài học và trạng thái hoàn thành
              const detailRes = await api.get(`/courses/${course.id}`);
              const { sections } = detailRes.data.data;
              
              let total = 0;
              let completed = 0;
              
              if (sections && Array.isArray(sections)) {
                sections.forEach((sec: any) => {
                  sec.lessons?.forEach((les: any) => {
                    total++;
                    if (les.is_completed) completed++;
                  });
                });
              }

              // Tính % tiến độ
              const progress = total === 0 ? 0 : Math.round((completed / total) * 100);
              return { ...course, progress };

            } catch (e) {
              // Nếu lỗi khi lấy chi tiết, giữ nguyên progress = 0
              console.error(`Lỗi lấy tiến độ khóa ${course.id}`, e);
              return { ...course, progress: 0 };
            }
          })
        );

        setCourses(coursesWithProgress);
      } catch (err) {
        console.error("Lỗi khi fetch khóa học của tôi:", err);
        toast.error("Không thể tải danh sách khóa học.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMyCourses();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-100px)] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 md:p-8">
      
      {/* === HEADER & NAV === */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 border-b pb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              Khóa học của tôi
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tiếp tục hành trình chinh phục tri thức.
            </p>
          </div>
        </div>
        
        <Button asChild>
           <Link href="/courses">
              <BookOpen className="mr-2 h-4 w-4" /> Khám phá thêm
           </Link>
        </Button>
      </div>

      {/* === DANH SÁCH KHÓA HỌC === */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <Link href={`/learn/${course.id}`} key={course.id} className="group">
              <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-muted/60 hover:border-primary/50">
                
                {/* Ảnh bìa */}
                <div className="relative w-full h-48 bg-muted">
                  <Image
                    src={course.thumbnail_url || "https://via.placeholder.com/400x200"}
                    alt={course.title}
                    layout="fill"
                    objectFit="cover"
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors" />
                  <div className="absolute bottom-3 right-3">
                    <Badge className="bg-white/90 text-black hover:bg-white">
                        <Clock className="w-3 h-3 mr-1" /> Đang học
                    </Badge>
                  </div>
                </div>
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 pb-2">
                   <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                     {course.description || "Không có mô tả."}
                   </p>

                   {/* Thanh tiến độ */}
                   <div className="space-y-2">
                     <div className="flex justify-between text-xs font-medium text-muted-foreground">
                        <span>Tiến độ hoàn thành</span>
                        <span>{course.progress || 0}%</span>
                     </div>
                     <Progress value={course.progress || 0} className="h-2" />
                   </div>
                </CardContent>
                
                <CardFooter className="pt-4">
                  <Button className="w-full font-bold text-md group-hover:bg-primary/90 transition-colors">
                    <PlayCircle className="mr-2 h-5 w-5" /> Vào học ngay
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        // Empty State
        <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-2xl border-2 border-dashed">
          <div className="bg-muted rounded-full p-4 mb-4">
             <BookOpen className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Bạn chưa đăng ký khóa học nào</h3>
          <p className="text-muted-foreground mt-2 mb-6 max-w-md text-center">
            Hàng ngàn kiến thức bổ ích đang chờ đón bạn. Hãy tìm một khóa học và bắt đầu ngay hôm nay!
          </p>
          <Button asChild size="lg">
            <Link href="/courses">Đến thư viện khóa học</Link>
          </Button>
        </div>
      )}
    </div>
  );
}