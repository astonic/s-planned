'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button, Text, Badge } from '@fluentui/react-components'
import {
  CheckmarkCircleRegular, ShieldRegular, DocumentRegular, PeopleRegular,
  DataBarVerticalRegular, ArrowRightRegular, BuildingRegular, ChartMultipleRegular,
  ClipboardRegular, BriefcaseRegular, GridRegular, CheckmarkRegular,
} from '@fluentui/react-icons'

const STATS = [
  { value: '500+', label: 'Projects delivered' },
  { value: '12',   label: 'Industries served' },
  { value: '98%',  label: 'On-time readiness' },
  { value: '40%',  label: 'Faster sign-offs' },
]

const FEATURES = [
  { icon: ClipboardRegular,    title: 'Deliverable Management', color: '#1474CB', bg: '#EEF7FF',
    desc: 'Structure your program with focus areas and sub-sections. Track status, evidence, and ownership — all in one workspace.' },
  { icon: ShieldRegular,       title: 'RAID Log',               color: '#13A10E', bg: '#F0FFF0',
    desc: 'Capture Risks, Assumptions, Issues, and Dependencies with severity ratings. Link them to the deliverables they affect.' },
  { icon: DocumentRegular,     title: 'Executive Reports',      color: '#F7B900', bg: '#FFFBEA',
    desc: 'Generate RAG-status slide reports and detailed activity logs. Publish with a shareable public link.' },
  { icon: ChartMultipleRegular,title: 'Real-time Analytics',    color: '#8764B8', bg: '#F5F0FF',
    desc: 'Track readiness percentage, phase progress, and RAID trends across your portfolio with live dashboards.' },
  { icon: GridRegular,         title: 'Reusable Templates',     color: '#C4314B', bg: '#FFF0F2',
    desc: 'Define your readiness blueprint once, instantiate across multiple projects. Clone and customise for variants.' },
  { icon: PeopleRegular,       title: 'Stakeholder Hub',        color: '#0078D4', bg: '#EFF6FC',
    desc: 'Manage people and vendors with role assignments. Link them to deliverables and track contributions.' },
]

const STEPS = [
  { n: '01', title: 'Create from template', desc: 'Choose a pre-built industry template or define your own structure.' },
  { n: '02', title: 'Track & evidence',     desc: 'Teams update deliverable status, upload documents, and log RAID items.' },
  { n: '03', title: 'Report & sign off',    desc: 'Generate executive summaries and publish a shareable link for stakeholder review.' },
]

const INDUSTRIES = [
  { icon: BuildingRegular,  name: 'Mining & Resources' },
  { icon: BriefcaseRegular, name: 'Construction' },
  { icon: ClipboardRegular, name: 'Healthcare' },
  { icon: GridRegular,      name: 'Manufacturing' },
  { icon: DocumentRegular,  name: 'Aviation' },
  { icon: ShieldRegular,    name: 'Legal & Fiduciary' },
]

