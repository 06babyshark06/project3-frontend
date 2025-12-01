"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Lock, PlayCircle, Loader2, FileText, Video } from "lucide-react";
import { CourseEnrollButton } from "@/components/course-enroll-button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface CourseInfo {
  id: number;
  title: string;
  description: string;
  thumbnail_url: string;
  price: number;
}
interface Lesson {
  id: number;
  title: string;
  lesson_type: string;
  is_completed: boolean;
}
interface Section {
  id: number;
  title: string;
  lessons: Lesson[]; // Có thể là null/undefined từ API
}

export default function CourseDetailPage() {
  const params = useParams();
  const { user } = useAuth();
  const courseId = params.id as string;

  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!courseId) return;

    const getCourseDetails = async () => {
      try {
        setIsLoading(true);
        const response = await api.get(`/courses/${courseId}`, {
          params: {
            user_id: user?.id || 0,
          }
        });

        const data = response.data.data;
        if (data && data.course) {
          setCourseInfo(data.course);
          setSections(data.sections || []);
          setIsEnrolled(data.is_enrolled || false);
        } else {
          throw new Error("Dữ liệu API không hợp lệ");
        }
      } catch (error) {
        console.error("Lỗi fetch chi tiết khóa học:", error);
        toast.error("Không thể tải chi tiết khóa học.");
      } finally {
        setIsLoading(false);
      }
    };

    getCourseDetails();
  }, [courseId, user]);

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-80px)] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!courseInfo) {
    return (
      <div className="container text-center py-10">
        <h1 className="text-2xl font-bold">Không tìm thấy khóa học</h1>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-8">
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* CỘT TRÁI: Nội dung khóa học (70%) */}
        <div className="md:col-span-2">
          <h1 className="text-4xl font-extrabold tracking-tight mb-4">
            {courseInfo.title}
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            {courseInfo.description}
          </p>

          <h2 className="text-3xl font-bold mb-4">Nội dung khóa học</h2>
          
          {sections.length === 0 ? (
             <p className="text-muted-foreground">Nội dung đang được cập nhật.</p>
          ) : (
            <Accordion type="single" collapsible defaultValue="item-0">
                {sections.map((section, index) => (
                <AccordionItem value={`item-${index}`} key={section.id}>
                    <AccordionTrigger className="text-xl font-semibold hover:no-underline">
                    {section.title}
                    </AccordionTrigger>
                    <AccordionContent>
                        {/* === SỬA LỖI Ở ĐÂY === */}
                        {/* Kiểm tra section.lessons tồn tại và có độ dài > 0 */}
                        {section.lessons && section.lessons.length > 0 ? (
                            <ul className="space-y-3">
                                {section.lessons.map((lesson) => (
                                <li key={lesson.id} className="flex items-center justify-between p-3 rounded-md hover:bg-secondary/60 transition-colors">
                                    <div className="flex items-center gap-3">
                                        {lesson.lesson_type === 'video' ? (
                                            <Video className="h-5 w-5 text-blue-500" />
                                        ) : (
                                            <FileText className="h-5 w-5 text-orange-500" />
                                        )}
                                        <span className="text-base font-medium">{lesson.title}</span>
                                    </div>
                                    {!isEnrolled && (
                                        <Lock className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-muted-foreground italic py-2">Chưa có bài học trong chương này.</p>
                        )}
                    </AccordionContent>
                </AccordionItem>
                ))}
            </Accordion>
          )}
        </div>

        {/* CỘT PHẢI: Card thông tin (30%) */}
        <div className="md:col-span-1">
          <Card className="sticky top-24 shadow-lg border-muted/60">
            <CardHeader className="p-0">
              <div className="relative w-full h-56">
                <Image
                  src={courseInfo.thumbnail_url || "https://via.placeholder.com/400x200"}
                  alt={courseInfo.title}
                  layout="fill"
                  objectFit="cover"
                  className="rounded-t-lg"
                />
              </div>
              
              <div className="p-6 pb-2">
                  {courseInfo.price > 0 ? (
                    <Badge className="text-2xl font-bold w-full justify-center p-3 bg-primary hover:bg-primary/90">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(courseInfo.price)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-2xl font-bold w-full justify-center p-3 bg-green-100 text-green-700 hover:bg-green-200">
                      Miễn phí
                    </Badge>
                  )}
              </div>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <CourseEnrollButton 
                courseId={courseInfo.id} 
                isEnrolled={isEnrolled} 
              />
              <p className="text-xs text-center text-muted-foreground mt-4">
                Truy cập trọn đời • Học mọi lúc mọi nơi
              </p>
            </CardContent>
          </Card>
        </div>
        
      </div>
    </div>
  );
}