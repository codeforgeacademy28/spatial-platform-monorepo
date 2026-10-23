import { useMemo, useState } from 'react';
import type { Project } from '@spatial/core';
import { FolderOpen, Cloud, HardDrive, Loader2, X } from 'lucide-react';

export interface SavedProjectEntry {
  project: Project;
  source: string;
  remote: boolean;
}

interface SavedProjectsDialogProps {
  open: boolean;
  projects: SavedProjectEntry[];
  loading: boolean;
  error: string;
  onRefresh: () => void;
  onOpen: (entry: SavedProjectEntry) => void;
  onClose: () => void;
}

export function SavedProjectsDialog({ open, projects, loading, error, onRefresh, onOpen, onClose }: SavedProjectsDialogProps): JSX.Element | null {
  const [query, setQuery] = useState('');
  const filteredProjects = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase();
    if (!normalized) return projects;
    return projects.filter(({ project, source }) => project.name.toLocaleLowerCase().includes(normalized) || source.toLocaleLowerCase().includes(normalized));
  }, [projects, query]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="saved-projects-title">
      <section className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
        <header className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <div><h2 id="saved-projects-title" className="text-lg font-semibold text-white">Saved projects</h2><p className="mt-1 text-xs text-slate-400">Open a design from Supabase or this browser.</p></div>
          <button type="button" onClick={onClose} aria-label="Close saved projects" className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"><X size={18} /></button>
        </header>
        <div className="border-b border-slate-800 p-4"><label htmlFor="saved-project-search" className="mb-1 block text-xs font-medium text-slate-300">Find a saved project</label><input id="saved-project-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project name or storage source…" className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500 focus:outline-none" /></div>
        <div className="max-h-[65vh] space-y-3 overflow-y-auto p-4">
          {error ? <p role="status" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-100">{error}</p> : null}
          {loading ? <p className="flex items-center gap-2 p-4 text-sm text-slate-300"><Loader2 size={16} className="animate-spin" /> Loading saved projects…</p> : null}
          {!loading && filteredProjects.length === 0 ? <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center"><FolderOpen className="mx-auto mb-3 text-slate-500" size={28} /><p className="font-medium text-white">{projects.length === 0 ? 'No saved projects found' : 'No matching projects'}</p><p className="mt-1 text-sm text-slate-400">{projects.length === 0 ? 'Save a design first, or check your Supabase persistence configuration.' : 'Try a different name or storage source.'}</p></div> : null}
          {filteredProjects.map(({ project, source, remote }) => <button key={`${source}:${project.id}:${project.updatedAt}`} type="button" onClick={() => onOpen({ project, source, remote })} className="flex w-full items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-left transition hover:border-sky-500/60 hover:bg-slate-900">
            <span className="mt-0.5 rounded-lg bg-slate-800 p-2 text-sky-300">{remote ? <Cloud size={18} /> : <HardDrive size={18} />}</span>
            <span className="min-w-0 flex-1"><span className="block truncate font-medium text-white">{project.name || 'Untitled Project'}</span><span className="mt-1 block text-xs text-slate-400">{project.walls.length} walls · {project.rooms.length} rooms · Updated {new Date(project.updatedAt).toLocaleString()}</span><span className="mt-2 inline-flex rounded-md bg-slate-800 px-2 py-1 text-[11px] text-slate-300">{source}</span></span>
            <span className="shrink-0 self-center text-xs font-semibold text-sky-300">Open →</span>
          </button>)}
        </div>
        <footer className="flex items-center justify-between border-t border-slate-800 px-5 py-3"><span className="text-xs text-slate-500">{filteredProjects.length} of {projects.length} project{projects.length === 1 ? '' : 's'}</span><button type="button" onClick={onRefresh} disabled={loading} className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-200 hover:bg-slate-800 disabled:opacity-50">Refresh list</button></footer>
      </section>
    </div>
  );
}