export default function LandingPage() {
  return (
    <div style={{ fontFamily: 'system-ui,-apple-system,sans-serif', color: '#111' }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'linear-gradient(160deg,#F0F7FF 0%,#FAFCFF 55%,#EEF4FF 100%)',
        padding: '80px 40px 64px', textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 999,
          backgroundColor: '#EEF7FF', border: '1px solid #C4E3FF', marginBottom: 24,
          animation: 'fadeIn 0.6s ease both',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#1474CB', display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: '#1474CB', fontWeight: 600 }}>Now with AI-powered readiness scoring</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(32px,5vw,60px)', fontWeight: 800, lineHeight: 1.1,
          color: '#0D1B2A', marginBottom: 20, maxWidth: 800, margin: '0 auto 20px',
          animation: 'fadeUp 0.7s ease 0.05s both',
        }}>
          Plan. Track. Evidence.{' '}
          <span className="gradient-text">Operational Readiness, Simplified.</span>
        </h1>

        <p style={{
          fontSize: 18, color: '#4A6280', maxWidth: 580, margin: '0 auto 36px',
          lineHeight: 1.7, animation: 'fadeUp 0.7s ease 0.12s both',
        }}>
          S-Planned gives project teams in mining, construction, healthcare, and manufacturing
          a structured, evidence-based system to prove readiness before go-live.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', animation: 'fadeUp 0.7s ease 0.18s both' }}>
          <Link href="/register"><Button appearance="primary" size="large" style={{ padding: '0 28px', fontWeight: 600 }}>Get started free</Button></Link>
          <Link href="/use-cases"><Button appearance="secondary" size="large" icon={<ArrowRightRegular />} iconPosition="after" style={{ padding: '0 28px' }}>See use cases</Button></Link>
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginTop: 28, animation: 'fadeIn 0.7s ease 0.3s both' }}>
          {['No credit card required', 'SOC 2 ready', 'Deploy in minutes'].map(t => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #DDE8F4', fontSize: 12, color: '#4A6280', fontWeight: 500 }}>
              <CheckmarkRegular style={{ fontSize: 11, color: '#1474CB' }} />{t}
            </span>
          ))}
        </div>

        {/* Hero image */}
        <div style={{
          marginTop: 52, borderRadius: 14, overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(20,116,203,0.2)', maxWidth: 880,
          margin: '52px auto 0', position: 'relative', aspectRatio: '16/7',
          animation: 'scaleIn 0.8s ease 0.2s both',
        }}>
          <Image src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&q=80"
            alt="Dashboard" fill style={{ objectFit: 'cover' }} priority />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(13,42,74,0.25) 0%,transparent 60%)' }} />
          <div style={{
            position: 'absolute', bottom: 16, left: 16, backgroundColor: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(8px)', borderRadius: 10, padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: '#13A10E', display: 'inline-block' }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Gold Mine Plant — Q2 2026</div>
              <div style={{ fontSize: 11, color: '#666' }}>Readiness: 78% · 3 critical RAID items</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1px', backgroundColor: '#E8EEF4' }}>
        {STATS.map(({ value, label }) => (
          <div key={label} style={{ padding: '28px 20px', textAlign: 'center', backgroundColor: '#fff' }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: '#1474CB', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: '#616161', marginTop: 5 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Features ── */}
      <div style={{ padding: '72px 40px', maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Badge appearance="outline" color="brand" size="large" style={{ marginBottom: 12 }}>CAPABILITIES</Badge>
          <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>Everything you need for operational readiness</div>
          <div style={{ fontSize: 16, color: '#616161', marginTop: 10, maxWidth: 520, margin: '10px auto 0' }}>
            One platform to plan, track, evidence, and report — built for regulated, project-intensive industries.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="card-lift" style={{ padding: '24px', borderRadius: 12, border: '1.5px solid #EEF0F4', backgroundColor: '#fff' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon style={{ fontSize: 20, color }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: '#616161', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{ backgroundColor: '#F8FBFF', padding: '72px 40px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Badge appearance="outline" color="brand" size="large" style={{ marginBottom: 12 }}>HOW IT WORKS</Badge>
            <div style={{ fontSize: 32, fontWeight: 700 }}>Three steps to go-live confidence</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 32 }}>
            {STEPS.map(({ n, title, desc }) => (
              <div key={n}>
                <div style={{ fontSize: 52, fontWeight: 800, color: '#DDE8F4', lineHeight: 1, marginBottom: 8 }}>{n}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 14, color: '#616161', lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Industries ── */}
      <div style={{ padding: '64px 40px', maxWidth: 1140, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#999', textTransform: 'uppercase', marginBottom: 28 }}>
          Built for regulated, project-intensive industries
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
          {INDUSTRIES.map(({ icon: Icon, name }) => (
            <div key={name} className="card-lift" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 999, border: '1.5px solid #E0ECF8', backgroundColor: '#fff', fontSize: 13, fontWeight: 500 }}>
              <Icon style={{ fontSize: 16, color: '#1474CB' }} />{name}
            </div>
          ))}
        </div>
      </div>

      {/* ── Photo strip ── */}
      <div style={{ padding: '0 40px 64px', maxWidth: 1140, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
        {[
          { src: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80', label: 'Mining commissioning' },
          { src: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=600&q=80', label: 'Plant operations' },
          { src: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?w=600&q=80', label: 'Infrastructure handover' },
        ].map(({ src, label }) => (
          <div key={label} style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', aspectRatio: '4/3' }}>
            <Image src={src} alt={label} fill style={{ objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg,rgba(13,27,42,0.5) 0%,transparent 55%)' }} />
            <div style={{ position: 'absolute', bottom: 12, left: 14, fontSize: 12, fontWeight: 600, color: '#fff' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── CTA ── */}
      <div style={{ padding: '0 40px 72px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', borderRadius: 18, background: 'linear-gradient(135deg,#0D2A4A 0%,#1474CB 65%,#2B8AE5 100%)', padding: '64px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -50, right: -50, width: 200, height: 200, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'absolute', bottom: -30, left: -30, width: 150, height: 150, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.05)' }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Start your first readiness project today</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
              Free to get started. No credit card required. Deploy in minutes.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
              <Link href="/register"><Button size="large" style={{ backgroundColor: '#fff', color: '#1474CB', fontWeight: 600, border: 'none', padding: '0 28px' }}>Get started free</Button></Link>
              <Link href="/use-cases"><Button size="large" appearance="transparent" icon={<ArrowRightRegular />} iconPosition="after" style={{ color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', padding: '0 28px' }}>See use cases</Button></Link>
            </div>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['No credit card', 'SOC 2 ready', 'GDPR compliant', 'Cancel anytime'].map(t => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.7)', fontSize: 13 }}>
                  <CheckmarkRegular style={{ fontSize: 13 }} />{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <div style={{ backgroundColor: '#0D1B2A', padding: '48px 40px 28px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#fff', marginBottom: 8 }}>S-Planned</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', maxWidth: 260, lineHeight: 1.6 }}>
                Operational readiness planning for project-intensive industries.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              {[
                { heading: 'Product', links: [['Features', '/landing'], ['Use Cases', '/use-cases'], ['Templates', '/template-gallery']] },
                { heading: 'Account', links: [['Sign In', '/login'], ['Register', '/register']] },
              ].map(({ heading, links }) => (
                <div key={heading}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 12 }}>{heading}</div>
                  {links.map(([label, href]) => (
                    <div key={label} style={{ marginBottom: 8 }}>
                      <Link href={href} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}>{label}</Link>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
            © 2026 S-Planned. Operational Readiness Platform.
          </div>
        </div>
      </div>
    </div>
  )
}
