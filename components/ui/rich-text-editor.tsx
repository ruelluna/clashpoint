'use client'

import { Box, Button, Flex } from '@chakra-ui/react'
import Link from '@tiptap/extension-link'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef, useState } from 'react'

type RichTextEditorProps = {
  name: string
  defaultValue?: string | null
  placeholder?: string
}

const editorSurfaceClass =
  'min-h-32 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring'

export function RichTextEditor({
  name,
  defaultValue = '',
  placeholder = 'Write registration rules…',
}: RichTextEditorProps) {
  const [html, setHtml] = useState(defaultValue ?? '')
  const inputRef = useRef<HTMLInputElement>(null)

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
      syncHtml(current.getHTML())
    },
    editorProps: {
      attributes: {
        class: editorSurfaceClass,
        'data-placeholder': placeholder,
      },
    },
  })

  function syncHtml(nextHtml: string) {
    setHtml(nextHtml)
    if (inputRef.current) {
      inputRef.current.value = nextHtml
    }
  }

  function runToolbarCommand(command: () => void) {
    command()
    if (editor) {
      syncHtml(editor.getHTML())
    }
  }

  useEffect(() => {
    if (!editor) return
    const next = defaultValue ?? ''
    if (editor.getHTML() !== next) {
      editor.commands.setContent(next, { emitUpdate: false })
      syncHtml(next)
    }
  }, [defaultValue, editor])

  useEffect(() => {
    if (!editor) return

    const handleBlur = () => syncHtml(editor.getHTML())
    editor.on('blur', handleBlur)

    return () => {
      editor.off('blur', handleBlur)
    }
  }, [editor])

  useEffect(() => {
    if (!editor || !inputRef.current) return

    const form = inputRef.current.closest('form')
    if (!form) return

    const handleSubmit = () => syncHtml(editor.getHTML())
    form.addEventListener('submit', handleSubmit)

    return () => {
      form.removeEventListener('submit', handleSubmit)
    }
  }, [editor])

  function toggleLink() {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL', previousUrl ?? 'https://')

    if (url === null) return

    if (url.trim() === '') {
      runToolbarCommand(() => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
      })
      return
    }

    runToolbarCommand(() => {
      editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
    })
  }

  return (
    <Box>
      <input ref={inputRef} type="hidden" name={name} defaultValue={html} />
      <Flex gap={1} mb={2} wrap="wrap">
        <Button
          type="button"
          size="xs"
          variant={editor?.isActive('bold') ? 'solid' : 'outline'}
          onClick={() =>
            runToolbarCommand(() => {
              editor?.chain().focus().toggleBold().run()
            })
          }
        >
          Bold
        </Button>
        <Button
          type="button"
          size="xs"
          variant={editor?.isActive('italic') ? 'solid' : 'outline'}
          onClick={() =>
            runToolbarCommand(() => {
              editor?.chain().focus().toggleItalic().run()
            })
          }
        >
          Italic
        </Button>
        <Button
          type="button"
          size="xs"
          variant={editor?.isActive('bulletList') ? 'solid' : 'outline'}
          onClick={() =>
            runToolbarCommand(() => {
              editor?.chain().focus().toggleBulletList().run()
            })
          }
        >
          Bullets
        </Button>
        <Button
          type="button"
          size="xs"
          variant={editor?.isActive('orderedList') ? 'solid' : 'outline'}
          onClick={() =>
            runToolbarCommand(() => {
              editor?.chain().focus().toggleOrderedList().run()
            })
          }
        >
          Numbered
        </Button>
        <Button
          type="button"
          size="xs"
          variant={editor?.isActive('link') ? 'solid' : 'outline'}
          onClick={toggleLink}
        >
          Link
        </Button>
      </Flex>
      <EditorContent editor={editor} />
    </Box>
  )
}
