import React from 'react';
import { X } from "lucide-react";

interface MediaRendererProps {
  url?: string;
  onRemove?: () => void;
  className?: string;
}

export function MediaRenderer({ url, onRemove, className = "" }: MediaRendererProps) {
  if (!url) return null;

  const isImage = url.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i);
  const isVideo = url.match(/\.(mp4|webm|mov)$/i);
  const isAudio = url.match(/\.(mp3|wav|ogg|flac)$/i);

  return (
    <div className={`relative inline-block group mt-2 w-full ${className}`}>
      {isImage ? (
        <img 
            src={url} 
            alt="Attachment Preview" 
            className="md:max-h-[300px] max-h-[200px] w-auto max-w-full rounded-md border object-contain bg-muted mx-auto" 
        />
      ) : isVideo ? (
        <video 
            src={url} 
            controls 
            className="md:max-h-[300px] max-h-[200px] w-auto max-w-full rounded-md border bg-black mx-auto" 
        />
      ) : isAudio ? (
        <audio 
            src={url} 
            controls 
            className="w-full max-w-sm rounded-md mx-auto" 
        />
      ) : (
        <div className="p-3 border rounded bg-muted text-sm break-all max-w-[300px] mx-auto text-center">
            📄 {url.split('/').pop()}
        </div>
      )}
      
      {onRemove && (
        <button
          type="button"
          className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10 hover:bg-red-600 focus:opacity-100"
          onClick={onRemove}
          title="Xóa đính kèm"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
