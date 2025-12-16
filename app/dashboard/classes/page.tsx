"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { 
  Users, BookOpen, Search, Filter 
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JoinClassDialog } from "@/components/JoinClassDialog";

interface ClassModel {
  id: number;
  name: string;
  code: string;
  description: string;
  teacher_name: string;
  student_count: number;
  created_at: string;
}

export default function StudentClassesPage() {
  const [classes, setClasses] = useState<ClassModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setLoading(true);
        const res = await api.get("/classes", {
          params: { limit: 100 }
        });
        setClasses(res.data.data.classes || []);
      } catch (error) {
        console.error("Failed to fetch classes:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchClasses();
  }, []);

  // Lọc lớp học theo từ khóa tìm kiếm
  const filteredClasses = classes.filter(cls => 
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.teacher_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lớp học của tôi</h1>
          <p className="text-muted-foreground mt-1">
            Danh sách các lớp học bạn đang tham gia.
          </p>
        </div>
        <JoinClassDialog />
      </div>

      {/* Search & Filter Section */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên lớp, mã lớp hoặc giảng viên..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Có thể thêm bộ lọc status nếu cần */}
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredClasses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((cls) => (
            <Link href={`/dashboard/classes/${cls.id}`} key={cls.id} className="group">
              <Card className="h-full hover:shadow-md transition-all border-l-4 border-l-primary/60 cursor-pointer group-hover:border-l-primary">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <Badge variant="outline" className="font-mono text-xs bg-primary/5">
                      {cls.code}
                    </Badge>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Users className="h-3 w-3 mr-1" /> {cls.student_count}
                    </div>
                  </div>
                  <CardTitle className="text-xl mt-3 line-clamp-1 group-hover:text-primary transition-colors">
                    {cls.name}
                  </CardTitle>
                  <CardDescription className="line-clamp-1">
                    GV: <span className="font-medium text-foreground">{cls.teacher_name}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">
                    {cls.description || "Không có mô tả cho lớp học này."}
                  </div>
                  <Button variant="secondary" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Vào lớp học
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-muted/10 rounded-xl border border-dashed">
          <div className="bg-background p-4 rounded-full mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">Chưa tìm thấy lớp học nào</h3>
          <p className="text-muted-foreground text-sm max-w-md text-center mt-2 mb-6">
            {searchTerm 
              ? "Không có lớp học nào khớp với từ khóa tìm kiếm của bạn." 
              : "Bạn chưa tham gia lớp học nào. Hãy hỏi giảng viên mã lớp để tham gia ngay."}
          </p>
          {!searchTerm && <JoinClassDialog />}
        </div>
      )}
    </div>
  );
}