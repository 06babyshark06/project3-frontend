"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Link from "next/link";
import { 
  BookOpen, CheckCircle, Edit, ArrowRight, 
  Clock, TrendingUp, Users, GraduationCap
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";

// Import component tham gia lớp học
import { JoinClassDialog } from "@/components/JoinClassDialog";

interface EnrolledCourse {
  id: number;
  title: string;
  thumbnail_url: string;
  instructor_id: number;
  description: string;
  progress?: number;
}

interface EnrolledClass {
  id: number;
  name: string;
  code: string;
  teacher_name: string;
  student_count: number;
  description: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [courses, setCourses] = useState<EnrolledCourse[]>([]);
  const [classes, setClasses] = useState<EnrolledClass[]>([]); // State cho danh sách lớp
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
        
        // 1. Lấy danh sách khóa học
        const resCourses = await api.get("/my-courses");
        const basicCourses = resCourses.data?.data?.courses || [];

        // 2. Lấy danh sách lớp học (Mới thêm)
        // API /classes tự động lọc theo student_id nếu là học sinh
        const resClasses = await api.get("/classes?limit=4"); 
        setClasses(resClasses.data?.data?.classes || []);

        // 3. Lấy thống kê bài thi
        let examsTakenCount = 0;
        try {
            const resExamStats = await api.get("/users/me/exam-stats");
            const rawCount = resExamStats.data?.data?.total_exams_taken;
            examsTakenCount = Number(rawCount ?? 0);
            if (isNaN(examsTakenCount)) examsTakenCount = 0;
        } catch (e) {
            console.warn("Chưa có dữ liệu bài thi hoặc lỗi API", e);
            examsTakenCount = 0;
        }

        let totalCompletedLessons = 0;

        // 4. Tính tiến độ khóa học
        const enrichedCourses = await Promise.all(
          basicCourses.map(async (course: any) => {
            try {
              const detailRes = await api.get(`/courses/${course.id}`, {
                params: { user_id: user.id }
              });
              const sections = detailRes.data?.data?.sections;

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
              return { ...course, progress: isNaN(progress) ? 0 : progress };
            } catch (err) {
              return { ...course, progress: 0 };
            }
          })
        );

        setCourses(enrichedCourses);
        
        // 5. Cập nhật state thống kê
        setStats({
            enrolledCourses: basicCourses.length || 0,
            completedLessons: totalCompletedLessons || 0,
            examsTaken: examsTakenCount,
        });

      } catch (error) {
        console.error("Lỗi tải dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);
  
  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl p-6 md:p-8">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
         </div>
      </div>
    );
  }

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
        
        <div className="flex flex-wrap gap-3">
          <JoinClassDialog />
          
          <Button asChild size="lg" className="shadow-lg shadow-primary/20">
              <Link href="/courses">Khám phá khóa học mới</Link>
          </Button>
        </div>
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
        <Link href="/dashboard/exams" className="block transform transition-transform hover:scale-105">
          <StatsCard 
            title="Bài thi" 
            value={stats.examsTaken} 
            label="đã làm (Bấm để xem lịch sử)"
            icon={<Edit className="h-6 w-6 text-yellow-600" />}
            loading={isLoading}
          />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SECTION: KHÓA HỌC CỦA TÔI */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" /> Khóa học đang học
                </h2>
                <Link href="/dashboard/my-courses" className="text-sm font-medium text-primary hover:underline">
                    Xem tất cả
                </Link>
            </div>

            {courses.length > 0 ? (
                <div className="grid grid-cols-1 gap-4">
                    {courses.slice(0, 3).map((course) => (
                        <Link href={`/learn/${course.id}`} key={course.id} className="group">
                            <Card className="flex flex-row overflow-hidden hover:shadow-md transition-all h-32 border-muted/60">
                                <div className="w-32 relative bg-muted shrink-0">
                                    <Image
                                        src={course.thumbnail_url || "https://via.placeholder.com/150"}
                                        alt={course.title}
                                        layout="fill"
                                        objectFit="cover"
                                    />
                                </div>
                                <div className="flex-1 p-4 flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors">
                                            {course.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                                            {course.description || "Không có mô tả"}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-xs font-medium text-muted-foreground">
                                            <span>Tiến độ</span>
                                            <span>{course.progress}%</span>
                                        </div>
                                        <Progress value={course.progress} className="h-1.5" />
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-muted/10 rounded-xl border border-dashed">
                    <p className="text-muted-foreground">Bạn chưa đăng ký khóa học nào</p>
                </div>
            )}
        </div>

        {/* SECTION: LỚP HỌC CỦA TÔI (MỚI) */}
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                    <GraduationCap className="h-6 w-6 text-primary" /> Lớp học của tôi
                </h2>
                {/* Link điều hướng đến trang danh sách lớp học (bạn cần tạo trang này nếu chưa có) */}
                <Link href="/dashboard/classes" className="text-sm font-medium text-primary hover:underline">
                    Xem tất cả
                </Link>
            </div>

            {classes.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {classes.map((cls) => (
                        // Lưu ý: Link này trỏ đến trang chi tiết lớp học dành cho sinh viên
                        // Bạn cần đảm bảo route /dashboard/classes/[id] tồn tại
                        <Link href={`/dashboard/classes/${cls.id}`} key={cls.id}>
                            <Card className="h-full hover:shadow-md transition-all border-l-4 border-l-primary/60 cursor-pointer">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <Badge variant="outline" className="font-mono text-xs">
                                            {cls.code}
                                        </Badge>
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <CardTitle className="text-lg line-clamp-1 mt-2">{cls.name}</CardTitle>
                                    <CardDescription className="text-xs line-clamp-1">GV: {cls.teacher_name}</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-xs text-muted-foreground">
                                        {cls.description || "Lớp học tiêu chuẩn"}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 bg-muted/10 rounded-xl border border-dashed flex flex-col items-center justify-center">
                    <p className="text-muted-foreground mb-3">Bạn chưa tham gia lớp nào</p>
                    <JoinClassDialog />
                </div>
            )}
        </div>
      </div>

      {/* Gợi ý bài thi */}
      <div className="bg-primary/5 rounded-2xl p-8 border border-primary/10 mt-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
                <h3 className="text-2xl font-bold text-primary mb-2">Kiểm tra kiến thức</h3>
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
                    <div className="text-4xl font-bold text-foreground">{value || 0}</div>
                )}
                <p className="text-xs text-muted-foreground mt-1">{label}</p>
            </CardContent>
        </Card>
    )
}