export const CHAIN_ID = 42220

export const CUSD_ADDRESS = '0x765DE816845861e75A25fCA122bb6898B8B1282a'

export const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS!

export const CELO_RPC = 'https://forno.celo.org'

export const TASK_TYPES = {
  CAPTION:   1,
  EMAIL:     2,
  SUMMARY:   3,
  EXPLAIN:   4,
  IMAGE:     5,
  TRANSLATE: 6,
} as const

export const TASK_PRICES: Record<number, string> = {
  1: '0.10',
  2: '0.25',
  3: '0.25',
  4: '0.10',
  5: '0.50',
  6: '0.10',
}

export const TASK_LABELS: Record<number, string> = {
  1: 'Caption writer',
  2: 'Email drafter',
  3: 'Text summarizer',
  4: 'Concept explainer',
  5: 'Image generator',
  6: 'Translator',
}

export const TASK_DESCRIPTIONS: Record<number, string> = {
  1: 'Turn any topic into a punchy social caption',
  2: 'Draft a clear email from bullet points',
  3: 'Pull key points from long text',
  4: 'Break down any concept for any audience',
  5: 'Generate images from text prompts',
  6: 'Translate between 30+ languages',
}

export const TASK_TONES = ['professional', 'casual', 'funny', 'viral']
export const TASK_LENGTHS = ['short', 'medium', 'detailed']
export const TASK_AUDIENCES = ['beginner', 'intermediate', 'expert']
export const TASK_RECIPIENTS = ['client', 'colleague', 'manager', 'stranger']

export const MAX_INPUT_CHARS = 2000
