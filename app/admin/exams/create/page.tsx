"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, ArrowLeft, PlusCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue
} from "@/components/ui/select";

interface Topic {
  id: number;
  name: string;
}

interface Section {
  id: number;
  name: string;
}

interface SectionConfig {
  section_id: number;
  count: number;
  difficulty: string;
}

export default function CreateExamPage() {
  const router = useRouter();

  // ===== FORM STATE =====
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(60);
  const [password, setPassword] = useState(""); // ✅ NEW
  const [shuffleQuestions, setShuffleQuestions] = useState(false); // ✅ NEW
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [showResultImmediately, setShowResultImmediately] = useState(true);

  const [selectedTopic, setSelectedTopic] = useState<number>(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // ===== SECTION CONFIGS =====
  const [sectionConfigs, setSectionConfigs] = useState<SectionConfig[]>([]);

  const [isCreating, setIsCreating] = useState(false);

  // ===== FETCH TOPICS =====
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const res = await api.get("/topics");
        setTopics(res.data.data.topics || []);
      } catch (error) {
        console.error("Error fetching topics:", error);
      }
    };
    fetchTopics();
  }, []);

  // ===== FETCH SECTIONS when topic changes =====
  useEffect(() => {
    if (!selectedTopic) return;

    const fetchSections = async () => {
      try {
        const res = await api.get(`/exam-sections?topic_id=${selectedTopic}`);
        setSections(res.data.data.sections || []);
      } catch (error) {
        console.error("Error fetching sections:", error);
      }
    };
    fetchSections();
  }, [selectedTopic]);

  // ===== ADD SECTION CONFIG =====
  const handleAddSection = () => {
    if (sections.length === 0) {
      toast.error("Chọn chủ đề trước để thêm section!");
      return;
    }

    setSectionConfigs([
      ...sectionConfigs,
      { section_id: sections[0].id, count: 5, difficulty: "easy" }
    ]);
  };

  const handleRemoveSection = (index: number) => {
    setSectionConfigs(sectionConfigs.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index: number, field: keyof SectionConfig, value: any) => {
    const updated = [...sectionConfigs];
    updated[index] = { ...updated[index], [field]: value };
    setSectionConfigs(updated);
  };

  // ===== CREATE EXAM =====
  const handleCreate = async () => {
    if (!title || !selectedTopic || sectionConfigs.length === 0) {
      toast.error("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    setIsCreating(true);

    try {
      const payload = {
        title,
        description,
        topic_id: selectedTopic,
        section_configs: sectionConfigs,
        settings: {
          duration_minutes: duration,
          max_attempts: maxAttempts,
          password: password || "", // ✅ NEW
          shuffle_questions: shuffleQuestions, // ✅ NEW
          requires_approval: requiresApproval,
          show_result_immediately: showResultImmediately
        }
      };

      const res = await api.post("/exams/generate", payload);
      toast.success("Tạo bài thi thành công!");
      router.push(`/admin/exams/edit/${res.data.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Tạo bài thi thất bại!");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại
      </Button>

      <h1 className="text-3xl font-bold mb-8">Tạo bài thi mới</h1>

      <div className="space-y-6">
        {/* BASIC INFO */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin cơ bản</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Tiêu đề bài thi *</Label>
              <Input
                placeholder="VD: Kiểm tra giữa kỳ - Toán 10"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <Label>Mô tả</Label>
              <Textarea
                placeholder="Mô tả về bài thi..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Chủ đề *</Label>
                <Select
                  value={selectedTopic.toString()}
                  onValueChange={(val) => {
                    setSelectedTopic(Number(val));
                    setSectionConfigs([]);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chủ đề" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Thời gian (phút) *</Label>
                <Input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ✅ EXAM SETTINGS - NEW */}
        <Card>
          <CardHeader>
            <CardTitle>Cài đặt bài thi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Password */}
            <div>
              <Label>Mật khẩu phòng thi (không bắt buộc)</Label>
              <Input
                type="text"
                placeholder="Để trống nếu không cần mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Học sinh phải nhập mật khẩu để vào thi
              </p>
            </div>

            {/* Shuffle Questions */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Trộn câu hỏi và đáp án</Label>
                <p className="text-sm text-muted-foreground">
                  Thứ tự câu hỏi và đáp án sẽ ngẫu nhiên cho mỗi học sinh
                </p>
              </div>
              <Switch
                checked={shuffleQuestions}
                onCheckedChange={setShuffleQuestions}
              />
            </div>

            {/* Max Attempts */}
            <div>
              <Label>Số lần thi tối đa</Label>
              <Input
                type="number"
                min={1}
                max={10}
                value={maxAttempts}
                onChange={(e) => setMaxAttempts(Number(e.target.value))}
              />
            </div>

            {/* Show Result Immediately */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Hiển thị kết quả ngay</Label>
                <p className="text-sm text-muted-foreground">
                  Học sinh xem điểm và đáp án đúng ngay sau khi nộp bài
                </p>
              </div>
              <Switch
                checked={showResultImmediately}
                onCheckedChange={setShowResultImmediately}
              />
            </div>

            {/* Requires Approval */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label>Yêu cầu phê duyệt</Label>
                <p className="text-sm text-muted-foreground">
                  Học sinh phải đăng ký và được giáo viên duyệt mới được thi
                </p>
              </div>
              <Switch
                checked={requiresApproval}
                onCheckedChange={setRequiresApproval}
              />
            </div>
          </CardContent>
        </Card>

        {/* SECTION CONFIGS */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cấu hình câu hỏi *</CardTitle>
              <Button
                onClick={handleAddSection}
                size="sm"
                disabled={!selectedTopic}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Thêm Section
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {sectionConfigs.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Chưa có cấu hình nào. Nhấn "Thêm Section" để bắt đầu.
              </p>
            ) : (
              <div className="space-y-4">
                {sectionConfigs.map((config, idx) => (
                  <div key={idx} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Cấu hình {idx + 1}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSection(idx)}
                      >
                        Xóa
                      </Button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label>Section</Label>
                        <Select
                          value={config.section_id.toString()}
                          onValueChange={(val) =>
                            handleSectionChange(idx, "section_id", Number(val))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {sections.map((s) => (
                              <SelectItem key={s.id} value={s.id.toString()}>
                                {s.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Độ khó</Label>
                        <Select
                          value={config.difficulty}
                          onValueChange={(val) =>
                            handleSectionChange(idx, "difficulty", val)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="easy">Dễ</SelectItem>
                            <SelectItem value="medium">Trung bình</SelectItem>
                            <SelectItem value="hard">Khó</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Số câu</Label>
                        <Input
                          type="number"
                          min={1}
                          max={50}
                          value={config.count}
                          onChange={(e) =>
                            handleSectionChange(idx, "count", Number(e.target.value))
                          }
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ACTIONS */}
        <div className="flex items-center gap-3">
          <Button
            onClick={handleCreate}
            disabled={isCreating}
            size="lg"
            className="flex-1"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Đang tạo...
              </>
            ) : (
              "Tạo bài thi"
            )}
          </Button>

          <Button
            onClick={() => router.back()}
            variant="outline"
            size="lg"
          >
            Hủy
          </Button>
        </div>
      </div>
    </div>
  );
}