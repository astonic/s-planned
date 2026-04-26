'use client'

import { useState, useTransition } from 'react'
import { makeStyles, tokens, Input, Spinner, Text } from '@fluentui/react-components'
import { SearchRegular } from '@fluentui/react-icons'
import type { ActionResult } from '@/lib/actions/projects'
import { searchDeliverables, searchRAIDItems } from '@/lib/actions/projects'

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalM,
    marginBottom: tokens.spacingVerticalL,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    maxWidth: '400px',
  },
  results: {
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  resultItem: {
    padding: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `1px solid ${tokens.colorNeutralStroke2}`,
    cursor: 'pointer',
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground1Hover,
    },
  },
  resultName: {
    fontWeight: tokens.fontWeightSemibold,
  },
  resultMeta: {
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
  },
  empty: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
})

interface SearchResult {
  id: string
  [key: string]: unknown
}

interface SearchProps<T extends SearchResult> {
  projectId: string
  type: 'deliverables' | 'raid'
  onResultClick?: (result: T) => void
}

export function ProjectSearch<T extends SearchResult>({ projectId, type, onResultClick }: SearchProps<T>) {
  const styles = useStyles()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<T[]>([])
  const [searching, startSearch] = useTransition()

  async function handleSearch(q: string) {
    setQuery(q)
    if (!q.trim()) {
      setResults([])
      return
    }

    startSearch(async () => {
      const res = type === 'deliverables'
        ? await searchDeliverables(projectId, q)
        : await searchRAIDItems(projectId, q)

      if (res.ok) {
        setResults(((res.data ?? []) as unknown) as T[])
      } else {
        setResults([])
      }
    })
  }

  return (
    <div className={styles.root}>
      <div className={styles.inputRow}>
        <Input
          contentBefore={<SearchRegular />}
          placeholder={type === 'deliverables' ? 'Search deliverables...' : 'Search RAID items...'}
          value={query}
          onChange={(_, d) => handleSearch(d.value)}
          disabled={searching}
        />
        {searching && <Spinner size="small" />}
      </div>

      {results.length > 0 && (
        <div className={styles.results}>
          {results.map((result) => (
            <div
              key={result.id}
              className={styles.resultItem}
              onClick={() => onResultClick?.(result)}
            >
              <Text className={styles.resultName}>
                {type === 'deliverables' ? (result as any).name : (result as any).title}
              </Text>
              {(result as any).description && (
                <Text className={styles.resultMeta}>{(result as any).description}</Text>
              )}
              {(result as any).code && (
                <Text className={styles.resultMeta}>Code: {(result as any).code}</Text>
              )}
            </div>
          ))}
        </div>
      )}

      {query && results.length === 0 && !searching && (
        <Text className={styles.empty}>No results found</Text>
      )}
    </div>
  )
}
