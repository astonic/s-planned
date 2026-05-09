import Image from 'next/image'

interface BrandLockupProps {
  markSize?: number
  showTagline?: boolean
  textColor?: string
  taglineColor?: string
  priority?: boolean
}

export function BrandLockup({
  markSize = 40,
  showTagline = true,
  textColor = '#0B1020',
  taglineColor = '#4682B4',
  priority = false,
}: BrandLockupProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        lineHeight: 1,
        whiteSpace: 'nowrap',
      }}
    >
      <Image
        src="/files/s-planned-mark.svg"
        alt=""
        aria-hidden="true"
        width={72}
        height={72}
        priority={priority}
        style={{
          width: markSize,
          height: 'auto',
          display: 'block',
          flexShrink: 0,
        }}
      />
      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
        <span style={{ color: textColor, fontSize: 18, fontWeight: 900, letterSpacing: 0 }}>
          S-planned
        </span>
        {showTagline ? (
          <span style={{ color: taglineColor, fontSize: 6, fontWeight: 900, letterSpacing: 2 }}>
            PLAN . EXECUTE . PROVE
          </span>
        ) : null}
      </span>
    </span>
  )
}
