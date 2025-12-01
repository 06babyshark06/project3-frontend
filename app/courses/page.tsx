import Link from "next/link";
import Image from "next/image"; 
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button"; // Thêm Button
import { api } from "@/lib/api"; 
import { SearchFilters } from "@/components/SearchFilters";
import { ArrowLeft, Home, LayoutDashboard } from "lucide-react"; // Thêm Icons

interface Course {
  id: number; 
  title: string;
  description: string;
  thumbnail_url: string;
  price: number;
}

async function getCourses(searchParams: any) {
  try {
    const response = await api.get("/courses", {
      params: {
        search: searchParams.search,
        sort: searchParams.sort,
        page: searchParams.page || 1,
        limit: 9,
      }
    });
    
    const data = response.data.data;
    
    // Kiểm tra an toàn dữ liệu trả về
    if (data && Array.isArray(data.courses)) {
       return data.courses as Course[];
    }

    return []; 
  } catch (error) {
    console.error("Lỗi khi fetch khóa học:", error);
    return []; 
  }
}

export default async function CoursesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const courses = await getCourses(searchParams);

  return (
    <div className="container mx-auto max-w-7xl p-4 md:p-8">
      
      {/* === 1. TOP BAR ĐIỀU HƯỚNG (THÊM MỚI) === */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 pb-6 border-b">
        <div className="flex items-center gap-3">
          {/* Nút Quay lại Dashboard */}
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard" title="Quay về Dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-primary">
              Thư viện Khóa học
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Khám phá kiến thức mới và nâng cao kỹ năng của bạn.
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

      {/* === 2. BỘ LỌC === */}
      <SearchFilters />
      
      {/* === 3. DANH SÁCH KHÓA HỌC === */}
      {courses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <Link href={`/courses/${course.id}`} key={course.id} className="group">
              <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-muted/60 hover:border-primary/50">
                <div className="relative w-full h-48 bg-muted">
                  <Image
                    src={course.thumbnail_url || "https://via.placeholder.com/400x200"}
                    alt={course.title}
                    layout="fill"
                    objectFit="cover"
                    className="group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                
                <CardHeader>
                  <CardTitle className="text-xl font-bold line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 pt-2 text-sm">
                    {course.description}
                  </CardDescription>
                </CardHeader>
                
                <CardFooter className="mt-auto pt-4 flex justify-between items-center">
                  {course.price > 0 ? (
                    <Badge variant="default" className="text-base font-bold px-3 py-1 bg-primary/90 hover:bg-primary">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(course.price)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-base font-bold px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200">
                      Miễn phí
                    </Badge>
                  )}
                  
                  <span className="text-xs text-muted-foreground font-medium group-hover:underline">
                    Xem chi tiết
                  </span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/10 rounded-xl border border-dashed border-muted-foreground/25">
          <p className="text-xl text-muted-foreground font-medium">Không tìm thấy khóa học nào phù hợp.</p>
          <Button 
            variant="link" 
            className="mt-2 text-primary" 
            asChild
          >
            <Link href="/courses">Xóa bộ lọc</Link>
          </Button>
        </div>
      )}
    </div>
  );
}