"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
    Loader2, ArrowLeft, Save, Globe, Lock, Trash2,
    Settings, FileText, ListChecks, Plus, Shuffle, Eye,
    ChevronRight, ChevronDown, FolderOpen, FileQuestion, GripVertical
} from "lucide-react";
import { toLocalISOString } from "@/lib/date-utils";

// ✅ 1. Import thư viện kéo thả
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import { AddQuestionDialog } from "@/components/AddQuestionDialog";

interface ExamSettings {
    duration_minutes: number;
    password?: string;
    shuffle_questions?: boolean;
    max_attempts?: number;
    requires_approval?: boolean;
    show_result_immediately?: boolean;
    start_time?: string;
    end_time?: string;
}

interface Question {
    id: number;
    content: string;
    question_type: string;
    difficulty: string;
    section_id?: number;
    section_name?: string;
}

interface Section {
    id: number;
    name: string;
    questions?: Question[];
}

interface Exam {
    id: number;
    title: string;
    description: string;
    status: string;
    topic_id: number;
    settings: ExamSettings;
    questions: Question[];
}

interface Topic { id: number; name: string; }

export default function EditExamPage() {
    const router = useRouter();
    const params = useParams();
    const examId = params.id as string;

    const [exam, setExam] = useState<Exam | null>(null);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Form States
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [topicId, setTopicId] = useState<string>("");

    // Settings States
    const [settings, setSettings] = useState<ExamSettings>({
        duration_minutes: 60,
        max_attempts: 1,
        shuffle_questions: false,
        show_result_immediately: true,
        requires_approval: false,
        password: ""
    });

    const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
    const [isRandomDialogOpen, setIsRandomDialogOpen] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState<any>(null);
    const [questionToDelete, setQuestionToDelete] = useState<number | null>(null);
    const [expandedSections, setExpandedSections] = useState<number[]>([]);

    // ===== FETCH DATA (Giữ nguyên) =====
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [examRes, topicRes] = await Promise.all([
                    api.get(`/exams/${examId}`),
                    api.get("/topics")
                ]);

                const examData = examRes.data.data;
                if (!examData.questions) examData.questions = [];

                setExam(examData);
                setTopics(topicRes.data.data.topics || []);

                setTitle(examData.title);
                setDescription(examData.description || "");
                setTopicId(examData.topic_id?.toString() || "");
                setSettings({
                    duration_minutes: examData.settings?.duration_minutes || 60,
                    max_attempts: examData.settings?.max_attempts || 1,
                    shuffle_questions: examData.settings?.shuffle_questions || false,
                    show_result_immediately: examData.settings?.show_result_immediately ?? true,
                    requires_approval: examData.settings?.requires_approval || false,
                    password: examData.settings?.password || "",
                    start_time: examData.settings?.start_time || "",
                    end_time: examData.settings?.end_time || ""
                });

            } catch (error) {
                toast.error("Không thể tải dữ liệu bài thi");
            } finally {
                setIsLoading(false);
            }
        };
        if (examId) fetchData();
    }, [examId]);

    useEffect(() => {
        if (!topicId) return;
        const fetchTreeData = async () => {
            try {
                const secRes = await api.get(`/exam-sections?topic_id=${topicId}`);
                const secList: Section[] = secRes.data.data.sections || [];
                const qRes = await api.get("/questions", { params: { topic_id: topicId, limit: 1000 } });
                const allQuestions: Question[] = qRes.data.data.questions || [];
                const sectionsWithQuestions = secList.map(sec => ({
                    ...sec,
                    questions: allQuestions.filter(q => q.section_id === sec.id)
                }));
                setSections(sectionsWithQuestions);
            } catch (error) {
                console.error("Lỗi tải cây thư mục câu hỏi:", error);
            }
        };
        fetchTreeData();
    }, [topicId]);

    // ===== ACTIONS =====
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await api.put(`/exams/${examId}`, {
                title,
                description,
                topic_id: Number(topicId),
                settings: settings,
                question_ids: exam?.questions?.map(q => q.id) || []
            });
            toast.success("Đã lưu thay đổi!");
            const res = await api.get(`/exams/${examId}`);
            setExam(res.data.data);
        } catch (error) {
            toast.error("Lưu thất bại");
        } finally {
            setIsSaving(false);
        }
    };

    const updateStatus = async (newStatus: string) => {
        if (!exam) return;
        try {
            await api.put(`/exams/${examId}/publish`, { status: newStatus });
            setExam({ ...exam, status: newStatus });
            toast.success("Đã cập nhật trạng thái");
        } catch (error) {
            toast.error("Thay đổi trạng thái thất bại");
        }
    };

    const toggleQuestionInExam = async (question: Question) => {
        if (!exam) return;
        const currentQuestions = exam.questions || [];
        const currentIds = currentQuestions.map(q => q.id);
        const isExists = currentIds.includes(question.id);

        let newIds;
        if (isExists) {
            newIds = currentIds.filter(id => id !== question.id);
        } else {
            newIds = [...currentIds, question.id];
        }

        const newQuestions = isExists
            ? currentQuestions.filter(q => q.id !== question.id)
            : [...currentQuestions, question];

        setExam({ ...exam, questions: newQuestions });

        try {
            await api.put(`/exams/${examId}`, {
                title, topic_id: Number(topicId), settings, question_ids: newIds
            });
        } catch (e) {
            toast.error("Lỗi cập nhật câu hỏi");
        }
    };

    // ✅ 2. Xử lý sự kiện kéo thả (Drag End)
    const onDragEnd = async (result: DropResult) => {
        // Nếu thả ra ngoài danh sách hoặc vị trí không đổi -> bỏ qua
        if (!result.destination || !exam) return;

        const sourceIndex = result.source.index;
        const destinationIndex = result.destination.index;

        if (sourceIndex === destinationIndex) return;

        // Tạo bản sao danh sách câu hỏi
        const newQuestions = Array.from(exam.questions || []);
        // Lấy phần tử đang kéo ra
        const [movedQuestion] = newQuestions.splice(sourceIndex, 1);
        // Chèn vào vị trí mới
        newQuestions.splice(destinationIndex, 0, movedQuestion);

        // Cập nhật State ngay lập tức (Optimistic UI)
        setExam({ ...exam, questions: newQuestions });

        // Gọi API để lưu thứ tự mới
        try {
            const questionIds = newQuestions.map(q => q.id);
            await api.put(`/exams/${examId}`, {
                title,
                topic_id: Number(topicId),
                settings,
                question_ids: questionIds
            });
            toast.success("Đã cập nhật thứ tự câu hỏi");
        } catch (error) {
            toast.error("Lỗi khi lưu thứ tự");
            // Rollback nếu cần (ở đây đơn giản ta không rollback state để UX mượt, nhưng nên reload nếu lỗi)
        }
    };

    // ... (Các hàm handleGenerateRandom, toggleSection giữ nguyên) ...
    const handleGenerateRandom = async (config: { difficulty: string; count: number; sectionId: string; replace: boolean }) => {
        // ... (Code cũ giữ nguyên)
        if (!topicId) return toast.error("Vui lòng chọn chủ đề trước");
        try {
            const params: any = {
                topic_id: topicId,
                difficulty: config.difficulty === 'all' ? undefined : config.difficulty,
                limit: 100
            };
            if (config.sectionId !== 'all') params.section_id = config.sectionId;

            const res = await api.get("/questions", { params });
            let pool = res.data.data.questions as Question[];
            const currentIds = exam?.questions?.map(q => q.id) || [];

            if (!config.replace) {
                pool = pool.filter(q => !currentIds.includes(q.id));
            }

            if (pool.length === 0) return toast.warning("Không tìm thấy câu hỏi mới nào phù hợp.");
            if (pool.length < config.count) toast.info(`Chỉ tìm thấy ${pool.length} câu hỏi phù hợp.`);

            const shuffled = pool.sort(() => 0.5 - Math.random());
            const selected = shuffled.slice(0, config.count);

            const finalIds = config.replace
                ? selected.map(q => q.id)
                : [...currentIds, ...selected.map(q => q.id)];

            await api.put(`/exams/${examId}`, {
                title, topic_id: Number(topicId), settings, question_ids: finalIds
            });

            const updatedExam = await api.get(`/exams/${examId}`);
            setExam(updatedExam.data.data);
            setIsRandomDialogOpen(false);
            toast.success(config.replace ? `Đã làm mới đề thi với ${selected.length} câu hỏi` : `Đã thêm ${selected.length} câu hỏi vào đề`);
        } catch (e) {
            toast.error("Lỗi khi sinh câu hỏi");
        }
    };

    const toggleSection = (secId: number) => {
        setExpandedSections(prev =>
            prev.includes(secId) ? prev.filter(id => id !== secId) : [...prev, secId]
        );
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    if (!exam) return <div className="text-center py-20">Không tìm thấy bài thi</div>;

    return (
        <div className="container mx-auto max-w-[1600px] py-4 px-4 h-[calc(100vh-20px)] flex flex-col gap-4">
            {/* HEADER AREA */}
            <div className="flex items-center justify-between border-b pb-3 bg-background sticky top-0 z-10 shrink-0">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
                            {exam.title}
                            <Badge variant={exam.status === 'public' ? "default" : exam.status === 'private' ? "secondary" : "outline"}
                                className={exam.status === 'public' ? "bg-green-600" : exam.status === 'private' ? "bg-yellow-600 text-white" : ""}>
                                {exam.status === 'public' ? <Globe className="h-3 w-3 mr-1" /> : exam.status === 'private' ? <Lock className="h-3 w-3 mr-1" /> : <FileText className="h-3 w-3 mr-1" />}
                                {exam.status === 'public' ? "Công khai" : exam.status === 'private' ? "Riêng tư" : "Bản nháp"}
                            </Badge>
                        </h1>
                        <p className="text-xs text-muted-foreground mt-1">
                            {exam.questions?.length || 0} câu hỏi • {settings.duration_minutes} phút • Chủ đề: {topics.find(t => t.id === Number(topicId))?.name || "N/A"}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => router.push(`/exams/${examId}/take`)}>
                        <Eye className="h-4 w-4 mr-2" /> Xem thử
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={isSaving} className="min-w-[90px]">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4 mr-2" /> Lưu</>}
                    </Button>
                    <Select value={exam.status || 'draft'} onValueChange={updateStatus}>
                        <SelectTrigger className="w-[130px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="draft">📝 Bản nháp</SelectItem>
                            <SelectItem value="private">🔒 Riêng tư</SelectItem>
                            <SelectItem value="public">🌍 Công khai</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden min-h-0">
                {/* LEFT PANE */}
                <div className="col-span-7 flex flex-col gap-4 overflow-hidden min-h-0">
                    <Tabs defaultValue="questions" className="flex-1 flex flex-col overflow-hidden min-h-0">
                        <TabsList className="w-full justify-start border-b rounded-none px-0 h-10 bg-transparent shrink-0">
                            <TabsTrigger value="questions" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                                <ListChecks className="h-4 w-4 mr-2" /> Danh sách câu hỏi ({exam.questions?.length || 0})
                            </TabsTrigger>
                            <TabsTrigger value="settings" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"><Settings className="h-4 w-4 mr-2" /> Cấu hình & Thông tin</TabsTrigger>
                        </TabsList>

                        {/* TAB QUESTIONS VỚI DRAG & DROP */}
                        <TabsContent value="questions" className="flex-1 overflow-hidden mt-4 min-h-0 flex flex-col">
                            <Card className="flex-1 flex flex-col border-none shadow-none bg-muted/10 overflow-hidden min-h-0">
                                <div className="flex justify-between items-center p-2 bg-background border rounded-t-lg shrink-0">
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={() => setIsRandomDialogOpen(true)}>
                                            <Shuffle className="h-4 w-4 mr-2" /> Sinh ngẫu nhiên
                                        </Button>
                                        <Button size="sm" onClick={() => setIsQuestionDialogOpen(true)}>
                                            <Plus className="h-4 w-4 mr-2" /> Tạo câu hỏi mới
                                        </Button>
                                    </div>
                                    <span className="text-xs text-muted-foreground">Kéo thả icon <GripVertical className="inline h-3 w-3" /> để sắp xếp</span>
                                </div>

                                <div className="flex-1 border-x border-b rounded-b-lg bg-background p-2 overflow-y-auto min-h-0">
                                    {(exam.questions || []).length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                                            <FileQuestion className="h-10 w-10 mb-2 opacity-20" />
                                            <p>Chưa có câu hỏi nào.</p>
                                            <p className="text-xs">Chọn từ ngân hàng bên phải hoặc tạo mới.</p>
                                        </div>
                                    ) : (
                                        // ✅ 3. Bọc DragDropContext
                                        <DragDropContext onDragEnd={onDragEnd}>
                                            <Droppable droppableId="exam-questions-list">
                                                {(provided) => (
                                                    <div
                                                        {...provided.droppableProps}
                                                        ref={provided.innerRef}
                                                        className="space-y-2"
                                                    >
                                                        {(exam.questions || []).map((q, idx) => (
                                                            <Draggable key={q.id} draggableId={q.id.toString()} index={idx}>
                                                                {(provided, snapshot) => (
                                                                    <div
                                                                        ref={provided.innerRef}
                                                                        {...provided.draggableProps}
                                                                        className={`group flex items-start gap-3 p-3 border rounded-lg transition-all bg-card ${snapshot.isDragging ? "shadow-lg ring-2 ring-primary/20 z-50 bg-accent" : "hover:border-primary/50 hover:bg-muted/30"
                                                                            }`}
                                                                        style={provided.draggableProps.style}
                                                                    >
                                                                        {/* Icon Grip để kéo */}
                                                                        <div
                                                                            {...provided.dragHandleProps}
                                                                            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-primary"
                                                                        >
                                                                            <GripVertical className="h-4 w-4" />
                                                                        </div>

                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">Câu {idx + 1}</Badge>
                                                                                <Badge className={`h-5 px-1.5 text-[10px] ${q.difficulty === 'easy' ? 'bg-green-100 text-green-700' :
                                                                                    q.difficulty === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                                                                                    }`}>
                                                                                    {q.difficulty}
                                                                                </Badge>
                                                                                <span className="text-xs text-muted-foreground truncate max-w-[200px]">{q.section_name}</span>
                                                                            </div>
                                                                            <p className="text-sm line-clamp-2 font-medium">{q.content}</p>
                                                                        </div>

                                                                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={async () => {
                                                                                try {
                                                                                    const res = await api.get(`/questions/${q.id}`);
                                                                                    setEditingQuestion(res.data.data);
                                                                                    setIsQuestionDialogOpen(true);
                                                                                } catch { toast.error("Lỗi tải câu hỏi"); }
                                                                            }}>
                                                                                <FileText className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" onClick={() => toggleQuestionInExam(q)}>
                                                                                <Trash2 className="h-3.5 w-3.5" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </DragDropContext>
                                    )}
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="settings" className="flex-1 overflow-y-auto mt-4 pr-2 min-h-0">
                            <div className="grid grid-cols-1 gap-6 pb-6">
                                <Card>
                                    <CardHeader className="py-3"><CardTitle className="text-base">Thông tin chung</CardTitle></CardHeader>
                                    <CardContent className="space-y-4 py-4">
                                        <div className="space-y-1">
                                            <Label>Tiêu đề bài thi</Label>
                                            <Input value={title} onChange={e => setTitle(e.target.value)} />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Mô tả / Hướng dẫn</Label>
                                            <Textarea value={description} onChange={e => setDescription(e.target.value)} className="h-24" />
                                        </div>
                                        <div className="space-y-1">
                                            <Label>Chủ đề (Topic)</Label>
                                            <Select value={topicId} onValueChange={setTopicId}>
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>{topics.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>)}</SelectContent>
                                            </Select>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="py-3"><CardTitle className="text-base">Cấu hình thi</CardTitle></CardHeader>
                                    <CardContent className="space-y-4 py-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><Label>Thời gian (phút)</Label><Input type="number" value={settings.duration_minutes} onChange={e => setSettings({ ...settings, duration_minutes: Number(e.target.value) })} /></div>
                                            <div><Label>Lượt thi tối đa</Label><Input type="number" value={settings.max_attempts} onChange={e => setSettings({ ...settings, max_attempts: Number(e.target.value) })} /></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label>Thời gian mở đề (Bắt đầu)</Label>
                                                <Input
                                                    type="datetime-local"
                                                    value={toLocalISOString(settings.start_time)}
                                                    onChange={e => setSettings({ ...settings, start_time: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                                                />
                                                <p className="text-[10px] text-muted-foreground mt-1">Bỏ trống để mở ngay lập tức</p>
                                            </div>
                                            <div>
                                                <Label>Thời gian đóng đề (Kết thúc)</Label>
                                                <Input
                                                    type="datetime-local"
                                                    value={toLocalISOString(settings.end_time)}
                                                    onChange={e => setSettings({ ...settings, end_time: e.target.value ? new Date(e.target.value).toISOString() : "" })}
                                                />
                                                <p className="text-[10px] text-muted-foreground mt-1">Bỏ trống để không giới hạn</p>
                                            </div>
                                        </div>
                                        <div><Label>Mật khẩu</Label><Input value={settings.password} onChange={e => setSettings({ ...settings, password: e.target.value })} placeholder="Bỏ trống nếu không cần" /></div>
                                        <div className="space-y-3 pt-2">
                                            <div className="flex justify-between items-center border p-2 rounded"><Label className="text-xs">Trộn câu hỏi</Label><Switch checked={settings.shuffle_questions} onCheckedChange={v => setSettings({ ...settings, shuffle_questions: v })} /></div>
                                            <div className="flex justify-between items-center border p-2 rounded"><Label className="text-xs">Xem đáp án ngay</Label><Switch checked={settings.show_result_immediately} onCheckedChange={v => setSettings({ ...settings, show_result_immediately: v })} /></div>
                                            <div className="flex justify-between items-center border p-2 rounded"><Label className="text-xs">Duyệt tham gia</Label><Switch checked={settings.requires_approval} onCheckedChange={v => setSettings({ ...settings, requires_approval: v })} /></div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>

                {/* RIGHT PANE: QUESTION BANK TREE (5 cols) - Giữ nguyên không đổi */}
                <div className="col-span-5 flex flex-col border-l pl-6 overflow-hidden min-h-0">
                    <div className="mb-4 shrink-0">
                        <h3 className="font-semibold flex items-center gap-2">
                            <FolderOpen className="h-4 w-4 text-blue-500" /> Ngân hàng câu hỏi
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">Tích chọn để thêm vào đề thi.</p>
                    </div>

                    <Card className="flex-1 overflow-hidden border bg-muted/5 shadow-none flex flex-col min-h-0">
                        <div className="flex-1 overflow-y-auto p-2 min-h-0">
                            {sections.length === 0 ? (
                                <div className="text-center py-10 text-muted-foreground text-sm">
                                    Chưa có dữ liệu hoặc chưa chọn chủ đề.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {sections.map(sec => {
                                        const isExpanded = expandedSections.includes(sec.id);
                                        return (
                                            <div key={sec.id} className="border rounded bg-background">
                                                <div
                                                    className="flex items-center justify-between p-2 cursor-pointer hover:bg-muted/50 sticky top-0 bg-background z-10"
                                                    onClick={() => toggleSection(sec.id)}
                                                >
                                                    <div className="flex items-center gap-2 font-medium text-sm">
                                                        {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                                        {sec.name} <span className="text-xs text-muted-foreground">({sec.questions?.length || 0})</span>
                                                    </div>
                                                </div>

                                                {isExpanded && sec.questions && sec.questions.length > 0 && (
                                                    <div className="border-t bg-muted/10 p-2 space-y-1">
                                                        {sec.questions.map(q => {
                                                            const isSelected = (exam.questions || []).some(eq => eq.id === q.id);
                                                            return (
                                                                <div
                                                                    key={q.id}
                                                                    className={`flex items-start gap-2 p-2 rounded text-sm cursor-pointer transition-colors ${isSelected ? "bg-blue-50 border border-blue-200" : "hover:bg-muted"}`}
                                                                    onClick={() => toggleQuestionInExam(q)}
                                                                >
                                                                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isSelected ? "bg-blue-600 border-blue-600" : "border-gray-400"}`}>
                                                                        {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className={`line-clamp-2 ${isSelected ? "text-blue-700 font-medium" : "text-muted-foreground"}`}>{q.content}</p>
                                                                        <div className="flex gap-1 mt-1">
                                                                            <span className={`text-[10px] px-1 rounded border ${q.difficulty === 'easy' ? 'text-green-600 border-green-200' : q.difficulty === 'medium' ? 'text-yellow-600 border-yellow-200' : 'text-red-600 border-red-200'}`}>{q.difficulty}</span>
                                                                            <span className="text-[10px] px-1 rounded border bg-muted">{q.question_type === 'single_choice' ? '1 Đ.A' : 'Nhiều Đ.A'}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </Card>
                </div>
            </div>

            {/* DIALOGS - Giữ nguyên */}
            <AddQuestionDialog
                open={isQuestionDialogOpen || !!editingQuestion}
                onOpenChange={(open) => { setIsQuestionDialogOpen(open); if (!open) setEditingQuestion(null); }}
                onSuccess={async () => {
                    const res = await api.get(`/exams/${examId}`);
                    setExam(res.data.data);
                    if (topicId) setTopicId(prev => prev);
                }}
                questionToEdit={editingQuestion}
                examId={Number(examId)}
                defaultTopicId={Number(topicId)}
                defaultSectionId={editingQuestion?.section_id}
            />

            <RandomGeneratorDialog
                open={isRandomDialogOpen}
                onOpenChange={setIsRandomDialogOpen}
                onGenerate={handleGenerateRandom}
                sections={sections}
            />
        </div>
    );
}

// RandomGeneratorDialog (Giữ nguyên)
function RandomGeneratorDialog({ open, onOpenChange, onGenerate, sections }: any) {
    const [difficulty, setDifficulty] = useState("all");
    const [sectionId, setSectionId] = useState("all");
    const [count, setCount] = useState(10);
    const [replace, setReplace] = useState(false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader><DialogTitle>Sinh ngẫu nhiên</DialogTitle></DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Chọn Chương</Label>
                        <Select value={sectionId} onValueChange={setSectionId}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Tất cả chương</SelectItem>
                                {sections.map((s: Section) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Độ khó</Label>
                        <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent><SelectItem value="all">Ngẫu nhiên</SelectItem><SelectItem value="easy">Dễ</SelectItem><SelectItem value="medium">TB</SelectItem><SelectItem value="hard">Khó</SelectItem></SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2"><Label>Số lượng</Label><Input type="number" min={1} value={count} onChange={e => setCount(Number(e.target.value))} /></div>

                    <div className="flex items-center space-x-2 border p-3 rounded-md bg-muted/20">
                        <Switch id="replace-mode" checked={replace} onCheckedChange={setReplace} />
                        <Label htmlFor="replace-mode" className="cursor-pointer text-sm font-normal">
                            Xóa câu hỏi cũ (Làm mới đề)
                        </Label>
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={() => onGenerate({ difficulty, count, sectionId, replace })}>
                        {replace ? "Tạo đề mới" : "Thêm vào đề"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}