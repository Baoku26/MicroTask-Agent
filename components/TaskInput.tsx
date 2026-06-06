'use client'

import { useState, useEffect } from 'react'
import {
  TASK_TYPES,
  TASK_TONES,
  TASK_LENGTHS,
  TASK_AUDIENCES,
  TASK_RECIPIENTS,
  MAX_INPUT_CHARS,
} from '@/lib/constants'

export interface TaskInputValue {
  text:       string
  tone?:      string
  recipient?: string
  length?:    string
  audience?:  string
}

interface TaskInputProps {
  taskType: number
  onChange: (value: TaskInputValue) => void
}

const PLACEHOLDERS: Record<number, string> = {
  [TASK_TYPES.CAPTION]: 'Describe what you want a caption for — a product launch, a travel photo, a gym selfie…',
  [TASK_TYPES.EMAIL]:   'Bullet points for the email — key message, context, what you need from the reader…',
  [TASK_TYPES.SUMMARY]: 'Paste the text you want summarized — article, report, meeting notes…',
  [TASK_TYPES.EXPLAIN]: 'What concept do you want explained? e.g. "How does proof of stake work?"',
}

const SELECTOR_LABELS: Record<number, string> = {
  [TASK_TYPES.CAPTION]: 'Tone',
  [TASK_TYPES.EMAIL]:   'Recipient',
  [TASK_TYPES.SUMMARY]: 'Length',
  [TASK_TYPES.EXPLAIN]: 'Audience',
}

function ChipSelector({
  options,
  value,
  onChange,
}: {
  options: string[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
      {options.map(opt => {
        const active = opt === value
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            style={{
              background:   active ? 'var(--accent)' : 'var(--bg-secondary)',
              color:        active ? '#fff' : 'var(--text-secondary)',
              border:       `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
              borderRadius: '999px',
              padding:      '0.35rem 0.9rem',
              fontSize:     '0.8rem',
              fontFamily:   'var(--font-mono)',
              cursor:       'pointer',
              minHeight:    '32px',
              transition:   'background 0.15s, color 0.15s, border-color 0.15s',
              textTransform: 'capitalize',
            }}
          >
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export function TaskInput({ taskType, onChange }: TaskInputProps) {
  const defaultOption = () => {
    switch (taskType) {
      case TASK_TYPES.CAPTION: return TASK_TONES[0]
      case TASK_TYPES.EMAIL:   return TASK_RECIPIENTS[1]
      case TASK_TYPES.SUMMARY: return TASK_LENGTHS[1]
      case TASK_TYPES.EXPLAIN: return TASK_AUDIENCES[1]
      default: return ''
    }
  }

  const [text,   setText]   = useState('')
  const [option, setOption] = useState(defaultOption())

  useEffect(() => {
    const value: TaskInputValue = { text }
    switch (taskType) {
      case TASK_TYPES.CAPTION: value.tone      = option; break
      case TASK_TYPES.EMAIL:   value.recipient = option; break
      case TASK_TYPES.SUMMARY: value.length    = option; break
      case TASK_TYPES.EXPLAIN: value.audience  = option; break
    }
    onChange(value)
  }, [text, option]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectorLabel   = SELECTOR_LABELS[taskType]
  const selectorOptions = taskType === TASK_TYPES.CAPTION ? TASK_TONES
                        : taskType === TASK_TYPES.EMAIL   ? TASK_RECIPIENTS
                        : taskType === TASK_TYPES.SUMMARY ? TASK_LENGTHS
                        : TASK_AUDIENCES
  const chars     = text.length
  const nearLimit = chars > MAX_INPUT_CHARS * 0.85
  const atLimit   = chars >= MAX_INPUT_CHARS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Textarea */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={text}
          onChange={e => setText(e.target.value.slice(0, MAX_INPUT_CHARS))}
          placeholder={PLACEHOLDERS[taskType]}
          rows={5}
          style={{
            width:        '100%',
            background:   'var(--bg-secondary)',
            border:       `1px solid ${atLimit ? 'var(--accent-amber)' : 'var(--border)'}`,
            borderRadius: '0.75rem',
            padding:      '0.875rem 1rem',
            color:        'var(--text-primary)',
            fontSize:     '0.9rem',
            lineHeight:   1.6,
            resize:       'vertical',
            outline:      'none',
            fontFamily:   'var(--font-sans)',
            minHeight:    '120px',
            boxSizing:    'border-box',
            transition:   'border-color 0.15s',
          }}
          onFocus={e => {
            if (!atLimit) e.target.style.borderColor = 'var(--accent)'
          }}
          onBlur={e => {
            e.target.style.borderColor = atLimit ? 'var(--accent-amber)' : 'var(--border)'
          }}
        />
        {/* Char count */}
        <span style={{
          position:   'absolute',
          bottom:     '0.6rem',
          right:      '0.75rem',
          fontSize:   '0.72rem',
          fontFamily: 'var(--font-mono)',
          color:      atLimit ? 'var(--accent-amber)'
                    : nearLimit ? 'var(--text-secondary)'
                    : 'var(--text-muted)',
          pointerEvents: 'none',
        }}>
          {chars}/{MAX_INPUT_CHARS}
        </span>
      </div>

      {/* Option selector */}
      <div>
        <p style={{
          fontSize:     '0.78rem',
          fontFamily:   'var(--font-mono)',
          color:        'var(--text-muted)',
          marginBottom: '0.5rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
        }}>
          {selectorLabel}
        </p>
        <ChipSelector
          options={selectorOptions}
          value={option}
          onChange={setOption}
        />
      </div>
    </div>
  )
}
