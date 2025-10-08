import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function checkOllama(timeoutMs: number = 8000) {
  const ollamaKey = process.env.OLLAMA_API_KEY
  const ollamaUrl = (process.env.OLLAMA_URL || 'https://api.ollama.ai').replace(/\/$/, '')
  const model = process.env.OLLAMA_MODEL || 'llama3.1'

  if (!ollamaKey) {
    return { ok: false, reason: 'missing_key', url: ollamaUrl, model }
  }

  try {
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${ollamaKey}` },
      signal: controller.signal,
    })
    clearTimeout(id)
    const ok = res.ok
    const status = res.status
    return { ok, status, url: ollamaUrl, model }
  } catch (e: any) {
    return { ok: false, reason: e?.message || 'fetch_failed', url: ollamaUrl, model }
  }
}

export async function GET() {
  const ollama = await checkOllama()
  return NextResponse.json({
    uptimeMs: Math.max(0, Date.now() - (globalThis as any).__appStartTime || 0),
    ollama,
  })
}


