"use client";

import { useEffect, useRef, useState } from "react";
// @ts-ignore
import renderMathInElement from "katex/dist/contrib/auto-render.js";
import "katex/dist/katex.min.css";

interface RichTextDisplayProps {
  content: string;
  className?: string;
}

export default function RichTextDisplay({ content, className = "" }: RichTextDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && containerRef.current && content) {
      // Decode content if it looks escaped
      let targetContent = content;
      if (typeof content === 'string' && (content.includes("&lt;") || content.includes("&gt;"))) {
        const txt = document.createElement("textarea");
        txt.innerHTML = content;
        targetContent = txt.value;
      }

      // Update the innerHTML manually to be sure
      containerRef.current.innerHTML = targetContent;

      try {
        renderMathInElement(containerRef.current, {
          delimiters: [
            { left: "$$", right: "$$", display: true },
            { left: "$", right: "$", display: false },
            { left: "\\(", right: "\\)", display: false },
            { left: "\\[", right: "\\]", display: true },
          ],
          throwOnError: false,
        });
      } catch (err) {
        console.error("KaTeX render error:", err);
      }
    }
  }, [content, mounted]);

  if (!content) return null;

  return (
    <div 
      ref={containerRef}
      className={`tiptap-content prose prose-sm dark:prose-invert max-w-none break-words min-h-[1em] ${className}`}
    />
  );
}
