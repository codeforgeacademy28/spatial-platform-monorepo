import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import type { LanguageModelV4Prompt } from '@ai-sdk/provider';
import { buildSpatialPrompt } from '../prompt-templates';
import {
  ChangeMaterialSchema,
  MoveWallSchema,
  ResizeRoomSchema,
  SpatialQuerySchema,
} from '../schemas/command-schemas';

export type SupportedProvider = 'openai' | 'groq';

export type SpatialActionCommand =
  | z.infer<typeof MoveWallSchema>
  | z.infer<typeof ResizeRoomSchema>
  | z.infer<typeof ChangeMaterialSchema>
  | z.infer<typeof SpatialQuerySchema>;

export interface SpatialActionRequest {
  provider: SupportedProvider;
  model: string;
  apiKey: string;
  prompt: string;
  temperature?: number;
}

export interface SpatialActionResponse {
  raw: unknown;
  action: SpatialActionCommand;
  provider: SupportedProvider;
  model: string;
}

const SpatialActionSchema = z.union([
  MoveWallSchema,
  ResizeRoomSchema,
  ChangeMaterialSchema,
  SpatialQuerySchema,
]);

function createOpenAIProvider(apiKey: string) {
  return createOpenAI({ apiKey });
}

function createGroqProvider(apiKey: string) {
  return createGroq({ apiKey });
}

function buildPromptMessages(userInstruction: string): LanguageModelV4Prompt {
  return [
    {
      role: 'system',
      content: 'You are a spatial design assistant that emits structured JSON for action execution.',
    },
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: buildSpatialPrompt(userInstruction),
        },
      ],
    },
  ];
}

function extractTextFromResponse(response: unknown): string {
  if (typeof response !== 'object' || response === null) {
    throw new Error('Unexpected AI response shape');
  }

  const contentArray = (response as { content?: Array<{ type?: string; text?: string }> }).content;
  if (!Array.isArray(contentArray)) {
    throw new Error('AI response does not contain content');
  }

  return contentArray
    .map((part) => (typeof part?.text === 'string' ? part.text : ''))
    .join('')
    .trim();
}

export async function generateSpatialAction(request: SpatialActionRequest): Promise<SpatialActionResponse> {
  const prompt = buildPromptMessages(request.prompt);
  let response: unknown;

  if (request.provider === 'openai') {
    const client = createOpenAIProvider(request.apiKey);
    const model = client.chat(request.model);
    response = await model.doGenerate({
      prompt,
      temperature: request.temperature ?? 0.2,
    });
  } else {
    const client = createGroqProvider(request.apiKey);
    const model = client.languageModel(request.model);
    response = await model.doGenerate({
      prompt,
      temperature: request.temperature ?? 0.2,
    });
  }

  const rawText = extractTextFromResponse(response);
  const parsed = JSON.parse(rawText);
  const action = SpatialActionSchema.parse(parsed);

  return {
    raw: response,
    action,
    provider: request.provider,
    model: request.model,
  };
}
