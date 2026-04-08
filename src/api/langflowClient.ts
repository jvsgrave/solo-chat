const ENDPOINTS: Record<'solo' | 'shh', string> = {
  solo: 'https://langflowailangflowlatest-production-4f99.up.railway.app/api/v1/run/90b40f58-67e0-406c-8f14-1d9e2866b227',
  shh:  'https://langflowailangflowlatest-production-4f99.up.railway.app/api/v1/run/29303352-8606-443f-9477-15c588729b39',
}

const SOLO_INFINITY_ENDPOINT = 'https://langflowailangflowlatest-production-4f99.up.railway.app/api/v1/run/e7f89d3a-a837-48c4-8952-22d74fe1b930'

export interface ParsedResponse {
  thoughts: string
  finalResponse: string
}

async function fetchOnce(message: string, sessionId: string, mode: 'solo' | 'shh' | 'script'): Promise<Response> {
  const endpointMode: 'solo' | 'shh' = mode === 'shh' ? 'shh' : 'solo'
  return fetch(ENDPOINTS[endpointMode], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input_value: message,
      input_type: 'chat',
      output_type: 'chat',
      session_id: sessionId,
    }),
  })
}

export async function sendMessage(
  message: string,
  sessionId: string,
  mode: 'solo' | 'shh' | 'script' = 'solo'
): Promise<ParsedResponse> {
  let response = await fetchOnce(message, sessionId, mode)

  // Retry once on transient server errors (5xx)
  if (response.status >= 500) {
    await new Promise(r => setTimeout(r, 1500))
    response = await fetchOnce(message, sessionId, mode)
  }

  if (!response.ok) {
    const friendly: Record<number, string> = {
      500: 'The AI server ran into a problem. Try again in a moment.',
      502: 'The AI server is temporarily unreachable.',
      503: 'The AI server is busy. Try again shortly.',
      429: 'Too many requests — slow down a little and try again.',
    }
    throw new Error(friendly[response.status] ?? `Something went wrong (${response.status}). Please try again.`)
  }

  const data = await response.json()
  return parseResponse(data, mode)
}

export async function sendToSoloInfinity(userMsg: string, soloResponse: string): Promise<string> {
  const combined = `User: ${userMsg}\n\nSolo: ${soloResponse}`
  try {
    const response = await fetch(SOLO_INFINITY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input_value: combined,
        input_type: 'chat',
        output_type: 'chat',
        session_id: crypto.randomUUID(),
      }),
    })
    if (!response.ok) return ''
    const data = await response.json()
    const allOutputs = data?.outputs?.[0]?.outputs || []
    for (const output of allOutputs) {
      const msg = output?.messages?.[0]?.message || output?.results?.message?.text || ''
      if (msg) return msg.trim()
    }
  } catch {}
  return ''
}

function parseResponse(data: any, mode: 'solo' | 'shh' | 'script'): ParsedResponse {
  const allOutputs = data?.outputs?.[0]?.outputs || []

  // Collect all non-empty messages in order
  const messages: string[] = []
  for (const output of allOutputs) {
    const msg = output?.messages?.[0]?.message || output?.results?.message?.text || ''
    if (msg) messages.push(msg)
  }

  if (messages.length === 0) return { thoughts: '', finalResponse: '' }
  if (messages.length === 1) return { thoughts: '', finalResponse: messages[0] }

  // Solo: first output(s) = final response, last = reasoning (outputs are reversed)
  // Shh:  last = final response, everything before = thoughts/reasoning
  if (mode === 'solo') {
    return {
      thoughts: messages[messages.length - 1],
      finalResponse: messages.slice(0, -1).join('\n'),
    }
  }
  return {
    thoughts: messages.slice(0, -1).join('\n'),
    finalResponse: messages[messages.length - 1],
  }
}
