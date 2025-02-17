import { createOpenAI,type OpenAIProviderSettings } from './openai';
import { getEncoding } from 'js-tiktoken';
import { RecursiveCharacterTextSplitter } from './text-splitter';

interface CustomOpenAIProviderSettings extends OpenAIProviderSettings {
    baseUrl ?:string;
}

//Providers

const openai = createOpenAI({
  apiKey: process.env.OPENAI_KEY!,
  baseURL: process.env.OPENAI_ENDPOINT || 'https://api.openai.com/v1',
} as CustomOpenAIProviderSettings);

const customModel = process.env.OPENAI_MODEL || 'o3-mini';


//Models
export const o3MiniModel = openai(customModel, {
    reasoningEffort: customModel.startsWith('o') ? 'medium' : undefined,
    structuredOutputs: true,
})

const MinChunkSize = 140;
const encoder = getEncoding('o200k_base');

//Trim propmpt to maximum context size
export function trimPrompt(prompt:string, contextSize = Number(process.env.CONTEXT_SIZE) || 128_000){
    if(!prompt){
        return '';
    }
    const length = encoder.encode(prompt).length;
    if(length <= contextSize){
        return prompt;
    }
    const overflowTokens = length - contextSize;
    const chunkSize = prompt.length - overflowTokens * 3;
    if(chunkSize < MinChunkSize){
        return prompt.slice(0,MinChunkSize);
    }
    const splitter = new RecursiveCharacterTextSplitter({
        chunkSize,
        chunkOverlap: 0,
    });
    const trimmedPrompt = splitter.splitText(prompt)[0] ?? '';

    if(trimmedPrompt.length === prompt.length){
        return trimPrompt(prompt.slice(0,chunkSize),contextSize);
    }

    return trimPrompt(trimmedPrompt,contextSize);
}
