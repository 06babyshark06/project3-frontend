// components/ExamAntiCheat.tsx (MỚI)
"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

export function ExamAntiCheat({ 
  examId, 
  onViolation, 
  maxViolations = 3 
}: {
  examId: number;
  onViolation: () => void;
  maxViolations?: number;
}) {
  const [violations, setViolations] = useState(0);

  useEffect(() => {
    const preventDevTools = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "J") ||
        (e.ctrlKey && e.key === "U")
      ) {
        e.preventDefault();
        handleViolation("devtools_attempt");
      }
    };

    let windowHeight = window.innerHeight;
    const detectResize = () => {
      if (Math.abs(window.innerHeight - windowHeight) > 100) {
        handleViolation("devtools_resize");
        windowHeight = window.innerHeight;
      }
    };

    const handleBlur = () => {
      handleViolation("window_blur");
    };

    const preventCopy = (e: Event) => {
      e.preventDefault();
      toast.error("Không được phép copy nội dung!");
    };

    const preventPaste = (e: Event) => {
      e.preventDefault();
      toast.error("Không được phép paste!");
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.error("Chuột phải bị vô hiệu hóa!");
    };

    const preventPrintScreen = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        navigator.clipboard.writeText("");
        toast.error("Chụp màn hình bị vô hiệu hóa!");
      }
    };

    const handleViolation = (type: string) => {
      const newCount = violations + 1;
      setViolations(newCount);

      toast.error(`⚠️ Vi phạm quy định thi (${newCount}/${maxViolations})`, {
        description: `Hành vi: ${getViolationMessage(type)}`,
        duration: 5000,
      });

      logViolationToServer(type);

      if (newCount >= maxViolations) {
        toast.error("Vượt quá số lần vi phạm! Bài thi sẽ tự động nộp.", {
          duration: 10000,
        });
        onViolation();
      }
    };

    document.addEventListener("keydown", preventDevTools);
    document.addEventListener("keydown", preventPrintScreen);
    window.addEventListener("resize", detectResize);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("copy", preventCopy);
    document.addEventListener("paste", preventPaste);
    document.addEventListener("contextmenu", preventContextMenu);

    document.documentElement.requestFullscreen?.();

    return () => {
      document.removeEventListener("keydown", preventDevTools);
      document.removeEventListener("keydown", preventPrintScreen);
      window.removeEventListener("resize", detectResize);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("copy", preventCopy);
      document.removeEventListener("paste", preventPaste);
      document.removeEventListener("contextmenu", preventContextMenu);
      
      document.exitFullscreen?.();
    };
  }, [violations, maxViolations]);

  const getViolationMessage = (type: string) => {
    const messages: Record<string, string> = {
      devtools_attempt: "Cố mở DevTools",
      devtools_resize: "Thay đổi kích thước cửa sổ bất thường",
      window_blur: "Chuyển tab/cửa sổ khác",
      tab_switch: "Chuyển tab trình duyệt",
    };
    return messages[type] || "Hành vi không rõ";
  };

  const logViolationToServer = async (type: string) => {
    try {
      await fetch("/api/v1/exams/log-violation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_id: examId, violation_type: type }),
      });
    } catch (error) {
      console.error("Failed to log violation:", error);
    }
  };

  return (
    <div className="fixed top-20 right-4 z-50">
      {violations > 0 && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded shadow-lg">
          <p className="font-bold">⚠️ Vi phạm: {violations}/{maxViolations}</p>
        </div>
      )}
    </div>
  );
}