import { generateSlug } from '../slugify'

describe('generateSlug', () => {
  it('lowercases and hyphenates a simple name', () => {
    expect(generateSlug('Acme Mining Co')).toBe('acme-mining-co')
  })

  it('removes special characters', () => {
    expect(generateSlug('Smith & Sons Ltd.')).toBe('smith-sons-ltd')
  })

  it('collapses multiple spaces and hyphens', () => {
    expect(generateSlug('Alpha  --  Beta')).toBe('alpha-beta')
  })

  it('strips leading and trailing hyphens', () => {
    expect(generateSlug('  -Leading-')).toBe('leading')
  })

  it('appends numeric suffix when existingSlugs contains the base slug', () => {
    expect(generateSlug('Acme Mining', ['acme-mining'])).toBe('acme-mining-2')
  })

  it('increments suffix until unique', () => {
    expect(generateSlug('Acme Mining', ['acme-mining', 'acme-mining-2'])).toBe('acme-mining-3')
  })

  it('handles names that are only special characters', () => {
    const slug = generateSlug('---')
    expect(slug).toMatch(/^org-\d+$/)
  })
})
