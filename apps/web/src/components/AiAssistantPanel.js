import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
export function AiAssistantPanel({ walls, onDispatchAction }) {
    const [prompt, setPrompt] = useState('Move wall-1 1.0 0.0');
    const [provider, setProvider] = useState('openai');
    const [model, setModel] = useState('gpt-4o-mini');
    const [apiKey, setApiKey] = useState('');
    const [temperature, setTemperature] = useState(0.25);
    const [status, setStatus] = useState('Ready to dispatch AI actions.');
    const [history, setHistory] = useState([]);
    const currentActionText = useMemo(() => walls.length > 0 ? `Walls: ${walls.length}` : 'No walls currently loaded.', [walls]);
    const handleSend = async () => {
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
            const response = await fetch('http://localhost:4000/api/ai/command', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-subscription-tier': 'studio',
                },
                body: JSON.stringify({
                    provider,
                    model,
                    apiKey,
                    prompt,
                    temperature,
                }),
            });
            if (!response.ok) {
                const payload = await response.json();
                throw new Error(payload?.error ?? 'AI command failed');
            }
            const payload = (await response.json());
            if (!payload.action) {
                throw new Error('AI response did not contain a valid action.');
            }
            const dispatchMessage = onDispatchAction(payload.action);
            const nextHistory = [`${new Date().toLocaleTimeString()}: ${prompt}`, `AI: ${JSON.stringify(payload.action)}`, `Dispatch: ${dispatchMessage}`];
            setHistory((previous) => [...nextHistory, ...previous].slice(0, 10));
            setStatus('Action dispatched successfully.');
        }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            setStatus(`AI request failed: ${message}`);
            setHistory((previous) => [`Error: ${message}`, ...previous].slice(0, 10));
        }
    };
    return (_jsxs("section", { className: "rounded-lg border border-slate-700 bg-slate-900/80 p-4 text-slate-100", children: [_jsx("div", { className: "mb-3 flex items-center justify-between gap-3", children: _jsxs("div", { children: [_jsx("h3", { className: "text-sm font-semibold text-white", children: "AI Assistant" }), _jsx("p", { className: "text-xs text-slate-400", children: currentActionText })] }) }), _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "block text-xs uppercase tracking-[0.2em] text-slate-400", children: "Instruction" }), _jsx("textarea", { value: prompt, onChange: (event) => setPrompt(event.target.value), rows: 4, className: "w-full rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 focus:border-sky-500 focus:outline-none" }), _jsxs("div", { className: "grid gap-2 sm:grid-cols-2", children: [_jsxs("label", { className: "block text-xs uppercase tracking-[0.2em] text-slate-400", children: ["API Key", _jsx("input", { value: apiKey, onChange: (event) => setApiKey(event.target.value), className: "mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100", placeholder: "sk-..." })] }), _jsxs("label", { className: "block text-xs uppercase tracking-[0.2em] text-slate-400", children: ["Model", _jsx("input", { value: model, onChange: (event) => setModel(event.target.value), className: "mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100", placeholder: "gpt-4o-mini" })] })] }), _jsxs("div", { className: "grid gap-2 sm:grid-cols-2", children: [_jsxs("label", { className: "block text-xs uppercase tracking-[0.2em] text-slate-400", children: ["Provider", _jsxs("select", { value: provider, onChange: (event) => setProvider(event.target.value), className: "mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100", children: [_jsx("option", { value: "openai", children: "OpenAI" }), _jsx("option", { value: "groq", children: "Groq" })] })] }), _jsxs("label", { className: "block text-xs uppercase tracking-[0.2em] text-slate-400", children: ["Temperature", _jsx("input", { type: "number", min: "0", max: "1", step: "0.05", value: temperature, onChange: (event) => setTemperature(Number(event.target.value)), className: "mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-2 text-sm text-slate-100" })] })] }), _jsx("button", { type: "button", onClick: handleSend, className: "w-full rounded bg-sky-600 px-3 py-2 text-sm font-semibold text-white hover:bg-sky-500", children: "Dispatch AI Action" }), _jsxs("div", { className: "rounded border border-slate-700 bg-slate-950/80 p-3 text-sm text-slate-300", children: [_jsx("div", { className: "mb-2 text-xs uppercase tracking-[0.2em] text-slate-400", children: "Status" }), _jsx("p", { children: status })] }), _jsxs("div", { className: "space-y-1 text-xs text-slate-300", children: [_jsx("div", { className: "uppercase tracking-[0.2em] text-slate-400", children: "Recent activity" }), history.length === 0 ? (_jsx("p", { className: "text-slate-500", children: "No history yet." })) : (history.map((entry, index) => (_jsx("div", { className: "rounded border border-slate-700 bg-slate-800/80 px-2 py-1", children: entry }, `${entry}-${index}`))))] })] })] }));
}
//# sourceMappingURL=AiAssistantPanel.js.map