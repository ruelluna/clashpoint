import 'server-only'

type SendEmailInput = {
  to: string
  subject: string
  text: string
}

export async function sendRegistrationEmail(
  input: SendEmailInput
): Promise<{ error?: string }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.REGISTRATION_EMAIL_FROM

  if (!apiKey || !from) {
    return { error: 'Email delivery is not configured' }
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      text: input.text,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    return { error: body || 'Failed to send verification email' }
  }

  return {}
}
