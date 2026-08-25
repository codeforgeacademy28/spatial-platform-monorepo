import type { Project } from '@spatial/core';

interface VersionHistoryPanelProps {
  versions: Project[];
  selectedVersionIds: string[];
  onToggle: (versionId: string) => void;
  onCompare: () => void;
}

export function VersionHistoryPanel({ versions, selectedVersionIds, onToggle, onCompare }: VersionHistoryPanelProps): JSX.Element {
  return (
    <section className="rounded-xl border border-indigo-500/30 bg-indigo-500/5 p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-indigo-300">Version history</p>
          <h3 className="mt-1 text-sm font-semibold text-white">Select two versions to compare</h3>
        </div>
        <span className="text-xs text-slate-400">{selectedVersionIds.length}/2 selected</span>
      </div>

      {!versions.length ? (
        <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-500">Save a version after drawing walls to create a comparison snapshot.</div>
      ) : (
        <div className="mt-3 space-y-2">
          {versions.map((version, index) => {
            const selected = selectedVersionIds.includes(version.id);
            return (
              <button
                key={version.id}
                type="button"
                onClick={() => onToggle(version.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left ${selected ? 'border-indigo-300 bg-indigo-500/20' : 'border-slate-700 bg-slate-900 hover:border-indigo-400/60'}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-white">{version.name || `Version ${index + 1}`}</span>
                  <span className="text-xs text-slate-400">{version.walls.length} walls</span>
                </div>
                <div className="mt-1 text-xs text-slate-500">{version.rooms.length} rooms · {selected ? 'Selected' : 'Click to select'}</div>
              </button>
            );
          })}
        </div>
      )}

      <button type="button" onClick={onCompare} disabled={selectedVersionIds.length !== 2} className="mt-3 w-full rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40">Compare Selected Versions</button>
    </section>
  );
}
