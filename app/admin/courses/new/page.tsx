// app/admin/courses/new/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // <-- Component mới
import { Loader2 } from "lucide-react";

// (Kiểu dữ liệu response từ API tạo khóa học)
interface CreateCourseResponse {
    data: {
        course: {
            id: number;
            title: string;
            description: string,
            instructor_id: number
        };
    }
}

export default function CreateCoursePage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [price, setPrice] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Gọi API (Interceptor sẽ tự gắn token)
            // API Gateway sẽ check Role (instructor/admin)
            const response = await api.post<CreateCourseResponse>("/courses", {
                title,
                description,
                price: Number(price), // Đảm bảo 'price' là số
            });

            const newCourse = response.data.data.course;

            // 2. Thông báo thành công
            toast.success("Tạo khóa học thành công!", {
                description: `Đã tạo "${newCourse.title}".`,
            });

            // 3. Chuyển hướng đến trang "Sửa khóa học" (quan trọng)
            // Đây là nơi giảng viên sẽ thêm Section và Lesson
            router.push(`/admin/courses/edit/${newCourse.id}`);

        } catch (err: any) {
            console.error("Lỗi tạo khóa học:", err);
            const errorMessage = err.response?.data?.error || "Đã xảy ra lỗi.";
            toast.error("Tạo khóa học thất bại", {
                description: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-4xl p-4 md:p-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-3xl font-bold">
                        Tạo Khóa Học Mới
                    </CardTitle>
                    <CardDescription>
                        Bắt đầu chia sẻ kiến thức của bạn. Bạn có thể thêm nội dung chi tiết sau.
                    </CardDescription>
                </CardHeader>

                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-6">
                        {/* Tiêu đề */}
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-lg font-medium">
                                Tiêu đề khóa học
                            </Label>
                            <Input
                                id="title"
                                type="text"
                                placeholder="Ví dụ: Lập trình Go từ cơ bản đến nâng cao"
                                required
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-12 text-lg"
                            />
                        </div>

                        {/* Mô tả */}
                        <div className="space-y-2">
                            <Label htmlFor="description" className="text-lg font-medium">
                                Mô tả
                            </Label>
                            <Textarea
                                id="description"
                                placeholder="Khóa học này sẽ giúp bạn..."
                                required
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="text-base min-h-[150px]"
                            />
                        </div>

                        {/* Giá tiền */}
                        <div className="space-y-2">
                            <Label htmlFor="price" className="text-lg font-medium">
                                Giá (VNĐ)
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder="0"
                                required
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                className="h-12 text-lg"
                            />
                            <p className="text-sm text-muted-foreground">
                                Để giá là 0 nếu bạn muốn phát hành miễn phí.
                            </p>
                        </div>
                    </CardContent>

                    <CardFooter>
                        <Button type="submit" size="lg" className="text-lg" disabled={isLoading}>
                            {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                            {isLoading ? "Đang lưu..." : "Lưu và Tiếp Tục"}
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}