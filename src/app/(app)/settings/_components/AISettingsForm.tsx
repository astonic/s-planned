'use client'

import { useState, useTransition } from 'react'
import {
  Button,
  Checkbox,
  Divider,
  Field,
  Input,
  Select,
  Spinner,
  Switch,
  Text,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { saveAISettings } from '@/lib/actions/settings'

// ── Model catalogue ───────────────────────────────────────────────────────────

const PROVIDERS = [
  { value: 'anthropic', label: 'Anthropic (Claude)' },
  { value: 'openai',    label: 'OpenAI (GPT)' },
]

const MODELS: Record<string, { value: string; label: string }[]> = {
  anthropic: [
    { value: 'claude-opus-4-7',           label: 'Claude Opus 4.7 — most capable' },
    { value: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6 — recommended' },
    { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 — fastest / cheapest' },
  ],
  openai: [
    { value: 'gpt-4o',       label: 'GPT-4o — most capable' },
    { value: 'gpt-4o-mini',  label: 'GPT-4o mini — recommended' },
    { value: 'o3-mini',      label: 'o3-mini — reasoning' },
  ],
}

const DEFAULT_MODEL: Record<string, string> = {
  anthropic: 'claude-sonnet-4-6',
  openai: 'gpt-4o-mini',
}

// ── Styles ────────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
  form: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalL, maxWidth: '560px' },
  row: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: tokens.spacingHorizontalM },
  checkboxGroup: { display: 'flex', flexDirection: 'column', gap: tokens.spacingVerticalS },
  error: { color: tokens.colorStatusDangerForeground1 },
  success: { color: tokens.colorStatusSuccessForeground1 },
})

export interface AISettingsProps {
  aiEnabled: boolean
  aiProvider: string
  aiModel: string
  aiDailyRefreshLimit: number
  aiAnalyzeActivity: boolean
  aiAnalyzeDeliverables: boolean
  aiAnalyzeRaid: boolean
  aiAnalyzeDecisions: boolean
  aiAnalyzeNotes: boolean
}

export function AISettingsForm(props: AISettingsProps) {
  const s = useStyles()
  const [pending, startTransition] = useTransition()
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null)

  const [enabled, setEnabled] = useState(props.aiEnabled)
  const [provider, setProvider] = useState(props.aiProvider || 'anthropic')
  const [model, setModel] = useState(props.aiModel)
  const [apiKey, setApiKey] = useState('')
  const [limit, setLimit] = useState(String(props.aiDailyRefreshLimit))
  const [analyzeActivity, setAnalyzeActivity] = useState(props.aiAnalyzeActivity)
  const [analyzeDeliverables, setAnalyzeDeliverables] = useState(props.aiAnalyzeDeliverables)
  const [analyzeRaid, setAnalyzeRaid] = useState(props.aiAnalyzeRaid)
  const [analyzeDecisions, setAnalyzeDecisions] = useState(props.aiAnalyzeDecisions)
  const [analyzeNotes, setAnalyzeNotes] = useState(props.aiAnalyzeNotes)

  function handleProviderChange(next: string) {
    setProvider(next)
    setModel(DEFAULT_MODEL[next] ?? '')
  }

  function handleSave() {
    setStatus(null)
    startTransition(async () => {
      const res = await saveAISettings({
        aiEnabled: enabled,
        aiProvider: provider,
        aiModel: model,
        aiApiKey: apiKey || undefined,
        aiDailyRefreshLimit: Math.max(1, Math.min(100, Number(limit) || 10)),
        aiAnalyzeActivity: analyzeActivity,
        aiAnalyzeDeliverables: analyzeDeliverables,
        aiAnalyzeRaid: analyzeRaid,
        aiAnalyzeDecisions: analyzeDecisions,
        aiAnalyzeNotes: analyzeNotes,
      })
      setStatus(res.ok ? { ok: true, msg: 'Settings saved.' } : { ok: false, msg: res.error })
      if (res.ok) setApiKey('')
    })
  }

  const modelOptions = MODELS[provider] ?? []

  return (
    <div className={s.form}>
      <Field label="Enable AI Suggestions">
        <Switch
          checked={enabled}
          onChange={(_, d) => setEnabled(d.checked)}
          label={enabled ? 'Enabled' : 'Disabled'}
        />
      </Field>

      <Divider />

      <div className={s.row}>
        <Field label="Provider">
          <Select value={provider} onChange={(_, d) => handleProviderChange(d.value)} disabled={!enabled}>
            {PROVIDERS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </Select>
        </Field>

        <Field label="Model">
          <Select value={model} onChange={(_, d) => setModel(d.value)} disabled={!enabled}>
            {modelOptions.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="API Key"
        hint={props.aiEnabled ? 'Leave blank to keep the existing key.' : `Your ${provider === 'openai' ? 'OpenAI (sk-…)' : 'Anthropic (sk-ant-…)'} API key.`}
      >
        <Input
          type="password"
          value={apiKey}
          onChange={(_, d) => setApiKey(d.value)}
          placeholder={props.aiEnabled ? '••••••••  (stored)' : provider === 'openai' ? 'sk-…' : 'sk-ant-…'}
          disabled={!enabled}
        />
      </Field>

      <Field label="Daily refresh limit per project" hint="Max AI suggestion refreshes per project per day (1–100).">
        <Input
          type="number"
          min={1}
          max={100}
          value={limit}
          onChange={(_, d) => setLimit(d.value)}
          style={{ width: 100 }}
          disabled={!enabled}
        />
      </Field>

      <Divider />

      <Text weight="semibold" size={200}>What should AI analyse?</Text>
      <div className={s.checkboxGroup}>
        <Checkbox label="Recent activity log"                          checked={analyzeActivity}     onChange={(_, d) => setAnalyzeActivity(!!d.checked)}     disabled={!enabled} />
        <Checkbox label="Deliverables (status, owner, dates)"         checked={analyzeDeliverables} onChange={(_, d) => setAnalyzeDeliverables(!!d.checked)   } disabled={!enabled} />
        <Checkbox label="RAID items (risks, issues, assumptions…)"    checked={analyzeRaid}         onChange={(_, d) => setAnalyzeRaid(!!d.checked)}          disabled={!enabled} />
        <Checkbox label="Decisions log"                               checked={analyzeDecisions}    onChange={(_, d) => setAnalyzeDecisions(!!d.checked)}     disabled={!enabled} />
        <Checkbox label="Deliverable notes"                           checked={analyzeNotes}        onChange={(_, d) => setAnalyzeNotes(!!d.checked)}         disabled={!enabled} />
      </div>

      {status && (
        <Text size={200} className={status.ok ? s.success : s.error}>{status.msg}</Text>
      )}

      <div>
        <Button appearance="primary" onClick={handleSave} disabled={pending}>
          {pending ? <Spinner size="tiny" /> : 'Save AI Settings'}
        </Button>
      </div>
    </div>
  )
}
