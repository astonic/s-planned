import Link from 'next/link'
import Image from 'next/image'
import { FluentWrapper } from '@/components/layout/FluentWrapper'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <FluentWrapper>
      <div className="min-h-screen flex flex-col">
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 var(--sp-space-6)', minHeight: 64,
          borderBottom: '0.5px solid var(--sp-gray-200)',
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(16px)',
          boxShadow: 'var(--sp-shadow-1)',
          position: 'sticky', top: 0, zIndex: 200,
        }}>
          <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--sp-radius-md)',
              background: 'var(--sp-grad-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: 'var(--sp-shadow-2)',
            }}>
              <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                <path d="M15 5.5H9.5a2 2 0 0 0-2 2v1.5a2 2 0 0 0 2 2h2.5a2 2 0 0 1 2 2V14a2 2 0 0 1-2 2H5"
                  stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--sp-gray-800)', letterSpacing: '-0.5px' }}>
              S-planned
            </span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link href="/use-cases" style={{ fontSize: 14, color: 'var(--sp-gray-600)', textDecoration: 'none', fontWeight: 700 }}>
              Use cases
            </Link>
            <Link href="/template-gallery" style={{ fontSize: 14, color: 'var(--sp-gray-600)', textDecoration: 'none', fontWeight: 700 }}>
              Templates
            </Link>
            <Link href="/login" style={{ fontSize: 14, color: 'var(--sp-gray-600)', textDecoration: 'none', fontWeight: 700 }}>
              Sign in
            </Link>
            <Link href="/register" style={{
              fontSize: 14, fontWeight: 700, color: '#fff', textDecoration: 'none',
              padding: '10px 22px', borderRadius: 'var(--sp-radius-pill)',
              background: 'var(--sp-grad-primary)', boxShadow: 'var(--sp-shadow-2)',
            }}>
              Get started
            </Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </FluentWrapper>
  )
}
