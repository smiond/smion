import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

async function checkOllama(timeoutMs: number = 8000) {
  const ollamaKey = process.env.OLLAMA_API_KEY
  const ollamaUrl = process.env.OLLAMA_URL || 'https://api.ollama.ai'
  const model = 'llama3.1' // Use same model as chat endpoint

  if (!ollamaKey) {
    return { ok: false, reason: 'missing_key', url: ollamaUrl, model }
  }

  try {
    const ollamaClient = new OpenAI({
      baseURL: `${ollamaUrl}/v1`, // Use OpenAI-compatible API
      apiKey: ollamaKey,
    })

    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    
    // Try a simple chat completion to verify API works
    const testResponse = await Promise.race([
      ollamaClient.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: 'hello' }],
        temperature: 0.1,
        max_tokens: 5,
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Ollama chat test timed out')), timeoutMs))
    ]) as OpenAI.Chat.Completions.ChatCompletion

    clearTimeout(id)
    
    if (testResponse.choices && testResponse.choices.length > 0) {
      return { 
        ok: true, 
        status: 200, 
        message: 'Ollama Cloud is configured and accessible.',
        url: ollamaUrl, 
        model,
        testResponse: testResponse.choices[0]?.message?.content || 'no content'
      }
    } else {
      return { 
        ok: false, 
        reason: 'No response choices returned', 
        url: ollamaUrl, 
        model 
      }
    }
  } catch (e: any) {
    console.error('Ollama health check error:', e)
    return { 
      ok: false, 
      reason: e?.message || 'fetch_failed', 
      url: ollamaUrl, 
      model,
      error: e?.toString() || 'unknown error'
    }
  }
}

export async function GET() {
  const ollama = await checkOllama()
  return NextResponse.json({
    uptimeMs: Math.max(0, Date.now() - (globalThis as any).__appStartTime || 0),
    ollama,
  })
}


