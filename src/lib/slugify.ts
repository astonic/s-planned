export function generateSlug(name: string, existingSlugs: string[] = []): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || `org-${Date.now()}`

  if (!existingSlugs.includes(base)) return base

  let suffix = 2
  while (existingSlugs.includes(`${base}-${suffix}`)) {
    suffix++
  }
  return `${base}-${suffix}`
}
