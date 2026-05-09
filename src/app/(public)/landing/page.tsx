'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button, Badge } from '@fluentui/react-components'
import { BrandLockup } from '@/components/ui/BrandLockup'
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

const TASKS = [
  { name: 'Fire suppression', short: 'Fire supp.', cat: 'Safety' },
  { name: 'Emergency stops', short: 'Emerg. stops', cat: 'Safety' },
  { name: 'Gas detection', short: 'Gas detect.', cat: 'Safety' },
  { name: 'LOTO verified', short: 'LOTO verif.', cat: 'Operations' },
  { name: 'Comms tested', short: 'Comms tested', cat: 'Operations' },
  { name: 'Training signed off', short: 'Training s/o', cat: 'People' },
  { name: 'Electrical cert', short: 'Electrical cert', cat: 'Compliance' },
  { name: 'Pressure test', short: 'Pressure test', cat: 'Engineering', inProgress: true },
  { name: 'Permits issued', short: 'Permits', cat: 'Compliance' },
  { name: 'Handover doc', short: 'Handover doc', cat: 'Docs' },
  { name: 'Stakeholder sign-off', short: 'Sign-off', cat: 'Governance' },
]

const CUBES = [
  { t: '190,20 230,40 190,60 150,40', l: '150,40 150,76 190,96 190,60', r: '190,60 190,96 230,76 230,40', x: 190, y: 44 },
  { t: '230,40 270,60 230,80 190,60', l: '190,60 190,96 230,116 230,80', r: '230,80 230,116 270,96 270,60', x: 230, y: 64 },
  { t: '270,60 310,80 270,100 230,80', l: '230,80 230,116 270,136 270,100', r: '270,100 270,136 310,116 310,80', x: 270, y: 84 },
  { t: '150,40 190,60 150,80 110,60', l: '110,60 110,96 150,116 150,80', r: '150,80 150,116 190,96 190,60', x: 150, y: 64 },
  { t: '110,60 150,80 110,100 70,80', l: '70,80 70,116 110,136 110,100', r: '110,100 110,136 150,116 150,80', x: 110, y: 84 },
  { t: '150,80 190,100 150,120 110,100', l: '110,100 110,136 150,156 150,120', r: '150,120 150,156 190,136 190,100', x: 150, y: 104 },
  { t: '190,100 230,120 190,140 150,120', l: '150,120 150,156 190,176 190,140', r: '190,140 190,176 230,156 230,120', x: 190, y: 124 },
  { t: '150,120 190,140 150,160 110,140', l: '110,140 110,176 150,196 150,160', r: '150,160 150,196 190,176 190,140', x: 150, y: 144 },
  { t: '30,100 70,120 30,140 -10,120', l: '-10,120 -10,156 30,176 30,140', r: '30,140 30,176 70,156 70,120', x: 30, y: 124 },
  { t: '70,120 110,140 70,160 30,140', l: '30,140 30,176 70,196 70,160', r: '70,160 70,196 110,176 110,140', x: 70, y: 144 },
  { t: '110,140 150,160 110,180 70,160', l: '70,160 70,196 110,216 110,180', r: '110,180 110,216 150,196 150,160', x: 110, y: 164 },
]

type TrackerState = 'idle' | 'active' | 'done' | 'inprog'

