import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'S-Planned — Operational Readiness Platform',
  description: 'Plan, track, and evidence operational readiness activities.',
  icons: {
    icon: [
      { url: '/files/s-planned-favicon-16.svg', sizes: '16x16', type: 'image/svg+xml' },
      { url: '/files/s-planned-favicon-32.svg', sizes: '32x32', type: 'image/svg+xml' },
      { url: '/files/s-planned-favicon-64.svg', sizes: '64x64', type: 'image/svg+xml' },
    ],
    shortcut: '/files/s-planned-favicon-32.svg',
    apple: '/files/s-planned-icon-512.svg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('sp-theme');if(t!=='light'&&t!=='dark')t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;}catch(e){}`,
          }}
        />
      </head>
      <body style={{ height: '100%' }}>{children}</body>
    </html>
  )
}
