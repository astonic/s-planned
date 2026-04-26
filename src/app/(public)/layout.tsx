import Link from 'next/link'
import { FluentWrapper } from '@/components/layout/FluentWrapper'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <FluentWrapper>
      <div className="min-h-screen flex flex-col">
        <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200">
          <Link href="/landing" className="flex items-center gap-2 no-underline">
            <span style={{ fontSize: 20, fontWeight: 700, color: '#1474CB', letterSpacing: '-0.5px' }}>
              S-Planned
            </span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-blue-600 hover:underline"
          >
            Sign in
          </Link>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </FluentWrapper>
  )
}
