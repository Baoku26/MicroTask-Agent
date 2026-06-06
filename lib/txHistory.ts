import { TASK_LABELS } from '@/lib/constants'

export interface TxEntry {
  id:        string
  taskType:  number
  taskLabel: string
  txHash:    string
  result:    string
  timestamp: number
}

const KEY      = 'microtask_history'
const MAX_ENTRIES = 10

export function saveEntry(entry: Omit<TxEntry, 'id' | 'taskLabel'>): void {
  if (typeof window === 'undefined') return
  const existing = loadHistory()
  const next: TxEntry = {
    ...entry,
    id:        `${entry.timestamp}-${entry.txHash.slice(-6)}`,
    taskLabel: TASK_LABELS[entry.taskType] ?? `Task ${entry.taskType}`,
  }
  const updated = [next, ...existing].slice(0, MAX_ENTRIES)
  try {
    localStorage.setItem(KEY, JSON.stringify(updated))
  } catch {
    // Ignore storage quota errors
  }
}

export function loadHistory(): TxEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as TxEntry[]) : []
  } catch {
    return []
  }
}

export function clearHistory(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(KEY)
}
