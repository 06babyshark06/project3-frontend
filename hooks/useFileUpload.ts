// hooks/useFileUpload.ts
import { useState } from "react";
import axios from "axios";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface UseFileUploadReturn {
  uploadFile: (file: File, folder: "lessons" | "questions") => Promise<string | null>;
  isUploading: boolean;
  progress: number;
}

export function useFileUpload(): UseFileUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, folder: "lessons" | "questions") => {
    setIsUploading(true);
    setProgress(0);

    try {
      const endpoint = folder === "lessons" ? "/lessons/upload-url" : "/questions/upload-url";
      
      const res = await api.post(endpoint, {
        file_name: file.name,
        content_type: file.type,
        folder: folder
      });

      const { upload_url, final_url } = res.data.data;

      await axios.put(upload_url, file, {
        headers: {
          "Content-Type": file.type,
        },
        onUploadProgress: (p) => {
          const percent = p.total ? Math.round((p.loaded * 100) / p.total) : 0;
          setProgress(percent);
        },
      });

      return final_url as string;

    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Upload thất bại. Vui lòng thử lại.");
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { uploadFile, isUploading, progress };
}