"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { MathExtension } from "@aarkue/tiptap-math-extension";
import { all, createLowlight } from "lowlight";
import { 
  Bold, Italic, List, ListOrdered, Quote, Undo, Redo, 
  Code, Type, AlignLeft, AlignCenter, AlignRight, 
  Highlighter, Link as LinkIcon, Sigma, Binary
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

const lowlight = createLowlight(all);

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
  minHeight?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 p-1 border-b bg-muted/20">
      <Button
        variant="ghost" size="sm" type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? "bg-accent" : ""}
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost" size="sm" type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? "bg-accent" : ""}
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost" size="sm" type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={editor.isActive("underline") ? "bg-accent" : ""}
      >
        <Type className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1 my-auto" />

      <Button
        variant="ghost" size="sm" type="button"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={editor.isActive({ textAlign: "left" }) ? "bg-accent" : ""}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost" size="sm" type="button"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={editor.isActive({ textAlign: "center" }) ? "bg-accent" : ""}
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost" size="sm" type="button"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={editor.isActive({ textAlign: "right" }) ? "bg-accent" : ""}
      >
        <AlignRight className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1 my-auto" />

      <Button
        variant="ghost" size="sm" type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive("bulletList") ? "bg-accent" : ""}
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost" size="sm" type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive("orderedList") ? "bg-accent" : ""}
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-6 bg-border mx-1 my-auto" />

      <Button
        variant="ghost" size="sm" type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive("codeBlock") ? "bg-accent" : ""}
        title="Code Block"
      >
        <Binary className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost" size="sm" type="button"
        onClick={() => {
          // Mathematics extension handles typing $...$ or $$...$$
          // But we can also provide a button to insert placeholders
          editor.chain().focus().insertContent("$x = $").run();
        }}
        title="Math Formula (or type $...$)"
      >
        <Sigma className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1 my-auto" />

      <Button
        variant="ghost" size="sm" type="button"
        onClick={() => editor.chain().focus().undo().run()}
      >
        <Undo className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost" size="sm" type="button"
        onClick={() => editor.chain().focus().redo().run()}
      >
        <Redo className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default function RichTextEditor({ content, onChange, placeholder, minHeight = "120px" }: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: false, // Disable default codeBlock to use lowlight
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight,
      CodeBlockLowlight.configure({
        lowlight,
      }),
      MathExtension,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm dark:prose-invert max-w-none focus:outline-none p-4 tiptap`,
        style: `min-height: ${minHeight};`,
      },
    },
  });

  // Sync content if it changes externally (e.g. when loading for edit)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="border rounded-md overflow-hidden bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 transition-all">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
