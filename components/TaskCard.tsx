'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { TASK_PRICES, TASK_DESCRIPTIONS } from '@/lib/constants'

interface TaskCardProps {
  id: number
  label: string
  index: number
}

export function TaskCard({ id, label, index }: TaskCardProps) {
  const price = TASK_PRICES[id]
  const description = TASK_DESCRIPTIONS[id]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.07 }}
    >
      <Link href={`/task/${id}`} style={{ display: 'block' }}>
        <div className="task-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
            <h3 style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.95rem',
              color: 'var(--text-primary)',
              fontWeight: 700,
            }}>
              {label}
            </h3>
            <span style={{
              background: 'rgba(0, 211, 149, 0.12)',
              color: 'var(--accent-green)',
              fontSize: '0.75rem',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '999px',
              whiteSpace: 'nowrap',
              marginLeft: '0.75rem',
            }}>
              {price} cUSD
            </span>
          </div>
          <p style={{
            fontSize: '0.85rem',
            color: 'var(--text-secondary)',
            lineHeight: 1.5,
          }}>
            {description}
          </p>
        </div>
      </Link>
    </motion.div>
  )
}
