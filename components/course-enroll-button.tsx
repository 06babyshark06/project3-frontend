"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Loader2, PlayCircle } from "lucide-react";

interface CourseEnrollButtonProps {
  courseId: number;
  isEnrolled: boolean;
}

export function CourseEnrollButton({ courseId, isEnrolled }: CourseEnrollButtonProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleEnroll = async () => {
    // 1. Kiểm tra đăng nhập
    if (!user) {
      toast.error("Vui lòng đăng nhập để đăng ký khóa học.");
      router.push("/login");
      return;
    }
    
    setIsLoading(true);
    try {
      await api.post("/courses/enroll", { course_id: courseId });
      
      toast.success("Đăng ký thành công! Đang vào lớp học...");
      
      router.refresh();
      
      router.push(`/learn/${courseId}`);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || "Đăng ký thất bại.";
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  const handleStartLearning = () => {
    router.push(`/learn/${courseId}`);
  };

  if (isEnrolled) {
    return (
      <Button 
        size="lg" 
        className="w-full text-lg font-bold bg-green-600 hover:bg-green-700 shadow-md hover:shadow-lg transition-all" 
        onClick={handleStartLearning}
      >
        <PlayCircle className="mr-2 h-5 w-5" /> Vào học ngay
      </Button>
    );
  }

  return (
    <Button 
      size="lg" 
      className="w-full text-lg font-bold shadow-md hover:shadow-lg transition-all" 
      onClick={handleEnroll} 
      disabled={isLoading}
    >
      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
      {isLoading ? "Đang xử lý..." : "Đăng ký học"}
    </Button>
  );
}