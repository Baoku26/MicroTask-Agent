import Anthropic from '@anthropic-ai/sdk'
import { TASK_TYPES, MAX_INPUT_CHARS } from '@/lib/constants'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Max output tokens per task type
const OUTPUT_TOKENS: Record<number, number> = {
  [TASK_TYPES.CAPTION]:   120,
  [TASK_TYPES.EMAIL]:     400,
  [TASK_TYPES.SUMMARY]:   300,
  [TASK_TYPES.EXPLAIN]:   350,
  [TASK_TYPES.IMAGE]:     200,
  [TASK_TYPES.TRANSLATE]: 500,
}

// Max output characters (rough guard after generation)
const OUTPUT_CHARS: Record<number, number> = {
  [TASK_TYPES.CAPTION]:   600,
  [TASK_TYPES.EMAIL]:     2000,
  [TASK_TYPES.SUMMARY]:   1500,
  [TASK_TYPES.EXPLAIN]:   1800,
  [TASK_TYPES.IMAGE]:     1000,
  [TASK_TYPES.TRANSLATE]: 2500,
}

export interface TaskInput {
  text:       string
  tone?:      string
  recipient?: string
  length?:    string
  audience?:  string
}

// Strip HTML tags and cap input length
function sanitize(text: string): string {
  return text
    .replace(/<[^>]*>/g, '')   // strip HTML
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_INPUT_CHARS)
}

function buildPrompt(taskType: number, input: TaskInput): { system: string; user: string } {
  const text = sanitize(input.text)

  switch (taskType) {
    case TASK_TYPES.CAPTION: {
      const tone = input.tone ?? 'professional'
      return {
        system: 'You are a social media copywriter. Write a single punchy caption — no hashtag spam, no filler phrases like "Excited to share". Output only the caption text.',
        user:   `Topic: ${text}\nTone: ${tone}\n\nWrite one social media caption.`,
      }
    }

    case TASK_TYPES.EMAIL: {
      const recipient = input.recipient ?? 'colleague'
      return {
        system: 'You are a professional email writer. Write clear, concise emails. Output only the email body — no subject line, no "Here is the email:" preamble.',
        user:   `Write a professional email to a ${recipient}.\n\nKey points to cover:\n${text}`,
      }
    }

    case TASK_TYPES.SUMMARY: {
      const length = input.length ?? 'medium'
      const wordTargets: Record<string, string> = {
        short:    '3-4 sentences',
        medium:   '1-2 paragraphs',
        detailed: '3-4 paragraphs',
      }
      return {
        system: 'You are an expert at summarizing text. Extract the key points clearly and concisely. Output only the summary.',
        user:   `Summarize the following text in ${wordTargets[length] ?? wordTargets.medium}:\n\n${text}`,
      }
    }

    case TASK_TYPES.EXPLAIN: {
      const audience = input.audience ?? 'intermediate'
      const audienceDesc: Record<string, string> = {
        beginner:     'a complete beginner with no prior knowledge',
        intermediate: 'someone with basic familiarity',
        expert:       'a domain expert who wants depth',
      }
      return {
        system: 'You are a brilliant explainer. Make complex ideas clear. Use analogies where helpful. Output only the explanation.',
        user:   `Explain the following concept to ${audienceDesc[audience] ?? audienceDesc.intermediate}:\n\n${text}`,
      }
    }

    default:
      throw new Error(`Unsupported taskType: ${taskType}`)
  }
}

export async function runTask(taskType: number, input: TaskInput): Promise<string> {
  const { system, user } = buildPrompt(taskType, input)
  const maxTokens = OUTPUT_TOKENS[taskType] ?? 300

  let attempt = 0
  while (attempt < 2) {
    try {
      const message = await client.messages.create({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        system,
        messages:   [{ role: 'user', content: user }],
      })

      const raw = message.content
        .filter(b => b.type === 'text')
        .map(b => (b as { type: 'text'; text: string }).text)
        .join('')
        .trim()

      // Truncate to max chars for this task type
      const cap = OUTPUT_CHARS[taskType] ?? 2000
      return raw.length > cap ? raw.slice(0, cap) + '…' : raw

    } catch (err: any) {
      // Retry once on 5xx server errors
      if (attempt === 0 && err?.status >= 500) {
        attempt++
        continue
      }
      throw err
    }
  }

  throw new Error('AI request failed after retry')
}
