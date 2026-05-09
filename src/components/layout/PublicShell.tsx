'use client'

import Link from 'next/link'
import { FluentWrapper } from '@/components/layout/FluentWrapper'
import { BrandLockup } from '@/components/ui/BrandLockup'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <FluentWrapper>
      <div className="min-h-screen flex flex-col">
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 var(--sp-space-6)', minHeight: 64,
          borderBottom: '0.5px solid var(--sp-gray-200)',
          backgroundColor: 'var(--sp-public-header-bg)',
          backdropFilter: 'blur(16px)',
          boxShadow: 'var(--sp-shadow-1)',
          position: 'sticky', top: 0, zIndex: 200,
        }}>
          <Link
            href="/landing"
            aria-label="S-Planned home"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              textDecoration: 'none',
              backgroundColor: '#fff',
              borderRadius: 'var(--sp-radius-md)',
              padding: '4px 10px',
              boxShadow: 'var(--sp-shadow-1)',
            }}
          >
            <BrandLockup markSize={42} priority />
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
            <ThemeToggle />
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </FluentWrapper>
  )
}
