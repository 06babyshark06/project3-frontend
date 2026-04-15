"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export function NotificationListener() {
    const { token } = useAuth(); // Assume we need the token from context to connect

    useEffect(() => {
        if (!token) return;

        // Note: EventSource doesn't support custom headers (like Authorization: Bearer ...)
        // We either pass token in query param or we use a polyfill/fetch API.
        // For simplicity, passing token natively via url is a common pattern for SSE.
        // If your gateway supports it, we append `?token=`
        
        const eventSource = new EventSource(`http://localhost:8081/api/v1/notifications/stream?token=${token}`);

        eventSource.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.type === "VIOLATION") {
                    toast.error(`🔔 Cảnh báo: ${data.message}`, {
                        description: `Thời gian: ${new Date(data.timestamp).toLocaleTimeString()}`,
                        duration: 10000,
                    });
                } else if (data.type === "INFO") {
                    toast.info(`💡 Thông báo: ${data.message}`);
                }
            } catch (err) {
                console.error("Error parsing notification:", err);
            }
        };

        eventSource.onerror = (error) => {
            console.error("SSE Error:", error);
            // Will automatically try to reconnect
        };

        return () => {
            eventSource.close();
        };

    }, [token]);

    return null; // This component does not render anything visually
}
