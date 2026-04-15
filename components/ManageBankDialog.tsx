"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { 
  Loader2, Pencil, Trash2, Library, Book, 
  Search, Plus, ChevronRight, AlertTriangle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddTopicDialog } from "./AddTopicDialog";
import { AddSectionDialog } from "./AddSectionDialog";

interface Topic {
  id: number;
  name: string;
  description?: string;
}

interface Section {
  id: number;
  name: string;
  description?: string;
  topic_id: number;
}

interface ManageBankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
}

export function ManageBankDialog({
  open,
  onOpenChange,
  onRefresh,
}: ManageBankDialogProps) {
  const [activeTab, setActiveTab] = useState("topics");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Topic Filter for Sections tab
  const [selectedTopicId, setSelectedTopicId] = useState<string>("all");

  // Edit/Delete Dialog States
  const [topicToEdit, setTopicToEdit] = useState<Topic | null>(null);
  const [sectionToEdit, setSectionToEdit] = useState<Section | null>(null);
  const [topicToDelete, setTopicToDelete] = useState<Topic | null>(null);
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null);

  const fetchTopics = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.get("/topics");
      setTopics(res.data.data.topics || []);
    } catch (error) {
      console.error("Fetch topics error:", error);
      toast.error("Không thể tải danh sách chủ đề");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSections = useCallback(async (topicId: string) => {
    try {
      setIsLoading(true);
      const url = topicId === "all" ? "/exam-sections" : `/exam-sections?topic_id=${topicId}`;
      const res = await api.get(url);
      setSections(res.data.data.sections || []);
    } catch (error) {
      console.error("Fetch sections error:", error);
      // Don't toast error if it's just 'topic not selected' type logic
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchTopics();
      if (activeTab === "sections") {
        fetchSections(selectedTopicId);
      }
    }
  }, [open, activeTab, selectedTopicId, fetchTopics, fetchSections]);

  const handleDeleteTopic = async () => {
    if (!topicToDelete) return;
    try {
      await api.delete(`/topics/${topicToDelete.id}`);
      toast.success("Đã xóa chủ đề thành công!");
      fetchTopics();
      onRefresh();
    } catch (error) {
      toast.error("Xóa chủ đề thất bại!");
    } finally {
      setTopicToDelete(null);
    }
  };

  const handleDeleteSection = async () => {
    if (!sectionToDelete) return;
    try {
      await api.delete(`/exam-sections/${sectionToDelete.id}`);
      toast.success("Đã xóa chương thành công!");
      fetchSections(selectedTopicId);
      onRefresh();
    } catch (error) {
      toast.error("Xóa chương thất bại!");
    } finally {
      setSectionToDelete(null);
    }
  };

  const filteredTopics = topics.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredSections = sections.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Library className="h-5 w-5 text-primary" />
              Quản lý Chủ đề & Chương
            </DialogTitle>
            <DialogDescription>
              Chỉnh sửa hoặc xóa các chủ đề và chương trong ngân hàng câu hỏi.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => {
            setActiveTab(v);
            setSearchTerm("");
          }} className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-1 mb-4">
              <TabsList>
                <TabsTrigger value="topics" className="gap-2">
                  <Library className="h-4 w-4" /> Chủ đề
                </TabsTrigger>
                <TabsTrigger value="sections" className="gap-2">
                  <Book className="h-4 w-4" /> Chương/Phần
                </TabsTrigger>
              </TabsList>

              <div className="relative w-64">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Tìm kiếm..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
            </div>

            <TabsContent value="topics" className="flex-1 overflow-auto mt-0 border rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Tên chủ đề</TableHead>
                    <TableHead>Mô tả</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : filteredTopics.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                        Không có chủ đề nào.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTopics.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-mono text-xs">#{t.id}</TableCell>
                        <TableCell className="font-medium">{t.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {t.description || "---"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => setTopicToEdit(t)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setTopicToDelete(t)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>

            <TabsContent value="sections" className="flex-1 overflow-auto mt-0 flex flex-col gap-4">
              <div className="flex items-center gap-4 p-4 border rounded-md bg-muted/30">
                <div className="text-sm font-medium shrink-0">Lọc theo chủ đề:</div>
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                >
                  <option value="all">Tất cả chủ đề</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="border rounded-md flex-1 overflow-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>Tên chương</TableHead>
                      <TableHead>Chủ đề</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center">
                          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                        </TableCell>
                      </TableRow>
                    ) : filteredSections.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                          {selectedTopicId === "all" ? "Không có chương nào." : "Chủ đề này chưa có chương nào."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredSections.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-mono text-xs">#{s.id}</TableCell>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell>
                            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                              {topics.find(t => t.id === s.topic_id)?.name || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={() => setSectionToEdit(s)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                onClick={() => setSectionToDelete(s)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* EDIT MODALS */}
      <AddTopicDialog 
        open={!!topicToEdit}
        onOpenChange={(open) => !open && setTopicToEdit(null)}
        topicToEdit={topicToEdit}
        onSuccess={() => {
          fetchTopics();
          onRefresh();
        }}
      />

      <AddSectionDialog
        open={!!sectionToEdit}
        onOpenChange={(open) => !open && setSectionToEdit(null)}
        sectionToEdit={sectionToEdit}
        onSuccess={() => {
          fetchSections(selectedTopicId);
          onRefresh();
        }}
      />

      {/* DELETE CONFIRMATIONS */}
      <AlertDialog open={!!topicToDelete} onOpenChange={(open) => !open && setTopicToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận xóa chủ đề?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đang sắp xóa chủ đề <strong>"{topicToDelete?.name}"</strong>. 
              Hành động này sẽ xóa <strong>TẤT CẢ</strong> các chương và câu hỏi thuộc chủ đề này.
              Điều này không thể hoàn tác!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTopic} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Tôi hiểu, hãy xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!sectionToDelete} onOpenChange={(open) => !open && setSectionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Xác nhận xóa chương?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn đang sắp xóa chương <strong>"{sectionToDelete?.name}"</strong>. 
              Hành động này sẽ xóa <strong>TẤT CẢ</strong> các câu hỏi thuộc chương này.
              Điều này không thể hoàn tác!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSection} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Tôi hiểu, hãy xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
