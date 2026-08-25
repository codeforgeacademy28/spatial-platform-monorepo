import { ChangeEvent, FocusEvent } from 'react';
import { Folder, Save, Share2, History, UploadCloud, Glasses, Layers } from 'lucide-react';

interface SpatialHeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onSave: () => void;
  onLoad: () => void;
  onShare: () => void;
  onSaveVersion: () => void;
  onEnterAr: () => void;
  refLength: number;
  onScaleChange?: (scale: number) => void;
  onUploadBlueprint?: (file: File) => void;
}

export function SpatialHeader({
  projectName,
  onProjectNameChange,
  onSave,
  onLoad,
  onShare,
  onSaveVersion,
  onEnterAr,
  refLength,
  onScaleChange,
  onUploadBlueprint,
}: SpatialHeaderProps): JSX.Element {
  const handleProjectNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onProjectNameChange(e.target.value);
  };

  const handleProjectNameBlur = (e: FocusEvent<HTMLInputElement>): void => {
    if (e.target.value.trim() === '') onProjectNameChange('Untitled Project');
  };

  const handleScaleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = Number.parseFloat(e.target.value);
    if (!Number.isNaN(value)) onScaleChange?.(value);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) onUploadBlueprint?.(file);
  };

  return (
    <div className="pointer-events-none fixed left-4 right-4 top-4 z-50 flex items-center justify-between rounded-2xl border border-white/10 bg-neutral-900/70 px-4 py-2.5 text-xs text-neutral-200 shadow-2xl backdrop-blur-2xl">
      <div className="pointer-events-auto flex min-w-0 flex-1 items-center gap-2">
        <Folder className="h-4 w-4 shrink-0 text-neutral-400" />
        <input type="text" value={projectName} onChange={handleProjectNameChange} onBlur={handleProjectNameBlur} placeholder="Untitled Project" className="min-w-0 bg-neutral-800/50 px-2 py-1 text-sm text-neutral-100 placeholder-neutral-500 outline-none" />
      </div>

      <div className="pointer-events-auto mx-4 flex items-center gap-1">
        <button type="button" onClick={onSave} className="flex items-center gap-1.5 rounded-lg border border-neutral-700/50 bg-neutral-800/60 px-2.5 py-1.5 transition hover:bg-neutral-700/80"><Save className="h-3.5 w-3.5" /><span className="hidden sm:inline">Save</span></button>
        <button type="button" onClick={onLoad} className="flex items-center gap-1.5 rounded-lg border border-neutral-700/50 bg-neutral-800/60 px-2.5 py-1.5 transition hover:bg-neutral-700/80"><Folder className="h-3.5 w-3.5" /><span className="hidden sm:inline">Load</span></button>
        <button type="button" onClick={onShare} className="flex items-center gap-1.5 rounded-lg border border-neutral-700/50 bg-neutral-800/60 px-2.5 py-1.5 transition hover:bg-neutral-700/80"><Share2 className="h-3.5 w-3.5" /><span className="hidden sm:inline">Share</span></button>
        <button type="button" onClick={onSaveVersion} className="flex items-center gap-1.5 rounded-lg border border-neutral-700/50 bg-neutral-800/60 px-2.5 py-1.5 transition hover:bg-neutral-700/80"><History className="h-3.5 w-3.5" /><span className="hidden sm:inline">Save Ver</span></button>
      </div>

      <div className="pointer-events-auto flex items-center gap-1">
        <label className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-neutral-700/50 bg-neutral-800/60 px-2.5 py-1.5 transition hover:bg-neutral-700/80">
          <UploadCloud className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Blueprint</span>
          <input type="file" accept=".jpg,.png,.jpeg" onChange={handleFileUpload} className="hidden" />
        </label>
        <div className="flex items-center gap-1.5 rounded-lg border border-neutral-700/50 bg-neutral-800/60 px-2.5 py-1.5">
          <Layers className="h-3.5 w-3.5" />
          <input type="number" value={refLength} onChange={handleScaleChange} step="0.1" min="0.1" className="w-12 bg-transparent text-xs text-neutral-100 outline-none" />
          <span className="text-neutral-400">m</span>
        </div>
        <button type="button" onClick={onEnterAr} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 font-medium text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500"><Glasses className="h-4 w-4" /><span className="hidden sm:inline">AR</span></button>
      </div>
    </div>
  );
}
