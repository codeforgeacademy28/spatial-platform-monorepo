import { ChangeEvent, FocusEvent } from 'react';
import {
  Folder,
  Save,
  Share2,
  History,
  UploadCloud,
  Glasses,
  Layers,
} from 'lucide-react';

interface SpatialHeaderProps {
  projectName: string;
  onProjectNameChange: (name: string) => void;
  onSave: () => void;
  onLoad: () => void;
  onShare: () => void;
  onSaveVersion: () => void;
  onEnterAR: () => void;
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
  onEnterAR,
  refLength,
  onScaleChange,
  onUploadBlueprint,
}: SpatialHeaderProps): JSX.Element {
  const handleProjectNameChange = (e: ChangeEvent<HTMLInputElement>): void => {
    onProjectNameChange(e.target.value);
  };

  const handleProjectNameBlur = (e: FocusEvent<HTMLInputElement>): void => {
    if (e.target.value.trim() === '') {
      onProjectNameChange('Untitled Project');
    }
  };

  const handleScaleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && onScaleChange) {
      onScaleChange(value);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file && onUploadBlueprint) {
      onUploadBlueprint(file);
    }
  };

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex items-center justify-between px-4 py-2.5 rounded-2xl bg-neutral-900/70 backdrop-blur-2xl border border-white/10 shadow-2xl text-xs text-neutral-200">
      {/* Project Identity Section */}
      <div className="flex items-center gap-2 flex-1">
        <Folder className="w-4 h-4 text-neutral-400" />
        <input
          type="text"
          value={projectName}
          onChange={handleProjectNameChange}
          onBlur={handleProjectNameBlur}
          placeholder="Untitled Project"
          className="bg-neutral-800/50 border border-neutral-700/50 rounded-lg px-2 py-1 text-sm text-neutral-100 placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-transparent"
        />
      </div>

      {/* Persistence & Share Button Group */}
      <div className="flex items-center gap-1 mx-4">
        <button
          type="button"
          onClick={onSave}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-700/80 border border-neutral-700/50 hover:border-neutral-600/80 transition-all duration-150 active:scale-95"
          title="Save project"
        >
          <Save className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save</span>
        </button>

        <button
          type="button"
          onClick={onLoad}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-700/80 border border-neutral-700/50 hover:border-neutral-600/80 transition-all duration-150 active:scale-95"
          title="Load project"
        >
          <Folder className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Load</span>
        </button>

        <button
          type="button"
          onClick={onShare}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-700/80 border border-neutral-700/50 hover:border-neutral-600/80 transition-all duration-150 active:scale-95"
          title="Share design"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Share</span>
        </button>

        <button
          type="button"
          onClick={onSaveVersion}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-700/80 border border-neutral-700/50 hover:border-neutral-600/80 transition-all duration-150 active:scale-95"
          title="Save version"
        >
          <History className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Save Ver</span>
        </button>
      </div>

      {/* Spatial & Blueprint Controls */}
      <div className="flex items-center gap-1">
        <label className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800/60 hover:bg-neutral-700/80 border border-neutral-700/50 hover:border-neutral-600/80 transition-all duration-150 cursor-pointer active:scale-95">
          <UploadCloud className="w-3.5 h-3.5" />
          <span className="hidden sm:inline text-xs">Blueprint</span>
          <input
            type="file"
            accept=".ifc,.jpg,.png,.pdf"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-neutral-800/60 border border-neutral-700/50">
          <Layers className="w-3.5 h-3.5" />
          <input
            type="number"
            value={refLength}
            onChange={handleScaleChange}
            placeholder="Scale"
            className="w-12 bg-transparent text-neutral-100 text-xs placeholder-neutral-500 focus:outline-none"
            step="0.1"
            min="0.1"
          />
          <span className="text-neutral-400">m</span>
        </div>

        <button
          type="button"
          onClick={onEnterAR}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-all duration-150 shadow-lg shadow-blue-600/30 active:scale-95 font-medium"
          title="Enter AR mode"
        >
          <Glasses className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">AR</span>
        </button>
      </div>
    </div>
  );
}
