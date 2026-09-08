import { NextRequest, NextResponse } from 'next/server';
import {
  fetchWithTimeout,
  isAbortError,
  MAX_UPSTREAM_ERROR_BYTES,
  readJsonLimited,
  readTextLimited,
  UPSTREAM_TIMEOUT_MS,
} from '@/lib/server/security';
import { miniMaxAuth } from '@/lib/server/minimax-auth';
import { ENDPOINTS } from '@/lib/minimax/constants';

const MODEL = 'MiniMax-M3';

function stripThink(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
}

function extractMessageContent(data: unknown): string {
  const record = data as {
    choices?: Array<{ message?: { content?: unknown }; content?: unknown }>;
    reply?: unknown;
  };
  const choice = record?.choices?.[0];
  const raw = choice?.message?.content ?? choice?.content ?? record?.reply ?? '';
  const text = Array.isArray(raw)
    ? raw.map((part) => (typeof part === 'string' ? part : String((part as { text?: string })?.text ?? ''))).join('')
    : String(raw ?? '');
  return stripThink(text).replace(/^["“]+|["”]+$/g, '').trim();
}

function buildMessages(field: 'prompt' | 'preview', hint: string) {
  if (field === 'prompt') {
    return [
      {
        role: 'system',
        content:
          '你为 MiniMax 音色设计写「音色描述」。只输出一段中文描述，不要标题、引号或 Markdown。80～180 字，必须包含性别、年龄感、音色质感、语气和适用场景。每次结果都要不同。',
      },
      {
        role: 'user',
        content: hint
          ? `请把下面的想法扩写成可用的音色描述：\n${hint}`
          : '请随机生成一个有特色、适合配音或口播的音色描述。',
      },
    ];
  }

  return [
    {
      role: 'system',
      content:
        '你为 MiniMax 音色设计写「预览文本」。只输出一段会被朗读的中文，不要标题、引号或 Markdown。40～80 字，口语自然，适合试听音色。',
    },
    {
      role: 'user',
      content: hint
        ? `请为这个音色写一段试听文案：\n${hint}`
        : '请写一段适合试听的中文口播短句。',
    },
  ];
}

/**
 * POST /api/chat
 * Generate voice-design copy with MiniMax-M3.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = miniMaxAuth(request);
    if (!auth.ok) return auth.response;
    const { apiKey, baseUrl } = auth;

    const body = await request.json();
    const field = body.field === 'preview' ? 'preview' : body.field === 'prompt' ? 'prompt' : null;
    if (!field) {
      return NextResponse.json({ error: 'field 必须是 prompt 或 preview' }, { status: 400 });
    }

    const hint = typeof body.hint === 'string' ? body.hint.trim().slice(0, 500) : '';

    const response = await fetchWithTimeout(
      `${baseUrl}${ENDPOINTS.CHAT}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: buildMessages(field, hint),
          thinking: { type: 'disabled' },
          max_tokens: 400,
          temperature: 0.9,
        }),
      },
      UPSTREAM_TIMEOUT_MS,
    );

    if (!response.ok) {
      const err = await readTextLimited(response, MAX_UPSTREAM_ERROR_BYTES);
      return NextResponse.json({ error: `Error ${response.status}: ${err}` }, { status: response.status });
    }

    const data: any = await readJsonLimited(response);

    if (data.base_resp && data.base_resp.status_code !== 0) {
      return NextResponse.json(
        { error: data.base_resp?.status_msg || '生成失败' },
        { status: 400 },
      );
    }

    const text = extractMessageContent(data);
    if (!text) {
      return NextResponse.json({ error: '模型没有返回可用文本' }, { status: 502 });
    }

    return NextResponse.json({ text: field === 'prompt' ? text.slice(0, 500) : text.slice(0, 200) });
  } catch (error) {
    if (isAbortError(error)) {
      return NextResponse.json({ error: 'MiniMax API request timed out' }, { status: 504 });
    }
    if (error instanceof Error && error.message === 'Response too large') {
      return NextResponse.json({ error: 'MiniMax response too large' }, { status: 502 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 },
    );
  }
}