function ReadinessHeroAnimation() {
  const [runKey, setRunKey] = useState(0)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const [settledIndex, setSettledIndex] = useState(-1)
  const [floating, setFloating] = useState(false)

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = []
    const step = 560

    setActiveIndex(null)
    setSettledIndex(-1)
    setFloating(false)

    TASKS.forEach((_, index) => {
      timeouts.push(setTimeout(() => {
        setActiveIndex(index)
        setSettledIndex(index - 1)
      }, 260 + index * step))

      timeouts.push(setTimeout(() => {
        setActiveIndex(null)
        setSettledIndex(index)
      }, 610 + index * step))
    })

    timeouts.push(setTimeout(() => {
      setFloating(true)
    }, 610 + TASKS.length * step))

    timeouts.push(setTimeout(() => {
      setRunKey((value) => value + 1)
    }, 3600 + TASKS.length * step))

    return () => timeouts.forEach(clearTimeout)
  }, [runKey])

  const states = useMemo<TrackerState[]>(() => (
    TASKS.map((task, index) => {
      if (index === activeIndex) return 'active'
      if (index <= settledIndex) return task.inProgress ? 'inprog' : 'done'
      return 'idle'
    })
  ), [activeIndex, settledIndex])

  const doneCount = TASKS.reduce((count, task, index) => (
    index <= settledIndex && !task.inProgress ? count + 1 : count
  ), 0)
  const pct = Math.round((doneCount / TASKS.length) * 100)

  return (
    <div className="landing-iso-hero">
      <div className="landing-iso-layout">
        <div className="landing-iso-stage">
          <div className="landing-iso-label">Readiness tracker</div>
          <svg
            className={floating ? 'landing-iso-svg is-floating' : 'landing-iso-svg'}
            width="310"
            height="320"
            viewBox="-16 0 340 320"
            role="img"
            aria-label="Animated isometric S-shaped readiness checklist"
          >
            <ellipse className="landing-iso-shadow" cx="150" cy="286" rx="140" ry="16" />
            {CUBES.map((cube, index) => {
              const state = states[index]
              const task = TASKS[index]

              return (
                <g
                  key={task.name}
                  className={`landing-iso-cube is-${state}`}
                  style={{ animationDelay: `${80 + index * 95}ms` }}
                >
                  <polygon className="cube-top" points={cube.t} />
                  <polygon className="cube-left" points={cube.l} />
                  <polygon className="cube-right" points={cube.r} />
                  <text className="cube-number" x={cube.x} y={cube.y} textAnchor="middle">{index + 1}</text>
                  <text className="cube-label" x={cube.x} y={cube.y + 10} textAnchor="middle">{task.short}</text>
                  <text className="cube-icon" x={cube.x} y={cube.y + 2} textAnchor="middle">{task.inProgress ? '...' : 'OK'}</text>
                </g>
              )
            })}
            <text className="landing-iso-progress-text" x="155" y="252" textAnchor="middle">
              {doneCount} / {TASKS.length} complete
            </text>
          </svg>
        </div>

        <div className="landing-iso-panel" aria-label="Checklist items">
          <div className="landing-iso-label landing-iso-label--left">Checklist items</div>
          <div className="landing-task-list">
            {TASKS.map((task, index) => {
              const state = states[index]
              const badge = state === 'done' ? 'Done' : state === 'inprog' ? 'Active' : state === 'active' ? '...' : '-'

              return (
                <div
                  key={task.name}
                  className={`landing-task-row is-${state}`}
                  style={{ animationDelay: `${180 + index * 55}ms` }}
                >
                  <span className="landing-task-dot" />
                  <span className="landing-task-name">{task.name}<span /></span>
                  <span className="landing-task-cat">{task.cat}</span>
                  <span className="landing-task-badge">{badge}</span>
                </div>
              )
            })}
          </div>

          <div className="landing-progress">
            <div className="landing-progress-meta">
              <span>{doneCount} / {TASKS.length} complete</span>
              <strong>{pct}%</strong>
            </div>
            <div className="landing-progress-track">
              <div className="landing-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          <button className="landing-replay-button" type="button" onClick={() => setRunKey((value) => value + 1)}>
            Replay
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div style={{ color: 'var(--sp-page-fg)', backgroundColor: 'var(--sp-page-bg)' }}>

      {/* ── Hero ── */}
      <section className="landing-hero">
        <ReadinessHeroAnimation />

        <div className="landing-hero-copy">
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
            color: 'var(--sp-page-fg)', marginBottom: 20, maxWidth: 800, margin: '0 auto 20px',
            animation: 'fadeUp 0.7s ease 0.05s both',
          }}>
            Plan. Track. Evidence.{' '}
            <span>Operational Readiness, Simplified.</span>
          </h1>

          <p style={{
            fontSize: 18, color: 'var(--sp-gray-600)', maxWidth: 580, margin: '0 auto 36px',
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
            {['Evidence-ready handovers', 'SOC 2 ready', 'Go-live gate tracking'].map(t => (
              <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 12px', borderRadius: 'var(--sp-radius-pill)', backgroundColor: 'var(--sp-surface-subtle-alpha)', border: '0.5px solid var(--sp-border-subtle)', fontSize: 12, color: 'var(--sp-gray-600)', fontWeight: 700 }}>
                <CheckmarkRegular style={{ fontSize: 11, color: 'var(--sp-blue-500)' }} />{t}
              </span>
            ))}
          </div>
        </div>
      </section>

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
              Start with structured deliverables, evidence capture, RAID visibility, and stakeholder sign-off.
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 28 }}>
              <Link href="/register"><Button size="large" style={{ backgroundColor: '#fff', color: 'var(--sp-blue-500)', fontWeight: 700, border: 'none', padding: '0 28px' }}>Get started free</Button></Link>
              <Link href="/use-cases"><Button size="large" appearance="transparent" icon={<ArrowRightRegular />} iconPosition="after" style={{ color: '#fff', border: '1.5px solid rgba(255,255,255,0.4)', padding: '0 28px' }}>See use cases</Button></Link>
            </div>
            <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Evidence trails', 'SOC 2 ready', 'GDPR compliant', 'Stakeholder sign-off'].map(t => (
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
                <BrandLockup markSize={40} />
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
