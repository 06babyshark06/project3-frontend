import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Trophy, Users, ArrowRight, PlayCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-rose-50/30 font-sans selection:bg-rose-200 selection:text-rose-900">
      
      {/* --- HERO SECTION --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Decorative Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full z-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-rose-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
          <div className="absolute top-20 right-10 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-red-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center rounded-full border border-rose-200 bg-white/50 px-3 py-1 text-sm font-medium text-rose-800 backdrop-blur-sm mb-8 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-rose-500 mr-2 animate-pulse"></span>
            Nền tảng học tập thế hệ mới
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
            Ươm mầm tri thức <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-500 to-pink-600">
              Kiến tạo tương lai
            </span>
          </h1>
          
          <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            JQK Study mang đến trải nghiệm học tập trực tuyến mượt mà, hiện đại và đầy cảm hứng. 
            Hàng ngàn khóa học chất lượng đang chờ đón bạn.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" className="h-14 px-8 text-lg bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-500/20 rounded-full transition-all hover:scale-105" asChild>
              <Link href="/courses">
                Khám phá khóa học <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800 rounded-full bg-white/80 backdrop-blur-sm" asChild>
              <Link href="/login">
                Đăng nhập ngay
              </Link>
            </Button>
          </div>
          
          

        </div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="py-10 bg-white border-y border-rose-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-rose-100">
            {[
              { label: "Học viên", value: "10,000+" },
              { label: "Khóa học", value: "250+" },
              { label: "Giảng viên", value: "50+" },
              { label: "Đánh giá", value: "4.9/5" },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-3xl md:text-4xl font-bold text-rose-600">{stat.value}</span>
                <span className="text-sm text-slate-500 font-medium uppercase tracking-wider mt-2">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- FEATURES SECTION --- */}
      <section className="py-24 bg-rose-50/50">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Tại sao chọn JQK Study?</h2>
            <p className="text-lg text-slate-600">Chúng tôi tập trung vào trải nghiệm người dùng và chất lượng nội dung.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <Card className="border-none shadow-md hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-rose-100 rounded-2xl flex items-center justify-center mb-6 rotate-3 hover:rotate-6 transition-transform">
                  <BookOpen className="h-8 w-8 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Lộ trình rõ ràng</h3>
                <p className="text-slate-500 leading-relaxed">
                  Các bài học được thiết kế bài bản, từ cơ bản đến nâng cao, giúp bạn không bị "hổng" kiến thức.
                </p>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="border-none shadow-md hover:shadow-xl transition-shadow duration-300 bg-white relative overflow-hidden group">
              <div className="absolute inset-0 bg-linear-to-br from-rose-500 to-pink-600 opacity-0 group-hover:opacity-5 transition-opacity" />
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-rose-100 rounded-2xl flex items-center justify-center mb-6 -rotate-3 hover:-rotate-6 transition-transform">
                  <PlayCircle className="h-8 w-8 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Học qua Video & Text</h3>
                <p className="text-slate-500 leading-relaxed">
                  Hệ thống player hiện đại, hỗ trợ độ phân giải cao, kết hợp tài liệu đọc chuyên sâu.
                </p>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="border-none shadow-md hover:shadow-xl transition-shadow duration-300 bg-white">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-rose-100 rounded-2xl flex items-center justify-center mb-6 rotate-3 hover:rotate-6 transition-transform">
                  <Trophy className="h-8 w-8 text-rose-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">Chứng chỉ uy tín</h3>
                <p className="text-slate-500 leading-relaxed">
                  Nhận chứng chỉ hoàn thành khóa học để bổ sung vào hồ sơ năng lực của bạn.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="bg-slate-900 rounded-3xl p-10 md:p-20 text-center relative overflow-hidden">
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-rose-500 rounded-full opacity-20 blur-3xl"></div>
            <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-indigo-500 rounded-full opacity-20 blur-3xl"></div>
            
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6 relative z-10">
              Sẵn sàng bắt đầu hành trình?
            </h2>
            <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-10 relative z-10">
              Tham gia cộng đồng hơn 10,000 học viên tại JQK Study và nâng cao kỹ năng của bạn ngay hôm nay.
            </p>
            <Button size="lg" className="h-14 px-10 text-lg bg-white text-slate-900 hover:bg-rose-50 hover:text-rose-700 font-bold rounded-full relative z-10" asChild>
              <Link href="/register">
                Đăng ký miễn phí
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white border-t border-rose-100 py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm">
            © 2025 JQK Study. Được xây dựng với ❤️ và ☕️.
          </p>
        </div>
      </footer>
    </div>
  );
}