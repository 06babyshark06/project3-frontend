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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Fragment } from "react"

import { AddTopicDialog } from "@/components/AddTopicDialog";
import { AddSectionDialog } from "@/components/AddSectionDialog";

interface Section { id: number; name: string; description: string; topic_id: number; }
interface Topic { id: number; name: string; description: string; creator_name?: string; } // Added creator_name

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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold">Quản lý Danh mục</h1>
                    <p className="text-muted-foreground">Tổ chức Chủ đề và Chương học cho ngân hàng câu hỏi.</p>
                </div>
                <Button onClick={() => setIsAddTopicOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> Thêm Chủ đề
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="border rounded-md overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[400px]">Chủ đề</TableHead>
                                <TableHead>Mô tả</TableHead>
                                <TableHead>Người tạo</TableHead>
                                <TableHead className="text-right">Thao tác</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {topics.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center">
                                        Chưa có chủ đề nào.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                topics.map(topic => (
                                    <Fragment key={topic.id}>
                                        <TableRow className="group hover:bg-muted/50 data-[state=selected]:bg-muted">
                                            <TableCell className="font-medium align-top">
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6 shrink-0"
                                                        onClick={() => toggleExpand(topic.id)}
                                                    >
                                                        {expandedTopics.includes(topic.id) ? (
                                                            <ChevronDown className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronRight className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <FolderOpen className="h-4 w-4 text-blue-500 shrink-0" />
                                                    <span>{topic.name}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="align-top text-muted-foreground">{topic.description}</TableCell>
                                            <TableCell className="align-top">
                                                {topic.creator_name ? (
                                                    <Badge variant="secondary" className="font-normal">
                                                        {topic.creator_name}
                                                    </Badge>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs font-italic">Unknown</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right align-top">
                                                <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedTopicId(topic.id); setIsAddSectionOpen(true); }} title="Thêm chương">
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setEditingItem({ type: 'topic', data: topic })} title="Sửa">
                                                        <Edit className="h-4 w-4 text-orange-500" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeletingItem({ type: 'topic', id: topic.id, name: topic.name })} title="Xóa">
                                                        <Trash2 className="h-4 w-4 text-red-500" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                        {expandedTopics.includes(topic.id) && (
                                            <TableRow className="hover:bg-transparent bg-muted/20">
                                                <TableCell colSpan={4} className="p-0 border-b">
                                                    <div className="p-4 pl-12 space-y-2">
                                                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">Danh sách chương</h4>
                                                        {(!sectionsMap[topic.id] || sectionsMap[topic.id].length === 0) ? (
                                                            <div className="text-sm text-muted-foreground italic">Chưa có chương nào.</div>
                                                        ) : (
                                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                                {sectionsMap[topic.id].map(sec => (
                                                                    <div key={sec.id} className="flex items-center justify-between p-2 rounded bg-background border hover:border-primary/50 transition-colors group/sec">
                                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                                            <Book className="h-4 w-4 text-green-600 shrink-0" />
                                                                            <div className="truncate">
                                                                                <div className="text-sm font-medium truncate">{sec.name}</div>
                                                                                {sec.description && <div className="text-xs text-muted-foreground truncate">{sec.description}</div>}
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex gap-1 opacity-0 group-hover/sec:opacity-100 transition-opacity">
                                                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingItem({ type: 'section', data: sec })}>
                                                                                <Edit className="h-3 w-3" />
                                                                            </Button>
                                                                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => setDeletingItem({ type: 'section', id: sec.id, name: sec.name })}>
                                                                                <Trash2 className="h-3 w-3" />
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </Fragment>
                                ))
                            )}
                        </TableBody>
                    </Table>
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
