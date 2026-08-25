import { useMemo, useState } from 'react';
import type { SpatialActionCommand } from '../hooks/useSpatialActionDispatcher';
import type { WallSegment } from '@spatial/core';

export interface AiAssistantPanelProps {
  walls: WallSegment[];
  onDispatchAction: (action: SpatialActionCommand) => string;
}

interface AiCommandResponse {
  raw?: unknown;
  action?: SpatialActionCommand;
  provider: 'openai' | 'groq';
  model: string;
}

function getApiBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') ?? '';
}

export function AiAssistantPanel({ walls, onDispatchAction }: AiAssistantPanelProps): JSX.Element {
  const [prompt, setPrompt] = useState('Move starter-wall-1 1.0 0.0');
  const [provider, setProvider] = useState<'openai' | 'groq'>('openai');
  const [model, setModel] = useState('gpt-4o-mini');
  const [apiKey, setApiKey] = useState('');
  const [temperature, setTemperature] = useState(0.25);
  const [status, setStatus] = useState<string>('Ready to dispatch AI actions.');
  const [history, setHistory] = useState<string[]>([]);

  const currentActionText = useMemo(() => walls.length > 0 ? `Walls: ${walls.length}` : 'No walls currently loaded.', [walls]);

  const handleSend = async (): Promise<void> => {
    if (!prompt.trim()) {
      setStatus('Please enter an AI instruction.');
      return;
    }

    if (!apiKey.trim()) {
      setStatus('Please enter your API key.');
      return;
    }

    setStatus('Sending instruction to AI...');

    try {
      const response = await fetch(`${getApiBaseUrl()}/api/ai/command`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-subscription-tier': 'studio',
        },
        body: JSON.stringify({ provider, model, apiKey, prompt, temperature }),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload?.error ?? 'AI command failed');
      }

      const payload = (await response.json()) as AiCommandResponse;
      if (!payload.action) throw new Error('AI response did not contain a valid action.');

      const dispatchMessage = onDispatchAction(payload.action);
      const nextHistory = [
        `${new Date().toLocaleTimeString()}: ${prompt}`,
        `AI: ${JSON.stringify(payload.action)}`,
        `Dispatch: ${dispatchMessage}`,
      ];
      setHistory((previous) => [...nextHistory, ...previous].slice(0, 10));
      setStatus('Action dispatched successfully.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      setStatus(`AI request failed: ${message}`);
      setHistory((previous) => [`Error: ${message}`, ...previous].slice(0, 10));
    }
  };

  return (
    <section className="rounded-lg border border-slate-700 bg-slate-900/80 p-4 text-slate-100">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
          <p className="text-xs text-slate-400">{currentActionText}</p>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">Instruction</label>
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} rows={4} className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none" />

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">
            API Key
            <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100" placeholder="Provider API key" type="password" autoComplete="off" />
          </label>
          <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">
            Model
            <input value={model} onChange={(event) => setModel(event.target.value)} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100" placeholder="gpt-4o-mini" />
          </label>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">
            Provider
            <select value={provider} onChange={(event) => setProvider(event.target.value as 'openai' | 'groq')} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100">
              <option value="openai">OpenAI</option>
              <option value="groq">Groq</option>
            </select>
          </label>
          <label className="block text-xs uppercase tracking-[0.2em] text-slate-400">
            Temperature
            <input type="number" min="0" max="1" step="0.05" value={temperature} onChange={(event) => setTemperature(Number(event.target.value))} className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-slate-100" />
          </label>
        </div>

        <button type="button" onClick={handleSend} className="w-full rounded bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500">
          Dispatch AI Action
        </button>

        <div className="rounded border border-slate-700 bg-slate-950/80 p-3 text-sm text-slate-300">
          <div className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Status</div>
          <p>{status}</p>
        </div>

        <div className="space-y-1 text-xs text-slate-300">
          <div className="uppercase tracking-[0.2em] text-slate-400">Recent activity</div>
          {history.length === 0 ? <p className="text-slate-500">No history yet.</p> : history.map((entry, index) => <div key={`${entry}-${index}`} className="rounded border border-slate-700 bg-slate-800/80 px-2 py-1">{entry}</div>)}
        </div>
      </div>
    </section>
  );
}
