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
  { icon: ClipboardRegular,    title: 'Deliverable Management', color: 'var(--sp-blue-500)', bg: 'var(--sp-blue-50)',
    desc: 'Structure your program with focus areas and sub-sections. Track status, evidence, and ownership — all in one workspace.' },
  { icon: ShieldRegular,       title: 'RAID Log',               color: 'var(--sp-success-dark)', bg: 'var(--sp-success-light)',
    desc: 'Capture Risks, Assumptions, Issues, and Dependencies with severity ratings. Link them to the deliverables they affect.' },
  { icon: DocumentRegular,     title: 'Executive Reports',      color: 'var(--sp-warning-dark)', bg: 'var(--sp-warning-light)',
    desc: 'Generate RAG-status slide reports and detailed activity logs. Publish with a shareable public link.' },
  { icon: ChartMultipleRegular,title: 'Real-time Analytics',    color: 'var(--sp-blue-600)', bg: 'var(--sp-blue-100)',
    desc: 'Track readiness percentage, phase progress, and RAID trends across your portfolio with live dashboards.' },
  { icon: GridRegular,         title: 'Reusable Templates',     color: 'var(--sp-danger-dark)', bg: 'var(--sp-danger-light)',
    desc: 'Define your readiness blueprint once, instantiate across multiple projects. Clone and customise for variants.' },
  { icon: PeopleRegular,       title: 'Stakeholder Hub',        color: 'var(--sp-teal)', bg: 'var(--sp-blue-50)',
    desc: 'Manage people and vendors with role assignments. Link them to deliverables and track contributions.' },
]

const STEPS = [
  { n: '01', title: 'Create from template', desc: 'Choose a pre-built industry template or define your own structure.' },
  { n: '02', title: 'Track & evidence',     desc: 'Teams update deliverable status, upload documents, and log RAID items.' },
  { n: '03', title: 'Report & sign off',    desc: 'Generate executive summaries and publish a shareable link for stakeholder review.' },
]

const industryIconStyle = { fontSize: 16, color: 'var(--sp-blue-500)' }

const INDUSTRIES = [
  { icon: <BuildingRegular style={industryIconStyle} />,  name: 'Mining & Resources' },
  { icon: <BriefcaseRegular style={industryIconStyle} />, name: 'Construction' },
  { icon: <ClipboardRegular style={industryIconStyle} />, name: 'Healthcare' },
  { icon: <GridRegular style={industryIconStyle} />,      name: 'Manufacturing' },
  { icon: <DocumentRegular style={industryIconStyle} />,  name: 'Aviation' },
  { icon: <ShieldRegular style={industryIconStyle} />,    name: 'Legal & Fiduciary' },
]

const GUIDE_CARDS = [
  {
    title: 'How to build your readiness workspace',
    desc: 'Start from a proven structure, tailor the focus areas, and give every team a clear path to go-live.',
    href: '/template-gallery',
    link: 'Explore templates',
    light: '/landing-screens/readiness-overview-light.png',
    dark: '/landing-screens/readiness-overview-dark-mode.png',
  },
  {
    title: 'How to track evidence and ownership',
    desc: 'Move from planning to execution with deliverables, RAID items, owners, and progress views in one place.',
    href: '/use-cases',
    link: 'See workflows',
    light: '/landing-screens/workspace-board-light.png',
    dark: '/landing-screens/workspace-board-dark.png',
  },
]

