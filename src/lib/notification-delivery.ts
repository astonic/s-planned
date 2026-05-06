import nodemailer from 'nodemailer8'
import type { OrganizationSettings, ProjectNotificationChannel } from '@prisma/client'

type DeliveryInput = {
  channel: ProjectNotificationChannel
  settings: OrganizationSettings | null
  toName: string
  toEmail: string | null
  toPhone: string | null
  subject: string
  body: string
}

function normalizeWhatsappNumber(phone: string) {
  const trimmed = phone.trim()
  const withoutPrefix = trimmed.startsWith('+') ? trimmed.slice(1) : trimmed
  return withoutPrefix.replace(/[^\d]/g, '')
}

async function sendEmail(input: DeliveryInput) {
  const settings = input.settings
  if (!input.toEmail) throw new Error('Recipient does not have an email address.')
  if (!settings?.smtpHost || !settings.smtpPort || !settings.smtpFrom) {
    throw new Error('Email is not configured for this organization.')
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    auth: settings.smtpUser
      ? {
          user: settings.smtpUser,
          pass: settings.smtpPassword ?? '',
        }
      : undefined,
  })

  await transporter.sendMail({
    from: settings.smtpFromName ? `"${settings.smtpFromName}" <${settings.smtpFrom}>` : settings.smtpFrom,
    to: input.toEmail,
    subject: input.subject,
    text: input.body,
  })
}

async function sendWhatsApp(input: DeliveryInput) {
  const settings = input.settings
  if (!input.toPhone) throw new Error('Recipient does not have a phone number.')
  if (!settings?.whatsappEnabled || !settings.whatsappPhoneNumberId || !settings.whatsappAccessToken) {
    throw new Error('WhatsApp is not configured for this organization.')
  }

  const response = await fetch(
    `https://graph.facebook.com/v19.0/${settings.whatsappPhoneNumberId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${settings.whatsappAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: normalizeWhatsappNumber(input.toPhone),
        type: 'text',
        text: {
          preview_url: false,
          body: input.body,
        },
      }),
    },
  )

  if (!response.ok) {
    let detail = response.statusText
    try {
      const payload = await response.json()
      detail = payload?.error?.message ?? detail
    } catch {
      // Keep the HTTP status text if the provider response is not JSON.
    }
    throw new Error(`WhatsApp delivery failed: ${detail}`)
  }
}

export async function deliverProjectNotification(input: DeliveryInput) {
  if (input.channel === 'email') {
    await sendEmail(input)
    return
  }

  await sendWhatsApp(input)
}
