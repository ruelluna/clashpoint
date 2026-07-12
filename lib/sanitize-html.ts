const ALLOWED_TAGS = new Set([
  'p',
  'strong',
  'b',
  'em',
  'i',
  'ul',
  'ol',
  'li',
  'a',
  'br',
  'h2',
  'h3',
  'blockquote',
  's',
  'del',
])

export function sanitizeHtml(html: string | null | undefined): string {
  if (!html?.trim()) return ''

  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag: string) => {
      const normalized = tag.toLowerCase()
      if (!ALLOWED_TAGS.has(normalized)) return ''
      if (normalized === 'a') {
        return match
          .replace(/href\s*=\s*"(?!https?:|mailto:)[^"]*"/gi, 'href="#"')
          .replace(/href\s*=\s*'(?!https?:|mailto:)[^']*'/gi, "href='#'")
      }
      return match.replace(/\s+(style|class|id)=("[^"]*"|'[^']*')/gi, '')
    })
}
