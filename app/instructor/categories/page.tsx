"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
    FolderOpen, Edit, Trash2, Plus,
    ChevronRight, ChevronDown, Loader2, Book
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";

import { AddTopicDialog } from "@/components/AddTopicDialog";
import { AddSectionDialog } from "@/components/AddSectionDialog";

interface Section { id: number; name: string; description: string; topic_id: number; }
interface Topic { id: number; name: string; description: string; }

export default function CategoryManagementPage() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [sectionsMap, setSectionsMap] = useState<Record<number, Section[]>>({});
    const [loading, setLoading] = useState(true);
    const [expandedTopics, setExpandedTopics] = useState<number[]>([]);

    // Dialog States
    const [isAddTopicOpen, setIsAddTopicOpen] = useState(false);
    const [isAddSectionOpen, setIsAddSectionOpen] = useState(false);
    const [selectedTopicId, setSelectedTopicId] = useState<number | undefined>();

    // Edit/Delete States
    const [editingItem, setEditingItem] = useState<{ type: 'topic' | 'section', data: any } | null>(null);
    const [deletingItem, setDeletingItem] = useState<{ type: 'topic' | 'section', id: number, name: string } | null>(null);

    const fetchTopics = async () => {
        try {
            setLoading(true);
            const res = await api.get("/topics");
            setTopics(res.data.data.topics || []);
        } catch (error) {
            toast.error("Lỗi tải danh sách chủ đề");
        } finally {
            setLoading(false);
        }
    };

    const fetchSections = async (topicId: number) => {
        if (sectionsMap[topicId]) return; // Đã tải rồi thì thôi
        try {
            const res = await api.get(`/exam-sections?topic_id=${topicId}`);
            setSectionsMap(prev => ({ ...prev, [topicId]: res.data.data.sections || [] }));
        } catch (error) {
            console.error(error);
        }
    };

    const toggleExpand = (topicId: number) => {
        if (expandedTopics.includes(topicId)) {
            setExpandedTopics(prev => prev.filter(id => id !== topicId));
        } else {
            setExpandedTopics(prev => [...prev, topicId]);
            fetchSections(topicId);
        }
    };

    useEffect(() => {
        fetchTopics();
    }, []);

    const handleEdit = async (data: any) => {
        if (!data.name.trim()) return toast.error("Tên không được để trống");

        try {
            const url = editingItem?.type === 'topic' ? `/topics/${data.id}` : `/exam-sections/${data.id}`;
            await api.put(url, { name: data.name, description: data.description });

            toast.success("Cập nhật thành công!");
            setEditingItem(null);

            // Refresh data
            if (editingItem?.type === 'topic') {
                fetchTopics();
            } else {
                // Force reload section của topic đó
                const topicId = data.topic_id;
                const res = await api.get(`/exam-sections?topic_id=${topicId}`);
                setSectionsMap(prev => ({ ...prev, [topicId]: res.data.data.sections || [] }));
            }
        } catch (error) {
            toast.error("Cập nhật thất bại");
        }
    };

    const handleDelete = async () => {
        if (!deletingItem) return;
        try {
            const url = deletingItem.type === 'topic' ? `/topics/${deletingItem.id}` : `/exam-sections/${deletingItem.id}`;
            await api.delete(url);
            toast.success("Xóa thành công!");

            if (deletingItem.type === 'topic') {
                fetchTopics();
            } else {
                // Tìm topic cha để reload (hơi khó vì chỉ có ID, nhưng ta có thể reload all hoặc trick UI)
                // Đơn giản nhất: Reload lại trang hoặc reload topics
                fetchTopics(); // Reload topics để reset tree
                setSectionsMap({}); // Clear cache sections
                setExpandedTopics([]);
            }
        } catch (error) {
            toast.error("Xóa thất bại (Có thể do dữ liệu đang được sử dụng)");
        } finally {
            setDeletingItem(null);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4 max-w-5xl">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Danh mục của tôi (Giáo viên)</h1>
                    <p className="text-muted-foreground">Tổ chức Chủ đề và Chương học cho ngân hàng câu hỏi.</p>
                </div>
                <Button onClick={() => setIsAddTopicOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Thêm Chủ đề
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="space-y-4">
                    {topics.length === 0 ? (
                        <div className="text-center py-10 border rounded bg-muted/10 text-muted-foreground">Chưa có chủ đề nào.</div>
                    ) : (
                        topics.map(topic => (
                            <Card key={topic.id} className="overflow-hidden">
                                <div className="flex items-center justify-between p-4 bg-card hover:bg-accent/5 transition-colors">
                                    <div className="flex items-center gap-3 cursor-pointer select-none flex-1" onClick={() => toggleExpand(topic.id)}>
                                        {expandedTopics.includes(topic.id) ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                                        <div className="flex items-center gap-2">
                                            <FolderOpen className="h-5 w-5 text-blue-500" />
                                            <div>
                                                <h3 className="font-semibold text-lg">{topic.name}</h3>
                                                {topic.description && <p className="text-sm text-muted-foreground line-clamp-1">{topic.description}</p>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => { setSelectedTopicId(topic.id); setIsAddSectionOpen(true); }}>
                                            <Plus className="h-4 w-4 mr-1" /> Thêm chương
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setEditingItem({ type: 'topic', data: topic })}>
                                            <Edit className="h-4 w-4 text-orange-500" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => setDeletingItem({ type: 'topic', id: topic.id, name: topic.name })}>
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>

                                {/* SECTIONS LIST */}
                                {expandedTopics.includes(topic.id) && (
                                    <div className="border-t bg-muted/20 p-2 pl-10 space-y-1">
                                        {(!sectionsMap[topic.id] || sectionsMap[topic.id].length === 0) ? (
                                            <div className="py-2 text-sm text-muted-foreground italic">Chưa có chương nào trong chủ đề này.</div>
                                        ) : (
                                            sectionsMap[topic.id].map(sec => (
                                                <div key={sec.id} className="flex items-center justify-between p-2 rounded hover:bg-background border border-transparent hover:border-border transition-all">
                                                    <div className="flex items-center gap-3">
                                                        <Book className="h-4 w-4 text-green-600" />
                                                        <span className="font-medium text-sm">{sec.name}</span>
                                                        {sec.description && <span className="text-xs text-muted-foreground">- {sec.description}</span>}
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingItem({ type: 'section', data: sec })}>
                                                            <Edit className="h-3 w-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeletingItem({ type: 'section', id: sec.id, name: sec.name })}>
                                                            <Trash2 className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </Card>
                        ))
                    )}
                </div>
            )}

            {/* EDIT DIALOG */}
            <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Chỉnh sửa {editingItem?.type === 'topic' ? 'Chủ đề' : 'Chương'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Tên</Label>
                            <Input
                                value={editingItem?.data.name || ''}
                                onChange={(e) => setEditingItem(prev => prev ? { ...prev, data: { ...prev.data, name: e.target.value } } : null)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Mô tả</Label>
                            <Textarea
                                value={editingItem?.data.description || ''}
                                onChange={(e) => setEditingItem(prev => prev ? { ...prev, data: { ...prev.data, description: e.target.value } } : null)}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingItem(null)}>Hủy</Button>
                        <Button onClick={() => handleEdit(editingItem?.data)}>Lưu thay đổi</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE ALERT */}
            <AlertDialog open={!!deletingItem} onOpenChange={(open) => !open && setDeletingItem(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Xác nhận xóa?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Bạn đang xóa <strong>{deletingItem?.name}</strong>.
                            <br />
                            <span className="text-red-600 font-bold">CẢNH BÁO:</span> Hành động này sẽ xóa tất cả dữ liệu con (Câu hỏi, bài thi...) liên quan. Không thể hoàn tác.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Xóa vĩnh viễn</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AddTopicDialog open={isAddTopicOpen} onOpenChange={setIsAddTopicOpen} onSuccess={fetchTopics} />
            <AddSectionDialog
                open={isAddSectionOpen}
                onOpenChange={setIsAddSectionOpen}
                onSuccess={() => { if (selectedTopicId) fetchSections(selectedTopicId); }}
                defaultTopicId={selectedTopicId}
            />
        </div>
    );
}
