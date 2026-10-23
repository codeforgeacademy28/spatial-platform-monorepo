import type { Dispatch, SetStateAction } from 'react';
import type { PresentationConfig, SceneAsset, WallOpening, WallSegment } from '@spatial/core';

interface SceneStudioPanelProps {
  walls: WallSegment[];
  selectedWallId: string | null;
  setSelectedWallId: (id: string | null) => void;
  setWalls: Dispatch<SetStateAction<WallSegment[]>>;
  setSceneAssets: Dispatch<SetStateAction<SceneAsset[]>>;
  setWallOpenings: Dispatch<SetStateAction<WallOpening[]>>;
  presentation: PresentationConfig;
  setPresentation: Dispatch<SetStateAction<PresentationConfig>>;
}

function now(): string {
  return new Date().toISOString();
}

function makeGalleryArtwork(): string {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600">' +
    '<rect width="900" height="600" fill="#251918"/>' +
    '<circle cx="680" cy="150" r="90" fill="#e9b08e"/>' +
    '<path d="M0 500C160 360 300 480 470 340C620 220 720 420 900 300V600H0Z" fill="#6c4445"/>' +
    '<text x="70" y="100" fill="#f9eee6" font-size="54" font-family="Georgia">US</text>' +
    '<text x="72" y="145" fill="#dbc8bc" font-size="20" letter-spacing="5">A MEMORY WORTH KEEPING</text>' +
    '</svg>';
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

export function SceneStudioPanel({
  walls,
  selectedWallId,
  setSelectedWallId,
  setWalls,
  setSceneAssets,
  setWallOpenings,
  presentation,
  setPresentation,
}: SceneStudioPanelProps): JSX.Element {
  const selectedWall = walls.find((wall) => wall.id === selectedWallId) ?? null;
  const selectedColor = selectedWall?.materialHex ?? '#efe7dc';

  const setColor = (color: string): void => {
    if (!selectedWall) return;
    setWalls((current) =>
      current.map((wall) =>
        wall.id === selectedWall.id ? { ...wall, materialHex: color, updatedAt: now() } : wall,
      ),
    );
  };

  const addDoor = (): void => {
    if (!selectedWall) return;
    const length = selectedWall.length || Math.hypot(
      selectedWall.end.x - selectedWall.start.x,
      selectedWall.end.y - selectedWall.start.y,
    );
    const timestamp = now();
    const opening: WallOpening = {
      id: 'door-' + Date.now(),
      wallId: selectedWall.id,
      type: 'door',
      offset: length / 2,
      width: 0.95,
      height: Math.min(2.2, selectedWall.height),
      bottom: 0,
      doorState: 'closed',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setWallOpenings((current) => [...current, opening]);
  };

  const addArtwork = (): void => {
    if (!selectedWall) return;
    const length = selectedWall.length || Math.hypot(
      selectedWall.end.x - selectedWall.start.x,
      selectedWall.end.y - selectedWall.start.y,
    );
    const width = Math.min(1.5, Math.max(0.8, length * 0.35));
    const timestamp = now();

    setSceneAssets((current) => [
      ...current,
      {
        id: 'art-' + Date.now(),
        assetType: 'image',
        name: 'Gallery artwork',
        assetUrl: makeGalleryArtwork(),
        frameStyle: 'gold',
        anchor: {
          type: 'wall',
          wallId: selectedWall.id,
          offset: length / 2,
          elevation: 1.1,
          width,
          height: width * 0.68,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ]);
  };

  const populateBirthdayGallery = (): void => {
    if (!walls.length) return;

    const timestamp = now();
    setWalls((current) =>
      current.map((wall) => ({ ...wall, materialHex: '#efe4d7', updatedAt: timestamp })),
    );

    setPresentation({
      title: 'A Walk Through Us',
      subtitle: 'A birthday gallery made just for you',
      finalMessage: 'I would choose you in every room, every version, every lifetime. ❤️',
      theme: 'romantic',
      ceilingEnabled: true,
    });

    const firstWall = walls[0];
    if (!firstWall) return;

    const length = firstWall.length || Math.hypot(
      firstWall.end.x - firstWall.start.x,
      firstWall.end.y - firstWall.start.y,
    );

    setSelectedWallId(firstWall.id);
    setSceneAssets((current) => {
      if (current.some((asset) => asset.name === 'First memory')) return current;
      return [
        ...current,
        {
          id: 'birthday-art-' + Date.now(),
          assetType: 'image',
          name: 'First memory',
          assetUrl: makeGalleryArtwork(),
          frameStyle: 'gold',
          anchor: {
            type: 'wall',
            wallId: firstWall.id,
            offset: length / 2,
            elevation: 1.1,
            width: Math.min(1.4, Math.max(0.9, length * 0.32)),
            height: 0.95,
          },
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ];
    });

    if (length > 1.8) {
      setWallOpenings((current) => {
        if (current.some((opening) => opening.wallId === firstWall.id && opening.type === 'door')) return current;
        return [
          ...current,
          {
            id: 'birthday-door-' + Date.now(),
            wallId: firstWall.id,
            type: 'door',
            offset: length / 2,
            width: 0.95,
            height: Math.min(2.2, firstWall.height),
            bottom: 0,
            createdAt: timestamp,
            updatedAt: timestamp,
          },
        ];
      });
    }
  };

  const colours = ['#efe7dc', '#f3d8d1', '#d9e7df', '#d7e0f2', '#6d4c43', '#2c2420'];

  return (
    <section className="mt-3 rounded-xl border border-fuchsia-400/20 bg-slate-950/80 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-fuchsia-300">
        Birthday Gallery Studio
      </div>
      <div className="mt-1 text-sm font-semibold text-white">Make the walls tell your story</div>

      <select
        value={selectedWallId ?? ''}
        onChange={(event) => setSelectedWallId(event.target.value || null)}
        className="spatial-field mt-3 px-3 py-2 text-xs"
      >
        <option value="">Select a wall…</option>
        {walls.map((wall, index) => (
          <option key={wall.id} value={wall.id}>
            Wall {index + 1}
          </option>
        ))}
      </select>

      <div className="mt-2 flex gap-2">
        {colours.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setColor(color)}
            className="h-7 w-7 rounded-full border border-white/10"
            style={{ background: color }}
            disabled={!selectedWall}
            aria-label={'Set wall colour to ' + color}
          />
        ))}
        <input
          type="color"
          value={selectedColor}
          onChange={(event) => setColor(event.target.value)}
          disabled={!selectedWall}
          className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0 disabled:opacity-40"
          aria-label="Custom wall colour"
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={addArtwork}
          disabled={!selectedWall}
          className="rounded-lg bg-fuchsia-600 px-3 py-2 text-xs font-semibold disabled:opacity-40"
        >
          🖼 Add artwork
        </button>
        <button
          type="button"
          onClick={addDoor}
          disabled={!selectedWall}
          className="rounded-lg bg-amber-600 px-3 py-2 text-xs font-semibold disabled:opacity-40"
        >
          🚪 Add door
        </button>
      </div>

      <button
        type="button"
        onClick={populateBirthdayGallery}
        disabled={!walls.length}
        className="mt-2 w-full rounded-lg bg-gradient-to-r from-fuchsia-600 via-rose-500 to-amber-500 px-3 py-2.5 text-xs font-bold"
      >
        ✨ Populate Birthday Gallery
      </button>

      <div className="mt-3 border-t border-slate-800 pt-3">
        <input
          value={presentation.title}
          onChange={(event) => setPresentation((current) => ({ ...current, title: event.target.value }))}
          className="spatial-field px-3 py-2 text-xs"
          placeholder="Gallery title"
        />
        <input
          value={presentation.subtitle}
          onChange={(event) => setPresentation((current) => ({ ...current, subtitle: event.target.value }))}
          className="spatial-field mt-2 px-3 py-2 text-xs"
          placeholder="Subtitle"
        />
        <textarea
          value={presentation.finalMessage}
          onChange={(event) => setPresentation((current) => ({ ...current, finalMessage: event.target.value }))}
          className="spatial-field mt-2 min-h-16 px-3 py-2 text-xs"
          placeholder="Final reveal message"
        />
        <label className="mt-2 flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={presentation.ceilingEnabled}
            onChange={(event) => setPresentation((current) => ({ ...current, ceilingEnabled: event.target.checked }))}
          />
          Ceiling
        </label>
      </div>
    </section>
  );
}
