"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface NotificationItem {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export function NotificationBell() {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!token) return;

    // Connect to SSE stream
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081/api/v1";
    const eventSource = new EventSource(`${baseUrl}/notifications/stream?token=${token}`);

    eventSource.onopen = () => {
      console.log(`SSE Connected: Đã kết nối lắng nghe quả chuông (ID của bạn đang là: ${user?.id})`);
    };

    eventSource.onmessage = (event) => {
      try {
        console.log("SSE Message Received:", event.data);
        const data = JSON.parse(event.data);
        const newItem: NotificationItem = {
          id: Date.now().toString() + Math.random().toString(),
          type: data.type || "INFO",
          message: data.message,
          timestamp: data.timestamp || new Date().toISOString(),
          read: false,
        };

        setNotifications((prev) => [newItem, ...prev]);
        setUnreadCount((prev) => prev + 1);

        if (data.type === "VIOLATION") {
          toast.error(`🔔 Cảnh báo: ${data.message}`, {
            description: `Thời gian: ${new Date(newItem.timestamp).toLocaleTimeString()}`,
            duration: 10000,
          });
        } else {
          toast.info(`💡 Thông báo: ${data.message}`);
        }
      } catch (err) {
        console.error("Error parsing notification:", err);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error:", error);
    };

    return () => {
      eventSource.close();
    };
  }, [token]);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  if (!user) return null;

  return (
    <DropdownMenu onOpenChange={(open) => { if (open) markAllAsRead() }}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Bell className="h-[1.2rem] w-[1.2rem] transition-all" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center p-1 rounded-full text-xs"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
          <span className="sr-only">Thông báo</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Thông báo</span>
          {unreadCount > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              ({unreadCount} chưa đọc)
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <ScrollArea className="h-72">
          {notifications.length === 0 ? (
            <div className="flex justify-center items-center h-full py-10 px-4 text-center text-sm text-muted-foreground">
              Bạn chưa có thông báo nào.
            </div>
          ) : (
            <div className="flex flex-col gap-1 p-1">
              {notifications.map((n) => (
                <div key={n.id} className="flex flex-col space-y-1 p-2 bg-muted/30 rounded-md mb-1 border-b pb-2 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <span className={`text-sm font-medium ${n.type === 'VIOLATION' ? 'text-red-500' : 'text-primary'}`}>
                      {n.type === 'VIOLATION' ? "Cảnh Báo Vi Phạm" : "Thông Báo"}
                    </span>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap ml-2">
                      {new Date(n.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {n.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
