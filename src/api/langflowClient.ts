const ENDPOINT = 'https://langflowailangflowlatest-production-4f99.up.railway.app/api/v1/run/90b40f58-67e0-406c-8f14-1d9e2866b227'

export interface ParsedResponse {
  thoughts: string
  finalResponse: string
}

export async function sendMessage(message: string): Promise<ParsedResponse> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input_value: message,
    }),
  })

  if (!response.ok) {
    throw new Error(`Langflow error: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  return parseResponse(data)
}

function parseResponse(data: any): ParsedResponse {
  const allOutputs = data?.outputs?.[0]?.outputs || []
  let thoughts = ''
  let finalResponse = ''

  for (const output of allOutputs) {
    const message = output?.messages?.[0]?.message || ''
    if (output.component_id === 'ChatOutput-2rqQh') {
      thoughts = message
    } else if (output.component_id === 'ChatOutput-xwo3C') {
      finalResponse = message
    }
  }

  return { thoughts, finalResponse }
}
