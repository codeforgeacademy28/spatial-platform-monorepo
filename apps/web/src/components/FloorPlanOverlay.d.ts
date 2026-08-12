import type { Room, WallSegment } from '@spatial/core';
interface FloorPlanOverlayProps {
    walls: WallSegment[];
    rooms: Room[];
    setWalls: React.Dispatch<React.SetStateAction<WallSegment[]>>;
    setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
    projectName: string;
    onProjectNameChange: (value: string) => void;
    onSave: () => void;
    onLoad: () => void;
    onShare: () => void;
    onEnterAr?: () => void;
    shareUrl: string;
    onSaveVersion?: () => void;
    onCompareVersions?: () => void;
    savedVersionsCount?: number;
}
export declare function FloorPlanOverlay({ walls, rooms, setWalls, setRooms, projectName, onProjectNameChange, onSave, onLoad, onShare, onEnterAr, shareUrl, onSaveVersion, onCompareVersions, savedVersionsCount, }: FloorPlanOverlayProps): JSX.Element;
export {};
//# sourceMappingURL=FloorPlanOverlay.d.ts.map