export default function LandingPage() {
  return (
    <div style={{ color: 'var(--sp-page-fg)', backgroundColor: 'var(--sp-page-bg)' }}>

      {/* ── Hero ── */}
      <div style={{
        background: 'var(--sp-grad-extended)',
        padding: '80px 40px 64px', textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 'var(--sp-radius-pill)',
          backgroundColor: 'var(--sp-surface-raised)', border: '1px solid var(--sp-border-subtle)', marginBottom: 24,
          boxShadow: 'var(--sp-shadow-1)',
          animation: 'fadeIn 0.6s ease both',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: 'var(--sp-radius-pill)', background: 'var(--sp-grad-primary)', display: 'inline-block' }} />
          <span style={{ fontSize: 12, color: 'var(--sp-blue-500)', fontWeight: 700 }}>Now with AI-powered readiness scoring</span>
        </div>

        <h1 style={{
          fontSize: 32, fontWeight: 800, lineHeight: 1.1,
          color: '#FFFFFF', marginBottom: 20, maxWidth: 800, margin: '0 auto 20px',
          animation: 'fadeUp 0.7s ease 0.05s both',
        }}>
          Plan. Track. Evidence.{' '}
          <span>Operational Readiness, Simplified.</span>
        </h1>

        <p style={{
          fontSize: 18, color: 'rgba(255,255,255,0.88)', maxWidth: 580, margin: '0 auto 36px',
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
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 'var(--sp-radius-pill)', backgroundColor: 'var(--sp-surface-subtle-alpha)', border: '0.5px solid var(--sp-border-subtle)', fontSize: 12, color: 'var(--sp-gray-600)', fontWeight: 700 }}>
              <CheckmarkRegular style={{ fontSize: 11, color: 'var(--sp-blue-500)' }} />{t}
            </span>
          ))}
        </div>

        {/* Hero image */}
        <div style={{
          marginTop: 52, borderRadius: 'var(--sp-radius-lg)', overflow: 'hidden',
          boxShadow: 'var(--sp-shadow-4)', maxWidth: 880,
          margin: '52px auto 0', position: 'relative', aspectRatio: '16/7',
          animation: 'scaleIn 0.8s ease 0.2s both',
        }}>
          <Image
            src="/landing-screens/workspace-board-light.png"
            alt="S-Planned project workspace showing readiness deliverables, ownership, and progress"
            fill
            sizes="(max-width: 900px) 100vw, 880px"
            priority
            className="landing-theme-image landing-theme-image--light"
          />
          <Image
            src="/landing-screens/workspace-board-dark.png"
            alt="S-Planned project workspace showing readiness deliverables, ownership, and progress"
            fill
            sizes="(max-width: 900px) 100vw, 880px"
            priority
            className="landing-theme-image landing-theme-image--dark"
          />
          <div style={{
            position: 'absolute', bottom: 16, left: 16, backgroundColor: 'var(--sp-surface-raised-alpha)',
            backdropFilter: 'blur(8px)', borderRadius: 'var(--sp-radius-md)', padding: '8px 14px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: 'var(--sp-radius-pill)', backgroundColor: 'var(--sp-success)', display: 'inline-block' }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 700 }}>Readiness workspace</div>
              <div style={{ fontSize: 11, color: 'var(--sp-gray-600)' }}>Deliverables, evidence, RAID, and ownership in one view</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: '1px', backgroundColor: 'var(--sp-gray-200)' }}>
        {STATS.map(({ value, label }) => (
          <div key={label} style={{ padding: '28px 20px', textAlign: 'center', backgroundColor: 'var(--sp-surface)' }}>
            <div style={{ fontSize: 34, fontWeight: 800, color: 'var(--sp-blue-500)', lineHeight: 1 }}>{value}</div>
            <div style={{ fontSize: 12, color: 'var(--sp-gray-400)', marginTop: 5, fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Product guide ── */}
      <section className="landing-guide-wrap">
        <div className="landing-guide-panel">
          <div className="landing-guide-kicker">READINESS WORKSPACE</div>
          <h2 className="landing-guide-title">Getting started with operational readiness</h2>
          <p className="landing-guide-copy">
            Set up a project quickly, assign accountability, and keep readiness evidence moving from one shared workspace.
          </p>

          <div className="landing-guide-grid">
            {GUIDE_CARDS.map(({ title, desc, href, link, light, dark }) => (
              <article key={title} className="landing-guide-tile">
                <div className="landing-guide-shot">
                  <Image
                    src={light}
                    alt=""
                    fill
                    sizes="(max-width: 900px) 100vw, 50vw"
                    className="landing-theme-image landing-theme-image--light"
                  />
                  <Image
                    src={dark}
                    alt=""
                    fill
                    sizes="(max-width: 900px) 100vw, 50vw"
                    className="landing-theme-image landing-theme-image--dark"
                  />
                </div>
                <h3>{title}</h3>
                <p>{desc}</p>
                <Link href={href} className="landing-guide-link">
                  {link} <ArrowRightRegular />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <div style={{ padding: '72px 40px', maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <Badge appearance="outline" color="brand" size="large" style={{ marginBottom: 12 }}>CAPABILITIES</Badge>
          <div style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2 }}>Everything you need for operational readiness</div>
          <div style={{ fontSize: 16, color: 'var(--sp-gray-600)', marginTop: 10, maxWidth: 520, margin: '10px auto 0' }}>
            One platform to plan, track, evidence, and report — built for regulated, project-intensive industries.
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 20 }}>
          {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
            <div key={title} className="card-lift" style={{ padding: '24px', borderRadius: 'var(--sp-radius-lg)', border: '0.5px solid var(--sp-border-subtle)', backgroundColor: 'var(--sp-surface)', boxShadow: 'var(--sp-shadow-2)' }}>
              <div style={{ width: 44, height: 44, borderRadius: 'var(--sp-radius-md)', backgroundColor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                <Icon style={{ fontSize: 20, color }} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>{title}</div>
              <div style={{ fontSize: 13, color: 'var(--sp-gray-600)', lineHeight: 1.6 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{ backgroundColor: 'var(--sp-surface-2)', padding: '72px 40px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <Badge appearance="outline" color="brand" size="large" style={{ marginBottom: 12 }}>HOW IT WORKS</Badge>
            <div style={{ fontSize: 32, fontWeight: 700 }}>Three steps to go-live confidence</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 32 }}>
            {STEPS.map(({ n, title, desc }) => (
              <div key={n}>
                <div style={{ fontSize: 52, fontWeight: 800, color: 'var(--sp-blue-100)', lineHeight: 1, marginBottom: 8 }}>{n}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 14, color: 'var(--sp-gray-600)', lineHeight: 1.7 }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Industries ── */}
      <div style={{ padding: '64px 40px', maxWidth: 1140, margin: '0 auto', textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--sp-gray-400)', textTransform: 'uppercase', marginBottom: 28 }}>
          Built for regulated, project-intensive industries
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
          {INDUSTRIES.map(({ icon, name }) => (
            <div key={name} className="card-lift" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 'var(--sp-radius-pill)', border: '1.5px solid var(--sp-border-subtle)', backgroundColor: 'var(--sp-surface)', fontSize: 13, fontWeight: 700, boxShadow: 'var(--sp-shadow-1)' }}>
              {icon}{name}
            </div>
          ))}
        </div>
      </div>

      {/* ── Product screenshot ── */}
      <div style={{ padding: '0 40px 64px', maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <Badge appearance="outline" color="brand" size="large" style={{ marginBottom: 12 }}>DELIVERABLES</Badge>
          <div style={{ fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}>See the readiness plan as a working control room</div>
          <div style={{ fontSize: 15, color: 'var(--sp-gray-600)', margin: '10px auto 0', maxWidth: 560, lineHeight: 1.6 }}>
            Track scope, ownership, progress, dates, priorities, and RAID exposure in one project view.
          </div>
        </div>
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--sp-radius-lg)',
          border: '1px solid var(--sp-border-subtle)',
          boxShadow: 'var(--sp-shadow-4)',
          aspectRatio: '2048 / 1114',
          backgroundColor: 'var(--sp-surface-2)',
        }}>
          <Image
            src="/landing-screens/deliverables-grid.png"
            alt="S-Planned deliverables grid showing project tasks, owners, progress, priorities, RAID links, and dates"
            fill
            sizes="(max-width: 1140px) 100vw, 1140px"
            style={{ objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* ── CTA ── */}
      <div style={{ padding: '0 40px 72px' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto', borderRadius: 'var(--sp-radius-xl)', background: 'var(--sp-grad-midnight)', boxShadow: 'var(--sp-shadow-4)', padding: '64px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 34, fontWeight: 700, color: '#fff', marginBottom: 12 }}>Start your first readiness project today</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.8)', marginBottom: 32, maxWidth: 480, margin: '0 auto 32px' }}>
              Free to get started. No credit card required. Deploy in minutes.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
              <Link href="/register"><Button size="large" style={{ backgroundColor: '#fff', color: 'var(--sp-blue-500)', fontWeight: 700, border: 'none', padding: '0 28px' }}>Get started free</Button></Link>
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
      <div className="landing-footer" style={{ backgroundColor: 'var(--sp-footer-bg)', padding: '48px 40px 28px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--sp-radius-md)',
                padding: '5px 9px',
                boxShadow: 'var(--sp-shadow-1)',
                marginBottom: 12,
              }}>
                <Image src="/files/s-planned-logo-horizontal.svg" alt="S-Planned" width={320} height={72} style={{ width: 142, height: 'auto', display: 'block' }} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--sp-footer-muted)', maxWidth: 260, lineHeight: 1.6 }}>
                Operational readiness planning for project-intensive industries.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
              {[
                { heading: 'Product', links: [['Features', '/landing'], ['Use Cases', '/use-cases'], ['Templates', '/template-gallery']] },
                { heading: 'Account', links: [['Sign In', '/login'], ['Register', '/register']] },
              ].map(({ heading, links }) => (
                <div key={heading}>
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--sp-footer-subtle)', marginBottom: 12 }}>{heading}</div>
                  {links.map(([label, href]) => (
                    <div key={label} style={{ marginBottom: 8 }}>
                      <Link href={href} style={{ fontSize: 13, color: 'var(--sp-footer-muted)', textDecoration: 'none' }}>{label}</Link>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div style={{ borderTop: '1px solid var(--sp-footer-border)', paddingTop: 20, fontSize: 12, color: 'var(--sp-footer-subtle)' }}>
            © 2026 S-Planned. Operational Readiness Platform.
          </div>
        </div>
      </div>
    </div>
  )
}
