"use client"; // ✅ QUAN TRỌNG: Chuyển thành Client Component

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { ArrowLeft, Home, LayoutDashboard, Clock, FileQuestion, Loader2 } from "lucide-react";

interface Exam {
  id: number;
  title: string;
  duration_minutes: number;
  topic_name?: string; // Thêm topic name nếu có
}

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExams = async () => {
      try {
        setLoading(true);
        // Gọi API lấy danh sách bài thi
        const response = await api.get("/exams", {
          params: {
            limit: 100,
          },
        });
        
        const data = response.data.data;
        if (data && Array.isArray(data.exams)) {
          setExams(data.exams);
        }
      } catch (error) {
        console.error("Lỗi khi fetch bài thi:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchExams();
  }, []);

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-8">
      
      {/* === 1. TOP BAR ĐIỀU HƯỚNG === */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 pb-6 border-b">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard" title="Quay về Dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              Thư viện Đề thi
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Thử sức với các bài kiểm tra để đánh giá năng lực.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
           <Button variant="secondary" size="sm" asChild>
              <Link href="/">
                 <Home className="mr-2 h-4 w-4" /> Trang chủ
              </Link>
           </Button>
           <Button variant="default" size="sm" asChild>
              <Link href="/dashboard">
                 <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard của tôi
              </Link>
           </Button>
        </div>
      </div>
      
      {/* === 2. DANH SÁCH BÀI THI === */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : exams.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {exams.map((exam) => (
            <Link href={`/exams/${exam.id}/take`} key={exam.id} className="group">
              <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-muted/60 hover:border-primary/50">
                <CardHeader className="bg-muted/10 pb-4">
                    <div className="flex justify-between items-start gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <FileQuestion className="h-6 w-6" />
                        </div>
                        <Badge variant="outline" className="bg-background">
                            <Clock className="mr-1 h-3 w-3" /> {exam.duration_minutes} phút
                        </Badge>
                    </div>
                    {/* Hiển thị Topic nếu có */}
                    {exam.topic_name && (
                      <Badge variant="secondary" className="mt-2 w-fit">{exam.topic_name}</Badge>
                    )}
                    <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors mt-2">
                        {exam.title}
                    </CardTitle>
                </CardHeader>
                
                <CardContent className="flex-1 pt-4">
                  <CardDescription className="line-clamp-3">
                    Bài kiểm tra trắc nghiệm đánh giá kiến thức tổng hợp.
                  </CardDescription>
                </CardContent>
                
                <CardFooter className="pt-0 pb-4 px-6">
                  <Button className="w-full group-hover:bg-primary/90">
                    Làm bài ngay
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed border-muted-foreground/25">
          <p className="text-xl text-muted-foreground font-medium">Chưa có bài thi nào được xuất bản.</p>
          <Button 
            variant="link" 
            className="mt-2 text-primary" 
            asChild
          >
            <Link href="/">Quay về trang chủ</Link>
          </Button>
        </div>
      )}
    </div>
  );
}