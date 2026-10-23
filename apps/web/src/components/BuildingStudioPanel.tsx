import { useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { BuildingComponentType, BuildingModel, Staircase, WallSegment } from '@spatial/core';

interface BuildingStudioPanelProps {
  building: BuildingModel;
  setBuilding: Dispatch<SetStateAction<BuildingModel>>;
  activeLevelId: string;
  onActiveLevelChange: (levelId: string) => void;
  walls: WallSegment[];
}

const CATALOG: Array<{ type: BuildingComponentType; label: string }> = [
  { type: 'door', label: 'Door' }, { type: 'window', label: 'Window' },
  { type: 'column', label: 'Column' }, { type: 'beam', label: 'Beam' },
  { type: 'sofa', label: 'Sofa' }, { type: 'chair', label: 'Chair' },
  { type: 'table', label: 'Table' }, { type: 'bed', label: 'Bed' },
  { type: 'wardrobe', label: 'Wardrobe' }, { type: 'cabinet', label: 'Cabinet' },
  { type: 'kitchen-unit', label: 'Kitchen unit' }, { type: 'sink', label: 'Sink' },
  { type: 'toilet', label: 'Toilet' }, { type: 'bathtub', label: 'Bathtub' },
  { type: 'shower', label: 'Shower' }, { type: 'appliance', label: 'Appliance' },
  { type: 'light', label: 'Light' }, { type: 'switch', label: 'Switch' },
  { type: 'socket', label: 'Socket' }, { type: 'curtain', label: 'Curtain' },
  { type: 'blind', label: 'Blind' }, { type: 'rug', label: 'Rug' },
  { type: 'artwork', label: 'Artwork' }, { type: 'plant', label: 'Plant' },
  { type: 'fence', label: 'Fence' }, { type: 'gate', label: 'Gate' },
  { type: 'driveway', label: 'Driveway' }, { type: 'pool', label: 'Pool' },
  { type: 'custom', label: 'Custom box' },
];

function now(): string { return new Date().toISOString(); }

function defaultDimensions(type: BuildingComponentType): { width: number; height: number; depth: number } {
  switch (type) {
    case 'door': return { width: 0.9, height: 2.1, depth: 0.08 };
    case 'window': return { width: 1.2, height: 1, depth: 0.1 };
    case 'bed': return { width: 1.6, height: 0.55, depth: 2 };
    case 'sofa': return { width: 2, height: 0.85, depth: 0.85 };
    case 'wardrobe': return { width: 1.4, height: 2.2, depth: 0.6 };
    case 'column': return { width: 0.3, height: 2.7, depth: 0.3 };
    case 'light': return { width: 0.25, height: 0.12, depth: 0.25 };
    case 'pool': return { width: 4, height: 1.2, depth: 6 };
    default: return { width: 0.8, height: 0.8, depth: 0.8 };
  }
}

export function BuildingStudioPanel({ building, setBuilding, activeLevelId, onActiveLevelChange, walls }: BuildingStudioPanelProps): JSX.Element {
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [selectedStairId, setSelectedStairId] = useState<string | null>(null);
  const activeLevel = building.levels.find((level) => level.id === activeLevelId) ?? building.levels[0];
  const selectedComponent = building.components.find((component) => component.id === selectedComponentId);
  const selectedStair = building.stairs.find((stair) => stair.id === selectedStairId);

  const addLevel = (): void => {
    const orderedLevels = [...building.levels].sort((a, b) => a.elevation - b.elevation);
    const highest = orderedLevels[orderedLevels.length - 1];
    const order = Math.max(-1, ...building.levels.map((level) => level.order)) + 1;
    const level = { id: crypto.randomUUID(), name: order === 1 ? 'First Floor' : `Floor ${order + 1}`, elevation: (highest?.elevation ?? 0) + (highest?.wallHeight ?? 2.7), wallHeight: 2.7, order };
    setBuilding((current) => ({ ...current, levels: [...current.levels, level].sort((a, b) => a.order - b.order) }));
    onActiveLevelChange(level.id);
  };

  const addComponent = (type: BuildingComponentType): void => {
    const xs = walls.flatMap((wall) => [wall.start.x, wall.end.x]);
    const zs = walls.flatMap((wall) => [wall.start.y, wall.end.y]);
    const position: [number, number, number] = [
      xs.length ? (Math.min(...xs) + Math.max(...xs)) / 2 : 0,
      0,
      zs.length ? (Math.min(...zs) + Math.max(...zs)) / 2 : 0,
    ];
    const component = {
      id: crypto.randomUUID(), levelId: activeLevelId, type,
      name: CATALOG.find((item) => item.type === type)?.label ?? 'Component',
      position, rotation: [0, 0, 0] as [number, number, number], scale: [1, 1, 1] as [number, number, number],
      dimensions: defaultDimensions(type), isVisible: true, isLocked: false,
      ...(type === 'door' ? { doorState: 'closed' as const } : {}),
    };
    setBuilding((current) => ({ ...current, components: [...current.components, component] }));
    setSelectedComponentId(component.id); setSelectedStairId(null);
  };

  const moveComponent = (axis: 0 | 2, amount: number): void => {
    if (!selectedComponent || selectedComponent.isLocked) return;
    setBuilding((current) => ({ ...current, components: current.components.map((component) => {
      if (component.id !== selectedComponent.id) return component;
      const position = [...component.position] as [number, number, number]; position[axis] += amount;
      return { ...component, position, updatedAt: now() } as typeof component;
    }) }));
  };

  const rotateComponent = (amount: number): void => {
    if (!selectedComponent || selectedComponent.isLocked) return;
    setBuilding((current) => ({ ...current, components: current.components.map((component) => component.id === selectedComponent.id ? { ...component, rotation: [component.rotation[0], component.rotation[1] + amount, component.rotation[2]] } : component) }));
  };

  const addStaircase = (): void => {
    if (!activeLevel) return;
    const next = building.levels.filter((level) => level.elevation > activeLevel.elevation).sort((a, b) => a.elevation - b.elevation)[0];
    if (!next) return;
    const rise = next.elevation - activeLevel.elevation;
    const stair: Staircase = {
      id: crypto.randomUUID(), name: `Stairs: ${activeLevel.name} to ${next.name}`,
      fromLevelId: activeLevel.id, toLevelId: next.id, position: [0, 0, 0],
      rotationY: 0, width: 1, run: Math.max(2.5, rise * 1.25), rise,
      stepCount: Math.max(8, Math.ceil(rise / 0.18)), materialHex: '#b8a58b',
    };
    setBuilding((current) => ({ ...current, stairs: [...current.stairs, stair] }));
    setSelectedStairId(stair.id); setSelectedComponentId(null);
  };

  const moveStair = (axis: 0 | 2, amount: number): void => {
    if (!selectedStair) return;
    setBuilding((current) => ({ ...current, stairs: current.stairs.map((stair) => {
      if (stair.id !== selectedStair.id) return stair;
      const position = [...stair.position] as [number, number, number]; position[axis] += amount;
      return { ...stair, position };
    }) }));
  };

  return (
    <section className="mt-3 rounded-xl border border-slate-700 bg-slate-950/80 p-3">
      <div className="flex items-start justify-between gap-2">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-cyan-300">Building model</p><h3 className="mt-1 text-sm font-semibold text-white">Floors & components</h3></div>
        <button type="button" onClick={addLevel} className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-600">+ Add floor</button>
      </div>
      <label className="mt-3 block text-xs text-slate-400">Active floor</label>
      <select value={activeLevelId} onChange={(event) => onActiveLevelChange(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
        {building.levels.map((level) => <option key={level.id} value={level.id}>{level.name} · {level.elevation.toFixed(2)} m</option>)}
      </select>
      <p className="mt-2 text-xs text-slate-500">{building.levels.length} levels · {building.floorSlabs.length} floor slabs · {building.stairs.length} staircases · {building.components.length} components</p>
      <label className="mt-3 flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={building.ceilingEnabled} onChange={(event) => setBuilding((current) => ({ ...current, ceilingEnabled: event.target.checked }))} /> Show ceilings in 3D / Spatial view</label>
      <label className="mt-3 block text-xs text-slate-400">Add component to {activeLevel?.name ?? 'floor'}</label>
      <select value="" onChange={(event) => { if (event.target.value) addComponent(event.target.value as BuildingComponentType); }} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white">
        <option value="">Choose a door, window, furniture, fixture…</option>
        {CATALOG.map((item) => <option key={item.type} value={item.type}>{item.label}</option>)}
      </select>
      {building.components.length > 0 ? <div className="mt-3"><label className="block text-xs text-slate-400">Select component</label><select value={selectedComponentId ?? ''} onChange={(event) => { setSelectedComponentId(event.target.value || null); setSelectedStairId(null); }} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"><option value="">Select component</option>{building.components.map((component) => <option key={component.id} value={component.id}>{component.name} · {building.levels.find((level) => level.id === component.levelId)?.name ?? 'Unknown floor'}</option>)}</select></div> : null}
      {selectedComponent ? <div className="mt-3 rounded-lg border border-slate-800 p-2"><div className="text-xs font-medium text-white">{selectedComponent.name}</div><div className="mt-2 grid grid-cols-4 gap-1"><button type="button" onClick={() => moveComponent(0, -0.25)} className="rounded bg-slate-800 px-2 py-2 text-xs">X−</button><button type="button" onClick={() => moveComponent(0, 0.25)} className="rounded bg-slate-800 px-2 py-2 text-xs">X+</button><button type="button" onClick={() => moveComponent(2, -0.25)} className="rounded bg-slate-800 px-2 py-2 text-xs">Z−</button><button type="button" onClick={() => moveComponent(2, 0.25)} className="rounded bg-slate-800 px-2 py-2 text-xs">Z+</button></div><div className="mt-2 flex gap-2"><button type="button" onClick={() => rotateComponent(-Math.PI / 12)} className="flex-1 rounded bg-slate-800 px-2 py-2 text-xs">Rotate −15°</button><button type="button" onClick={() => rotateComponent(Math.PI / 12)} className="flex-1 rounded bg-slate-800 px-2 py-2 text-xs">Rotate +15°</button><button type="button" onClick={() => setBuilding((current) => ({ ...current, components: current.components.filter((component) => component.id !== selectedComponent.id) }))} className="rounded bg-rose-900 px-3 py-2 text-xs">Delete</button></div></div> : null}
      {building.levels.some((level) => level.elevation > (activeLevel?.elevation ?? 0)) ? <button type="button" onClick={addStaircase} className="mt-3 w-full rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-100">+ Add stairs to next floor</button> : <p className="mt-3 text-xs text-slate-500">Add another floor to enable connecting stairs.</p>}
      {building.stairs.length > 0 ? <div className="mt-3"><label className="block text-xs text-slate-400">Select staircase</label><select value={selectedStairId ?? ''} onChange={(event) => { setSelectedStairId(event.target.value || null); setSelectedComponentId(null); }} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"><option value="">Select staircase</option>{building.stairs.map((stair) => <option key={stair.id} value={stair.id}>{stair.name}</option>)}</select></div> : null}
      {selectedStair ? <div className="mt-2 flex gap-1"><button type="button" onClick={() => moveStair(0, -0.25)} className="flex-1 rounded bg-slate-800 px-2 py-2 text-xs">Move X−</button><button type="button" onClick={() => moveStair(0, 0.25)} className="flex-1 rounded bg-slate-800 px-2 py-2 text-xs">Move X+</button><button type="button" onClick={() => moveStair(2, -0.25)} className="flex-1 rounded bg-slate-800 px-2 py-2 text-xs">Move Z−</button><button type="button" onClick={() => moveStair(2, 0.25)} className="flex-1 rounded bg-slate-800 px-2 py-2 text-xs">Move Z+</button><button type="button" onClick={() => setBuilding((current) => ({ ...current, stairs: current.stairs.filter((stair) => stair.id !== selectedStair.id) }))} className="rounded bg-rose-900 px-3 py-2 text-xs">Delete</button></div> : null}
    </section>
  );
}
