'use client'

import { Box, Button, Flex } from '@chakra-ui/react'
import Link from '@tiptap/extension-link'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useState } from 'react'

type RichTextEditorProps = {
  name: string
  defaultValue?: string | null
  placeholder?: string
}

export function RichTextEditor({
  name,
  defaultValue = '',
  placeholder = 'Write registration rules…',
}: RichTextEditorProps) {
  const [html, setHtml] = useState(defaultValue ?? '')

  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content: defaultValue ?? '',
    immediatelyRender: false,
    onUpdate: ({ editor: current }) => {
      setHtml(current.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'min-h-32 rounded-md border border-border bg-bg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring',
        'data-placeholder': placeholder,
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    const next = defaultValue ?? ''
    if (editor.getHTML() !== next) {
      editor.commands.setContent(next, { emitUpdate: false })
      setHtml(next)
    }
  }, [defaultValue, editor])

  return (
    <Box>
      <input type="hidden" name={name} value={html} readOnly />
      <Flex gap={1} mb={2} wrap="wrap">
        <Button
          type="button"
          size="xs"
          variant={editor?.isActive('bold') ? 'solid' : 'outline'}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          Bold
        </Button>
        <Button
          type="button"
          size="xs"
          variant={editor?.isActive('italic') ? 'solid' : 'outline'}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          Italic
        </Button>
        <Button
          type="button"
          size="xs"
          variant={editor?.isActive('bulletList') ? 'solid' : 'outline'}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          Bullets
        </Button>
        <Button
          type="button"
          size="xs"
          variant={editor?.isActive('orderedList') ? 'solid' : 'outline'}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          Numbered
        </Button>
      </Flex>
      <EditorContent editor={editor} />
    </Box>
  )
}
