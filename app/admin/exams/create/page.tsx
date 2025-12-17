"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
    Loader2, ArrowLeft, ArrowRight, Save, Clock, Shield,
    Settings, BookOpen, Plus, Trash2, Shuffle, CheckSquare
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { QuestionBankSelector } from "@/components/QuestionBankSelector";

// ===== INTERFACES =====
interface Topic {
    id: number;
    name: string;
}

interface Section {
    id: number;
    name: string;
}

interface Question {
    id: number;
    content: string;
    question_type: string;
    difficulty: string;
    section_name?: string;
}

// ===== COMPONENT CHÍNH =====
export default function CreateExamPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- DATA STATES ---
    const [topics, setTopics] = useState<Topic[]>([]);
    const [sections, setSections] = useState<Section[]>([]); // ✅ Thêm state sections
    const [selectedQuestions, setSelectedQuestions] = useState<Question[]>([]);

    // --- FORM STATES ---
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [topicId, setTopicId] = useState<string>("");

    const [duration, setDuration] = useState(60);
    const [maxAttempts, setMaxAttempts] = useState(1);
    const [password, setPassword] = useState("");
    const [startTime, setStartTime] = useState("");
    const [endTime, setEndTime] = useState("");
    const [shuffleQuestions, setShuffleQuestions] = useState(false);
    const [showResult, setShowResult] = useState(true);
    const [requiresApproval, setRequiresApproval] = useState(false);

    const [isBankSelectorOpen, setIsBankSelectorOpen] = useState(false);
    const [isRandomDialogOpen, setIsRandomDialogOpen] = useState(false);

    // Fetch Topics
    useEffect(() => {
        api.get("/topics").then(res => setTopics(res.data.data.topics || []));
    }, []);

    // ✅ Fetch Sections khi chọn Topic
    useEffect(() => {
        if (topicId) {
            api.get(`/exam-sections?topic_id=${topicId}`)
                .then(res => setSections(res.data.data.sections || []))
                .catch(console.error);
        } else {
            setSections([]);
        }
    }, [topicId]);

    // --- HANDLERS ---

    const handleSelectFromBank = async (selectedIds: number[]) => {
        const newIds = selectedIds.filter(id => !selectedQuestions.some(q => q.id === id));
        if (newIds.length === 0) return;

        try {
            const res = await api.get("/questions", { params: { topic_id: topicId, limit: 1000 } });
            const allQuestions = res.data.data.questions as Question[];
            const questionsToAdd = allQuestions.filter(q => newIds.includes(q.id));
            setSelectedQuestions(prev => [...prev, ...questionsToAdd]);
            toast.success(`Đã thêm ${questionsToAdd.length} câu hỏi`);
        } catch (e) {
            console.error(e);
        }
    };

    // ✅ Cập nhật handler sinh ngẫu nhiên
    const handleGenerateRandom = async (config: { difficulty: string; count: number; sectionId: string }) => {
        if (!topicId) return toast.error("Vui lòng chọn chủ đề trước");

        try {
            const params: any = {
                topic_id: topicId,
                difficulty: config.difficulty === 'all' ? undefined : config.difficulty,
                limit: 100
            };

            // ✅ Thêm lọc theo section
            if (config.sectionId !== 'all') {
                params.section_id = config.sectionId;
            }

            const res = await api.get("/questions", { params });

            let pool = res.data.data.questions as Question[];
            pool = pool.filter(q => !selectedQuestions.some(sq => sq.id === q.id));

            if (pool.length < config.count) {
                toast.warning(`Chỉ tìm thấy ${pool.length} câu hỏi phù hợp (yêu cầu ${config.count})`);
            }

            const shuffled = pool.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, config.count);

            if (selected.length === 0) {
                toast.error("Không tìm thấy câu hỏi nào phù hợp tiêu chí");
                return;
            }

            setSelectedQuestions(prev => [...prev, ...selected]);
            setIsRandomDialogOpen(false);
            toast.success(`Đã thêm ngẫu nhiên ${selected.length} câu hỏi`);
        } catch (e) {
            toast.error("Lỗi khi sinh câu hỏi");
        }
    };

    const removeQuestion = (id: number) => {
        setSelectedQuestions(prev => prev.filter(q => q.id !== id));
    };

    const handleSubmit = async () => {
        if (!title || !topicId) return toast.error("Thiếu thông tin bắt buộc");
        if (selectedQuestions.length === 0) return toast.error("Đề thi chưa có câu hỏi nào");

        setIsSubmitting(true);
        try {
            const payload = {
                title,
                description,
                topic_id: Number(topicId),
                question_ids: selectedQuestions.map(q => q.id),
                settings: {
                    duration_minutes: duration,
                    max_attempts: maxAttempts,
                    password,
                    start_time: startTime ? new Date(startTime).toISOString() : "",
                    end_time: endTime ? new Date(endTime).toISOString() : "",
                    shuffle_questions: shuffleQuestions,
                    show_result_immediately: showResult,
                    requires_approval: requiresApproval
                },
                creator_id: 1
            };

            await api.post("/exams", payload);
            toast.success("Tạo bài thi thành công!");
            router.push("/admin/exams");
        } catch (error: any) {
            toast.error(error.response?.data?.error?.message || "Lỗi khi tạo bài thi");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="flex items-center gap-4 mb-8">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Tạo bài thi mới</h1>
                    <p className="text-sm text-muted-foreground">Thiết lập thông tin, cấu hình và soạn đề thi</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-1 space-y-2">
                    <StepItem step={1} current={currentStep} label="Thông tin chung" icon={BookOpen} />
                    <StepItem step={2} current={currentStep} label="Cấu hình thi" icon={Settings} />
                    <StepItem step={3} current={currentStep} label="Soạn câu hỏi" icon={CheckSquare} />
                </div>

                <div className="md:col-span-3 space-y-6">
                    {/* STEP 1: INFO */}
                    {currentStep === 1 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Thông tin cơ bản</CardTitle>
                                <CardDescription>Nhập tên bài thi và chọn chủ đề kiến thức.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Tên bài thi <span className="text-red-500">*</span></Label>
                                    <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Ví dụ: Kiểm tra giữa kỳ môn Mạng máy tính" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Chủ đề (Topic) <span className="text-red-500">*</span></Label>
                                    <Select value={topicId} onValueChange={(val) => { setTopicId(val); setSections([]); }}>
                                        <SelectTrigger><SelectValue placeholder="Chọn chủ đề" /></SelectTrigger>
                                        <SelectContent>
                                            {topics.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Mô tả</Label>
                                    <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Nội dung tóm tắt..." className="min-h-[100px]" />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* STEP 2: SETTINGS (Giữ nguyên) */}
                    {currentStep === 2 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Cấu hình bài thi</CardTitle>
                                <CardDescription>Thiết lập thời gian, bảo mật và quy tắc thi.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Thời gian làm bài (phút)</Label>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="number" className="pl-9" value={duration} onChange={e => setDuration(Number(e.target.value))} />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Số lần làm tối đa</Label>
                                        <Input type="number" value={maxAttempts} onChange={e => setMaxAttempts(Number(e.target.value))} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Thời gian bắt đầu (Tùy chọn)</Label>
                                        <Input type="datetime-local" value={startTime} onChange={e => setStartTime(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Thời gian kết thúc (Tùy chọn)</Label>
                                        <Input type="datetime-local" value={endTime} onChange={e => setEndTime(e.target.value)} />
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label>Mật khẩu bài thi (Tùy chọn)</Label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input type="text" className="pl-9" placeholder="Để trống nếu công khai" value={password} onChange={e => setPassword(e.target.value)} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between border p-3 rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label>Trộn câu hỏi</Label>
                                            <p className="text-xs text-muted-foreground">Đảo thứ tự câu hỏi mỗi lần thi</p>
                                        </div>
                                        <Switch checked={shuffleQuestions} onCheckedChange={setShuffleQuestions} />
                                    </div>
                                    <div className="flex items-center justify-between border p-3 rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label>Hiện đáp án ngay</Label>
                                            <p className="text-xs text-muted-foreground">Học sinh xem được đáp án sau khi nộp</p>
                                        </div>
                                        <Switch checked={showResult} onCheckedChange={setShowResult} />
                                    </div>
                                    <div className="flex items-center justify-between border p-3 rounded-lg">
                                        <div className="space-y-0.5">
                                            <Label>Duyệt tham gia</Label>
                                            <p className="text-xs text-muted-foreground">Cần giáo viên duyệt trước khi vào thi</p>
                                        </div>
                                        <Switch checked={requiresApproval} onCheckedChange={setRequiresApproval} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* STEP 3: QUESTIONS */}
                    {currentStep === 3 && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-lg font-semibold">Danh sách câu hỏi ({selectedQuestions.length})</h2>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={() => setIsRandomDialogOpen(true)}>
                                        <Shuffle className="mr-2 h-4 w-4" /> Sinh ngẫu nhiên
                                    </Button>
                                    <Button onClick={() => setIsBankSelectorOpen(true)}>
                                        <Plus className="mr-2 h-4 w-4" /> Chọn thủ công
                                    </Button>
                                </div>
                            </div>

                            <Card>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50px]">#</TableHead>
                                            <TableHead>Nội dung</TableHead>
                                            <TableHead className="w-[120px]">Chương</TableHead>
                                            <TableHead className="w-[100px]">Độ khó</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {selectedQuestions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                                    Chưa có câu hỏi nào được chọn.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            selectedQuestions.map((q, i) => (
                                                <TableRow key={q.id}>
                                                    <TableCell className="text-xs font-mono">{i + 1}</TableCell>
                                                    <TableCell className="font-medium line-clamp-1">{q.content}</TableCell>
                                                    <TableCell className="text-muted-foreground text-sm">{q.section_name}</TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className={
                                                            q.difficulty === 'easy' ? 'text-green-600' :
                                                                q.difficulty === 'medium' ? 'text-yellow-600' : 'text-red-600'
                                                        }>
                                                            {q.difficulty}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button variant="ghost" size="icon" onClick={() => removeQuestion(q.id)}>
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </Card>
                        </div>
                    )}

                    {/* NAVIGATION BUTTONS */}
                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => setCurrentStep(p => Math.max(1, p - 1))} disabled={currentStep === 1}>
                            Quay lại
                        </Button>

                        {currentStep < 3 ? (
                            <Button onClick={() => {
                                if (currentStep === 1 && (!title || !topicId)) return toast.error("Vui lòng điền đủ thông tin");
                                setCurrentStep(p => p + 1);
                            }}>
                                Tiếp tục <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleSubmit} disabled={isSubmitting} className="bg-green-600 hover:bg-green-700">
                                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                Hoàn tất tạo bài thi
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- DIALOGS --- */}

            {topicId && (
                <QuestionBankSelector
                    open={isBankSelectorOpen}
                    onOpenChange={setIsBankSelectorOpen}
                    topicId={Number(topicId)}
                    existingQuestionIds={selectedQuestions.map(q => q.id)}
                    onAddQuestions={handleSelectFromBank}
                />
            )}

            {/* ✅ Truyền sections vào dialog */}
            <RandomGeneratorDialog
                open={isRandomDialogOpen}
                onOpenChange={setIsRandomDialogOpen}
                onGenerate={handleGenerateRandom}
                sections={sections}
            />

        </div>
    );
}

// --- SUB-COMPONENTS ---

function StepItem({ step, current, label, icon: Icon }: any) {
    const isActive = step === current;
    const isCompleted = step < current;

    return (
        <div className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${isActive ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground"}`}>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border ${isActive ? "border-primary bg-primary text-white" : isCompleted ? "bg-green-100 text-green-600 border-green-200" : "border-gray-200"}`}>
                {isCompleted ? "✓" : step}
            </div>
            <div className="flex-1">
                <p className="text-sm">{label}</p>
            </div>
        </div>
    )
}

// ✅ Cập nhật Component Dialog
function RandomGeneratorDialog({ open, onOpenChange, onGenerate, sections }: any) {
    const [difficulty, setDifficulty] = useState("all");
    const [sectionId, setSectionId] = useState("all"); // State chọn Section
    const [count, setCount] = useState(10);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Sinh câu hỏi ngẫu nhiên</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Select Section */}
                    <div className="space-y-2">
                        <Label>Chương / Phần</Label>
                        <Select value={sectionId} onValueChange={setSectionId}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Toàn bộ chủ đề (Tất cả)</SelectItem>
                                {sections?.map((s: Section) => (
                                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Độ khó</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Ngẫu nhiên (Tất cả)</SelectItem>
                                <SelectItem value="easy">Dễ</SelectItem>
                                <SelectItem value="medium">Trung bình</SelectItem>
                                <SelectItem value="hard">Khó</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Số lượng câu hỏi</Label>
                        <Input type="number" min={1} max={100} value={count} onChange={e => setCount(Number(e.target.value))} />
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => onGenerate({ difficulty, count, sectionId })}>Sinh đề</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}