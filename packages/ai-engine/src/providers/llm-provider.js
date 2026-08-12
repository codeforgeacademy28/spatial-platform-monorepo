import { z } from 'zod';
import { createOpenAI } from '@ai-sdk/openai';
import { createGroq } from '@ai-sdk/groq';
import { buildSpatialPrompt } from '../prompt-templates.js';
import { ChangeMaterialSchema, MoveWallSchema, ResizeRoomSchema, SpatialQuerySchema, } from '../schemas/command-schemas.js';
const SpatialActionSchema = z.union([
    MoveWallSchema,
    ResizeRoomSchema,
    ChangeMaterialSchema,
    SpatialQuerySchema,
]);
function createOpenAIProvider(apiKey) {
    return createOpenAI({ apiKey });
}
function createGroqProvider(apiKey) {
    return createGroq({ apiKey });
}
function sanitizeAiPrompt(input) {
    return input
        .replace(/```[\s\S]*?```/g, '')
        .replace(/<[^>]+>/g, '')
        .replace(/\b(script|style|iframe|object|embed|form|input|button|textarea|select|option)\b/gi, '')
        .trim();
}
function buildPromptMessages(userInstruction) {
    const cleanedInstruction = sanitizeAiPrompt(userInstruction);
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
                    text: buildSpatialPrompt(cleanedInstruction),
                },
            ],
        },
    ];
}
function extractTextFromResponse(response) {
    if (typeof response !== 'object' || response === null) {
        throw new Error('Unexpected AI response shape');
    }
    const contentArray = response.content;
    if (!Array.isArray(contentArray)) {
        throw new Error('AI response does not contain content');
    }
    return contentArray
        .map((part) => (typeof part?.text === 'string' ? part.text : ''))
        .join('')
        .trim();
}
export async function generateSpatialAction(request) {
    const prompt = buildPromptMessages(request.prompt);
    let response;
    if (request.provider === 'openai') {
        const client = createOpenAIProvider(request.apiKey);
        const model = client.chat(request.model);
        response = await model.doGenerate({
            prompt,
            temperature: request.temperature ?? 0.2,
        });
    }
    else {
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
//# sourceMappingURL=llm-provider.js.map