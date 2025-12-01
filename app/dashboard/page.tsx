"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { 
  BookOpen, CheckCircle, Edit, ArrowRight, 
  PlayCircle, Clock, TrendingUp 
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Image from "next/image";

interface EnrolledCourse {
  id: number;
  title: string;
  thumbnail_url: string;
  instructor_id: number;
  description: string;
  progress?: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [stats, setStats] = useState({
    enrolledCourses: 0,
    completedLessons: 0,
    examsTaken: 0, 
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setIsLoading(true);
        
        // 1. Lấy danh sách khóa học đã đăng ký
        const resCourses = await api.get("/my-courses");
        const basicCourses = resCourses.data.data.courses || [];

        // 2. Lấy thống kê bài thi (API MỚI)
        // (Lưu ý: Hãy đảm bảo bạn đã rebuild Backend và có route này)
        let examsTakenCount = 0;
        try {
            const resExamStats = await api.get("/users/me/exam-stats");
            examsTakenCount = Number(resExamStats.data.data.total_exams_taken);
        } catch (e) {
            console.error("Không thể lấy thống kê bài thi", e);
        }

        let totalCompletedLessons = 0;

        // 3. Tính tiến độ khóa học
        const enrichedCourses = await Promise.all(
          basicCourses.map(async (course: any) => {
            try {
              const detailRes = await api.get(`/courses/${course.id}`, {
                params: { user_id: user.id }
              });
              const { sections } = detailRes.data.data;

              let totalLessons = 0;
              let completedLessons = 0;

              if (sections && Array.isArray(sections)) {
                sections.forEach((sec: any) => {
                  sec.lessons?.forEach((les: any) => {
                    totalLessons++;
                    if (les.is_completed) {
                        completedLessons++;
                        totalCompletedLessons++;
                    }
                  });
                });
              }

              const progress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);
              return { ...course, progress };
            } catch (err) {
              return { ...course, progress: 0 };
            }
          })
        );

        setCourses(enrichedCourses);
        
        // 4. Cập nhật state thống kê
        setStats({
            enrolledCourses: basicCourses.length,
            completedLessons: totalCompletedLessons,
            examsTaken: examsTakenCount, // Dữ liệu thật từ API
        });

      } catch (error) {
        console.error("Lỗi tải dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // ... (Phần render giữ nguyên như code trước) ...
  // Bạn copy lại phần return JSX của DashboardPage cũ vào đây nhé
  // Tôi chỉ viết lại logic fetch để ngắn gọn
  
  return (
    <div className="container mx-auto max-w-7xl p-6 md:p-8 space-y-8">
       {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Xin chào, <span className="text-primary">{user?.full_name}</span> 👋
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Hôm nay bạn muốn học gì?
          </p>
        </div>
        <Button asChild size="lg" className="shadow-lg shadow-primary/20">
            <Link href="/courses">Khám phá khóa học mới</Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard 
          title="Đang học" 
          value={stats.enrolledCourses} 
          label="khóa học"
          icon={<BookOpen className="h-6 w-6 text-blue-600" />}
          loading={isLoading}
        />
        <StatsCard 
          title="Hoàn thành" 
          value={stats.completedLessons} 
          label="bài học"
          icon={<CheckCircle className="h-6 w-6 text-green-600" />}
          loading={isLoading}
        />
        <StatsCard 
          title="Bài thi" 
          value={stats.examsTaken} 
          label="đã làm"
          icon={<Edit className="h-6 w-6 text-yellow-600" />}
          loading={isLoading}
        />
      </div>

      {/* ... Phần Khóa học (Copy y hệt code cũ) ... */}
       <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-primary" /> Tiếp tục học
            </h2>
            <Link href="/dashboard/my-courses" className="text-sm font-medium text-primary hover:underline">
                Xem tất cả
            </Link>
        </div>

        {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="space-y-3">
                        <Skeleton className="h-48 w-full rounded-xl" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                    </div>
                ))}
            </div>
        ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <Link href={`/learn/${course.id}`} key={course.id} className="group">
                        <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 border-muted/40 hover:border-primary/50">
                            <div className="relative h-48 bg-muted">
                                <Image
                                    src={course.thumbnail_url || "https://via.placeholder.com/400x200"}
                                    alt={course.title}
                                    layout="fill"
                                    objectFit="cover"
                                    className="group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-md flex items-center gap-1">
                                    <Clock className="h-3 w-3" /> Tiếp tục
                                </div>
                            </div>
                            <CardContent className="p-5">
                                <div className="mb-4">
                                    <h3 className="font-bold text-lg line-clamp-1 group-hover:text-primary transition-colors">
                                        {course.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                        {course.description || "Không có mô tả"}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                        <span>Tiến độ</span>
                                        <span>{course.progress}%</span>
                                    </div>
                                    <Progress value={course.progress} className="h-2" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        ) : (
            <div className="text-center py-16 bg-muted/10 rounded-xl border border-dashed">
                <h3 className="text-lg font-semibold text-muted-foreground">Bạn chưa đăng ký khóa học nào</h3>
                <Button asChild className="mt-4">
                    <Link href="/courses">Khám phá thư viện</Link>
                </Button>
            </div>
        )}
      </div>

      {/* Gợi ý bài thi */}
      <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
                <h3 className="text-2xl font-bold text-primary mb-2">Kiểm tra kiến thức của bạn</h3>
                <p className="text-muted-foreground">Làm các bài thi thử để đánh giá năng lực và nhận chứng chỉ.</p>
            </div>
            <Button size="lg" variant="default" asChild>
                <Link href="/exams">Vào phòng thi <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </Button>
        </div>
      </div>
    </div>
  );
}

function StatsCard({ title, value, label, icon, loading }: any) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                {loading ? (
                    <Skeleton className="h-10 w-20 mb-1" />
                ) : (
                    <div className="text-4xl font-bold text-foreground">{value}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </CardContent>
        </Card>
    )
}