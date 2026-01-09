"use client"

import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useEffect, useRef } from "react"
import { Palette } from "lucide-react"

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

const TEXT_COLORS = [ { name: "أسود", value: "#000000" }, { name: "أبيض", value: "#FFFFFF" }, { name: "رمادي", value: "#6B7280" }, { name: "أحمر", value: "#DC2626" }, { name: "برتقالي", value: "#EA580C" }, { name: "أصفر", value: "#CA8A04" }, { name: "أخضر", value: "#16A34A" }, { name: "أزرق", value: "#2563EB" }, { name: "بنفسجي", value: "#9333EA" }, { name: "وردي", value: "#DB2777" }, { name: "سماوي", value: "#0891B2" },  { name: "ذهبي", value: "#B45309" },
]

export function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const isInitialMount = useRef(true)
  const lastContent = useRef(content)
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Link.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      lastContent.current = html
      onChange(html)
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none focus:outline-none min-h-[200px] p-4 bg-muted text-foreground rounded-b-lg",
        dir: "rtl",
        contenteditable: "true",
      },
    },
  })

  useEffect(() => {
    if (editor) {
      // Only set content if it's initial mount or content changed externally (not from user typing)
      if (isInitialMount.current) {
        isInitialMount.current = false
        if (content && content !== editor.getHTML()) {
          editor.commands.setContent(content)
        }
      } else if (content !== lastContent.current && content !== editor.getHTML()) {
        // Content changed externally (e.g., form reset)
        editor.commands.setContent(content)
        lastContent.current = content
      }
    }
  }, [content, editor])

  if (!editor) return null 
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="bg-card border-b border-border p-2 flex flex-wrap gap-1">
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("bold") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="font-bold"
        >
          B
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("italic") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="italic"
        >
          I
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("underline") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="underline"
        >
          U
        </Button>
        <div className="w-px h-8 bg-border mx-1" />
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" size="sm" variant="ghost" className="relative">
              <Palette className="h-4 w-4" />
              <span
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full"
                style={{ backgroundColor: editor.getAttributes("textStyle").color || "#000000" }}
              />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2" align="start">
            <div className="grid grid-cols-4 gap-1">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.name}
                  className="w-8 h-8 rounded-md border border-border hover:scale-110 transition-transform"
                  style={{ backgroundColor: color.value }}
                  onClick={() => editor.chain().focus().setColor(color.value).run()}
                />
              ))}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="w-full mt-2 text-xs"
              onClick={() => editor.chain().focus().unsetColor().run()}
            >
              إزالة اللون
            </Button>
          </PopoverContent>
        </Popover>
        <div className="w-px h-8 bg-border mx-1" />
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("heading", { level: 3 }) ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </Button>
        <div className="w-px h-8 bg-border mx-1" />
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("bulletList") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          •
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("orderedList") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1.
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive("blockquote") ? "default" : "ghost"}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          "
        </Button>
        <div className="w-px h-8 bg-border mx-1" />
        <Button
          type="button"
          size="sm"
          variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <span className="material-icons-outlined text-sm">format_align_right</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <span className="material-icons-outlined text-sm">format_align_center</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <span className="material-icons-outlined text-sm">format_align_left</span>
        </Button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  )
}

