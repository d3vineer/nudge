export type GeminiSchema =
  | { type: 'STRING' | 'INTEGER' | 'BOOLEAN' }
  | { items: GeminiSchema; type: 'ARRAY' }
  | { properties: Record<string, GeminiSchema>; required?: string[]; type: 'OBJECT' };

function delay(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function uniqueValues(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function envList(name: string) {
  return String(Deno.env.get(name) ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function modelCandidates(primaryEnvName: string, fallbackEnvName: string, defaultModels: string[]) {
  return uniqueValues([
    ...envList(primaryEnvName),
    ...envList(fallbackEnvName),
    ...defaultModels,
  ]);
}

function isRetryableGeminiError(status: number, message: string) {
  const lowerMessage = message.toLowerCase();
  return (
    status === 429 ||
    status === 500 ||
    status === 503 ||
    lowerMessage.includes('high demand') ||
    lowerMessage.includes('overload') ||
    lowerMessage.includes('overloaded') ||
    lowerMessage.includes('temporarily') ||
    lowerMessage.includes('unavailable') ||
    lowerMessage.includes('no longer available')
  );
}

export async function callGeminiGenerateContent(
  apiKey: string,
  models: string[],
  body: Record<string, unknown>,
  stage: string,
  sourceId?: string
) {
  let lastMessage = 'Gemini request failed.';

  for (const model of models) {
    for (const waitMs of [0, 900, 1800]) {
      if (waitMs > 0) await delay(waitMs);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST',
        }
      );

      const data = await response.json();

      if (response.ok) {
        console.log(JSON.stringify({ detail: model, sourceId, stage }));
        return data;
      }

      lastMessage = data?.error?.message ?? `${stage} failed with ${response.status}`;
      console.warn(JSON.stringify({ model, sourceId, stage, status: response.status, warning: lastMessage }));

      if (!isRetryableGeminiError(response.status, lastMessage)) {
        throw new Error(lastMessage);
      }
    }
  }

  throw new Error('Gemini is busy right now. Please retry this upload in a few minutes.');
}
