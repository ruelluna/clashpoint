import { describe, expect, it } from 'vitest'

import { sanitizeHtml } from '@/lib/sanitize-html'

describe('sanitizeHtml', () => {
  it('returns empty string for null, undefined, or blank input', () => {
    expect(sanitizeHtml(null)).toBe('')
    expect(sanitizeHtml(undefined)).toBe('')
    expect(sanitizeHtml('   ')).toBe('')
  })

  it('preserves allowed formatting tags', () => {
    const input = '<p><strong>Bold</strong> and <em>italic</em></p>'
    expect(sanitizeHtml(input)).toContain('<strong>Bold</strong>')
    expect(sanitizeHtml(input)).toContain('<em>italic</em>')
  })

  it('preserves ordered and unordered lists', () => {
    const input = '<ul><li>One</li></ul><ol><li>First</li></ol>'
    const result = sanitizeHtml(input)

    expect(result).toContain('<ul>')
    expect(result).toContain('<li>One</li>')
    expect(result).toContain('<ol>')
    expect(result).toContain('<li>First</li>')
  })

  it('preserves safe links and strips unsafe href values', () => {
    const safe = '<a href="https://example.com">Rules</a>'
    expect(sanitizeHtml(safe)).toContain('href="https://example.com"')

    const unsafe = '<a href="javascript:alert(1)">Bad</a>'
    expect(sanitizeHtml(unsafe)).not.toContain('javascript:')
  })

  it('removes script tags and event handlers', () => {
    const input =
      '<p>Hello</p><script>alert("xss")</script><img onerror="alert(1)" src="x">'
    const result = sanitizeHtml(input)

    expect(result).not.toContain('<script')
    expect(result).not.toContain('onerror')
    expect(result).toContain('Hello')
  })

  it('strips disallowed tags such as headings and images', () => {
    const input = '<h1>Title</h1><p>Text</p><img src="x" alt="y">'
    const result = sanitizeHtml(input)

    expect(result).not.toContain('<h1')
    expect(result).not.toContain('<img')
    expect(result).toContain('<p>Text</p>')
  })

  it('removes style, class, and id attributes from allowed tags', () => {
    const input = '<p class="evil" style="color:red" id="x">Safe</p>'
    const result = sanitizeHtml(input)

    expect(result).not.toContain('class=')
    expect(result).not.toContain('style=')
    expect(result).not.toContain('id=')
    expect(result).toContain('Safe')
  })
})
