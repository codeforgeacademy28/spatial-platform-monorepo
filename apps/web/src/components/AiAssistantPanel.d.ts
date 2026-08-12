import type { SpatialActionCommand } from '../hooks/useSpatialActionDispatcher.js';
import type { WallSegment } from '@spatial/core';
export interface AiAssistantPanelProps {
    walls: WallSegment[];
    onDispatchAction: (action: SpatialActionCommand) => string;
}
export declare function AiAssistantPanel({ walls, onDispatchAction }: AiAssistantPanelProps): JSX.Element;
//# sourceMappingURL=AiAssistantPanel.d.ts.map