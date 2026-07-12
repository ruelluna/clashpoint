'use client'

import {
  Box,
  Flex,
  Icon,
  IconButton,
  NativeSelect,
  Separator,
  Tooltip,
} from '@chakra-ui/react'
import type { Editor } from '@tiptap/react'
import {
  BoldIcon,
  ItalicIcon,
  LinkIcon,
  ListIcon,
  ListOrderedIcon,
  QuoteIcon,
  Redo2Icon,
  StrikethroughIcon,
  Undo2Icon,
} from 'lucide-react'

type RichTextEditorToolbarProps = {
  editor: Editor | null
  onLinkClick: () => void
  onCommand: (command: () => void) => void
}

type ToolbarButtonProps = {
  label: string
  isActive?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}

function ToolbarButton({
  label,
  isActive = false,
  disabled = false,
  onClick,
  children,
}: ToolbarButtonProps) {
  return (
    <Tooltip.Root positioning={{ placement: 'top' }}>
      <Tooltip.Trigger asChild>
        <IconButton
          type="button"
          size="xs"
          variant={isActive ? 'solid' : 'ghost'}
          colorPalette={isActive ? 'blue' : 'gray'}
          aria-label={label}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </IconButton>
      </Tooltip.Trigger>
      <Tooltip.Positioner>
        <Tooltip.Content>{label}</Tooltip.Content>
      </Tooltip.Positioner>
    </Tooltip.Root>
  )
}

function ToolbarDivider() {
  return (
    <Separator orientation="vertical" height="5" alignSelf="center" mx={0.5} />
  )
}

function getHeadingValue(editor: Editor | null): string {
  if (!editor) return 'paragraph'
  if (editor.isActive('heading', { level: 2 })) return 'h2'
  if (editor.isActive('heading', { level: 3 })) return 'h3'
  return 'paragraph'
}

export function RichTextEditorToolbar({
  editor,
  onLinkClick,
  onCommand,
}: RichTextEditorToolbarProps) {
  const headingValue = getHeadingValue(editor)

  function setHeading(value: string) {
    if (!editor) return

    if (value === 'paragraph') {
      onCommand(() => {
        editor.chain().focus().setParagraph().run()
      })
      return
    }

    const level = value === 'h2' ? 2 : 3
    onCommand(() => {
      editor.chain().focus().setHeading({ level }).run()
    })
  }

  return (
    <Flex
      gap={0.5}
      wrap="wrap"
      align="center"
      px={2}
      py={1.5}
      borderBottomWidth="1px"
      borderColor="border"
      bg="bg.subtle"
    >
      <NativeSelect.Root size="xs" width="auto" minW="7.5rem">
        <NativeSelect.Field
          aria-label="Heading"
          value={headingValue}
          onChange={(event) => setHeading(event.target.value)}
        >
          <option value="paragraph">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </NativeSelect.Field>
      </NativeSelect.Root>

      <ToolbarDivider />

      <ToolbarButton
        label="Bold"
        isActive={editor?.isActive('bold')}
        disabled={!editor}
        onClick={() =>
          onCommand(() => {
            editor?.chain().focus().toggleBold().run()
          })
        }
      >
        <Icon asChild boxSize={3.5}>
          <BoldIcon />
        </Icon>
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        isActive={editor?.isActive('italic')}
        disabled={!editor}
        onClick={() =>
          onCommand(() => {
            editor?.chain().focus().toggleItalic().run()
          })
        }
      >
        <Icon asChild boxSize={3.5}>
          <ItalicIcon />
        </Icon>
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        isActive={editor?.isActive('strike')}
        disabled={!editor}
        onClick={() =>
          onCommand(() => {
            editor?.chain().focus().toggleStrike().run()
          })
        }
      >
        <Icon asChild boxSize={3.5}>
          <StrikethroughIcon />
        </Icon>
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Bullets"
        isActive={editor?.isActive('bulletList')}
        disabled={!editor}
        onClick={() =>
          onCommand(() => {
            editor?.chain().focus().toggleBulletList().run()
          })
        }
      >
        <Icon asChild boxSize={3.5}>
          <ListIcon />
        </Icon>
      </ToolbarButton>
      <ToolbarButton
        label="Numbered"
        isActive={editor?.isActive('orderedList')}
        disabled={!editor}
        onClick={() =>
          onCommand(() => {
            editor?.chain().focus().toggleOrderedList().run()
          })
        }
      >
        <Icon asChild boxSize={3.5}>
          <ListOrderedIcon />
        </Icon>
      </ToolbarButton>
      <ToolbarButton
        label="Blockquote"
        isActive={editor?.isActive('blockquote')}
        disabled={!editor}
        onClick={() =>
          onCommand(() => {
            editor?.chain().focus().toggleBlockquote().run()
          })
        }
      >
        <Icon asChild boxSize={3.5}>
          <QuoteIcon />
        </Icon>
      </ToolbarButton>

      <ToolbarDivider />

      <ToolbarButton
        label="Link"
        isActive={editor?.isActive('link')}
        disabled={!editor}
        onClick={onLinkClick}
      >
        <Icon asChild boxSize={3.5}>
          <LinkIcon />
        </Icon>
      </ToolbarButton>

      <Box flex="1" minW={2} />

      <ToolbarButton
        label="Undo"
        disabled={!editor?.can().undo()}
        onClick={() =>
          onCommand(() => {
            editor?.chain().focus().undo().run()
          })
        }
      >
        <Icon asChild boxSize={3.5}>
          <Undo2Icon />
        </Icon>
      </ToolbarButton>
      <ToolbarButton
        label="Redo"
        disabled={!editor?.can().redo()}
        onClick={() =>
          onCommand(() => {
            editor?.chain().focus().redo().run()
          })
        }
      >
        <Icon asChild boxSize={3.5}>
          <Redo2Icon />
        </Icon>
      </ToolbarButton>
    </Flex>
  )
}
