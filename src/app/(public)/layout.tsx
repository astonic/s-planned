import Link from 'next/link'
import Image from 'next/image'
import { FluentWrapper } from '@/components/layout/FluentWrapper'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <FluentWrapper>
      <div className="min-h-screen flex flex-col">
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 40px', height: 60,
          borderBottom: '1px solid #EEF0F4',
          backgroundColor: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(8px)',
          position: 'sticky', top: 0, zIndex: 200,
        }}>
          <Link href="/landing" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{
              width: 30, height: 30, borderRadius: 7,
              background: 'linear-gradient(135deg, #1474CB, #0D2A4A)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg viewBox="0 0 20 20" fill="none" width="16" height="16">
                <path d="M15 5.5H9.5a2 2 0 0 0-2 2v1.5a2 2 0 0 0 2 2h2.5a2 2 0 0 1 2 2V14a2 2 0 0 1-2 2H5"
                  stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 700, color: '#0D1B2A', letterSpacing: '-0.3px' }}>
              S-Planned
            </span>
          </Link>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <Link href="/use-cases" style={{ fontSize: 14, color: '#4A6280', textDecoration: 'none', fontWeight: 500 }}>
              Use cases
            </Link>
            <Link href="/template-gallery" style={{ fontSize: 14, color: '#4A6280', textDecoration: 'none', fontWeight: 500 }}>
              Templates
            </Link>
            <Link href="/login" style={{ fontSize: 14, color: '#4A6280', textDecoration: 'none', fontWeight: 500 }}>
              Sign in
            </Link>
            <Link href="/register" style={{
              fontSize: 14, fontWeight: 600, color: '#fff', textDecoration: 'none',
              padding: '7px 16px', borderRadius: 6,
              background: 'linear-gradient(135deg, #1474CB, #0D2A4A)',
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
