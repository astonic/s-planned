import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'S-Planned — Operational Readiness Platform',
  description: 'Plan, track, and evidence operational readiness activities.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ height: '100%' }}>{children}</body>
    </html>
  )
}
