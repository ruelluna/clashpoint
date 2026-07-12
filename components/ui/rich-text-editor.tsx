'use client'

import {
  Box,
  Button,
  ButtonGroup,
  Dialog,
  Input,
  Portal,
} from '@chakra-ui/react'
import Link from '@tiptap/extension-link'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useRef, useState } from 'react'

import { RichTextEditorToolbar } from '@/components/ui/rich-text-editor-toolbar'

type RichTextEditorProps = {
  name: string
  defaultValue?: string | null
  placeholder?: string
}

const editorContentClass = 'rich-text-editor-content outline-none'

export function RichTextEditor({
  name,
  defaultValue = '',
  placeholder = 'Write registration rules…',
}: RichTextEditorProps) {
  const [html, setHtml] = useState(defaultValue ?? '')
  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('https://')
  const inputRef = useRef<HTMLInputElement>(null)
  const linkInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content: defaultValue ?? '',
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    onUpdate: ({ editor: current }) => {
      syncHtml(current.getHTML())
    },
    editorProps: {
      attributes: {
        class: editorContentClass,
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

  function openLinkDialog() {
    if (!editor) return

    const previousUrl = editor.getAttributes('link').href as string | undefined
    setLinkUrl(previousUrl?.trim() ? previousUrl : 'https://')
    setLinkDialogOpen(true)
  }

  function saveLink() {
    if (!editor) return

    const trimmed = linkUrl.trim()
    if (!trimmed) {
      runToolbarCommand(() => {
        editor.chain().focus().extendMarkRange('link').unsetLink().run()
      })
    } else {
      runToolbarCommand(() => {
        editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run()
      })
    }

    setLinkDialogOpen(false)
  }

  function removeLink() {
    if (!editor) return

    runToolbarCommand(() => {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
    })
    setLinkDialogOpen(false)
  }

  return (
    <Box>
      <input ref={inputRef} type="hidden" name={name} defaultValue={html} />
      <Box
        borderWidth="1px"
        borderColor="border"
        borderRadius="md"
        bg="bg"
        overflow="hidden"
        colorPalette="blue"
        _focusWithin={{
          borderColor: 'colorPalette.solid',
          boxShadow: '0 0 0 1px var(--chakra-colors-color-palette-solid)',
        }}
      >
        <RichTextEditorToolbar
          editor={editor}
          onLinkClick={openLinkDialog}
          onCommand={runToolbarCommand}
        />
        <Box px={3} py={2.5} minH="8rem">
          <EditorContent editor={editor} />
        </Box>
      </Box>

      <Dialog.Root
        lazyMount
        open={linkDialogOpen}
        initialFocusEl={() => linkInputRef.current}
        onOpenChange={(details) => setLinkDialogOpen(details.open)}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="md">
              <Dialog.Header>
                <Dialog.Title>Insert link</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Input
                  ref={linkInputRef}
                  type="url"
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={(event) => setLinkUrl(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      saveLink()
                    }
                  }}
                />
              </Dialog.Body>
              <Dialog.Footer>
                <ButtonGroup>
                  <Dialog.ActionTrigger asChild>
                    <Button variant="outline">Cancel</Button>
                  </Dialog.ActionTrigger>
                  <Button variant="outline" onClick={removeLink}>
                    Remove link
                  </Button>
                  <Button onClick={saveLink}>Save</Button>
                </ButtonGroup>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  )
}
