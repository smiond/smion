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
    
    // Try to list models to verify API key and URL
    const tagsResponse = await Promise.race([
      ollamaClient.models.list(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Ollama models API timed out')), timeoutMs))
    ]) as OpenAI.Models.ModelsPage

    clearTimeout(id)
    
    const availableModels = tagsResponse.data.map(m => m.id)
    const isDefaultModelAvailable = availableModels.includes(model)

    if (!isDefaultModelAvailable) {
      return { 
        ok: false, 
        reason: `Default model '${model}' not found. Available models: ${availableModels.join(', ')}`, 
        url: ollamaUrl, 
        model,
        availableModels 
      }
    }

    return { 
      ok: true, 
      status: 200, 
      message: 'Ollama Cloud is configured and accessible.',
      url: ollamaUrl, 
      model,
      availableModels 
    }
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


