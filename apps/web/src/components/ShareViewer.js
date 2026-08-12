import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SpatialCanvas } from './SpatialCanvas.js';
export function ShareViewer({ project }) {
    const walls = project.rooms.flatMap((room) => room.wallSegments);
    const points = walls.flatMap((wall) => [wall.start, wall.end]);
    return (_jsxs("div", { className: "relative h-screen w-screen bg-slate-950 text-slate-100", children: [_jsxs("div", { className: "absolute left-4 top-4 z-10 rounded-lg border border-slate-700 bg-slate-900/80 p-3 shadow-lg backdrop-blur-sm", children: [_jsx("p", { className: "text-[10px] uppercase tracking-[0.24em] text-sky-300", children: "Shared design" }), _jsx("h1", { className: "mt-2 text-xl font-semibold text-white", children: project.name })] }), _jsx(SpatialCanvas, { walls: walls, rooms: project.rooms, points: points, readOnly: true })] }));
}
//# sourceMappingURL=ShareViewer.js.map