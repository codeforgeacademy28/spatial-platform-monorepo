import type { Project, Room, WallSegment } from './index.js';

function cloneWall(wall: WallSegment): WallSegment {
  return { ...wall, start: { ...wall.start }, end: { ...wall.end } };
}

function cloneRoom(room: Room): Room {
  return { ...room, polygon: room.polygon.map((point) => ({ ...point })), wallSegments: room.wallSegments.map(cloneWall) };
}

export function cloneProject(project: Project): Project {
  const building = project.building
    ? {
        ...project.building,
        levels: project.building.levels.map((level) => ({ ...level })),
        floorSlabs: project.building.floorSlabs.map((slab) => ({
          ...slab,
          outline: slab.outline.map((point) => ({ ...point })),
        })),
        stairs: project.building.stairs.map((stair) => ({
          ...stair,
          position: [...stair.position] as [number, number, number],
        })),
        components: project.building.components.map((component) => ({
          ...component,
          position: [...component.position] as [number, number, number],
          rotation: [...component.rotation] as [number, number, number],
          scale: [...component.scale] as [number, number, number],
          dimensions: component.dimensions ? { ...component.dimensions } : undefined,
        })),
      }
    : undefined;
  return {
    ...project,
    walls: project.walls.map(cloneWall),
    rooms: project.rooms.map(cloneRoom),
    sceneAssets: project.sceneAssets?.map((asset) => ({
      ...asset,
      anchor: asset.anchor.type === 'wall'
        ? { ...asset.anchor }
        : { ...asset.anchor, position: [...asset.anchor.position] as [number, number, number] },
      light: asset.light ? { ...asset.light } : undefined,
    })),
    wallOpenings: project.wallOpenings?.map((opening) => ({ ...opening })),
    presentation: project.presentation ? { ...project.presentation } : undefined,
    building,
  };
}
