import type { Metadata } from 'next'
import { GalleryCard, type GalleryTemplate } from './_components/GalleryCard'

export const metadata: Metadata = {
  title: 'Template Gallery — S-Planned',
  description: 'Browse industry-ready operational readiness templates. Use any template to fast-track your project commissioning.',
}

// ── Static gallery data (Phase 3 will replace with DB query) ─────────────────

const GALLERY_TEMPLATES: GalleryTemplate[] = [
  {
    industry: 'Mining & Resources',
    name: 'Mine Processing Plant Commissioning',
    desc: 'Full commissioning readiness for mineral processing plants — from pre-commissioning to handover.',
    deliverables: 84,
    phases: ['Pre-commissioning', 'Commissioning', 'Handover'],
  },
  {
    industry: 'Construction & Engineering',
    name: 'Infrastructure Project Handover',
    desc: 'Practical completion through to operational handover for civil and structural projects.',
    deliverables: 62,
    phases: ['Commissioning', 'Ramp-up', 'Handover'],
  },
  {
    industry: 'Healthcare',
    name: 'Hospital Go-Live Readiness',
    desc: 'Clinical, IT, and facilities readiness for new hospital and clinic openings.',
    deliverables: 96,
    phases: ['Pre-commissioning', 'Commissioning', 'Handover'],
  },
  {
    industry: 'Manufacturing',
    name: 'Production Line Qualification',
    desc: 'IQ/OQ/PQ qualification, safety sign-offs, and operator training for new production lines.',
    deliverables: 71,
    phases: ['Pre-commissioning', 'Commissioning', 'Ramp-up'],
  },
  {
    industry: 'Aviation',
    name: 'Airport Terminal Operations Readiness',
    desc: 'Systems, safety, and operational readiness for new terminal openings and expansions.',
    deliverables: 88,
    phases: ['Pre-commissioning', 'Commissioning', 'Handover'],
  },
  {
    industry: 'Legal & Fiduciary',
    name: 'Fund Administration Go-Live',
    desc: 'Compliance, systems, and process readiness for new fund administration mandates.',
    deliverables: 45,
    phases: ['Commissioning', 'Handover'],
  },
]

// ── Group by industry ─────────────────────────────────────────────────────────

function groupByIndustry(templates: GalleryTemplate[]): Map<string, GalleryTemplate[]> {
  const map = new Map<string, GalleryTemplate[]>()
  for (const t of templates) {
    const existing = map.get(t.industry) ?? []
    existing.push(t)
    map.set(t.industry, existing)
  }
  return map
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TemplateGalleryPage() {
  const grouped = groupByIndustry(GALLERY_TEMPLATES)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 80px' }}>

      {/* ── Page heading ── */}
      <div style={{ textAlign: 'center', marginBottom: 48 }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '4px 14px', borderRadius: 999,
          background: 'linear-gradient(135deg,rgba(20,116,203,0.08),rgba(20,116,203,0.04))',
          border: '1px solid rgba(20,116,203,0.18)',
          marginBottom: 16,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1474CB', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Template Gallery
          </span>
        </div>
        <h1 style={{
          fontSize: 40, fontWeight: 800, color: '#0D1B2A',
          letterSpacing: '-0.5px', lineHeight: 1.15, margin: '0 0 16px',
        }}>
          Start from a proven blueprint
        </h1>
        <p style={{ fontSize: 17, color: '#4A6280', maxWidth: 560, margin: '0 auto', lineHeight: 1.6 }}>
          Industry-ready operational readiness templates built by practitioners.
          Clone, customise, and launch in minutes.
        </p>
      </div>

      {/* ── Summary stat strip ── */}
      <div style={{
        display: 'flex', justifyContent: 'center', gap: 40,
        marginBottom: 56, flexWrap: 'wrap',
      }}>
        {[
          { value: '6',    label: 'Industries' },
          { value: '446+', label: 'Deliverables covered' },
          { value: 'Free', label: 'Always free to browse' },
        ].map((s) => (
          <div key={s.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1474CB' }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#4A6280', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Template grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
        gap: 24,
      }}>
        {GALLERY_TEMPLATES.map((t) => (
          <GalleryCard key={`${t.industry}-${t.name}`} t={t} />
        ))}
      </div>

      {/* ── Bottom CTA ── */}
      <div style={{
        marginTop: 72, textAlign: 'center',
        padding: '48px 32px',
        borderRadius: 16,
        background: 'linear-gradient(160deg,#F0F7FF 0%,#FAFCFF 100%)',
        border: '1px solid rgba(20,116,203,0.12)',
      }}>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: '#0D1B2A', marginBottom: 12 }}>
          Need a custom template?
        </h2>
        <p style={{ fontSize: 15, color: '#4A6280', marginBottom: 24, maxWidth: 480, margin: '0 auto 24px' }}>
          Create your own readiness framework from scratch, or clone and adapt any template to match your project structure.
        </p>
        <a
          href="/register"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '11px 28px', borderRadius: 8,
            background: 'linear-gradient(135deg,#1474CB,#0D2A4A)',
            color: '#fff', fontWeight: 600, fontSize: 15, textDecoration: 'none',
          }}
        >
          Get started free
        </a>
      </div>
    </div>
  )
}
