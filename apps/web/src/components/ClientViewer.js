import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo } from 'react';
import { SpatialCanvas } from './SpatialCanvas.js';
export function ClientViewer({ project }) {
    const walls = useMemo(() => project.rooms.flatMap((room) => room.wallSegments), [project]);
    const points = useMemo(() => walls.flatMap((wall) => [wall.start, wall.end]), [walls]);
    const handleCommentAdd = useCallback(async (comment) => {
        try {
            await fetch(`http://localhost:4000/api/projects/${encodeURIComponent(project.id)}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(comment),
            });
        }
        catch (error) {
            console.error('Unable to persist comment:', error);
        }
    }, [project.id]);
    return (_jsxs("div", { className: "relative h-screen w-screen bg-slate-950 text-slate-100", children: [_jsxs("div", { className: "absolute left-4 top-4 z-10 max-w-md rounded-lg border border-slate-700 bg-slate-900/75 p-3 shadow-lg backdrop-blur-sm", children: [_jsx("p", { className: "text-[10px] uppercase tracking-[0.24em] text-sky-300", children: "Client review" }), _jsx("h1", { className: "mt-2 text-xl font-semibold text-white", children: project.name }), _jsx("p", { className: "mt-1 text-sm text-slate-300", children: "Read-only design review" })] }), _jsx(SpatialCanvas, { projectId: project.id, walls: walls, rooms: project.rooms, points: points, readOnly: true, onCommentAdd: handleCommentAdd })] }));
}
//# sourceMappingURL=ClientViewer.js.map